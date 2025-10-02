import { User, CreateUserRequest } from '../types/index.js';
export declare class UserModel {
    static create(userData: CreateUserRequest): Promise<Omit<User, 'password_hash'>>;
    static findById(id: number): Promise<Omit<User, 'password_hash'> | null>;
    static findByUsername(username: string): Promise<User | null>;
    static findByEmail(email: string): Promise<User | null>;
    static updateOnlineStatus(id: number, isOnline: boolean): Promise<void>;
    static checkUsernameExists(username: string): Promise<boolean>;
    static checkEmailExists(email: string): Promise<boolean>;
    static getOnlineUsers(): Promise<Omit<User, 'password_hash'>[]>;
}
//# sourceMappingURL=user-model.d.ts.map