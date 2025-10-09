import type mysql from 'mysql2/promise';
export declare function withTransaction<T>(fn: (conn: mysql.PoolConnection) => Promise<T>): Promise<T>;
//# sourceMappingURL=tx.d.ts.map