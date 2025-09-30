import { Repository } from 'typeorm';
import { User } from '../entities/user.entity';
export declare class FavoritesService {
    private userRepository;
    constructor(userRepository: Repository<User>);
    getFavorites(userId: string): Promise<{
        items: {
            teacherId: string;
            addedAt: string;
        }[];
    }>;
    addFavorite(userId: string, teacherId: string): Promise<{
        teacherId: string;
        addedAt: string;
    }>;
    removeFavorite(userId: string, teacherId: string): Promise<{
        success: boolean;
    }>;
}
