import { User } from './user.entity';
export declare enum PurchaseType {
    LESSON_CARD = "lesson_card",
    TRIAL_CARD = "trial_card",
    COMPENSATION_CARD = "compensation_card",
    CANCEL_CARD = "cancel_card"
}
export declare enum PurchaseStatus {
    DRAFT = "draft",
    ACTIVE = "active",
    EXPIRED = "expired",
    CONSUMED = "consumed"
}
export declare class Purchase {
    id: string;
    studentId: string;
    packageName: string;
    quantity: number;
    remaining: number;
    type: PurchaseType;
    suggestedLabel?: string;
    purchasedAt: Date;
    activatedAt?: Date;
    expiresAt?: Date;
    status: PurchaseStatus;
    notes?: string;
    meta?: any;
    student: User;
}
