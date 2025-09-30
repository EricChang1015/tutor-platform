import { TeacherProfile } from './teacher-profile.entity';
import { Booking } from './booking.entity';
import { Purchase } from './purchase.entity';
export declare enum UserRole {
    ADMIN = "admin",
    TEACHER = "teacher",
    STUDENT = "student"
}
export declare class User {
    id: string;
    email: string;
    passwordHash: string;
    role: UserRole;
    name: string;
    avatarUrl?: string;
    bio?: string;
    phone?: string;
    timezone: string;
    locale: string;
    settings?: any;
    active: boolean;
    createdAt: Date;
    updatedAt: Date;
    deletedAt?: Date;
    teacherProfile?: TeacherProfile;
    studentBookings: Booking[];
    teacherBookings: Booking[];
    purchases: Purchase[];
}
