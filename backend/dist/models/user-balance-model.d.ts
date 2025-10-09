export interface UserBalanceRow {
    user_id: number;
    balance_tokens: number;
    updated_at: Date;
}
export declare class UserBalanceModel {
    static get(userId: number): Promise<UserBalanceRow>;
    static credit(userId: number, amount: number, tx: any): Promise<void>;
    static debit(userId: number, amount: number, tx: any): Promise<void>;
}
//# sourceMappingURL=user-balance-model.d.ts.map