import { User } from './user.entity';
export declare class BookingMessage {
    id: string;
    bookingId: string;
    senderId: string;
    text: string;
    createdAt: Date;
    sender: User;
}
