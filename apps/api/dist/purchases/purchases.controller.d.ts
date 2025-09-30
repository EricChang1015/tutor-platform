import { PurchasesService } from './purchases.service';
export declare class PurchasesController {
    private purchasesService;
    constructor(purchasesService: PurchasesService);
    getPurchases(query: any, req: any): Promise<{
        items: {
            id: string;
            studentId: string;
            packageName: string;
            quantity: number;
            remaining: number;
            type: import("../entities").PurchaseType;
            suggestedLabel: string;
            purchasedAt: Date;
            activatedAt: Date;
            expiresAt: string | Date;
            status: import("../entities").PurchaseStatus;
            notes: string;
            meta: any;
        }[];
        page: any;
        pageSize: any;
        total: number;
    }>;
    activatePurchase(id: string, req: any): Promise<{
        id: string;
        studentId: string;
        packageName: string;
        quantity: number;
        remaining: number;
        type: import("../entities").PurchaseType;
        suggestedLabel: string;
        purchasedAt: Date;
        activatedAt: Date;
        expiresAt: string | Date;
        status: import("../entities").PurchaseStatus;
        notes: string;
        meta: any;
    }>;
    extendPurchase(id: string, body: {
        newExpiresAt: string;
    }, req: any): Promise<{
        id: string;
        studentId: string;
        packageName: string;
        quantity: number;
        remaining: number;
        type: import("../entities").PurchaseType;
        suggestedLabel: string;
        purchasedAt: Date;
        activatedAt: Date;
        expiresAt: string | Date;
        status: import("../entities").PurchaseStatus;
        notes: string;
        meta: any;
    }>;
}
