import { db } from '../database/connection.js';
export class GameMoveModel {
    static async create(gameSessionId, playerId, moveData, moveNumber) {
        const query = `
      INSERT INTO game_moves (game_session_id, player_id, move_data, move_number)
      VALUES (?, ?, ?, ?)
    `;
        const result = await db.query(query, [gameSessionId, playerId, JSON.stringify(moveData), moveNumber]);
        const insertId = result.insertId;
        const gameMove = await this.findById(insertId);
        if (!gameMove) {
            throw new Error('Failed to create game move');
        }
        return gameMove;
    }
    static async findById(id) {
        const query = `
      SELECT id, game_session_id, player_id, move_data, move_number, created_at
      FROM game_moves
      WHERE id = ?
    `;
        const result = await db.queryOne(query, [id]);
        if (!result)
            return null;
        return {
            ...result,
            move_data: JSON.parse(result.move_data)
        };
    }
    static async findByGameSession(gameSessionId) {
        const query = `
      SELECT id, game_session_id, player_id, move_data, move_number, created_at
      FROM game_moves
      WHERE game_session_id = ?
      ORDER BY move_number ASC
    `;
        const results = await db.query(query, [gameSessionId]);
        return results.map(result => ({
            ...result,
            move_data: JSON.parse(result.move_data)
        }));
    }
    static async getLastMoveNumber(gameSessionId) {
        const query = `
      SELECT COALESCE(MAX(move_number), 0) as last_move_number
      FROM game_moves
      WHERE game_session_id = ?
    `;
        const result = await db.queryOne(query, [gameSessionId]);
        return result?.last_move_number || 0;
    }
    static async getMoveHistory(gameSessionId, limit) {
        let query = `
      SELECT id, game_session_id, player_id, move_data, move_number, created_at
      FROM game_moves
      WHERE game_session_id = ?
      ORDER BY move_number DESC
    `;
        const params = [gameSessionId];
        if (limit) {
            query += ' LIMIT ?';
            params.push(limit);
        }
        const results = await db.query(query, params);
        return results.map(result => ({
            ...result,
            move_data: JSON.parse(result.move_data)
        }));
    }
}
//# sourceMappingURL=game-move-model.js.map