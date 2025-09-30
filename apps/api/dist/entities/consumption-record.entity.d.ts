import { Booking } from './booking.entity';
import { User } from './user.entity';
import { PurchaseType } from './purchase.entity';
export declare enum ConsumptionReason {
    BOOKING = "booking",
    CANCEL_TIER_1 = "cancel_tier_1",
    CANCEL_TIER_2 = "cancel_tier_2",
    CANCEL_TIER_LOCKED = "cancel_tier_locked",
    ADMIN_ADJUST = "admin_adjust",
    REFUND = "refund"
}
export declare class ConsumptionRecord {
    id: string;
    bookingId?: string;
    studentId: string;
    purchaseId: string;
    type: PurchaseType;
    amount: number;
    reason: ConsumptionReason;
    meta?: any;
    createdAt: Date;
    booking?: Booking;
    student: User;
}
