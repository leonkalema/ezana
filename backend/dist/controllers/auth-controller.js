import { UserModel } from '../models/user-model.js';
import { AuthUtils } from '../utils/auth.js';
export class AuthController {
    static async register(req, res) {
        try {
            const { username, email, password } = req.body;
            const existingUsername = await UserModel.checkUsernameExists(username);
            if (existingUsername) {
                res.status(409).json({ error: 'Username already exists' });
                return;
            }
            const existingEmail = await UserModel.checkEmailExists(email);
            if (existingEmail) {
                res.status(409).json({ error: 'Email already exists' });
                return;
            }
            const user = await UserModel.create({ username, email, password });
            const token = AuthUtils.generateToken(user);
            res.status(201).json({
                message: 'User registered successfully',
                user,
                token
            });
        }
        catch (error) {
            console.error('Registration error:', error);
            res.status(500).json({ error: 'Failed to register user' });
        }
    }
    static async login(req, res) {
        try {
            const { username, password } = req.body;
            const user = await UserModel.findByUsername(username);
            if (!user) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            const isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
            if (!isValidPassword) {
                res.status(401).json({ error: 'Invalid credentials' });
                return;
            }
            await UserModel.updateOnlineStatus(user.id, true);
            const userWithoutPassword = {
                id: user.id,
                username: user.username,
                email: user.email,
                created_at: user.created_at,
                updated_at: user.updated_at,
                is_online: true,
                last_seen: user.last_seen
            };
            const token = AuthUtils.generateToken(userWithoutPassword);
            res.json({
                message: 'Login successful',
                user: userWithoutPassword,
                token
            });
        }
        catch (error) {
            console.error('Login error:', error);
            res.status(500).json({ error: 'Failed to login' });
        }
    }
    static async logout(req, res) {
        try {
            const userId = req.user?.id;
            if (userId) {
                await UserModel.updateOnlineStatus(userId, false);
            }
            res.json({ message: 'Logout successful' });
        }
        catch (error) {
            console.error('Logout error:', error);
            res.status(500).json({ error: 'Failed to logout' });
        }
    }
    static async getProfile(req, res) {
        try {
            const userId = req.user?.id;
            if (!userId) {
                res.status(401).json({ error: 'User not authenticated' });
                return;
            }
            const user = await UserModel.findById(userId);
            if (!user) {
                res.status(404).json({ error: 'User not found' });
                return;
            }
            res.json({ user });
        }
        catch (error) {
            console.error('Get profile error:', error);
            res.status(500).json({ error: 'Failed to get profile' });
        }
    }
}
//# sourceMappingURL=auth-controller.js.map