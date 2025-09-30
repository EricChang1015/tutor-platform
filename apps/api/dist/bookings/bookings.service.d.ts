import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { User } from '../entities/user.entity';
import { Purchase } from '../entities/purchase.entity';
export declare class BookingsService {
    private bookingRepository;
    private userRepository;
    private purchaseRepository;
    constructor(bookingRepository: Repository<Booking>, userRepository: Repository<User>, purchaseRepository: Repository<Purchase>);
    findUserBookings(userId: string, query?: any): Promise<{
        items: {
            id: string;
            teacher: {
                id: string;
                name: string;
                avatarUrl: string;
            };
            student: {
                id: string;
                name: string;
            };
            startsAt: Date;
            endsAt: Date;
            status: BookingStatus;
            materialId: string;
            lastMessageAt: Date;
            meetingUrl: string;
            source: import("../entities/booking.entity").BookingSource;
        }[];
        page: any;
        pageSize: any;
        total: number;
    }>;
    createBooking(createBookingDto: any, userId: string): Promise<{
        courseTitle: string;
        message: string;
        messages: any[];
        canReschedule: boolean;
        canCancel: boolean;
        cancelPolicy: {
            freeBeforeHours: number;
            tiered: {
                minHours: number;
                maxHours: number;
                cancelCardCost: number;
            }[];
        };
        settlement: any;
        postClass: any;
        id: string;
        teacher: {
            id: string;
            name: string;
            avatarUrl: string;
        };
        student: {
            id: string;
            name: string;
        };
        startsAt: Date;
        endsAt: Date;
        status: BookingStatus;
        materialId: string;
        lastMessageAt: Date;
        meetingUrl: string;
        source: import("../entities/booking.entity").BookingSource;
    }>;
    findById(id: string): Promise<{
        courseTitle: string;
        message: string;
        messages: any[];
        canReschedule: boolean;
        canCancel: boolean;
        cancelPolicy: {
            freeBeforeHours: number;
            tiered: {
                minHours: number;
                maxHours: number;
                cancelCardCost: number;
            }[];
        };
        settlement: any;
        postClass: any;
        id: string;
        teacher: {
            id: string;
            name: string;
            avatarUrl: string;
        };
        student: {
            id: string;
            name: string;
        };
        startsAt: Date;
        endsAt: Date;
        status: BookingStatus;
        materialId: string;
        lastMessageAt: Date;
        meetingUrl: string;
        source: import("../entities/booking.entity").BookingSource;
    }>;
    private formatBookingSummary;
    private formatBookingDetail;
    private canReschedule;
    private canCancel;
    private getCancelPolicy;
}
