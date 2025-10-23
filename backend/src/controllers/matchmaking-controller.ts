import { Request, Response } from 'express';
import { MatchmakingModel } from '../models/matchmaking-model.js';
import { GameSessionModel } from '../models/game-session-model.js';
import { EscrowService } from '../services/escrow/escrow-service.js';
import { AuthenticatedRequest } from '../middleware/auth-middleware.js';
import { withTransaction } from '../utils/tx.js';

export class MatchmakingController {
  static async joinQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { stakeTokens = 0 } = req.body;
      const io = req.app.get('io');
      
      console.log(`[Matchmaking] User ${userId} joining queue with stake: ${stakeTokens}`);
      
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      // Check if user already has an active game
      const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
      if (activeGames.length > 0) {
        res.status(409).json({ 
          error: 'You already have an active game',
          activeGame: activeGames[0]
        });
        return;
      }

      // Check if user is already in queue
      const existingQueueEntry = await MatchmakingModel.findInQueue(userId);
      if (existingQueueEntry) {
        res.status(409).json({ 
          queueEntry: existingQueueEntry
        });
        return;
      }

      // Validate user has sufficient balance for stakes
      if (stakeTokens > 0) {
        const { UserBalanceModel } = await import('../models/user-balance-model.js');
        const userBalance = await UserBalanceModel.get(userId);
        if (userBalance.balance_tokens < stakeTokens) {
          res.status(400).json({ 
            error: 'Insufficient balance',
            required: stakeTokens,
            available: userBalance.balance_tokens
          });
          return;
        }
      }

      // Use transaction to prevent race conditions
      const result = await withTransaction(async (conn) => {
        // Try to find an opponent with same stake amount (with lock)
        const opponent = await MatchmakingModel.getOldestQueuedPlayer(userId, stakeTokens, conn);
        
        if (opponent) {
          // Validate opponent still has sufficient balance before creating match
          if (stakeTokens > 0) {
            const { UserBalanceModel } = await import('../models/user-balance-model.js');
            const opponentBalance = await UserBalanceModel.get(opponent.user_id);
            
            if (opponentBalance.balance_tokens < stakeTokens) {
              // Opponent no longer has sufficient balance, remove from queue
              await MatchmakingModel.removeFromQueue(opponent.user_id);
              
              // Try to find another opponent
              const nextOpponent = await MatchmakingModel.getOldestQueuedPlayer(userId, stakeTokens, conn);
              if (!nextOpponent) {
                // No other opponent, add current user to queue
                await MatchmakingModel.addToQueue(userId, stakeTokens);
                const queueSize = await MatchmakingModel.getQueueSize();
                
                return {
                  matched: false,
                  message: `Added to matchmaking queue for ${stakeTokens.toLocaleString()} token games`,
                  queueSize
                };
              }
              // Use the next opponent instead
              opponent.user_id = nextOpponent.user_id;
            }
          }
          
          // Remove opponent from queue immediately to prevent double-matching
          await MatchmakingModel.removeFromQueue(opponent.user_id);
          
          // Create a game with the opponent
          const gameSession = await GameSessionModel.create(opponent.user_id);
          
          // Join the game as player 2
          const updatedGameSession = await GameSessionModel.joinGame(gameSession.game_code, userId);
          
          // Set stakes if specified and hold escrow immediately
          if (stakeTokens > 0) {
            try {
              console.log(`[Matchmaking] Setting stake config for game ${gameSession.game_code}`);
              await GameSessionModel.setStakeConfig(gameSession.game_code, stakeTokens);
              
              console.log(`[Matchmaking] Holding escrow for game ${gameSession.game_code}`);
              await EscrowService.holdForGame(gameSession.game_code);
              console.log(`[Matchmaking] Escrow held successfully for game ${gameSession.game_code}`);
            } catch (escrowError) {
              // If escrow fails, abandon the game and return error
              console.error(`[Matchmaking] Escrow failed for game ${gameSession.game_code}:`, escrowError);
              await GameSessionModel.endGame(gameSession.game_code, null, 'abandoned');
              
              throw escrowError; // Rollback transaction
            }
          }
          
          // Remove current user from queue
          await MatchmakingModel.removeFromQueue(userId);

          // Get final game session with stakes
          const finalGameSession = await GameSessionModel.findByGameCode(gameSession.game_code);
          
          console.log(`[Matchmaking] Match created: ${gameSession.game_code}, Player1: ${opponent.user_id}, Player2: ${userId}`);
          
          // Notify both players via Socket.IO
          if (io) {
            io.to(`user_${opponent.user_id}`).emit('match_found', { gameSession: finalGameSession });
            io.to(`user_${userId}`).emit('match_found', { gameSession: finalGameSession });
            console.log(`[Matchmaking] Socket.IO notifications sent to both players`);
          }

          return {
            matched: true,
            message: stakeTokens > 0 
              ? `Match found! Game created with ${stakeTokens.toLocaleString()} token stakes.`
              : 'Match found! Game created.',
            gameSession: finalGameSession
          };
        } else {
          // Add to queue with stake preference
          await MatchmakingModel.addToQueue(userId, stakeTokens);
          const queueSize = await MatchmakingModel.getQueueSize();
          
          return {
            matched: false,
            message: stakeTokens > 0 
              ? `Added to matchmaking queue for ${stakeTokens.toLocaleString()} token games`
              : 'Added to matchmaking queue',
            queueSize
          };
        }
      });

      res.json(result);
    } catch (error) {
      console.error('Join queue error:', error);
      res.status(500).json({ error: 'Failed to join matchmaking queue' });
    }
  }

  static async leaveQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      await MatchmakingModel.removeFromQueue(userId);
      
      res.json({ message: 'Removed from matchmaking queue' });
    } catch (error) {
      console.error('Leave queue error:', error);
      res.status(500).json({ error: 'Failed to leave matchmaking queue' });
    }
  }

  static async getQueueStatus(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({ error: 'User not authenticated' });
        return;
      }

      const queueEntry = await MatchmakingModel.findInQueue(userId);
      const queueSize = await MatchmakingModel.getQueueSize();

      res.json({
        inQueue: !!queueEntry,
        queueEntry,
        queueSize
      });
    } catch (error) {
      console.error('Get queue status error:', error);
      res.status(500).json({ error: 'Failed to get queue status' });
    }
  }

  static async getQueueStats(req: Request, res: Response): Promise<void> {
    try {
      const queueSize = await MatchmakingModel.getQueueSize();
      const queuedPlayers = await MatchmakingModel.getQueuedPlayers();

      res.json({
        queueSize,
        averageWaitTime: queuedPlayers.length > 0 
          ? queuedPlayers.reduce((acc, player) => {
              const waitTime = Date.now() - new Date(player.created_at).getTime();
              return acc + waitTime;
            }, 0) / queuedPlayers.length / 1000 // in seconds
          : 0
      });
    } catch (error) {
      console.error('Get queue stats error:', error);
      res.status(500).json({ error: 'Failed to get queue stats' });
    }
  }
}
