import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../entities/notification.entity';
import { LoggerService } from '../common/logger.service';

@Injectable()
export class NotificationsService {
  private readonly logger = new LoggerService('NotificationsService');

  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async findUserNotifications(userId: string, query: any = {}) {
    this.logger.logMethodCall('findUserNotifications', { userId, ...query });
    const {
      unreadOnly = false,
      page = 1,
      pageSize = 20,
    } = query;

    const queryBuilder = this.notificationRepository.createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId });

    if (unreadOnly) {
      queryBuilder.andWhere('notification.read_at IS NULL');
    }

    // 排序：未讀在前，然後按時間倒序
    queryBuilder.orderBy('notification.read_at', 'ASC', 'NULLS FIRST')
      .addOrderBy('notification.created_at', 'DESC');

    // 分頁
    const skip = (page - 1) * pageSize;
    queryBuilder.skip(skip).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    const result = {
      items,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
    };
    this.logger.logMethodResult('findUserNotifications', { userId, total, page, pageSize });
    return result;
  }

  async markAsRead(notificationId: string, userId: string) {
    this.logger.logMethodCall('markAsRead', { notificationId, userId });
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      this.logger.warn(`Notification not found: ${notificationId} (user=${userId})`);
      throw new NotFoundException('Notification not found');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    this.logger.logMethodResult('markAsRead', { id: notification.id, readAt: notification.readAt });
    return {
      id: notification.id,
      readAt: notification.readAt,
    };
  }

  async markMultipleAsRead(notificationIds: string[], userId: string) {
    this.logger.logMethodCall('markMultipleAsRead', { count: notificationIds?.length || 0, userId });
    const result = await this.notificationRepository.update(
      {
        id: In(notificationIds),
        userId,
        readAt: null, // 只更新未讀的
      },
      {
        readAt: new Date(),
      }
    );

    this.logger.logMethodResult('markMultipleAsRead', { updated: result.affected || 0 });
    return {
      updated: result.affected || 0,
    };
  }

  async createNotification(data: {
    userId: string;
    type: string;
    title: string;
    message: string;
    data?: any;
  }) {
    this.logger.logMethodCall('createNotification', { userId: data.userId, type: data.type });
    const notification = this.notificationRepository.create(data);
    const saved = await this.notificationRepository.save(notification);
    this.logger.logMethodResult('createNotification', { id: saved.id, userId: saved.userId });
    return saved;
  }
}
