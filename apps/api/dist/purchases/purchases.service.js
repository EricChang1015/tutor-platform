"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PurchasesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const purchase_entity_1 = require("../entities/purchase.entity");
const user_entity_1 = require("../entities/user.entity");
let PurchasesService = class PurchasesService {
    constructor(purchaseRepository, userRepository) {
        this.purchaseRepository = purchaseRepository;
        this.userRepository = userRepository;
    }
    async findUserPurchases(userId, query = {}) {
        const { page = 1, pageSize = 20, studentId, sort } = query;
        const targetUserId = studentId || userId;
        const queryBuilder = this.purchaseRepository
            .createQueryBuilder('purchase')
            .leftJoinAndSelect('purchase.student', 'student')
            .where('purchase.studentId = :studentId', { studentId: targetUserId });
        if (sort) {
            const [field, order] = sort.split(':');
            queryBuilder.orderBy(`purchase.${field}`, order.toUpperCase());
        }
        else {
            queryBuilder.orderBy('purchase.purchasedAt', 'DESC');
        }
        const offset = (page - 1) * pageSize;
        queryBuilder.skip(offset).take(pageSize);
        const [items, total] = await queryBuilder.getManyAndCount();
        return {
            items: items.map(purchase => this.formatPurchaseItem(purchase)),
            page,
            pageSize,
            total,
        };
    }
    async activatePurchase(id, userId) {
        const purchase = await this.purchaseRepository.findOne({
            where: { id, studentId: userId },
        });
        if (!purchase) {
            throw new Error('Purchase not found');
        }
        if (purchase.status !== purchase_entity_1.PurchaseStatus.DRAFT) {
            throw new Error('Purchase already activated');
        }
        purchase.activatedAt = new Date();
        purchase.status = purchase_entity_1.PurchaseStatus.ACTIVE;
        const weeksToAdd = purchase.quantity;
        purchase.expiresAt = new Date(Date.now() + weeksToAdd * 7 * 24 * 60 * 60 * 1000);
        await this.purchaseRepository.save(purchase);
        return this.formatPurchaseItem(purchase);
    }
    async extendPurchase(id, newExpiresAt) {
        const purchase = await this.purchaseRepository.findOne({ where: { id } });
        if (!purchase) {
            throw new Error('Purchase not found');
        }
        purchase.expiresAt = newExpiresAt;
        await this.purchaseRepository.save(purchase);
        return this.formatPurchaseItem(purchase);
    }
    formatPurchaseItem(purchase) {
        return {
            id: purchase.id,
            studentId: purchase.studentId,
            packageName: purchase.packageName,
            quantity: purchase.quantity,
            remaining: purchase.remaining,
            type: purchase.type,
            suggestedLabel: purchase.suggestedLabel,
            purchasedAt: purchase.purchasedAt,
            activatedAt: purchase.activatedAt,
            expiresAt: purchase.expiresAt || (purchase.status === purchase_entity_1.PurchaseStatus.DRAFT ? '14天' : null),
            status: purchase.status,
            notes: purchase.notes,
            meta: purchase.meta,
        };
    }
};
exports.PurchasesService = PurchasesService;
exports.PurchasesService = PurchasesService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository])
], PurchasesService);
//# sourceMappingURL=purchases.service.js.map