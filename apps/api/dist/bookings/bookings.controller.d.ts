import { BookingsService } from './bookings.service';
export declare class BookingsController {
    private bookingsService;
    constructor(bookingsService: BookingsService);
    getBookings(query: any, req: any): Promise<{
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
            status: import("../entities").BookingStatus;
            materialId: string;
            lastMessageAt: Date;
            meetingUrl: string;
            source: import("../entities").BookingSource;
        }[];
        page: any;
        pageSize: any;
        total: number;
    }>;
    createBooking(createBookingDto: any, req: any): Promise<{
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
        status: import("../entities").BookingStatus;
        materialId: string;
        lastMessageAt: Date;
        meetingUrl: string;
        source: import("../entities").BookingSource;
    }>;
    getBooking(id: string): Promise<{
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
        status: import("../entities").BookingStatus;
        materialId: string;
        lastMessageAt: Date;
        meetingUrl: string;
        source: import("../entities").BookingSource;
    }>;
}
