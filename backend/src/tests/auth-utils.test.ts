import { describe, it, expect } from 'vitest';
import { AuthUtils } from '../utils/auth.js';

describe('AuthUtils', () => {
  describe('hashPassword', () => {
    it('should hash a password', async () => {
      const password = 'testPassword123';
      const hash = await AuthUtils.hashPassword(password);
      
      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50);
    });

    it('should generate different hashes for the same password', async () => {
      const password = 'testPassword123';
      const hash1 = await AuthUtils.hashPassword(password);
      const hash2 = await AuthUtils.hashPassword(password);
      
      expect(hash1).not.toBe(hash2);
    });
  });

  describe('comparePassword', () => {
    it('should return true for correct password', async () => {
      const password = 'testPassword123';
      const hash = await AuthUtils.hashPassword(password);
      
      const isValid = await AuthUtils.comparePassword(password, hash);
      expect(isValid).toBe(true);
    });

    it('should return false for incorrect password', async () => {
      const password = 'testPassword123';
      const wrongPassword = 'wrongPassword456';
      const hash = await AuthUtils.hashPassword(password);
      
      const isValid = await AuthUtils.comparePassword(wrongPassword, hash);
      expect(isValid).toBe(false);
    });
  });

  describe('generateToken', () => {
    it('should generate a JWT token', () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        is_online: true,
        last_seen: new Date()
      };

      const token = AuthUtils.generateToken(user);
      
      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT has 3 parts
    });
  });

  describe('verifyToken', () => {
    it('should verify a valid token', () => {
      const user = {
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        created_at: new Date(),
        updated_at: new Date(),
        is_online: true,
        last_seen: new Date()
      };

      const token = AuthUtils.generateToken(user);
      const decoded = AuthUtils.verifyToken(token);
      
      expect(decoded.id).toBe(user.id);
      expect(decoded.username).toBe(user.username);
      expect(decoded.email).toBe(user.email);
    });

    it('should throw error for invalid token', () => {
      const invalidToken = 'invalid.token.here';
      
      expect(() => {
        AuthUtils.verifyToken(invalidToken);
      }).toThrow('Invalid token');
    });
  });

  describe('extractTokenFromHeader', () => {
    it('should extract token from Bearer header', () => {
      const token = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9';
      const authHeader = `Bearer ${token}`;
      
      const extractedToken = AuthUtils.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBe(token);
    });

    it('should return null for invalid header format', () => {
      const authHeader = 'InvalidFormat token';
      
      const extractedToken = AuthUtils.extractTokenFromHeader(authHeader);
      expect(extractedToken).toBeNull();
    });

    it('should return null for undefined header', () => {
      const extractedToken = AuthUtils.extractTokenFromHeader(undefined);
      expect(extractedToken).toBeNull();
    });
  });
});
