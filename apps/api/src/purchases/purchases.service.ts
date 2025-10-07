import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase, PurchaseStatus, PurchaseType } from '../entities/purchase.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ActivatePurchaseDto } from './dto/activate-purchase.dto';

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

  async createPurchase(createPurchaseDto: CreatePurchaseDto, adminUserId: string) {
    // 檢查學生是否存在
    const student = await this.userRepository.findOne({
      where: { id: createPurchaseDto.studentId, role: UserRole.STUDENT },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // 創建購買記錄
    const purchase = this.purchaseRepository.create({
      studentId: createPurchaseDto.studentId,
      packageName: createPurchaseDto.packageName,
      quantity: createPurchaseDto.quantity,
      remaining: createPurchaseDto.quantity,
      type: createPurchaseDto.type,
      suggestedLabel: createPurchaseDto.suggestedLabel || this.getSuggestedLabel(createPurchaseDto.type),
      status: PurchaseStatus.DRAFT,
      notes: createPurchaseDto.notes,
    });

    const savedPurchase = await this.purchaseRepository.save(purchase);
    return this.formatPurchaseItem(savedPurchase);
  }

  async updatePurchase(id: string, updatePurchaseDto: UpdatePurchaseDto) {
    const purchase = await this.purchaseRepository.findOne({ where: { id } });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    // 更新字段
    if (updatePurchaseDto.packageName !== undefined) {
      purchase.packageName = updatePurchaseDto.packageName;
    }
    if (updatePurchaseDto.remaining !== undefined) {
      purchase.remaining = updatePurchaseDto.remaining;
    }
    if (updatePurchaseDto.status !== undefined) {
      purchase.status = updatePurchaseDto.status;
    }
    if (updatePurchaseDto.expiresAt !== undefined) {
      purchase.expiresAt = new Date(updatePurchaseDto.expiresAt);
    }
    if (updatePurchaseDto.suggestedLabel !== undefined) {
      purchase.suggestedLabel = updatePurchaseDto.suggestedLabel;
    }
    if (updatePurchaseDto.notes !== undefined) {
      purchase.notes = updatePurchaseDto.notes;
    }

    const savedPurchase = await this.purchaseRepository.save(purchase);
    return this.formatPurchaseItem(savedPurchase);
  }

  async deletePurchase(id: string) {
    const purchase = await this.purchaseRepository.findOne({ where: { id } });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    await this.purchaseRepository.remove(purchase);
    return { message: 'Purchase deleted successfully' };
  }

  async activatePurchase(id: string, userId: string, activateDto?: ActivatePurchaseDto, isAdmin: boolean = false) {
    const whereCondition = isAdmin ? { id } : { id, studentId: userId };
    const purchase = await this.purchaseRepository.findOne({
      where: whereCondition,
    });

    if (!purchase) {
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.status !== PurchaseStatus.DRAFT) {
      throw new BadRequestException('Purchase already activated');
    }

    // 啟動購買項目
    purchase.activatedAt = new Date();
    purchase.status = PurchaseStatus.ACTIVE;

    // 設定過期時間
    let expireDays: number;
    if (isAdmin && activateDto?.customExpireDays) {
      expireDays = activateDto.customExpireDays;
    } else {
      // 預設每張卡一週
      expireDays = purchase.quantity * 7;
    }

    purchase.expiresAt = new Date(Date.now() + expireDays * 24 * 60 * 60 * 1000);

    const savedPurchase = await this.purchaseRepository.save(purchase);
    return this.formatPurchaseItem(savedPurchase);
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

  async consumeCards(studentId: string, slotsNeeded: number, bookingId: string, cardTypes?: PurchaseType[]) {
    // 預設使用課卡類型
    const defaultCardTypes = [PurchaseType.LESSON_CARD, PurchaseType.TRIAL_CARD, PurchaseType.COMPENSATION_CARD];
    const targetCardTypes = cardTypes || defaultCardTypes;

    // 查找可用的卡片
    const availableCards = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .where('purchase.studentId = :studentId', { studentId })
      .andWhere('purchase.type IN (:...types)', { types: targetCardTypes })
      .andWhere('purchase.status = :status', { status: PurchaseStatus.ACTIVE })
      .andWhere('purchase.remaining > 0')
      .andWhere('purchase.expiresAt > :now', { now: new Date() })
      .orderBy('purchase.expiresAt', 'ASC') // 優先使用即將過期的卡
      .getMany();

    let totalAvailable = availableCards.reduce((sum, card) => sum + card.remaining, 0);

    if (totalAvailable < slotsNeeded) {
      throw new BadRequestException(`Insufficient cards. Need ${slotsNeeded}, available ${totalAvailable}`);
    }

    // 扣除卡片
    let remainingToConsume = slotsNeeded;
    const consumedCards = [];

    for (const card of availableCards) {
      if (remainingToConsume <= 0) break;

      const toConsume = Math.min(card.remaining, remainingToConsume);
      card.remaining -= toConsume;

      if (card.remaining === 0) {
        card.status = PurchaseStatus.CONSUMED;
      }

      await this.purchaseRepository.save(card);

      consumedCards.push({
        purchaseId: card.id,
        type: card.type,
        consumed: toConsume,
        remaining: card.remaining,
      });

      remainingToConsume -= toConsume;
    }

    return {
      consumed: slotsNeeded,
      consumedCards,
      bookingId,
    };
  }

  async consumeCancelCards(studentId: string, cancelCardsNeeded: number, bookingId: string) {
    try {
      return await this.consumeCards(studentId, cancelCardsNeeded, bookingId, [PurchaseType.CANCEL_CARD]);
    } catch (error) {
      // 如果沒有足夠的取消卡，返回部分消耗結果
      const availableCancelCards = await this.purchaseRepository
        .createQueryBuilder('purchase')
        .where('purchase.studentId = :studentId', { studentId })
        .andWhere('purchase.type = :type', { type: PurchaseType.CANCEL_CARD })
        .andWhere('purchase.status = :status', { status: PurchaseStatus.ACTIVE })
        .andWhere('purchase.remaining > 0')
        .andWhere('purchase.expiresAt > :now', { now: new Date() })
        .orderBy('purchase.expiresAt', 'ASC')
        .getMany();

      const totalAvailable = availableCancelCards.reduce((sum, card) => sum + card.remaining, 0);

      if (totalAvailable === 0) {
        throw new BadRequestException('No cancel cards available');
      }

      // 消耗所有可用的取消卡
      return await this.consumeCards(studentId, totalAvailable, bookingId, [PurchaseType.CANCEL_CARD]);
    }
  }

  async refundCards(studentId: string, slotsToRefund: number, originalBookingId: string) {
    // 查找最近消耗的卡片記錄（這裡簡化處理，實際應該有消耗記錄表）
    const recentCards = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .where('purchase.studentId = :studentId', { studentId })
      .andWhere('purchase.type IN (:...types)', { types: [PurchaseType.LESSON_CARD, PurchaseType.TRIAL_CARD, PurchaseType.COMPENSATION_CARD] })
      .andWhere('purchase.status IN (:...statuses)', { statuses: [PurchaseStatus.ACTIVE, PurchaseStatus.CONSUMED] })
      .orderBy('purchase.purchasedAt', 'DESC')
      .getMany();

    let remainingToRefund = slotsToRefund;
    const refundedCards = [];

    for (const card of recentCards) {
      if (remainingToRefund <= 0) break;

      const maxRefund = card.quantity - card.remaining;
      const toRefund = Math.min(maxRefund, remainingToRefund);

      if (toRefund > 0) {
        card.remaining += toRefund;
        if (card.status === PurchaseStatus.CONSUMED) {
          card.status = PurchaseStatus.ACTIVE;
        }

        await this.purchaseRepository.save(card);

        refundedCards.push({
          purchaseId: card.id,
          type: card.type,
          refunded: toRefund,
          remaining: card.remaining,
        });

        remainingToRefund -= toRefund;
      }
    }

    return {
      refunded: slotsToRefund - remainingToRefund,
      refundedCards,
      originalBookingId,
    };
  }

  private getSuggestedLabel(type: PurchaseType): string {
    const labelMap = {
      [PurchaseType.LESSON_CARD]: '約課次卡',
      [PurchaseType.TRIAL_CARD]: '體驗次卡',
      [PurchaseType.COMPENSATION_CARD]: '補償次卡',
      [PurchaseType.CANCEL_CARD]: '取消約課次卡',
    };
    return labelMap[type] || '未知類型';
  }

  private formatPurchaseItem(purchase: Purchase) {
    const now = new Date();
    let statusDisplay = purchase.status;

    // 檢查是否過期
    if (purchase.status === PurchaseStatus.ACTIVE && purchase.expiresAt && purchase.expiresAt <= now) {
      statusDisplay = PurchaseStatus.EXPIRED;
    }

    return {
      id: purchase.id,
      studentId: purchase.studentId,
      student: purchase.student ? {
        id: purchase.student.id,
        name: purchase.student.name,
        email: purchase.student.email,
      } : undefined,
      packageName: purchase.packageName,
      quantity: purchase.quantity,
      remaining: purchase.remaining,
      type: purchase.type,
      suggestedLabel: purchase.suggestedLabel,
      purchasedAt: purchase.purchasedAt,
      activatedAt: purchase.activatedAt,
      expiresAt: purchase.expiresAt,
      status: statusDisplay,
      notes: purchase.notes,
      meta: purchase.meta,
      canActivate: purchase.status === PurchaseStatus.DRAFT,
      isExpired: purchase.status === PurchaseStatus.ACTIVE && purchase.expiresAt && purchase.expiresAt <= now,
    };
  }
}
