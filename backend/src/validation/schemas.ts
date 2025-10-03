import { z } from 'zod';

export const createUserSchema = z.object({
  username: z.string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be less than 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
  email: z.string()
    .email('Invalid email format')
    .max(100, 'Email must be less than 100 characters'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password must be less than 128 characters')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Password must contain at least one lowercase letter, one uppercase letter, and one number')
});

export const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required')
});

export const createGameSchema = z.object({
  gameCode: z.string()
    .length(8, 'Game code must be exactly 8 characters')
    .regex(/^[A-Z0-9]+$/, 'Game code can only contain uppercase letters and numbers')
    .optional()
});

export const joinGameSchema = z.object({
  gameCode: z.string()
    .length(8, 'Game code must be exactly 8 characters')
    .regex(/^[A-Z0-9]+$/, 'Game code can only contain uppercase letters and numbers')
});

export const positionSchema = z.object({
  row: z.number().int().min(0).max(7),
  col: z.number().int().min(0).max(7)
});

export const gameMoveSchema = z.object({
  gameCode: z.string()
    .length(8, 'Game code must be exactly 8 characters')
    .regex(/^[A-Z0-9]+$/, 'Game code can only contain uppercase letters and numbers'),
  move: z.object({
    from: positionSchema,
    to: positionSchema,
    capturedPieces: z.array(positionSchema).optional(),
    isKingMove: z.boolean().optional(),
    // Optional multi-jump path, must start with `from` and end with `to`
    path: z.array(positionSchema).min(2).optional()
  })
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type JoinGameInput = z.infer<typeof joinGameSchema>;
export type GameMoveInput = z.infer<typeof gameMoveSchema>;
