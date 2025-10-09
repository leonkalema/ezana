import { MatchmakingModel } from '../models/matchmaking-model.js';
import { GameSessionModel } from '../models/game-session-model.js';
import { EscrowService } from '../services/escrow/escrow-service.js';
export class MatchmakingController {
    static async joinQueue(req, res) {
        try {
            const userId = req.user?.id;
            const { stakeTokens = 0 } = req.body;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
            if (activeGames.length > 0) {
                res.status(409).json({
                    error: 'You already have an active game',
                    activeGame: activeGames[0]
                });
                return;
            }
            const existingQueueEntry = await MatchmakingModel.findInQueue(userId);
            if (existingQueueEntry) {
                res.status(409).json({
                    queueEntry: existingQueueEntry
                });
                return;
            }
            const opponent = await MatchmakingModel.getOldestQueuedPlayer(userId, stakeTokens);
            if (opponent) {
                const gameSession = await GameSessionModel.create(opponent.user_id);
                const updatedGameSession = await GameSessionModel.joinGame(gameSession.game_code, userId);
                if (stakeTokens > 0) {
                    await GameSessionModel.setStakeConfig(gameSession.game_code, stakeTokens);
                    await EscrowService.holdForGame(gameSession.game_code);
                }
                await MatchmakingModel.removeFromQueue(opponent.user_id);
                await MatchmakingModel.removeFromQueue(userId);
                const finalGameSession = await GameSessionModel.findByGameCode(gameSession.game_code);
                res.json({
                    message: stakeTokens > 0
                        ? `Match found! Game created with ${stakeTokens.toLocaleString()} token stakes.`
                        : 'Match found! Game created.',
                    gameSession: finalGameSession,
                    matched: true
                });
            }
            else {
                await MatchmakingModel.addToQueue(userId, stakeTokens);
                const queueSize = await MatchmakingModel.getQueueSize();
                res.json({
                    message: stakeTokens > 0
                        ? `Added to matchmaking queue for ${stakeTokens.toLocaleString()} token games`
                        : 'Added to matchmaking queue',
                    queueSize,
                    matched: false
                });
            }
        }
        catch (error) {
            console.error('Join queue error:', error);
            res.status(500).json({ error: 'Failed to join matchmaking queue' });
        }
    }
    static async leaveQueue(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            await MatchmakingModel.removeFromQueue(userId);
            res.json({ message: 'Removed from matchmaking queue' });
        }
        catch (error) {
            console.error('Leave queue error:', error);
            res.status(500).json({ error: 'Failed to leave matchmaking queue' });
        }
    }
    static async getQueueStatus(req, res) {
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
        }
        catch (error) {
            console.error('Get queue status error:', error);
            res.status(500).json({ error: 'Failed to get queue status' });
        }
    }
    static async getQueueStats(req, res) {
        try {
            const queueSize = await MatchmakingModel.getQueueSize();
            const queuedPlayers = await MatchmakingModel.getQueuedPlayers();
            res.json({
                queueSize,
                averageWaitTime: queuedPlayers.length > 0
                    ? queuedPlayers.reduce((acc, player) => {
                        const waitTime = Date.now() - new Date(player.created_at).getTime();
                        return acc + waitTime;
                    }, 0) / queuedPlayers.length / 1000
                    : 0
            });
        }
        catch (error) {
            console.error('Get queue stats error:', error);
            res.status(500).json({ error: 'Failed to get queue stats' });
        }
    }
}
//# sourceMappingURL=matchmaking-controller.js.map