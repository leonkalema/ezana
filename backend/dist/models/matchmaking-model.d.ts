import { MatchmakingQueue } from '../types/index.js';
export declare class MatchmakingModel {
    static addToQueue(userId: number, stakeTokens?: number): Promise<void>;
    static removeFromQueue(userId: number): Promise<void>;
    static findInQueue(userId: number): Promise<MatchmakingQueue | null>;
    static getQueuedPlayers(excludeUserId?: number): Promise<MatchmakingQueue[]>;
    static getOldestQueuedPlayer(excludeUserId?: number, stakeTokens?: number): Promise<MatchmakingQueue | null>;
    static getQueueSize(): Promise<number>;
    static clearOldEntries(olderThanMinutes?: number): Promise<void>;
}
//# sourceMappingURL=matchmaking-model.d.ts.map