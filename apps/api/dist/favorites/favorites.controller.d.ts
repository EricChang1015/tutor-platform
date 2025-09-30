import { FavoritesService } from './favorites.service';
export declare class FavoritesController {
    private favoritesService;
    constructor(favoritesService: FavoritesService);
    getFavorites(req: any): Promise<{
        items: {
            teacherId: string;
            addedAt: string;
        }[];
    }>;
    addFavorite(body: {
        teacherId: string;
    }, req: any): Promise<{
        teacherId: string;
        addedAt: string;
    }>;
    removeFavorite(teacherId: string, req: any): Promise<void>;
}
