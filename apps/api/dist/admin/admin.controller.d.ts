import { AdminService } from './admin.service';
export declare class AdminController {
    private adminService;
    constructor(adminService: AdminService);
    createTeacher(createTeacherDto: any, req: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("../entities").UserRole;
        active: boolean;
        profile: import("../entities").TeacherProfile;
    }>;
    createStudent(createStudentDto: any, req: any): Promise<{
        id: string;
        email: string;
        name: string;
        role: import("../entities").UserRole;
        active: boolean;
    }>;
    grantCards(grantCardsDto: any, req: any): Promise<{
        id: string;
        studentId: string;
        packageName: string;
        quantity: number;
        remaining: number;
        type: import("../entities").PurchaseType;
        status: import("../entities").PurchaseStatus;
        purchasedAt: Date;
    }>;
    getReports(query: any, req: any): Promise<{
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
    private checkAdminRole;
}
