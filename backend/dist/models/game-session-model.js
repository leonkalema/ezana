import { db } from '../database/connection.js';
import { CheckersEngine } from '../game/checkers-engine.js';
import { GameCodeGenerator } from '../utils/game-code-generator.js';
export class GameSessionModel {
    static async create(player1Id, gameCode) {
        const code = gameCode || GameCodeGenerator.generate();
        const initialGameState = CheckersEngine.createInitialGameState();
        const gameStateJson = JSON.stringify(initialGameState);
        console.log('Creating game with state:', gameStateJson);
        const query = `
      INSERT INTO game_sessions (game_code, player1_id, game_state)
      VALUES (?, ?, ?)
    `;
        const result = await db.query(query, [code, player1Id, gameStateJson]);
        const insertId = result.insertId;
        const gameSession = await this.findById(insertId);
        if (!gameSession) {
            throw new Error('Failed to create game session');
        }
        return gameSession;
    }
    static async findById(id) {
        const query = `
      SELECT id, game_code, player1_id, player2_id, game_state, current_turn, status,
             winner_id, stake_tokens, rake_bps, escrow_status,
             created_at, updated_at, started_at, ended_at
      FROM game_sessions
      WHERE id = ?
    `;
        const result = await db.queryOne(query, [id]);
        if (!result)
            return null;
        try {
            return {
                ...result,
                game_state: typeof result.game_state === 'string'
                    ? JSON.parse(result.game_state)
                    : result.game_state
            };
        }
        catch (error) {
            console.error('Error parsing game_state JSON for findById:', result.game_state, error);
            throw new Error('Invalid game state data');
        }
    }
    static async findByGameCode(gameCode) {
        const query = `
      SELECT id, game_code, player1_id, player2_id, game_state, current_turn, status,
             winner_id, stake_tokens, rake_bps, escrow_status,
             created_at, updated_at, started_at, ended_at
      FROM game_sessions
      WHERE game_code = ?
    `;
        const result = await db.queryOne(query, [gameCode]);
        if (!result)
            return null;
        try {
            return {
                ...result,
                game_state: typeof result.game_state === 'string'
                    ? JSON.parse(result.game_state)
                    : result.game_state
            };
        }
        catch (error) {
            console.error('Error parsing game_state JSON for findByGameCode:', result.game_state, error);
            throw new Error('Invalid game state data');
        }
    }
    static async joinGame(gameCode, player2Id) {
        const query = `
      UPDATE game_sessions
      SET player2_id = ?, status = 'active', started_at = CURRENT_TIMESTAMP
      WHERE game_code = ? AND player2_id IS NULL AND status = 'waiting'
    `;
        const result = await db.query(query, [player2Id, gameCode]);
        const affectedRows = result.affectedRows;
        if (affectedRows === 0) {
            return null;
        }
        return await this.findByGameCode(gameCode);
    }
    static async updateGameState(gameCode, gameState, currentTurn) {
        const query = `
      UPDATE game_sessions
      SET game_state = ?, current_turn = ?, updated_at = CURRENT_TIMESTAMP
      WHERE game_code = ?
    `;
        await db.query(query, [JSON.stringify(gameState), currentTurn, gameCode]);
    }
    static async endGame(gameCode, winnerId, status) {
        const query = `
      UPDATE game_sessions
      SET winner_id = ?, status = ?, ended_at = CURRENT_TIMESTAMP
      WHERE game_code = ?
    `;
        await db.query(query, [winnerId, status, gameCode]);
    }
    static async setStakeConfig(gameCode, stakeTokens, rakeBps = 1000) {
        const query = `
      UPDATE game_sessions
      SET stake_tokens = ?, rake_bps = ?, escrow_status = IFNULL(escrow_status, 'none')
      WHERE game_code = ?
    `;
        await db.query(query, [stakeTokens, rakeBps, gameCode]);
    }
    static async findActiveGamesByPlayer(playerId) {
        const query = `
      SELECT id, game_code, player1_id, player2_id, game_state, current_turn, status,
             winner_id, stake_tokens, rake_bps, escrow_status,
             created_at, updated_at, started_at, ended_at
      FROM game_sessions
      WHERE (player1_id = ? OR player2_id = ?) AND status IN ('waiting', 'active')
      ORDER BY updated_at DESC
    `;
        const results = await db.query(query, [playerId, playerId]);
        return results.map(result => {
            try {
                return {
                    ...result,
                    game_state: typeof result.game_state === 'string'
                        ? JSON.parse(result.game_state)
                        : result.game_state
                };
            }
            catch (error) {
                console.error('Error parsing game_state JSON for findActiveGamesByPlayer:', result.game_state, error);
                throw new Error('Invalid game state data');
            }
        });
    }
    static async findWaitingGames() {
        const query = `
      SELECT id, game_code, player1_id, player2_id, game_state, current_turn, status,
             winner_id, stake_tokens, rake_bps, escrow_status,
             created_at, updated_at, started_at, ended_at
      FROM game_sessions
      WHERE status = 'waiting' AND player2_id IS NULL
      ORDER BY created_at ASC
    `;
        const results = await db.query(query);
        return results.map(result => ({
            ...result,
            game_state: JSON.parse(result.game_state)
        }));
    }
    static async checkGameCodeExists(gameCode) {
        const query = `
      SELECT COUNT(*) as count
      FROM game_sessions
      WHERE game_code = ?
    `;
        const result = await db.queryOne(query, [gameCode]);
        return (result?.count || 0) > 0;
    }
    static async isPlayerInGame(playerId, gameCode) {
        const query = `
      SELECT COUNT(*) as count
      FROM game_sessions
      WHERE game_code = ? AND (player1_id = ? OR player2_id = ?)
    `;
        const result = await db.queryOne(query, [gameCode, playerId, playerId]);
        return (result?.count || 0) > 0;
    }
    static async getPlayerRole(playerId, gameCode) {
        const query = `
      SELECT player1_id, player2_id
      FROM game_sessions
      WHERE game_code = ?
    `;
        const result = await db.queryOne(query, [gameCode]);
        if (!result)
            return null;
        if (result.player1_id === playerId)
            return 'player1';
        if (result.player2_id === playerId)
            return 'player2';
        return null;
    }
}
//# sourceMappingURL=game-session-model.js.map