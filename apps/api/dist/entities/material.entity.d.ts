export declare enum MaterialType {
    PAGE = "page",
    PDF = "pdf"
}
export declare class Material {
    id: string;
    type: MaterialType;
    title: string;
    folderId: string;
    content?: string;
    fileUrl?: string;
    previewUrl?: string;
    meta?: any;
    createdAt: Date;
    updatedAt: Date;
}
