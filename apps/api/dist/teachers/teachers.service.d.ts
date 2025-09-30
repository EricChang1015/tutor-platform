import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
import { TeacherProfile } from '../entities/teacher-profile.entity';
export declare class TeachersService {
    private userRepository;
    private teacherProfileRepository;
    constructor(userRepository: Repository<User>, teacherProfileRepository: Repository<TeacherProfile>);
    findAll(query?: any): Promise<{
        items: {
            id: string;
            name: string;
            avatarUrl: string;
            rating: number;
            ratingsCount: number;
            experienceYears: number;
            domains: string[];
            region: string;
            pricePer30min: number;
            nextAvailableAt: Date;
            introSnippet: string;
        }[];
        page: any;
        pageSize: any;
        total: number;
    }>;
    findById(id: string): Promise<{
        id: string;
        name: string;
        avatarUrl: string;
        intro: string;
        certifications: string[];
        experienceYears: number;
        domains: string[];
        region: string;
        gallery: any[];
        rating: number;
        ratingsBreakdown: Record<string, number>;
        languages: string[];
        pricePolicies: any[];
        meetingPreference: {
            mode: "zoom_personal" | "custom_each_time";
            defaultUrl?: string;
        };
    }>;
    private formatTeacherCard;
    private formatTeacherDetail;
}
