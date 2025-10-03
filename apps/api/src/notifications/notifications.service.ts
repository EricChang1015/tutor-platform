import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Notification } from '../entities/notification.entity';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
  ) {}

  async findUserNotifications(userId: string, query: any = {}) {
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

    return {
      items,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      total,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    const notification = await this.notificationRepository.findOne({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    if (!notification.readAt) {
      notification.readAt = new Date();
      await this.notificationRepository.save(notification);
    }

    return {
      id: notification.id,
      readAt: notification.readAt,
    };
  }

  async markMultipleAsRead(notificationIds: string[], userId: string) {
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
    const notification = this.notificationRepository.create(data);
    return this.notificationRepository.save(notification);
  }
}
