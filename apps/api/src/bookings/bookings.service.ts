import { Injectable, NotFoundException, ConflictException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Booking, BookingStatus, BookingSource } from '../entities/booking.entity';
import { User, UserRole } from '../entities/user.entity';
import { Purchase, PurchaseType, PurchaseStatus } from '../entities/purchase.entity';
import { TeacherAvailabilityService } from '../teacher-availability/teacher-availability.service';
import { PurchasesService } from '../purchases/purchases.service';
import { TimeSlotUtil } from '../common/time-slots.util';
import { TimezoneUtil } from '../utils/timezone';
import { DateTime } from 'luxon';
import { CreateBookingDto } from './dto/create-booking.dto';
import { CancelBookingDto, CancelCause } from './dto/cancel-booking.dto';

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
    private purchasesService: PurchasesService,
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

  async createBooking(createBookingDto: CreateBookingDto, userId: string) {
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

    // 檢查教師在該時間段是否可用（使用UTC時間）
    const isAvailable = await this.teacherAvailabilityService.checkAvailabilityByUtc(
      teacherId,
      startDate,
      endDate
    );
    if (!isAvailable) {
      throw new ConflictException('Teacher is not available at the requested time');
    }

    // 檢查時間衝突 - 學生和教師都不能有重疊的預約
    // 使用正確的時間重疊邏輯：start_time_utc < end_time AND end_time_utc > start_time
    const conflictingBookings = await this.bookingRepository
      .createQueryBuilder('booking')
      .where(
        '(booking.studentId = :userId OR booking.teacherId = :teacherId) AND ' +
        'booking.startsAt < :endDate AND booking.endsAt > :startDate AND ' +
        'booking.status = :status',
        {
          userId,
          teacherId,
          startDate,
          endDate,
          status: BookingStatus.SCHEDULED
        }
      )
      .getMany();

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
      source: createBookingDto.source || BookingSource.STUDENT,
      materialId: createBookingDto.materialId,
      courseTitle: createBookingDto.courseTitle,
      message: createBookingDto.message,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    try {
      // 計算需要的卡片數量（每30分鐘1張卡）
      const durationMinutes = (endDate.getTime() - startDate.getTime()) / (1000 * 60);
      const slotsNeeded = Math.ceil(durationMinutes / 30);

      // 扣除課卡
      const consumeResult = await this.purchasesService.consumeCards(
        createBookingDto.studentId || userId,
        slotsNeeded,
        savedBooking.id
      );

      // 標記教師時間槽為已預約（使用UTC時間）
      await this.teacherAvailabilityService.markAsBookedByUtc(
        teacherId,
        startDate,
        endDate,
        savedBooking.id
      );

      // TODO: 發送通知邏輯

      return this.findById(savedBooking.id);
    } catch (error) {
      // 如果扣卡失敗，刪除已創建的預約
      await this.bookingRepository.remove(savedBooking);
      throw error;
    }
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
      canCancel: this.canCancel(booking),
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

  async cancelBooking(bookingId: string, cancelBookingDto: CancelBookingDto, user: any) {
    // 查找預約
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['student', 'teacher'],
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // 檢查權限
    const isStudent = user.sub === booking.studentId;
    const isTeacher = user.sub === booking.teacherId;
    const isAdmin = user.role === 'admin';

    if (!isStudent && !isTeacher && !isAdmin) {
      throw new ForbiddenException('No permission to cancel this booking');
    }

    // 檢查預約狀態
    if (booking.status !== BookingStatus.SCHEDULED) {
      throw new BadRequestException('Only scheduled bookings can be canceled');
    }

    // 檢查是否已過期
    if (booking.startsAt <= new Date()) {
      throw new BadRequestException('Cannot cancel past bookings');
    }

    // 計算距離上課時間
    const hoursUntilClass = (booking.startsAt.getTime() - new Date().getTime()) / (1000 * 60 * 60);

    // 確定取消原因
    let cause = cancelBookingDto.cause;
    if (!cause) {
      if (isStudent) cause = CancelCause.STUDENT_REQUEST;
      else if (isTeacher) cause = CancelCause.TEACHER_REQUEST;
      else if (isAdmin) cause = CancelCause.ADMIN_FORCE;
    }

    // 應用取消政策
    const refundInfo = this.calculateCancelRefund(hoursUntilClass, cause, cancelBookingDto.waivePolicy && isAdmin);

    // 檢查是否允許取消
    if (!refundInfo.allowed && !isAdmin) {
      throw new BadRequestException('Cancellation not allowed within 2 hours of class time');
    }

    // 計算課程時長和需要退還的卡片數
    const durationMinutes = (booking.endsAt.getTime() - booking.startsAt.getTime()) / (1000 * 60);
    const slotsToProcess = Math.ceil(durationMinutes / 30);

    // 更新預約狀態
    booking.status = BookingStatus.CANCELED;
    await this.bookingRepository.save(booking);

    // 釋放教師時間槽
    await this.teacherAvailabilityService.releaseBookedSlot(
      booking.teacherId,
      booking.startsAt,
      booking.endsAt
    );

    // 處理卡片退還和扣除邏輯
    let actualRefund = { lessonCardsReturned: 0, cancelCardsConsumed: 0, compensationGranted: 0 };

    try {
      if (refundInfo.lessonCardsReturned > 0) {
        // 退還課卡
        const refundResult = await this.purchasesService.refundCards(
          booking.studentId,
          slotsToProcess,
          booking.id
        );
        actualRefund.lessonCardsReturned = refundResult.refunded;
      }

      if (refundInfo.cancelCardsConsumed > 0) {
        // 扣除取消卡
        try {
          const cancelResult = await this.purchasesService.consumeCancelCards(
            booking.studentId,
            refundInfo.cancelCardsConsumed,
            `cancel-${booking.id}`
          );
          actualRefund.cancelCardsConsumed = cancelResult.consumed;
        } catch (error) {
          // 如果沒有足夠的取消卡，記錄但不阻止取消
          console.warn(`Insufficient cancel cards for booking ${booking.id}:`, error.message);
          actualRefund.cancelCardsConsumed = 0;
        }
      }

      if (refundInfo.compensationGranted > 0) {
        // 發放補償卡（由管理員手動處理，這裡只記錄）
        actualRefund.compensationGranted = refundInfo.compensationGranted;
      }
    } catch (error) {
      console.error('Error processing card refund/consumption:', error);
    }

    // TODO: 發送通知

    return {
      id: booking.id,
      status: booking.status,
      refund: {
        lessonCardsReturned: actualRefund.lessonCardsReturned,
        cancelCardsConsumed: actualRefund.cancelCardsConsumed,
        compensationGranted: actualRefund.compensationGranted,
        notes: refundInfo.notes,
      },
    };
  }

  private calculateCancelRefund(hoursUntilClass: number, cause: CancelCause, waivePolicy: boolean = false) {
    // 管理員免除政策
    if (waivePolicy) {
      return {
        allowed: true,
        lessonCardsReturned: 1,
        cancelCardsConsumed: 0,
        compensationGranted: 0,
        notes: 'Admin waived cancellation policy',
      };
    }

    // 教師取消 - 退還學生課卡
    if (cause === CancelCause.TEACHER_REQUEST) {
      return {
        allowed: true,
        lessonCardsReturned: 1,
        cancelCardsConsumed: 0,
        compensationGranted: 0,
        notes: 'Teacher cancellation - lesson card refunded',
      };
    }

    // 技術問題 - 補償
    if (cause === CancelCause.TECHNICAL_ISSUE) {
      return {
        allowed: true,
        lessonCardsReturned: 1,
        cancelCardsConsumed: 0,
        compensationGranted: 1,
        notes: 'Technical issue - lesson card refunded and compensation granted',
      };
    }

    // 學生取消 - 應用分層政策
    if (cause === CancelCause.STUDENT_REQUEST) {
      if (hoursUntilClass >= 24) {
        // 24小時前免費取消
        return {
          allowed: true,
          lessonCardsReturned: 1,
          cancelCardsConsumed: 0,
          compensationGranted: 0,
          notes: 'Free cancellation (24+ hours before class)',
        };
      } else if (hoursUntilClass >= 12) {
        // 12-24小時：扣1張取消卡
        return {
          allowed: true,
          lessonCardsReturned: 1,
          cancelCardsConsumed: 1,
          compensationGranted: 0,
          notes: 'Cancellation 12-24 hours before class',
        };
      } else if (hoursUntilClass >= 2) {
        // 2-12小時：扣2張取消卡
        return {
          allowed: true,
          lessonCardsReturned: 1,
          cancelCardsConsumed: 2,
          compensationGranted: 0,
          notes: 'Cancellation 2-12 hours before class',
        };
      } else {
        // 2小時內不允許取消
        return {
          allowed: false,
          lessonCardsReturned: 0,
          cancelCardsConsumed: 0,
          compensationGranted: 0,
          notes: 'Cancellation not allowed within 2 hours',
        };
      }
    }

    // 管理員強制取消
    return {
      allowed: true,
      lessonCardsReturned: 1,
      cancelCardsConsumed: 0,
      compensationGranted: 0,
      notes: 'Admin force cancellation',
    };
  }

  async checkAndGrantCancelCards(studentId: string) {
    // 計算學生已完成的課程數量
    const completedBookings = await this.bookingRepository.count({
      where: {
        studentId,
        status: BookingStatus.COMPLETED,
      },
    });

    // 計算應該獲得的取消卡數量（每10堂課1張）
    const expectedCancelCards = Math.floor(completedBookings / 10);

    // 查看已經發放的取消卡數量
    const existingCancelCards = await this.purchaseRepository
      .createQueryBuilder('purchase')
      .where('purchase.studentId = :studentId', { studentId })
      .andWhere('purchase.type = :type', { type: PurchaseType.CANCEL_CARD })
      .select('SUM(purchase.quantity)', 'total')
      .getRawOne();

    const grantedCancelCards = parseInt(existingCancelCards?.total || '0');

    // 如果需要發放新的取消卡
    if (expectedCancelCards > grantedCancelCards) {
      const cardsToGrant = expectedCancelCards - grantedCancelCards;

      // 創建取消卡記錄
      const cancelCardPurchase = this.purchaseRepository.create({
        studentId,
        packageName: `取消約課次卡 ${cardsToGrant}張`,
        quantity: cardsToGrant,
        remaining: cardsToGrant,
        type: PurchaseType.CANCEL_CARD,
        status: PurchaseStatus.ACTIVE, // 取消卡自動激活
        suggestedLabel: '系統自動發放',
        notes: `完成${completedBookings}堂課自動獲得`,
        activatedAt: new Date(),
      });

      // 設定過期時間（與最近的課卡過期時間一致）
      const recentLessonCard = await this.purchaseRepository
        .createQueryBuilder('purchase')
        .where('purchase.studentId = :studentId', { studentId })
        .andWhere('purchase.type IN (:...types)', { types: [PurchaseType.LESSON_CARD, PurchaseType.TRIAL_CARD] })
        .andWhere('purchase.status = :status', { status: PurchaseStatus.ACTIVE })
        .orderBy('purchase.expiresAt', 'DESC')
        .getOne();

      if (recentLessonCard && recentLessonCard.expiresAt) {
        cancelCardPurchase.expiresAt = recentLessonCard.expiresAt;
      } else {
        // 如果沒有課卡，設定為7天後過期
        cancelCardPurchase.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
      }

      await this.purchaseRepository.save(cancelCardPurchase);

      return {
        granted: cardsToGrant,
        totalCompleted: completedBookings,
        totalCancelCards: expectedCancelCards,
      };
    }

    return null; // 沒有需要發放的卡片
  }

  // 課程完成時調用此方法
  async completeBooking(bookingId: string) {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    booking.status = BookingStatus.COMPLETED;
    await this.bookingRepository.save(booking);

    // 檢查並發放取消卡
    await this.checkAndGrantCancelCards(booking.studentId);

    return this.formatBookingDetail(booking);
  }

  async addMessage(bookingId: string, senderId: string, text: string) {
    // 簡化：不持久化，直接回傳訊息物件（與 OpenAPI 相容）
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');
    const msg = {
      id: `${bookingId}-${Date.now()}`,
      senderId,
      text,
      createdAt: new Date().toISOString(),
    };
    return msg;
  }

  async reschedule(bookingId: string, user: any, newStartsAt: string, durationMinutes: number = 30) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // 權限：學生或教師或管理員其中之一
    const allowed = user.sub === booking.studentId || user.sub === booking.teacherId || user.role === 'admin';
    if (!allowed) throw new ForbiddenException('No permission to reschedule');

    // 僅可改期未開始課程
    if (!this.canReschedule(booking)) throw new BadRequestException('Cannot reschedule');

    // 驗證時間
    const validation = TimezoneUtil.validateBookingTime(newStartsAt, durationMinutes);
    if (!validation.valid) {
      throw new BadRequestException(validation.error);
    }

    const newStart = TimezoneUtil.isoToUtcDate(newStartsAt);
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60000);

    // 檢查教師可用性與衝突
    const teacherId = booking.teacherId;
    const isAvailable = await this.teacherAvailabilityService.checkAvailabilityByUtc(teacherId, newStart, newEnd);
    if (!isAvailable) throw new ConflictException('Teacher not available');

    const conflicts = await this.bookingRepository
      .createQueryBuilder('b')
      .where('b.id != :id', { id: bookingId })
      .andWhere('(b.studentId = :studentId OR b.teacherId = :teacherId)', { studentId: booking.studentId, teacherId })
      .andWhere('b.startsAt < :end AND b.endsAt > :start', { start: newStart, end: newEnd })
      .andWhere('b.status = :status', { status: BookingStatus.SCHEDULED })
      .getCount();
    if (conflicts > 0) throw new ConflictException('Time slot conflicts');

    // 釋放舊時段、標記新時段
    await this.teacherAvailabilityService.releaseBookedSlot(teacherId, booking.startsAt, booking.endsAt);
    await this.teacherAvailabilityService.markAsBookedByUtc(teacherId, newStart, newEnd, booking.id);

    booking.startsAt = newStart;
    booking.endsAt = newEnd;
    // 改期後可能需要教師確認
    booking.status = BookingStatus.PENDING_TEACHER;
    await this.bookingRepository.save(booking);

    return {
      id: booking.id,
      status: booking.status,
      startsAt: booking.startsAt,
      endsAt: booking.endsAt,
    };
  }

  async getIcs(bookingId: string, requesterId: string) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId }, relations: ['teacher', 'student'] });
    if (!booking) throw new NotFoundException('Booking not found');
    if (![booking.studentId, booking.teacherId].includes(requesterId)) throw new ForbiddenException('No access');

    const dtStart = booking.startsAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const dtEnd = booking.endsAt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');
    const uid = `${booking.id}@tutor-platform`;
    const summary = booking.courseTitle || 'Lesson';

    const ics = `BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//Tutor Platform//EN\nBEGIN:VEVENT\nUID:${uid}\nDTSTAMP:${dtStart}\nDTSTART:${dtStart}\nDTEND:${dtEnd}\nSUMMARY:${summary}\nEND:VEVENT\nEND:VCALENDAR`;
    // Nest 會以字串回傳。若需 header，可在 controller 設定 Response。
    return ics;
  }

  async confirm(bookingId: string, user: any) {
    const booking = await this.bookingRepository.findOne({ where: { id: bookingId } });
    if (!booking) throw new NotFoundException('Booking not found');

    // 僅老師或管理員可確認
    const isTeacher = user.sub === booking.teacherId;
    const isAdmin = user.role === 'admin';
    if (!isTeacher && !isAdmin) throw new ForbiddenException('Only teacher/admin can confirm');

    booking.status = BookingStatus.SCHEDULED;
    await this.bookingRepository.save(booking);
    return { id: booking.id, status: booking.status };
  }


}
