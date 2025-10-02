import { Request, Response } from 'express';
import { CreateUserInput, LoginInput } from '../validation/schemas.js';
export declare class AuthController {
    static register(req: Request<{}, {}, CreateUserInput>, res: Response): Promise<void>;
    static login(req: Request<{}, {}, LoginInput>, res: Response): Promise<void>;
    static logout(req: Request, res: Response): Promise<void>;
    static getProfile(req: Request, res: Response): Promise<void>;
}
//# sourceMappingURL=auth-controller.d.ts.map