import { Request, Response } from 'express';
import { GameSessionModel } from '../models/game-session-model.js';
import { GameMoveModel } from '../models/game-move-model.js';
import { MatchmakingModel } from '../models/matchmaking-model.js';
import { CheckersEngine } from '../game/checkers-engine.js';
import { CreateGameInput, JoinGameInput, GameMoveInput } from '../validation/schemas.js';
import { applyMovePath } from '../game/move-utils.js';
import { AuthenticatedRequest } from '../types/index.js';

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

      res.json({
        message: 'Joined game successfully',
        gameSession: updatedGameSession
      });
    } catch (error) {
      console.error('Join game error:', error);
      res.status(500).json({ error: 'Failed to join game' });
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

      res.json({ gameSession });
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

      // Determine if a multi-jump path was provided
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

      // Save move to history (consolidated)
      const moveNumber = await GameMoveModel.getLastMoveNumber(gameSession.id) + 1;
      const savedMove = { ...moveWithTimestamp } as any;
      await GameMoveModel.create(gameSession.id, userId, savedMove, moveNumber);

      // Check if game ended
      if (updatedState.gameStatus === 'completed') {
        const winnerId = updatedState.winner === 'red' 
          ? gameSession.player1_id 
          : gameSession.player2_id;
        await GameSessionModel.endGame(gameCode, winnerId, 'completed');
      }

      // Get updated game session
      const updatedGameSession = await GameSessionModel.findByGameCode(gameCode);

      res.json({
        message: 'Move made successfully',
        gameSession: updatedGameSession,
        move: savedMove
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

      res.json({ message: 'Game abandoned successfully' });
    } catch (error) {
      console.error('Abandon game error:', error);
      res.status(500).json({ error: 'Failed to abandon game' });
    }
  }
}
