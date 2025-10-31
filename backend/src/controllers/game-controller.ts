import { Request, Response } from 'express';
import { GameSessionModel } from '../models/game-session-model.js';
import { GameMoveModel } from '../models/game-move-model.js';
import { MatchmakingModel } from '../models/matchmaking-model.js';
import { CheckersEngine } from '../game/checkers-engine.js';
import { CreateGameInput, JoinGameInput, GameMoveInput } from '../validation/schemas.js';
import { applyMovePath } from '../game/move-utils.js';
import { AuthenticatedRequest } from '../types/index.js';
import { EscrowService } from '../services/escrow/escrow-service.js';
import { MoveProcessor } from '../services/game/move-processor.js';
import { TimerService } from '../services/timer/timer-service.js';

export class GameController {
  static async createGame(req: AuthenticatedRequest<{}, {}, CreateGameInput>, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { gameCode } = req.body;

      // Check if user already has an active game
      const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
      if (activeGames.length > 0) {
        res.status(409).json({ 
          error: 'You already have an active game',
          activeGame: activeGames[0]
        });
        return;
      }

      // If custom game code provided, check if it already exists
      if (gameCode && await GameSessionModel.checkGameCodeExists(gameCode)) {
        res.status(409).json({ error: 'Game code already exists' });
        return;
      }

      // Remove user from matchmaking queue if they're in it
      await MatchmakingModel.removeFromQueue(userId);

      // Create game session
      const gameSession = await GameSessionModel.create(userId, gameCode);

      res.status(201).json({
        message: 'Game created successfully',
        gameSession
      });
    } catch (error) {
      console.error('Create game error:', error);
      res.status(500).json({ error: 'Failed to create game' });
    }
  }

  static async joinGame(req: AuthenticatedRequest<{}, {}, JoinGameInput>, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { gameCode } = req.body;

      // Check if user already has an active game
      const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
      if (activeGames.length > 0) {
        res.status(409).json({ 
          error: 'You already have an active game',
          activeGame: activeGames[0]
        });
        return;
      }

      // Check if game exists and is joinable
      const gameSession = await GameSessionModel.findByGameCode(gameCode);
      if (!gameSession) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      if (gameSession.status !== 'waiting') {
        res.status(409).json({ error: 'Game is not available to join' });
        return;
      }

      if (gameSession.player1_id === userId) {
        res.status(409).json({ error: 'Cannot join your own game' });
        return;
      }

      if (gameSession.player2_id !== null) {
        res.status(409).json({ error: 'Game is already full' });
        return;
      }

      // Remove user from matchmaking queue if they're in it
      await MatchmakingModel.removeFromQueue(userId);

      // Join the game
      const updatedGameSession = await GameSessionModel.joinGame(gameCode, userId);
      if (!updatedGameSession) {
        res.status(409).json({ error: 'Failed to join game' });
        return;
      }

      // Initialize timers now that both players are present
      await MoveProcessor.initializeTimers(gameCode);

      res.json({
        message: 'Joined game successfully',
        gameSession: updatedGameSession
      });
    } catch (error) {
      console.error('Join game error:', error);
      res.status(500).json({ error: 'Failed to join game' });
    }
  }

  static async setStake(
    req: AuthenticatedRequest<{ gameCode: string }, {}, { stakeTokens: number; rakeBps?: number }>,
    res: Response
  ): Promise<void> {
    try {
      const userId = req.user?.id;
      const { gameCode } = req.params;
      const { stakeTokens, rakeBps } = req.body;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }
      if (!Number.isFinite(stakeTokens) || stakeTokens <= 0) {
        res.status(400).json({ error: 'Invalid stake amount' });
        return;
      }

      const session = await GameSessionModel.findByGameCode(gameCode);
      if (!session) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      if (session.player1_id !== userId && session.player2_id !== userId) {
        res.status(403).json({ error: 'Not part of this game' });
        return;
      }

      await GameSessionModel.setStakeConfig(gameCode, stakeTokens, rakeBps ?? 1000);

      if (session.player1_id && session.player2_id) {
        await EscrowService.holdForGame(gameCode);
      }

      const updated = await GameSessionModel.findByGameCode(gameCode);
      res.json({ message: 'Stake configured', gameSession: updated });
    } catch (error) {
      console.error('Set stake error:', error);
      res.status(500).json({ error: 'Failed to set stake' });
    }
  }

  static async getGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { gameCode } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const gameSession = await GameSessionModel.findByGameCode(gameCode);
      if (!gameSession) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      // Check if user is part of this game
      const isPlayerInGame = await GameSessionModel.isPlayerInGame(userId, gameCode);
      if (!isPlayerInGame) {
        res.status(403).json({ error: 'You are not part of this game' });
        return;
      }

      // Calculate real-time timer values
      const timerData = TimerService.getTimerData(gameSession);
      const enrichedGameSession = {
        ...gameSession,
        player1_time_remaining: timerData.player1.timeRemaining,
        player2_time_remaining: timerData.player2.timeRemaining,
      };

      res.json({ gameSession: enrichedGameSession });
    } catch (error) {
      console.error('Get game error:', error);
      res.status(500).json({ error: 'Failed to get game' });
    }
  }

  static async makeMove(req: AuthenticatedRequest<{}, {}, GameMoveInput>, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const { gameCode, move } = req.body;

      // Get game session
      const gameSession = await GameSessionModel.findByGameCode(gameCode);
      if (!gameSession) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      // Check if user is part of this game
      const playerRole = await GameSessionModel.getPlayerRole(userId, gameCode);
      if (!playerRole) {
        res.status(403).json({ error: 'You are not part of this game' });
        return;
      }

      // Check if game is active
      if (gameSession.status !== 'active') {
        res.status(409).json({ error: 'Game is not active' });
        return;
      }

      // Check if it's the player's turn
      if (gameSession.current_turn !== playerRole) {
        res.status(409).json({ error: 'It is not your turn' });
        return;
      }

      // Check for timeout and handle auto-move if needed
      console.log('🔍 Checking timeout for:', { gameCode, playerRole, moveFrom: move.from, moveTo: move.to });
      
      const timeoutResult = await MoveProcessor.checkTimeout(gameSession, playerRole);
      
      if (timeoutResult.timeoutOccurred) {
        console.log('⏰ TIMEOUT OCCURRED:', { 
          gameOver: timeoutResult.gameOver, 
          strikes: timeoutResult.strikes,
          hasAutoMove: !!timeoutResult.autoMove 
        });
        
        if (timeoutResult.gameOver) {
          // Player has 3 strikes - they lose
          console.log('💀 3 STRIKES - GAME OVER');
          await GameSessionModel.endGame(gameCode, timeoutResult.winnerId, 'completed');
          await EscrowService.finalize(gameCode);
          
          const finalGameSession = await GameSessionModel.findByGameCode(gameCode);
          res.status(200).json({
            message: 'Game over - maximum timeouts reached',
            gameSession: finalGameSession,
            timeout: true,
            strikes: timeoutResult.strikes
          });
          return;
        }
        
        if (timeoutResult.autoMove) {
          // Time expired - use auto-move instead of player's move
          console.log(`🔄 REPLACING MOVE - Player ${playerRole} timed out, using auto-move:`, {
            original: { from: move.from, to: move.to },
            autoMove: { from: timeoutResult.autoMove.from, to: timeoutResult.autoMove.to },
            strikes: timeoutResult.strikes
          });
          move.from = timeoutResult.autoMove.from;
          move.to = timeoutResult.autoMove.to;
          move.path = undefined; // Clear any path from dummy move
        }
      } else {
        console.log('✅ No timeout detected, processing normal move');
      }

      // Determine if a multi-jump path was provided (AFTER timeout replacement)
      const isPlayer1 = playerRole === 'player1';
      const path = move.path && move.path.length >= 2 ? move.path : undefined;
      const moveWithTimestamp = { ...move, timestamp: new Date() };

      // Track captured counts before applying move
      const prevCaptured = {
        red: gameSession.game_state.capturedPieces.red,
        black: gameSession.game_state.capturedPieces.black
      };

      let updatedState;
      if (path) {
        // Apply the entire path (multi-jump or long king move)
        const applied = applyMovePath(gameSession.game_state, path, isPlayer1);
        if (!applied) {
          res.status(400).json({ error: 'Invalid move path' });
          return;
        }
        updatedState = applied.state;
      } else {
        // Fallback: single segment validation via engine
        const moveWithTimestamp = { ...move, timestamp: new Date() };
        const isValidMove = CheckersEngine.isValidMove(
          gameSession.game_state,
          moveWithTimestamp,
          userId,
          isPlayer1
        );
        if (!isValidMove) {
          res.status(400).json({ error: 'Invalid move' });
          return;
        }
        updatedState = CheckersEngine.applyMove(gameSession.game_state, moveWithTimestamp);
      }

      // Determine if the move captured any piece(s)
      const capturedDelta =
        (updatedState.capturedPieces.red - prevCaptured.red) +
        (updatedState.capturedPieces.black - prevCaptured.black);
      const didCapture = capturedDelta > 0;

      // Check if further captures are available from landing square
      const landing = moveWithTimestamp.to;
      const piece = updatedState.board[landing.row]?.[landing.col];
      const playerColor: 'red' | 'black' = (playerRole === 'player1') ? 'red' : 'black';

      function hasFurtherCapture(state: any, fromRow: number, fromCol: number, color: 'red' | 'black', isKing: boolean): boolean {
        const inBounds = (r: number, c: number) => r >= 0 && r < 8 && c >= 0 && c < 8;
        const dirs: Array<[number, number]> = isKing
          ? [[-1,-1],[-1,1],[1,-1],[1,1]]
          : [[-1,-1],[-1,1],[1,-1],[1,1]]; // allow capture in all diagonals
        for (const [dr, dc] of dirs) {
          // Regular capture: immediate opponent then empty landing one step beyond
          const r1 = fromRow + dr;
          const c1 = fromCol + dc;
          const r2 = fromRow + 2*dr;
          const c2 = fromCol + 2*dc;
          if (inBounds(r2, c2)) {
            const mid = state.board[r1]?.[c1];
            const land = state.board[r2]?.[c2];
            if (mid?.type && mid.color !== color && land?.type === null) {
              return true;
            }
          }
          if (isKing) {
            // Flying capture for kings: scan until first non-empty, then require empty beyond
            let rr = fromRow + dr;
            let cc = fromCol + dc;
            let foundOpponent = false;
            while (inBounds(rr, cc)) {
              const sq = state.board[rr]?.[cc];
              if (sq?.type) {
                if (sq.color === color) break; // blocked by own piece
                // opponent found; next empty square is a capture landing
                foundOpponent = true;
                rr += dr;
                cc += dc;
                while (inBounds(rr, cc)) {
                  const landSq = state.board[rr]?.[cc];
                  if (landSq?.type === null) return true;
                  if (landSq?.type) break;
                  rr += dr; cc += dc;
                }
                break;
              }
              rr += dr; cc += dc;
            }
            if (foundOpponent) {
              // already returned true if landing found; else continue other dirs
            }
          }
        }
        return false;
      }

      const shouldContinue = didCapture && piece?.type && hasFurtherCapture(updatedState, landing.row, landing.col, playerColor, piece.type === 'king');

      // Keep server-side engine turn (currentPlayer) aligned for chained captures
      if (shouldContinue) {
        updatedState.currentPlayer = playerColor; // allow same player to continue jumping
      }

      const newCurrentTurn = shouldContinue ? playerRole : (playerRole === 'player1' ? 'player2' : 'player1');

      // Update game session
      await GameSessionModel.updateGameState(gameCode, updatedState, newCurrentTurn);

      // Process timer update (mark if this was an auto-move)
      const isAutoMove = timeoutResult.autoMove !== null;
      await MoveProcessor.processMove(gameSession, userId, playerRole, move, isAutoMove);

      // Get fresh game session with updated timer
      const freshGameSession = await GameSessionModel.findByGameCode(gameCode);
      if (!freshGameSession) {
        throw new Error('Game session not found after move');
      }

      // Check if game ended
      if (updatedState.gameStatus === 'completed') {
        console.log('Game completed! Winner from engine:', updatedState.winner);
        
        let winnerId = null;
        if (updatedState.winner === 'red') {
          winnerId = gameSession.player1_id;
          console.log('Red wins! Winner ID:', winnerId);
        } else if (updatedState.winner === 'black') {
          winnerId = gameSession.player2_id;
          console.log('Black wins! Winner ID:', winnerId);
        } else {
          console.log('True draw - no winner');
        }
        
        await GameSessionModel.endGame(gameCode, winnerId, 'completed');
        // Finalize escrow payouts/refunds
        await EscrowService.finalize(gameCode);
      }

      // Get updated game session
      const updatedGameSession = await GameSessionModel.findByGameCode(gameCode);

      // Calculate real-time timer values
      if (updatedGameSession) {
        const timerData = TimerService.getTimerData(updatedGameSession);
        updatedGameSession.player1_time_remaining = timerData.player1.timeRemaining;
        updatedGameSession.player2_time_remaining = timerData.player2.timeRemaining;
      }

      res.json({
        message: isAutoMove ? 'Auto-move made due to timeout' : 'Move made successfully',
        gameSession: updatedGameSession,
        move: moveWithTimestamp,
        autoMove: isAutoMove,
        strikes: playerRole === 'player1' ? updatedGameSession?.player1_strikes : updatedGameSession?.player2_strikes
      });
    } catch (error) {
      console.error('Make move error:', error);
      res.status(500).json({ error: 'Failed to make move' });
    }
  }

  static async getActiveGames(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
      res.json({ activeGames });
    } catch (error) {
      console.error('Get active games error:', error);
      res.status(500).json({ error: 'Failed to get active games' });
    }
  }

  static async abandonGame(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { gameCode } = req.params;

      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Check if user is part of this game
      const isPlayerInGame = await GameSessionModel.isPlayerInGame(userId, gameCode);
      if (!isPlayerInGame) {
        res.status(403).json({ error: 'You are not part of this game' });
        return;
      }

      // Get game session to determine winner
      const gameSession = await GameSessionModel.findByGameCode(gameCode);
      if (!gameSession) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      // Determine winner (the other player)
      const winnerId = gameSession.player1_id === userId 
        ? gameSession.player2_id 
        : gameSession.player1_id;

      await GameSessionModel.endGame(gameCode, winnerId, 'abandoned');
      await EscrowService.finalize(gameCode);

      // Get updated game session and notify all players via socket
      const updatedGameSession = await GameSessionModel.findByGameCode(gameCode);
      if (updatedGameSession) {
        const io = req.app.get('io');
        if (io) {
          io.to(`game:${gameCode}`).emit('game_state_updated', {
            gameSession: updatedGameSession
          });
          // Notify clients in room to refresh wallet balances (payout/refund done)
          io.to(`game:${gameCode}`).emit('wallet_balance_updated', {
            gameCode,
            winnerId: updatedGameSession.winner_id ?? null,
            stakeTokens: updatedGameSession.stake_tokens ?? 0
          });
        }
      }

      res.json({ message: 'Game abandoned successfully' });
    } catch (error) {
      console.error('Abandon game error:', error);
      res.status(500).json({ error: 'Failed to abandon game' });
    }
  }
}
