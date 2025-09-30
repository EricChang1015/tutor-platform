import { Booking } from './booking.entity';
import { User } from './user.entity';
export declare enum ReviewStatus {
    PENDING = "pending",
    APPROVED = "approved",
    REJECTED = "rejected"
}
export declare class Review {
    id: string;
    bookingId: string;
    teacherId: string;
    studentId: string;
    studentMaskedName?: string;
    rating: number;
    comment?: string;
    status: ReviewStatus;
    reason?: string;
    createdAt: Date;
    updatedAt: Date;
    booking: Booking;
    teacher: User;
}
