import { withTransaction } from '../../utils/tx.js';
import { GameSessionModel } from '../../models/game-session-model.js';
import { UserBalanceModel } from '../../models/user-balance-model.js';
import { LedgerModel } from '../../models/ledger-model.js';
export class EscrowService {
    static async holdForGame(gameCode) {
        const session = await GameSessionModel.findByGameCode(gameCode);
        if (!session)
            throw new Error('Game not found');
        if (!session.player1_id || !session.player2_id)
            throw new Error('Both players required');
        if (!session.stake_tokens || session.stake_tokens <= 0)
            return;
        if (session.escrow_status && session.escrow_status !== 'none')
            return;
        const stake = Number(session.stake_tokens);
        await withTransaction(async (conn) => {
            await UserBalanceModel.debit(session.player1_id, stake, conn);
            await LedgerModel.add(conn, {
                userId: session.player1_id,
                kind: 'stake_hold',
                direction: 'debit',
                amount: stake,
                reference: session.game_code
            });
            await UserBalanceModel.debit(session.player2_id, stake, conn);
            await LedgerModel.add(conn, {
                userId: session.player2_id,
                kind: 'stake_hold',
                direction: 'debit',
                amount: stake,
                reference: session.game_code
            });
            await LedgerModel.add(conn, {
                userId: null,
                kind: 'stake_hold',
                direction: 'credit',
                amount: stake * 2,
                reference: session.game_code
            });
            await conn.query('UPDATE game_sessions SET escrow_status = "held" WHERE game_code = ? AND (escrow_status = "none" OR escrow_status IS NULL)', [session.game_code]);
        });
    }
    static async finalize(gameCode) {
        const session = await GameSessionModel.findByGameCode(gameCode);
        if (!session)
            throw new Error('Game not found');
        if (!session.stake_tokens || session.stake_tokens <= 0)
            return;
        if (session.escrow_status !== 'held')
            return;
        const stake = Number(session.stake_tokens);
        const total = stake * 2;
        const rakeBps = session.rake_bps ?? 1000;
        const rake = Math.floor((total * rakeBps) / 10000);
        const payout = total - rake;
        await withTransaction(async (conn) => {
            if (session.winner_id) {
                await LedgerModel.add(conn, {
                    userId: null,
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
            }
            else {
                await LedgerModel.add(conn, {
                    userId: null,
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
//# sourceMappingURL=escrow-service.js.map