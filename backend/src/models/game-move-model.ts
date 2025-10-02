import { db } from '../database/connection.js';
import { GameMove, CheckersMove } from '../types/index.js';

export class GameMoveModel {
  static async create(gameSessionId: number, playerId: number, moveData: CheckersMove, moveNumber: number): Promise<GameMove> {
    const query = `
      INSERT INTO game_moves (game_session_id, player_id, move_data, move_number)
      VALUES (?, ?, ?, ?)
    `;

    const result = await db.query(query, [gameSessionId, playerId, JSON.stringify(moveData), moveNumber]);
    const insertId = (result as any).insertId;

    const gameMove = await this.findById(insertId);
    if (!gameMove) {
      throw new Error('Failed to create game move');
    }

    return gameMove;
  }

  static async findById(id: number): Promise<GameMove | null> {
    const query = `
      SELECT id, game_session_id, player_id, move_data, move_number, created_at
      FROM game_moves
      WHERE id = ?
    `;

    const result = await db.queryOne<any>(query, [id]);
    if (!result) return null;

    try {
      return {
        ...result,
        move_data: typeof result.move_data === 'string' 
          ? JSON.parse(result.move_data) 
          : result.move_data
      };
    } catch (error) {
      console.error('Error parsing move_data JSON for findById:', result.move_data, error);
      throw new Error('Invalid move data');
    }
  }

  static async findByGameSession(gameSessionId: number): Promise<GameMove[]> {
    const query = `
      SELECT id, game_session_id, player_id, move_data, move_number, created_at
      FROM game_moves
      WHERE game_session_id = ?
      ORDER BY move_number ASC
    `;

    const results = await db.query<any>(query, [gameSessionId]);
    return results.map(result => {
      try {
        return {
          ...result,
          move_data: typeof result.move_data === 'string' 
            ? JSON.parse(result.move_data) 
            : result.move_data
        };
      } catch (error) {
        console.error('Error parsing move_data JSON for findByGameSession:', result.move_data, error);
        throw new Error('Invalid move data');
      }
    });
  }

  static async getLastMoveNumber(gameSessionId: number): Promise<number> {
    const query = `
      SELECT COALESCE(MAX(move_number), 0) as last_move_number
      FROM game_moves
      WHERE game_session_id = ?
    `;

    const result = await db.queryOne<{ last_move_number: number }>(query, [gameSessionId]);
    return result?.last_move_number || 0;
  }

  static async getMoveHistory(gameSessionId: number, limit?: number): Promise<GameMove[]> {
    let query = `
      SELECT id, game_session_id, player_id, move_data, move_number, created_at
      FROM game_moves
      WHERE game_session_id = ?
      ORDER BY move_number DESC
    `;

    const params: any[] = [gameSessionId];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const results = await db.query<any>(query, params);
    return results.map(result => {
      try {
        return {
          ...result,
          move_data: typeof result.move_data === 'string' 
            ? JSON.parse(result.move_data) 
            : result.move_data
        };
      } catch (error) {
        console.error('Error parsing move_data JSON for getMoveHistory:', result.move_data, error);
        throw new Error('Invalid move data');
      }
    });
  }
}
