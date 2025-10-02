import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-key';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
export class AuthUtils {
    static async hashPassword(password) {
        const saltRounds = 12;
        return await bcrypt.hash(password, saltRounds);
    }
    static async comparePassword(password, hash) {
        return await bcrypt.compare(password, hash);
    }
    static generateToken(payload) {
        return jwt.sign(payload, JWT_SECRET, {
            expiresIn: JWT_EXPIRES_IN
        });
    }
    static verifyToken(token) {
        try {
            return jwt.verify(token, JWT_SECRET);
        }
        catch (error) {
            throw new Error('Invalid token');
        }
    }
    static extractTokenFromHeader(authHeader) {
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return null;
        }
        return authHeader.substring(7);
    }
}
export default AuthUtils;
//# sourceMappingURL=auth.js.map