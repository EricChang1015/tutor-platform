import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase, PurchaseStatus } from '../entities/purchase.entity';
import { User } from '../entities/user.entity';

@Injectable()
export class PurchasesService {
  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findUserPurchases(userId: string, query: any = {}) {
    const { page = 1, pageSize = 20, studentId, sort } = query;
    
    // 如果指定了 studentId，檢查權限（只有管理員可以查看其他用戶的購買記錄）
    const targetUserId = studentId || userId;
    
    const queryBuilder = this.purchaseRepository
      .createQueryBuilder('purchase')
      .leftJoinAndSelect('purchase.student', 'student')
      .where('purchase.studentId = :studentId', { studentId: targetUserId });

    // 排序
    if (sort) {
      const [field, order] = sort.split(':');
      queryBuilder.orderBy(`purchase.${field}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('purchase.purchasedAt', 'DESC');
    }

    // 分頁
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

  async activatePurchase(id: string, userId: string) {
    const purchase = await this.purchaseRepository.findOne({
      where: { id, studentId: userId },
    });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    if (purchase.status !== PurchaseStatus.DRAFT) {
      throw new Error('Purchase already activated');
    }

    // 啟動購買項目
    purchase.activatedAt = new Date();
    purchase.status = PurchaseStatus.ACTIVE;
    
    // 設定過期時間（每張卡一週）
    const weeksToAdd = purchase.quantity;
    purchase.expiresAt = new Date(Date.now() + weeksToAdd * 7 * 24 * 60 * 60 * 1000);

    await this.purchaseRepository.save(purchase);

    return this.formatPurchaseItem(purchase);
  }

  async extendPurchase(id: string, newExpiresAt: Date) {
    const purchase = await this.purchaseRepository.findOne({ where: { id } });

    if (!purchase) {
      throw new Error('Purchase not found');
    }

    purchase.expiresAt = newExpiresAt;
    await this.purchaseRepository.save(purchase);

    return this.formatPurchaseItem(purchase);
  }

  private formatPurchaseItem(purchase: Purchase) {
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
      expiresAt: purchase.expiresAt || (purchase.status === PurchaseStatus.DRAFT ? '14天' : null),
      status: purchase.status,
      notes: purchase.notes,
      meta: purchase.meta,
    };
  }
}
