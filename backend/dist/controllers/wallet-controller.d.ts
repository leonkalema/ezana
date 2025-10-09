import { Response } from 'express';
import { AuthenticatedRequest } from '../types/index.js';
export declare class WalletController {
    static getBalance(req: AuthenticatedRequest, res: Response): Promise<void>;
    static getTransactions(req: AuthenticatedRequest, res: Response): Promise<void>;
    static deposit(req: AuthenticatedRequest<{}, {}, {
        amount: number;
    }>, res: Response): Promise<void>;
}
//# sourceMappingURL=wallet-controller.d.ts.map