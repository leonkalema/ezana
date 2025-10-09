import { Response } from 'express';
import { CreateGameInput, JoinGameInput, GameMoveInput } from '../validation/schemas.js';
import { AuthenticatedRequest } from '../types/index.js';
export declare class GameController {
    static createGame(req: AuthenticatedRequest<{}, {}, CreateGameInput>, res: Response): Promise<void>;
    static joinGame(req: AuthenticatedRequest<{}, {}, JoinGameInput>, res: Response): Promise<void>;
    static setStake(req: AuthenticatedRequest<{
        gameCode: string;
    }, {}, {
        stakeTokens: number;
        rakeBps?: number;
    }>, res: Response): Promise<void>;
    static getGame(req: AuthenticatedRequest, res: Response): Promise<void>;
    static makeMove(req: AuthenticatedRequest<{}, {}, GameMoveInput>, res: Response): Promise<void>;
    static getActiveGames(req: AuthenticatedRequest, res: Response): Promise<void>;
    static abandonGame(req: AuthenticatedRequest, res: Response): Promise<void>;
}
//# sourceMappingURL=game-controller.d.ts.map