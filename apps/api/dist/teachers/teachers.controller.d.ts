import { TeachersService } from './teachers.service';
export declare class TeachersController {
    private teachersService;
    constructor(teachersService: TeachersService);
    getTeachers(query: any): Promise<{
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
    getTeacher(id: string): Promise<{
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
}
