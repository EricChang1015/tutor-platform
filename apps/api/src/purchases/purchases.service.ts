import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Purchase, PurchaseStatus, PurchaseType } from '../entities/purchase.entity';
import { User, UserRole } from '../entities/user.entity';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { ActivatePurchaseDto } from './dto/activate-purchase.dto';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class PurchasesService {
  private readonly logger = new LoggerService('PurchasesService');

  constructor(
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findUserPurchases(userId: string, query: any = {}, callerRole: UserRole | string = UserRole.STUDENT) {
    this.logger.logMethodCall('findUserPurchases', { userId, callerRole, ...query });
    const { page = 1, pageSize = 20, studentId, sort } = query;

    // Server-side 權限檢查：如果呼叫者不是 admin，但試圖查詢其他 student's 資料，直接拒絕
    if (studentId && studentId !== userId && callerRole !== UserRole.ADMIN && callerRole !== 'admin') {
      this.logger.warn(`Forbidden purchases query by non-admin: caller=${userId}, target=${studentId}`);
      throw new ForbiddenException('Admin access required to view other users\' purchases');
    }

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

    const result = {
      items: items.map(purchase => this.formatPurchaseItem(purchase)),
      page,
      pageSize,
      total,
    };
    this.logger.logMethodResult('findUserPurchases', { targetUserId, total, page, pageSize });
    return result;
  }

  async createPurchase(createPurchaseDto: CreatePurchaseDto, _adminUserId: string) {
    this.logger.logMethodCall('createPurchase', { adminUserId: _adminUserId, studentId: createPurchaseDto.studentId, type: createPurchaseDto.type, quantity: createPurchaseDto.quantity });
    // 檢查學生是否存在
    const student = await this.userRepository.findOne({
      where: { id: createPurchaseDto.studentId, role: UserRole.STUDENT },
    });

    if (!student) {
      this.logger.warn(`Student not found: ${createPurchaseDto.studentId}`);
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
    const formatted = this.formatPurchaseItem(savedPurchase);
    this.logger.logMethodResult('createPurchase', { id: formatted.id, studentId: formatted.studentId, type: formatted.type });
    return formatted;
  }

  async updatePurchase(id: string, updatePurchaseDto: UpdatePurchaseDto) {
    this.logger.logMethodCall('updatePurchase', { id, ...updatePurchaseDto });
    const purchase = await this.purchaseRepository.findOne({ where: { id } });

    if (!purchase) {
      this.logger.warn(`Purchase not found: ${id}`);
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
    const formatted = this.formatPurchaseItem(savedPurchase);
    this.logger.logMethodResult('updatePurchase', { id: formatted.id, status: formatted.status, remaining: formatted.remaining });
    return formatted;
  }

  async deletePurchase(id: string) {
    this.logger.logMethodCall('deletePurchase', { id });
    const purchase = await this.purchaseRepository.findOne({ where: { id } });

    if (!purchase) {
      this.logger.warn(`Purchase not found: ${id}`);
      throw new NotFoundException('Purchase not found');
    }

    await this.purchaseRepository.remove(purchase);
    this.logger.logMethodResult('deletePurchase', { id, deleted: true });
    return { message: 'Purchase deleted successfully' };
  }

  async activatePurchase(id: string, userId: string, activateDto?: ActivatePurchaseDto, isAdmin: boolean = false) {
    this.logger.logMethodCall('activatePurchase', { id, userId, isAdmin, customExpireDays: activateDto?.customExpireDays });
    const whereCondition = isAdmin ? { id } : { id, studentId: userId };
    const purchase = await this.purchaseRepository.findOne({
      where: whereCondition,
    });

    if (!purchase) {
      this.logger.warn(`Purchase not found: ${id}`);
      throw new NotFoundException('Purchase not found');
    }

    if (purchase.status !== PurchaseStatus.DRAFT) {
      this.logger.warn(`Purchase already activated: ${id} (status=${purchase.status})`);
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
    const formatted = this.formatPurchaseItem(savedPurchase);
    this.logger.logMethodResult('activatePurchase', { id: formatted.id, expiresAt: formatted.expiresAt });
    return formatted;
  }

  async extendPurchase(id: string, newExpiresAt: Date) {
    this.logger.logMethodCall('extendPurchase', { id, newExpiresAt });
    const purchase = await this.purchaseRepository.findOne({ where: { id } });

    if (!purchase) {
      this.logger.warn(`Purchase not found: ${id}`);
      throw new Error('Purchase not found');
    }

    purchase.expiresAt = newExpiresAt;
    await this.purchaseRepository.save(purchase);

    const formatted = this.formatPurchaseItem(purchase);
    this.logger.logMethodResult('extendPurchase', { id: formatted.id, expiresAt: formatted.expiresAt });
    return formatted;
  }

  async consumeCards(studentId: string, slotsNeeded: number, bookingId: string, cardTypes?: PurchaseType[]) {
    this.logger.logMethodCall('consumeCards', { studentId, slotsNeeded, bookingId, cardTypes });
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
      this.logger.warn(`Insufficient cards for student=${studentId}. Need ${slotsNeeded}, available ${totalAvailable}`);
      throw new BadRequestException(`Insufficient cards. Need ${slotsNeeded}, available ${totalAvailable}`);
    }

    // 扣除卡片
    let remainingToConsume = slotsNeeded;
    const consumedCards = [] as Array<{ purchaseId: string; type: PurchaseType; consumed: number; remaining: number }>;

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
        type: card.type as PurchaseType,
        consumed: toConsume,
        remaining: card.remaining,
      });

      remainingToConsume -= toConsume;
    }

    const result = {
      consumed: slotsNeeded,
      consumedCards,
      bookingId,
    };
    this.logger.logMethodResult('consumeCards', { consumed: result.consumed, items: consumedCards.length, bookingId });
    return result;
  }

  async consumeCancelCards(studentId: string, cancelCardsNeeded: number, bookingId: string) {
    this.logger.logMethodCall('consumeCancelCards', { studentId, cancelCardsNeeded, bookingId });
    try {
      const res = await this.consumeCards(studentId, cancelCardsNeeded, bookingId, [PurchaseType.CANCEL_CARD]);
      this.logger.logMethodResult('consumeCancelCards', { consumed: res.consumed, bookingId });
      return res;
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
        this.logger.warn(`No cancel cards available for student=${studentId}`);
        throw new BadRequestException('No cancel cards available');
      }

      // 消耗所有可用的取消卡
      const res = await this.consumeCards(studentId, totalAvailable, bookingId, [PurchaseType.CANCEL_CARD]);
      this.logger.logMethodResult('consumeCancelCards', { consumed: res.consumed, fallback: true, bookingId });
      return res;
    }
  }

  async refundCards(studentId: string, slotsToRefund: number, originalBookingId: string) {
    this.logger.logMethodCall('refundCards', { studentId, slotsToRefund, originalBookingId });
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

    const result = {
      refunded: slotsToRefund - remainingToRefund,
      refundedCards,
      originalBookingId,
    };
    this.logger.logMethodResult('refundCards', { refunded: result.refunded, items: refundedCards.length, originalBookingId });
    return result;
  }

  async getPurchaseById(id: string, callerUserId: string, callerRole: UserRole | string = UserRole.STUDENT) {
    this.logger.logMethodCall('getPurchaseById', { id, callerUserId, callerRole });
    const purchase = await this.purchaseRepository.findOne({ where: { id }, relations: ['student'] });
    if (!purchase) {
      this.logger.warn(`Purchase not found: ${id}`);
      throw new NotFoundException('Purchase not found');
    }

    // 只有 admin 或是該 purchase 的擁有者可以查看
    if (callerRole !== UserRole.ADMIN && callerRole !== 'admin' && purchase.studentId !== callerUserId) {
      this.logger.warn(`Access denied to purchase=${id} by caller=${callerUserId} role=${callerRole}`);
      throw new ForbiddenException('Access denied');
    }

    const formatted = this.formatPurchaseItem(purchase);
    this.logger.logMethodResult('getPurchaseById', { id: formatted.id, status: formatted.status });
    return formatted;
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
