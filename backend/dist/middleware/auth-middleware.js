import { AuthUtils } from '../utils/auth.js';
import { UserModel } from '../models/user-model.js';
export const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = AuthUtils.extractTokenFromHeader(authHeader);
        if (!token) {
            res.status(401).json({ error: 'Access token required' });
            return;
        }
        const decoded = AuthUtils.verifyToken(token);
        const user = await UserModel.findById(decoded.id);
        if (!user) {
            res.status(401).json({ error: 'User not found' });
            return;
        }
        req.user = {
            id: user.id,
            username: user.username,
            email: user.email
        };
        next();
    }
    catch (error) {
        res.status(401).json({ error: 'Invalid token' });
    }
};
export const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        const token = AuthUtils.extractTokenFromHeader(authHeader);
        if (token) {
            const decoded = AuthUtils.verifyToken(token);
            const user = await UserModel.findById(decoded.id);
            if (user) {
                req.user = {
                    id: user.id,
                    username: user.username,
                    email: user.email
                };
            }
        }
        next();
    }
    catch (error) {
        next();
    }
};
//# sourceMappingURL=auth-middleware.js.map