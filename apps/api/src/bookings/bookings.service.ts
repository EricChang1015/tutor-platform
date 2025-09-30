import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { User } from '../entities/user.entity';
import { Purchase, PurchaseType } from '../entities/purchase.entity';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
  ) {}

  async findUserBookings(userId: string, query: any = {}) {
    const { page = 1, pageSize = 20, roleView, from, to, status, sort } = query;
    
    const queryBuilder = this.bookingRepository
      .createQueryBuilder('booking')
      .leftJoinAndSelect('booking.student', 'student')
      .leftJoinAndSelect('booking.teacher', 'teacher');

    // 根據角色視圖過濾
    if (roleView === 'student') {
      queryBuilder.where('booking.studentId = :userId', { userId });
    } else if (roleView === 'teacher') {
      queryBuilder.where('booking.teacherId = :userId', { userId });
    } else {
      // 預設顯示用戶相關的所有預約
      queryBuilder.where(
        '(booking.studentId = :userId OR booking.teacherId = :userId)',
        { userId }
      );
    }

    // 時間範圍過濾
    if (from) {
      queryBuilder.andWhere('booking.startsAt >= :from', { from });
    }
    if (to) {
      queryBuilder.andWhere('booking.startsAt <= :to', { to });
    }

    // 狀態過濾
    if (status) {
      if (status === 'upcoming') {
        queryBuilder.andWhere('booking.startsAt > NOW()');
        queryBuilder.andWhere('booking.status IN (:...statuses)', { 
          statuses: [BookingStatus.SCHEDULED, BookingStatus.PENDING] 
        });
      } else if (status === 'past') {
        queryBuilder.andWhere('booking.startsAt <= NOW()');
        queryBuilder.andWhere('booking.status = :status', { 
          status: BookingStatus.COMPLETED 
        });
      } else if (status === 'canceled') {
        queryBuilder.andWhere('booking.status = :status', { 
          status: BookingStatus.CANCELED 
        });
      } else if (status === 'pending') {
        queryBuilder.andWhere('booking.status IN (:...statuses)', { 
          statuses: [BookingStatus.PENDING, BookingStatus.PENDING_TEACHER] 
        });
      }
    }

    // 排序
    if (sort) {
      const [field, order] = sort.split(':');
      queryBuilder.orderBy(`booking.${field}`, order.toUpperCase() as 'ASC' | 'DESC');
    } else {
      queryBuilder.orderBy('booking.startsAt', 'DESC');
    }

    // 分頁
    const offset = (page - 1) * pageSize;
    queryBuilder.skip(offset).take(pageSize);

    const [items, total] = await queryBuilder.getManyAndCount();

    return {
      items: items.map(booking => this.formatBookingSummary(booking)),
      page,
      pageSize,
      total,
    };
  }

  async createBooking(createBookingDto: any, userId: string) {
    // 簡化版本：直接建立預約
    // 實際應用中需要檢查時間衝突、扣除課卡等
    
    const booking = this.bookingRepository.create({
      studentId: createBookingDto.studentId || userId,
      teacherId: createBookingDto.teacherId,
      startsAt: new Date(createBookingDto.startsAt),
      endsAt: new Date(new Date(createBookingDto.startsAt).getTime() + createBookingDto.durationMinutes * 60000),
      status: BookingStatus.SCHEDULED,
      source: createBookingDto.source || 'student',
      materialId: createBookingDto.materialId,
      courseTitle: createBookingDto.courseTitle,
      message: createBookingDto.message,
    });

    const savedBooking = await this.bookingRepository.save(booking);
    
    // TODO: 扣除課卡邏輯
    // TODO: 發送通知邏輯
    
    return this.findById(savedBooking.id);
  }

  async findById(id: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id },
      relations: ['student', 'teacher'],
    });

    if (!booking) {
      throw new Error('Booking not found');
    }

    return this.formatBookingDetail(booking);
  }

  private formatBookingSummary(booking: Booking) {
    return {
      id: booking.id,
      teacher: {
        id: booking.teacher.id,
        name: booking.teacher.name,
        avatarUrl: booking.teacher.avatarUrl,
      },
      student: {
        id: booking.student.id,
        name: booking.student.name,
      },
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
      status: booking.status,
      materialId: booking.materialId,
      lastMessageAt: booking.lastMessageAt,
      meetingUrl: booking.meetingUrl,
      source: booking.source,
    };
  }

  private formatBookingDetail(booking: Booking) {
    return {
      ...this.formatBookingSummary(booking),
      courseTitle: booking.courseTitle,
      message: booking.message,
      messages: [], // TODO: 實現留言功能
      canReschedule: this.canReschedule(booking),
      canCancel: this.canCancel(booking),
      cancelPolicy: this.getCancelPolicy(),
      settlement: null, // TODO: 實現結算功能
      postClass: null, // TODO: 實現課後回報功能
    };
  }

  private canReschedule(booking: Booking): boolean {
    // 簡化邏輯：只有未開始的課程可以改期
    return booking.status === BookingStatus.SCHEDULED && booking.startsAt > new Date();
  }

  private canCancel(booking: Booking): boolean {
    // 簡化邏輯：只有未開始的課程可以取消
    return booking.status === BookingStatus.SCHEDULED && booking.startsAt > new Date();
  }

  private getCancelPolicy() {
    return {
      freeBeforeHours: 24,
      tiered: [
        { minHours: 12, maxHours: 24, cancelCardCost: 1 },
        { minHours: 2, maxHours: 12, cancelCardCost: 2 },
      ],
    };
  }
}
