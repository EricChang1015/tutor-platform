import { User } from './user.entity';
export declare class TeacherProfile {
    id: string;
    userId: string;
    intro: string;
    certifications?: string[];
    experienceYears: number;
    domains: string[];
    regions: string[];
    languages?: string[];
    pricePolicies?: any[];
    unitPriceUsd: number;
    meetingPreference?: {
        mode: 'zoom_personal' | 'custom_each_time';
        defaultUrl?: string;
    };
    rating: number;
    ratingsCount: number;
    ratingsBreakdown?: Record<string, number>;
    nextAvailableAt?: Date;
    createdAt: Date;
    updatedAt: Date;
    user: User;
}
