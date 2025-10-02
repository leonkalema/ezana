import { Request, Response } from 'express';
import { UserModel } from '../models/user-model.js';
import { AuthUtils } from '../utils/auth.js';
import { CreateUserInput, LoginInput } from '../validation/schemas.js';
import { createError } from '../middleware/error-middleware.js';

export class AuthController {
  static async register(req: Request<{}, {}, CreateUserInput>, res: Response): Promise<void> {
    try {
      const { username, email, password } = req.body;

      // Check if username already exists
      const existingUsername = await UserModel.checkUsernameExists(username);
      if (existingUsername) {
        res.status(409).json({ error: 'Username already exists' });
        return;
      }

      // Check if email already exists
      const existingEmail = await UserModel.checkEmailExists(email);
      if (existingEmail) {
        res.status(409).json({ error: 'Email already exists' });
        return;
      }

      // Create user
      const user = await UserModel.create({ username, email, password });
      
      // Generate token
      const token = AuthUtils.generateToken(user);

      res.status(201).json({
        message: 'User registered successfully',
        user,
        token
      });
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Failed to register user' });
    }
  }

  static async login(req: Request<{}, {}, LoginInput>, res: Response): Promise<void> {
    try {
      const { username, password } = req.body;

      // Find user by username
      const user = await UserModel.findByUsername(username);
      if (!user) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Verify password
      const isValidPassword = await AuthUtils.comparePassword(password, user.password_hash);
      if (!isValidPassword) {
        res.status(401).json({ error: 'Invalid credentials' });
        return;
      }

      // Update online status
      await UserModel.updateOnlineStatus(user.id, true);

      // Generate token
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
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Failed to login' });
    }
  }

  static async logout(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
      if (userId) {
        await UserModel.updateOnlineStatus(userId, false);
      }

      res.json({ message: 'Logout successful' });
    } catch (error) {
      console.error('Logout error:', error);
      res.status(500).json({ error: 'Failed to logout' });
    }
  }

  static async getProfile(req: Request, res: Response): Promise<void> {
    try {
      const userId = (req as any).user?.id;
      
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
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ error: 'Failed to get profile' });
    }
  }
}
