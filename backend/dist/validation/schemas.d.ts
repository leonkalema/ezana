import { z } from 'zod';
export declare const createUserSchema: z.ZodObject<{
    username: z.ZodString;
    email: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    email: string;
    password: string;
}, {
    username: string;
    email: string;
    password: string;
}>;
export declare const loginSchema: z.ZodObject<{
    username: z.ZodString;
    password: z.ZodString;
}, "strip", z.ZodTypeAny, {
    username: string;
    password: string;
}, {
    username: string;
    password: string;
}>;
export declare const createGameSchema: z.ZodObject<{
    gameCode: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    gameCode?: string | undefined;
}, {
    gameCode?: string | undefined;
}>;
export declare const joinGameSchema: z.ZodObject<{
    gameCode: z.ZodString;
}, "strip", z.ZodTypeAny, {
    gameCode: string;
}, {
    gameCode: string;
}>;
export declare const positionSchema: z.ZodObject<{
    row: z.ZodNumber;
    col: z.ZodNumber;
}, "strip", z.ZodTypeAny, {
    row: number;
    col: number;
}, {
    row: number;
    col: number;
}>;
export declare const gameMoveSchema: z.ZodObject<{
    gameCode: z.ZodString;
    move: z.ZodObject<{
        from: z.ZodObject<{
            row: z.ZodNumber;
            col: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            row: number;
            col: number;
        }, {
            row: number;
            col: number;
        }>;
        to: z.ZodObject<{
            row: z.ZodNumber;
            col: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            row: number;
            col: number;
        }, {
            row: number;
            col: number;
        }>;
        capturedPieces: z.ZodOptional<z.ZodArray<z.ZodObject<{
            row: z.ZodNumber;
            col: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            row: number;
            col: number;
        }, {
            row: number;
            col: number;
        }>, "many">>;
        isKingMove: z.ZodOptional<z.ZodBoolean>;
        path: z.ZodOptional<z.ZodArray<z.ZodObject<{
            row: z.ZodNumber;
            col: z.ZodNumber;
        }, "strip", z.ZodTypeAny, {
            row: number;
            col: number;
        }, {
            row: number;
            col: number;
        }>, "many">>;
    }, "strip", z.ZodTypeAny, {
        from: {
            row: number;
            col: number;
        };
        to: {
            row: number;
            col: number;
        };
        capturedPieces?: {
            row: number;
            col: number;
        }[] | undefined;
        isKingMove?: boolean | undefined;
        path?: {
            row: number;
            col: number;
        }[] | undefined;
    }, {
        from: {
            row: number;
            col: number;
        };
        to: {
            row: number;
            col: number;
        };
        capturedPieces?: {
            row: number;
            col: number;
        }[] | undefined;
        isKingMove?: boolean | undefined;
        path?: {
            row: number;
            col: number;
        }[] | undefined;
    }>;
}, "strip", z.ZodTypeAny, {
    gameCode: string;
    move: {
        from: {
            row: number;
            col: number;
        };
        to: {
            row: number;
            col: number;
        };
        capturedPieces?: {
            row: number;
            col: number;
        }[] | undefined;
        isKingMove?: boolean | undefined;
        path?: {
            row: number;
            col: number;
        }[] | undefined;
    };
}, {
    gameCode: string;
    move: {
        from: {
            row: number;
            col: number;
        };
        to: {
            row: number;
            col: number;
        };
        capturedPieces?: {
            row: number;
            col: number;
        }[] | undefined;
        isKingMove?: boolean | undefined;
        path?: {
            row: number;
            col: number;
        }[] | undefined;
    };
}>;
export type CreateUserInput = z.infer<typeof createUserSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type CreateGameInput = z.infer<typeof createGameSchema>;
export type JoinGameInput = z.infer<typeof joinGameSchema>;
export type GameMoveInput = z.infer<typeof gameMoveSchema>;
//# sourceMappingURL=schemas.d.ts.map