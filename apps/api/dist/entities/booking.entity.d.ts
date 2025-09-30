import { User } from './user.entity';
export declare enum BookingStatus {
    SCHEDULED = "scheduled",
    PENDING = "pending",
    PENDING_TEACHER = "pending_teacher",
    CANCELED = "canceled",
    COMPLETED = "completed",
    NOSHOW = "noshow"
}
export declare enum BookingSource {
    STUDENT = "student",
    ADMIN = "admin",
    TEACHER = "teacher",
    SYSTEM = "system"
}
export declare class Booking {
    id: string;
    studentId: string;
    teacherId: string;
    startsAt: Date;
    endsAt: Date;
    status: BookingStatus;
    source: BookingSource;
    materialId?: string;
    courseTitle?: string;
    message?: string;
    meetingUrl?: string;
    lastMessageAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    student: User;
    teacher: User;
}
