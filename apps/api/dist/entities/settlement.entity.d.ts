export declare enum SettlementStatus {
    PENDING = "pending",
    BLOCKED = "blocked",
    READY = "ready",
    SETTLED = "settled"
}
export declare class Settlement {
    id: string;
    bookingId: string;
    status: SettlementStatus;
    teacherUnitUsd?: number;
    payableAt?: Date;
    settledAt?: Date;
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}
