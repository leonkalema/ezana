import { db } from '../database/connection.js';
export async function withTransaction(fn) {
    const conn = await db.getConnection();
    try {
        await conn.beginTransaction();
        const result = await fn(conn);
        await conn.commit();
        return result;
    }
    catch (err) {
        try {
            await conn.rollback();
        }
        catch { }
        throw err;
    }
    finally {
        conn.release();
    }
}
//# sourceMappingURL=tx.js.map