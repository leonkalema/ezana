export type LedgerKind = 'deposit' | 'stake_hold' | 'stake_payout' | 'stake_refund';
export type LedgerDirection = 'credit' | 'debit';
export interface LedgerRow {
    id: number;
    user_id: number | null;
    kind: LedgerKind;
    direction: LedgerDirection;
    amount: number;
    reference: string | null;
    created_at: Date;
}
export declare class LedgerModel {
    static add(tx: any, params: {
        userId: number | null;
        kind: LedgerKind;
        direction: LedgerDirection;
        amount: number;
        reference?: string | null;
    }): Promise<void>;
    static listByUser(userId: number, limit?: number): Promise<LedgerRow[]>;
}
//# sourceMappingURL=ledger-model.d.ts.map