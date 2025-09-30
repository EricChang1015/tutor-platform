import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';
import { Purchase, PurchaseType, PurchaseStatus } from '../entities/purchase.entity';
import { Booking } from '../entities/booking.entity';
export declare class AdminService {
    private userRepository;
    private teacherProfileRepository;
    private purchaseRepository;
    private bookingRepository;
    constructor(userRepository: Repository<User>, teacherProfileRepository: Repository<TeacherProfile>, purchaseRepository: Repository<Purchase>, bookingRepository: Repository<Booking>);
    createTeacher(createTeacherDto: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        active: boolean;
        profile: TeacherProfile;
    }>;
    createStudent(createStudentDto: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: UserRole;
        active: boolean;
    }>;
    grantCards(grantCardsDto: any): Promise<{
        id: string;
        studentId: string;
        packageName: string;
        quantity: number;
        remaining: number;
        type: PurchaseType;
        status: PurchaseStatus;
        purchasedAt: Date;
    }>;
    getReports(query?: any): Promise<{
        totalBookings: number;
        completedBookings: number;
        canceledBookings: number;
        completionRate: string;
        cancellationRate: string;
        technicalCancellationRate: string;
        period: string;
        teacherId: any;
        message: string;
    }>;
    private getSuggestedLabel;
}
