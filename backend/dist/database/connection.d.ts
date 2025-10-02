import mysql from 'mysql2/promise';
declare class DatabaseConnection {
    private pool;
    constructor();
    getConnection(): Promise<mysql.PoolConnection>;
    query<T = any>(sql: string, params?: any[]): Promise<T[]>;
    queryOne<T = any>(sql: string, params?: any[]): Promise<T | null>;
    testConnection(): Promise<boolean>;
    close(): Promise<void>;
}
export declare const db: DatabaseConnection;
export default db;
//# sourceMappingURL=connection.d.ts.map