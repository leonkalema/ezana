import { GameSessionModel } from '../models/game-session-model.js';
import { GameMoveModel } from '../models/game-move-model.js';
import { MatchmakingModel } from '../models/matchmaking-model.js';
import { CheckersEngine } from '../game/checkers-engine.js';
import { applyMovePath } from '../game/move-utils.js';
import { EscrowService } from '../services/escrow/escrow-service.js';
export class GameController {
    static async createGame(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { gameCode } = req.body;
            const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
            if (activeGames.length > 0) {
                res.status(409).json({
                    error: 'You already have an active game',
                    activeGame: activeGames[0]
                });
                return;
            }
            if (gameCode && await GameSessionModel.checkGameCodeExists(gameCode)) {
                res.status(409).json({ error: 'Game code already exists' });
                return;
            }
            await MatchmakingModel.removeFromQueue(userId);
            const gameSession = await GameSessionModel.create(userId, gameCode);
            res.status(201).json({
                message: 'Game created successfully',
                gameSession
            });
        }
        catch (error) {
            console.error('Create game error:', error);
            res.status(500).json({ error: 'Failed to create game' });
        }
    }
    static async joinGame(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { gameCode } = req.body;
            const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
            if (activeGames.length > 0) {
                res.status(409).json({
                    error: 'You already have an active game',
                    activeGame: activeGames[0]
                });
                return;
            }
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
            await MatchmakingModel.removeFromQueue(userId);
            const updatedGameSession = await GameSessionModel.joinGame(gameCode, userId);
            if (!updatedGameSession) {
                res.status(409).json({ error: 'Failed to join game' });
                return;
            }
            res.json({
                message: 'Joined game successfully',
                gameSession: updatedGameSession
            });
        }
        catch (error) {
            console.error('Join game error:', error);
            res.status(500).json({ error: 'Failed to join game' });
        }
    }
    static async setStake(req, res) {
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
        }
        catch (error) {
            console.error('Set stake error:', error);
            res.status(500).json({ error: 'Failed to set stake' });
        }
    }
    static async getGame(req, res) {
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
            const isPlayerInGame = await GameSessionModel.isPlayerInGame(userId, gameCode);
            if (!isPlayerInGame) {
                res.status(403).json({ error: 'You are not part of this game' });
                return;
            }
            res.json({ gameSession });
        }
        catch (error) {
            console.error('Get game error:', error);
            res.status(500).json({ error: 'Failed to get game' });
        }
    }
    static async makeMove(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const { gameCode, move } = req.body;
            const gameSession = await GameSessionModel.findByGameCode(gameCode);
            if (!gameSession) {
                res.status(404).json({ error: 'Game not found' });
                return;
            }
            const playerRole = await GameSessionModel.getPlayerRole(userId, gameCode);
            if (!playerRole) {
                res.status(403).json({ error: 'You are not part of this game' });
                return;
            }
            if (gameSession.status !== 'active') {
                res.status(409).json({ error: 'Game is not active' });
                return;
            }
            if (gameSession.current_turn !== playerRole) {
                res.status(409).json({ error: 'It is not your turn' });
                return;
            }
            const isPlayer1 = playerRole === 'player1';
            const path = move.path && move.path.length >= 2 ? move.path : undefined;
            const moveWithTimestamp = { ...move, timestamp: new Date() };
            const prevCaptured = {
                red: gameSession.game_state.capturedPieces.red,
                black: gameSession.game_state.capturedPieces.black
            };
            let updatedState;
            if (path) {
                const applied = applyMovePath(gameSession.game_state, path, isPlayer1);
                if (!applied) {
                    res.status(400).json({ error: 'Invalid move path' });
                    return;
                }
                updatedState = applied.state;
            }
            else {
                const moveWithTimestamp = { ...move, timestamp: new Date() };
                const isValidMove = CheckersEngine.isValidMove(gameSession.game_state, moveWithTimestamp, userId, isPlayer1);
                if (!isValidMove) {
                    res.status(400).json({ error: 'Invalid move' });
                    return;
                }
                updatedState = CheckersEngine.applyMove(gameSession.game_state, moveWithTimestamp);
            }
            const capturedDelta = (updatedState.capturedPieces.red - prevCaptured.red) +
                (updatedState.capturedPieces.black - prevCaptured.black);
            const didCapture = capturedDelta > 0;
            const landing = moveWithTimestamp.to;
            const piece = updatedState.board[landing.row]?.[landing.col];
            const playerColor = (playerRole === 'player1') ? 'red' : 'black';
            function hasFurtherCapture(state, fromRow, fromCol, color, isKing) {
                const inBounds = (r, c) => r >= 0 && r < 8 && c >= 0 && c < 8;
                const dirs = isKing
                    ? [[-1, -1], [-1, 1], [1, -1], [1, 1]]
                    : [[-1, -1], [-1, 1], [1, -1], [1, 1]];
                for (const [dr, dc] of dirs) {
                    const r1 = fromRow + dr;
                    const c1 = fromCol + dc;
                    const r2 = fromRow + 2 * dr;
                    const c2 = fromCol + 2 * dc;
                    if (inBounds(r2, c2)) {
                        const mid = state.board[r1]?.[c1];
                        const land = state.board[r2]?.[c2];
                        if (mid?.type && mid.color !== color && land?.type === null) {
                            return true;
                        }
                    }
                    if (isKing) {
                        let rr = fromRow + dr;
                        let cc = fromCol + dc;
                        let foundOpponent = false;
                        while (inBounds(rr, cc)) {
                            const sq = state.board[rr]?.[cc];
                            if (sq?.type) {
                                if (sq.color === color)
                                    break;
                                foundOpponent = true;
                                rr += dr;
                                cc += dc;
                                while (inBounds(rr, cc)) {
                                    const landSq = state.board[rr]?.[cc];
                                    if (landSq?.type === null)
                                        return true;
                                    if (landSq?.type)
                                        break;
                                    rr += dr;
                                    cc += dc;
                                }
                                break;
                            }
                            rr += dr;
                            cc += dc;
                        }
                        if (foundOpponent) {
                        }
                    }
                }
                return false;
            }
            const shouldContinue = didCapture && piece?.type && hasFurtherCapture(updatedState, landing.row, landing.col, playerColor, piece.type === 'king');
            if (shouldContinue) {
                updatedState.currentPlayer = playerColor;
            }
            const newCurrentTurn = shouldContinue ? playerRole : (playerRole === 'player1' ? 'player2' : 'player1');
            await GameSessionModel.updateGameState(gameCode, updatedState, newCurrentTurn);
            const moveNumber = await GameMoveModel.getLastMoveNumber(gameSession.id) + 1;
            const savedMove = { ...moveWithTimestamp };
            await GameMoveModel.create(gameSession.id, userId, savedMove, moveNumber);
            if (updatedState.gameStatus === 'completed') {
                console.log('Game completed! Winner from engine:', updatedState.winner);
                let winnerId = null;
                if (updatedState.winner === 'red') {
                    winnerId = gameSession.player1_id;
                    console.log('Red wins! Winner ID:', winnerId);
                }
                else if (updatedState.winner === 'black') {
                    winnerId = gameSession.player2_id;
                    console.log('Black wins! Winner ID:', winnerId);
                }
                else {
                    console.log('True draw - no winner');
                }
                await GameSessionModel.endGame(gameCode, winnerId, 'completed');
                await EscrowService.finalize(gameCode);
            }
            const updatedGameSession = await GameSessionModel.findByGameCode(gameCode);
            res.json({
                message: 'Move made successfully',
                gameSession: updatedGameSession,
                move: savedMove
            });
        }
        catch (error) {
            console.error('Make move error:', error);
            res.status(500).json({ error: 'Failed to make move' });
        }
    }
    static async getActiveGames(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const activeGames = await GameSessionModel.findActiveGamesByPlayer(userId);
            res.json({ activeGames });
        }
        catch (error) {
            console.error('Get active games error:', error);
            res.status(500).json({ error: 'Failed to get active games' });
        }
    }
    static async abandonGame(req, res) {
        try {
            const userId = req.user?.id;
            const { gameCode } = req.params;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const isPlayerInGame = await GameSessionModel.isPlayerInGame(userId, gameCode);
            if (!isPlayerInGame) {
                res.status(403).json({ error: 'You are not part of this game' });
                return;
            }
            const gameSession = await GameSessionModel.findByGameCode(gameCode);
            if (!gameSession) {
                res.status(404).json({ error: 'Game not found' });
                return;
            }
            const winnerId = gameSession.player1_id === userId
                ? gameSession.player2_id
                : gameSession.player1_id;
            await GameSessionModel.endGame(gameCode, winnerId, 'abandoned');
            await EscrowService.finalize(gameCode);
            const updatedGameSession = await GameSessionModel.findByGameCode(gameCode);
            if (updatedGameSession) {
                const io = req.app.get('io');
                if (io) {
                    io.to(`game:${gameCode}`).emit('game_state_updated', {
                        gameSession: updatedGameSession
                    });
                    io.to(`game:${gameCode}`).emit('wallet_balance_updated', {
                        gameCode,
                        winnerId: updatedGameSession.winner_id ?? null,
                        stakeTokens: updatedGameSession.stake_tokens ?? 0
                    });
                }
            }
            res.json({ message: 'Game abandoned successfully' });
        }
        catch (error) {
            console.error('Abandon game error:', error);
            res.status(500).json({ error: 'Failed to abandon game' });
        }
    }
}
//# sourceMappingURL=game-controller.js.map