import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { User, UserRole } from '../entities/user.entity';
import { Purchase, PurchaseType } from '../entities/purchase.entity';
import { TeacherAvailabilityService } from '../teacher-availability/teacher-availability.service';
import { TimeSlotUtil } from '../common/time-slots.util';
import { TimezoneUtil } from '../utils/timezone';
import { DateTime } from 'luxon';

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private bookingRepository: Repository<Booking>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Purchase)
    private purchaseRepository: Repository<Purchase>,
    private teacherAvailabilityService: TeacherAvailabilityService,
  ) {}

  async findUserBookings(userId: string, query: any = {}) {
    const { page = 1, pageSize = 20, roleView, from, to, status, sort, timezone = 'Asia/Taipei' } = query;
    
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
      items: items.map(booking => this.formatBookingSummary(booking, timezone)),
      page,
      pageSize,
      total,
      timezone,
    };
  }

  async createBooking(createBookingDto: any, userId: string) {
    const { teacherId, startsAt, durationMinutes = 30, timezone = 'Asia/Taipei' } = createBookingDto;

    // 驗證時區
    if (!TimezoneUtil.isValidTimezone(timezone)) {
      throw new BadRequestException(`Invalid timezone: ${timezone}`);
    }

    // 驗證必要參數
    if (!teacherId || !startsAt) {
      throw new BadRequestException('Missing required parameters: teacherId, startsAt');
    }

    // 使用時區工具驗證預約時間
    const validation = TimezoneUtil.validateBookingTime(startsAt, durationMinutes);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    // 將 ISO 8601 時間字串轉換為 UTC Date
    const startDate = TimezoneUtil.isoToUtcDate(startsAt);
    const endDate = new Date(startDate.getTime() + durationMinutes * 60000);

    // 驗證時間槽對齊 - 必須從整點或半點開始
    const startMinutes = startDate.getUTCMinutes();
    if (startMinutes !== 0 && startMinutes !== 30) {
      throw new BadRequestException('Booking must start at :00 or :30 minutes');
    }

    // 檢查教師是否存在且為教師角色
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER, active: true }
    });
    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    // 獲取教師的時區
    const teacherTimezone = teacher.timezone || 'Asia/Taipei';

    // 將用戶時間轉換為教師時區，然後計算時間槽
    const utcDateTime = DateTime.fromISO(startsAt);
    const teacherLocalDateTime = utcDateTime.setZone(teacherTimezone);
    const { date: dateStr, timeSlot: startSlot } = TimezoneUtil.utcToSlot(utcDateTime, teacherTimezone);

    // 計算需要的時間槽
    const slotsNeeded = Math.ceil(durationMinutes / 30);
    const timeSlots: number[] = [];
    for (let i = 0; i < slotsNeeded; i++) {
      timeSlots.push(startSlot + i);
    }

    // 驗證時間槽有效性
    const invalidSlots = timeSlots.filter(slot => !TimeSlotUtil.isValidSlot(slot));
    if (invalidSlots.length > 0) {
      throw new BadRequestException('Invalid time slots');
    }

    // 檢查教師在該時間段是否可用
    const isAvailable = await this.teacherAvailabilityService.checkAvailability(
      teacherId,
      dateStr,
      timeSlots
    );
    if (!isAvailable) {
      throw new ConflictException('Teacher is not available at the requested time');
    }

    // 檢查時間衝突 - 學生和教師都不能有重疊的預約
    const conflictingBookings = await this.bookingRepository.find({
      where: [
        {
          studentId: userId,
          startsAt: Between(
            new Date(startDate.getTime() - durationMinutes * 60000),
            new Date(endDate.getTime())
          ),
          status: BookingStatus.SCHEDULED
        },
        {
          teacherId,
          startsAt: Between(
            new Date(startDate.getTime() - durationMinutes * 60000),
            new Date(endDate.getTime())
          ),
          status: BookingStatus.SCHEDULED
        }
      ]
    });

    if (conflictingBookings.length > 0) {
      throw new ConflictException('Time slot conflicts with existing booking');
    }

    // 建立預約
    const booking = this.bookingRepository.create({
      studentId: createBookingDto.studentId || userId,
      teacherId,
      startsAt: startDate,
      endsAt: endDate,
      status: BookingStatus.SCHEDULED,
      source: createBookingDto.source || 'student',
      materialId: createBookingDto.materialId,
      courseTitle: createBookingDto.courseTitle,
      message: createBookingDto.message,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // 標記教師時間槽為已預約
    await this.teacherAvailabilityService.markAsBooked(
      teacherId,
      dateStr,
      timeSlots,
      savedBooking.id
    );

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

  private formatBookingSummary(booking: Booking, userTimezone: string = 'Asia/Taipei') {
    // 獲取教師時區
    const teacherTimezone = booking.teacher?.timezone || 'Asia/Taipei';

    return {
      id: booking.id,
      teacher: {
        id: booking.teacher.id,
        name: booking.teacher.name,
        avatarUrl: booking.teacher.avatarUrl,
        timezone: teacherTimezone,
      },
      student: {
        id: booking.student.id,
        name: booking.student.name,
      },
      startsAt: booking.startsAt, // UTC 時間
      endsAt: booking.endsAt, // UTC 時間
      startsAtLocal: TimezoneUtil.formatTime(booking.startsAt, userTimezone, 'yyyy-MM-dd HH:mm:ss'),
      endsAtLocal: TimezoneUtil.formatTime(booking.endsAt, userTimezone, 'yyyy-MM-dd HH:mm:ss'),
      teacherLocalTime: TimezoneUtil.formatTime(booking.startsAt, teacherTimezone, 'yyyy-MM-dd HH:mm:ss'),
      status: booking.status,
      materialId: booking.materialId,
      lastMessageAt: booking.lastMessageAt,
      meetingUrl: booking.meetingUrl,
      source: booking.source,
      timezones: {
        teacher: teacherTimezone,
        user: userTimezone,
      },
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
