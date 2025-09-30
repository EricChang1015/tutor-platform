import { Repository } from 'typeorm';
import { Purchase, PurchaseStatus } from '../entities/purchase.entity';
import { User } from '../entities/user.entity';
export declare class PurchasesService {
    private purchaseRepository;
    private userRepository;
    constructor(purchaseRepository: Repository<Purchase>, userRepository: Repository<User>);
    findUserPurchases(userId: string, query?: any): Promise<{
        items: {
            id: string;
            studentId: string;
            packageName: string;
            quantity: number;
            remaining: number;
            type: import("../entities/purchase.entity").PurchaseType;
            suggestedLabel: string;
            purchasedAt: Date;
            activatedAt: Date;
            expiresAt: string | Date;
            status: PurchaseStatus;
            notes: string;
            meta: any;
        }[];
        page: any;
        pageSize: any;
        total: number;
    }>;
    activatePurchase(id: string, userId: string): Promise<{
        id: string;
        studentId: string;
        packageName: string;
        quantity: number;
        remaining: number;
        type: import("../entities/purchase.entity").PurchaseType;
        suggestedLabel: string;
        purchasedAt: Date;
        activatedAt: Date;
        expiresAt: string | Date;
        status: PurchaseStatus;
        notes: string;
        meta: any;
    }>;
    extendPurchase(id: string, newExpiresAt: Date): Promise<{
        id: string;
        studentId: string;
        packageName: string;
        quantity: number;
        remaining: number;
        type: import("../entities/purchase.entity").PurchaseType;
        suggestedLabel: string;
        purchasedAt: Date;
        activatedAt: Date;
        expiresAt: string | Date;
        status: PurchaseStatus;
        notes: string;
        meta: any;
    }>;
    private formatPurchaseItem;
}
