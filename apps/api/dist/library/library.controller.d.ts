import { LibraryService } from './library.service';
export declare class LibraryController {
    private libraryService;
    constructor(libraryService: LibraryService);
    getLibrary(query: any): Promise<{
        folders: {
            id: string;
            name: string;
            parentId: any;
            path: string;
            children: {
                id: string;
                name: string;
                parentId: string;
                path: string;
                materials: {
                    id: string;
                    type: string;
                    title: string;
                    content: string;
                }[];
            }[];
        }[];
    } | {
        materials: any[];
    }>;
    getMaterial(id: string): Promise<any>;
}
