import { User } from './user.entity';
export declare enum MediaType {
    IMAGE = "image",
    VIDEO = "video",
    OTHER = "other"
}
export declare class TeacherGallery {
    id: string;
    teacherId: string;
    url: string;
    type: MediaType;
    caption?: string;
    uploadedAt: Date;
    teacher: User;
}
