import { Request, Response } from 'express';
import { MatchmakingModel } from '../models/matchmaking-model.js';
import { GameSessionModel } from '../models/game-session-model.js';
import { AuthenticatedRequest } from '../middleware/auth-middleware.js';

export class MatchmakingController {
  static async joinQueue(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
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
          error: 'You are already in the matchmaking queue',
          queueEntry: existingQueueEntry
        });
        return;
      }

      // Try to find an opponent
      const opponent = await MatchmakingModel.getOldestQueuedPlayer(userId);
      
      if (opponent) {
        // Create a game with the opponent
        const gameSession = await GameSessionModel.create(opponent.user_id);
        
        // Join the game as player 2
        const updatedGameSession = await GameSessionModel.joinGame(gameSession.game_code, userId);
        
        // Remove both players from queue
        await MatchmakingModel.removeFromQueue(opponent.user_id);
        await MatchmakingModel.removeFromQueue(userId);

        res.json({
          message: 'Match found! Game created.',
          gameSession: updatedGameSession,
          matched: true
        });
      } else {
        // Add user to queue
        await MatchmakingModel.addToQueue(userId);
        
        const queueSize = await MatchmakingModel.getQueueSize();
        
        res.json({
          message: 'Added to matchmaking queue',
          queueSize,
          matched: false
        });
      }
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
