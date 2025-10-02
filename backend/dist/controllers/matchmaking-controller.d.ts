import { Request, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth-middleware.js';
export declare class MatchmakingController {
    static joinQueue(req: AuthenticatedRequest, res: Response): Promise<void>;
    static leaveQueue(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getQueueStatus(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getQueueStats(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=matchmaking-controller.d.ts.map