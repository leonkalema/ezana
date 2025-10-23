import { withTransaction } from '../../utils/tx.js';
import { GameSessionModel } from '../../models/game-session-model.js';
import { UserBalanceModel } from '../../models/user-balance-model.js';
import { LedgerModel } from '../../models/ledger-model.js';

export class EscrowService {
  // Hold stakes for both players. Requires stakeTokens to be set on session beforehand.
  static async holdForGame(gameCode: string): Promise<void> {
    console.log(`[Escrow] Starting holdForGame for ${gameCode}`);
    const session = await GameSessionModel.findByGameCode(gameCode);
    
    if (!session) {
      console.error(`[Escrow] Game not found: ${gameCode}`);
      throw new Error('Game not found');
    }
    
    console.log(`[Escrow] Game session:`, { 
      gameCode, 
      player1: session.player1_id, 
      player2: session.player2_id,
      stake: session.stake_tokens,
      escrowStatus: session.escrow_status
    });
    
    if (!session.player1_id || !session.player2_id) {
      console.error(`[Escrow] Both players required for ${gameCode}`);
      throw new Error('Both players required');
    }
    
    if (!session.stake_tokens || session.stake_tokens <= 0) {
      console.log(`[Escrow] No staking for game ${gameCode}, skipping escrow`);
      return; // no staking
    }
    
    if (session.escrow_status && session.escrow_status !== 'none') {
      console.log(`[Escrow] Escrow already handled for ${gameCode}, status: ${session.escrow_status}`);
      return; // already handled
    }

    const stake = Number(session.stake_tokens);
    console.log(`[Escrow] Holding ${stake} tokens from each player for game ${gameCode}`);

    await withTransaction(async (conn) => {
      // Debit both players
      console.log(`[Escrow] Debiting ${stake} from player1 (${session.player1_id})`);
      await UserBalanceModel.debit(session.player1_id, stake, conn);
      await LedgerModel.add(conn, {
        userId: session.player1_id,
        kind: 'stake_hold',
        direction: 'debit',
        amount: stake,
        reference: session.game_code
      });

      console.log(`[Escrow] Debiting ${stake} from player2 (${session.player2_id})`);
      await UserBalanceModel.debit(session.player2_id!, stake, conn);
      await LedgerModel.add(conn, {
        userId: session.player2_id!,
        kind: 'stake_hold',
        direction: 'debit',
        amount: stake,
        reference: session.game_code
      });

      // Credit house (user_id = 0) with total held funds (logical escrow)
      console.log(`[Escrow] Crediting house with ${stake * 2} tokens`);
      await LedgerModel.add(conn, {
        userId: 0, // House account
        kind: 'stake_hold',
        direction: 'credit',
        amount: stake * 2,
        reference: session.game_code
      });

      // Mark escrow held on session
      console.log(`[Escrow] Marking escrow as held for ${gameCode}`);
      await conn.query(
        'UPDATE game_sessions SET escrow_status = "held" WHERE game_code = ? AND (escrow_status = "none" OR escrow_status IS NULL)',
        [session.game_code]
      );
      
      console.log(`[Escrow] Successfully held escrow for game ${gameCode}`);
    });
  }

  // Release funds at end of game: payout winner minus rake, or refund on draw.
  static async finalize(gameCode: string): Promise<void> {
    const session = await GameSessionModel.findByGameCode(gameCode);
    if (!session) throw new Error('Game not found');
    if (!session.stake_tokens || session.stake_tokens <= 0) return; // no staking
    if (session.escrow_status !== 'held') return; // nothing to do

    const stake = Number(session.stake_tokens);
    const total = stake * 2;
    const rakeBps = session.rake_bps ?? 1000; // default 10%
    const rake = Math.floor((total * rakeBps) / 10000);
    const payout = total - rake;

    await withTransaction(async (conn) => {
      if (session.winner_id) {
        // Debit house by payout and credit winner
        await LedgerModel.add(conn, {
          userId: 0, // House account
          kind: 'stake_payout',
          direction: 'debit',
          amount: payout,
          reference: session.game_code
        });
        await UserBalanceModel.credit(session.winner_id, payout, conn);
        await LedgerModel.add(conn, {
          userId: session.winner_id,
          kind: 'stake_payout',
          direction: 'credit',
          amount: payout,
          reference: session.game_code
        });
        await conn.query('UPDATE game_sessions SET escrow_status = "finalized" WHERE game_code = ?', [gameCode]);
      } else {
        // Draw: refund both stakes
        await LedgerModel.add(conn, {
          userId: 0, // House account
          kind: 'stake_refund',
          direction: 'debit',
          amount: total,
          reference: session.game_code
        });
        await UserBalanceModel.credit(session.player1_id, stake, conn);
        await LedgerModel.add(conn, {
          userId: session.player1_id,
          kind: 'stake_refund',
          direction: 'credit',
          amount: stake,
          reference: session.game_code
        });
        if (session.player2_id) {
          await UserBalanceModel.credit(session.player2_id, stake, conn);
          await LedgerModel.add(conn, {
            userId: session.player2_id,
            kind: 'stake_refund',
            direction: 'credit',
            amount: stake,
            reference: session.game_code
          });
        }
        await conn.query('UPDATE game_sessions SET escrow_status = "finalized" WHERE game_code = ?', [gameCode]);
      }
    });
  }
}
