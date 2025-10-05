import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, Between } from 'typeorm';
import { TeacherAvailability, AvailabilityStatus } from '../entities/teacher-availability.entity';
import { User, UserRole } from '../entities/user.entity';
import { TimeSlotUtil } from '../common/time-slots.util';
import { TimezoneUtil } from '../utils/timezone';

export interface SearchTeachersQuery {
  date: string; // YYYY-MM-DD
  fromTime: string; // HH:MM
  toTime: string; // HH:MM
  timezone?: string; // IANA timezone, default: Asia/Taipei
}

export interface TeacherTimetableQuery {
  teacherId: string;
  date: string; // YYYY-MM-DD
  timezone?: string; // IANA timezone, default: Asia/Taipei
}

@Injectable()
export class TeacherAvailabilityService {
  constructor(
    @InjectRepository(TeacherAvailability)
    private availabilityRepository: Repository<TeacherAvailability>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  /**
   * 搜尋指定時間段內可用的教師 IDs
   * 支援時區參數，預設為 Asia/Taipei
   */
  async searchAvailableTeachers(searchQuery: SearchTeachersQuery): Promise<string[]> {
    const { date, fromTime, toTime, timezone = 'Asia/Taipei' } = searchQuery;

    // 驗證時區
    if (!TimezoneUtil.isValidTimezone(timezone)) {
      throw new ConflictException(`Invalid timezone: ${timezone}`);
    }

    // 轉換時間為時間槽
    const timeSlots = TimeSlotUtil.getSlotRange(fromTime, toTime);

    if (timeSlots.length === 0) {
      return [];
    }

    // 計算 UTC 時間範圍用於跨時區查詢
    const startDateTime = TimezoneUtil.slotToUtc(date, timeSlots[0], timezone);
    const endDateTime = TimezoneUtil.slotToUtc(date, timeSlots[timeSlots.length - 1], timezone).plus({ minutes: 30 });

    // 使用 UTC 時間範圍查詢可用教師
    const query = `
      SELECT DISTINCT ta.teacher_id
      FROM teacher_availability ta
      WHERE ta.start_time_utc >= $1
        AND ta.end_time_utc <= $2
        AND ta.status = $3
        AND NOT EXISTS (
          SELECT 1 FROM teacher_availability ta2
          WHERE ta2.teacher_id = ta.teacher_id
            AND ta2.start_time_utc >= $1
            AND ta2.end_time_utc <= $2
            AND ta2.status != $3
        )
    `;

    const result = await this.availabilityRepository.manager.query(query, [
      startDateTime.toJSDate(),
      endDateTime.toJSDate(),
      AvailabilityStatus.AVAILABLE
    ]);

    return result.map(row => row.teacher_id);
  }

  /**
   * 取得教師在指定日期的時間表
   * 支援時區參數，返回本地時間和 UTC 時間
   */
  async getTeacherTimetable(query: TeacherTimetableQuery) {
    const { teacherId, date, timezone = 'Asia/Taipei' } = query;

    // 驗證時區
    if (!TimezoneUtil.isValidTimezone(timezone)) {
      throw new ConflictException(`Invalid timezone: ${timezone}`);
    }

    // 驗證教師存在並獲取教師時區
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER, active: true }
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherTimezone = teacher.timezone || 'Asia/Taipei';

    // 取得該日期的所有時間槽
    const availability = await this.availabilityRepository.find({
      where: { teacherId, date },
      order: { timeSlot: 'ASC' }
    });

    // 轉換為 API 回應格式，包含 UTC 時間和用戶時區時間
    return availability.map(slot => {
      let localTime = null;
      let localTimeFormatted = null;

      if (slot.startTimeUtc && timezone !== 'UTC') {
        const localDateTime = TimezoneUtil.formatTime(slot.startTimeUtc, timezone, 'HH:mm');
        localTime = localDateTime;
        localTimeFormatted = TimezoneUtil.formatTime(slot.startTimeUtc, timezone, 'yyyy-MM-dd HH:mm');
      }

      return {
        id: slot.id,
        uid: slot.bookingId ? 1 : 0, // 模擬原 API 的 uid 欄位
        date: slot.date,
        time: slot.timeString, // 教師本地時間
        timeSlot: slot.timeSlot,
        localTime: localTime, // 用戶時區時間
        localTimeFormatted: localTimeFormatted,
        startTimeUtc: slot.startTimeUtc ? slot.startTimeUtc.toISOString() : null,
        endTimeUtc: slot.endTimeUtc ? slot.endTimeUtc.toISOString() : null,
        teacherTimezone: teacherTimezone,
        userTimezone: timezone,
        isOnline: slot.status === AvailabilityStatus.AVAILABLE ? 1 :
                  slot.status === AvailabilityStatus.BOOKED ? 2 : 0,
        isReserve: slot.status === AvailabilityStatus.BOOKED ? 1 : 0,
        canReserve: slot.canReserve ? 1 : 0,
        reason: slot.reason || (slot.status === AvailabilityStatus.BOOKED ? '已被约' : null)
      };
    });
  }

  /**
   * 設定教師可用時間
   * 會自動根據教師時區計算 UTC 時間
   */
  async setTeacherAvailability(
    teacherId: string,
    date: string,
    timeSlots: number[],
    status: AvailabilityStatus = AvailabilityStatus.AVAILABLE
  ): Promise<void> {
    // 驗證教師存在並獲取時區
    const teacher = await this.userRepository.findOne({
      where: { id: teacherId, role: UserRole.TEACHER, active: true }
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    const teacherTimezone = teacher.timezone || 'Asia/Taipei';

    // 驗證時間槽
    const invalidSlots = timeSlots.filter(slot => !TimeSlotUtil.isValidSlot(slot));
    if (invalidSlots.length > 0) {
      throw new ConflictException(`Invalid time slots: ${invalidSlots.join(', ')}`);
    }

    // 批量建立或更新可用時間，包含 UTC 時間計算
    const availabilityRecords = timeSlots.map(timeSlot => {
      // 計算 UTC 時間（觸發器會自動處理，但我們也可以在這裡預先計算）
      const startTimeUtc = TimezoneUtil.slotToUtc(date, timeSlot, teacherTimezone);
      const endTimeUtc = startTimeUtc.plus({ minutes: 30 });

      return {
        teacherId,
        date,
        timeSlot,
        status,
        // 這些欄位會被觸發器覆蓋，但提供預設值
        startTimeUtc: startTimeUtc.toJSDate(),
        endTimeUtc: endTimeUtc.toJSDate()
      };
    });

    await this.availabilityRepository.upsert(availabilityRecords, {
      conflictPaths: ['teacherId', 'date', 'timeSlot'],
      skipUpdateIfNoValuesChanged: true
    });
  }

  /**
   * 檢查教師在指定時間槽是否可用
   */
  async checkAvailability(
    teacherId: string,
    date: string,
    timeSlots: number[]
  ): Promise<boolean> {
    const availableSlots = await this.availabilityRepository.count({
      where: {
        teacherId,
        date,
        timeSlot: In(timeSlots),
        status: AvailabilityStatus.AVAILABLE
      }
    });

    return availableSlots === timeSlots.length;
  }

  /**
   * 標記時間槽為已預約
   */
  async markAsBooked(
    teacherId: string,
    date: string,
    timeSlots: number[],
    bookingId: string
  ): Promise<void> {
    await this.availabilityRepository.update(
      {
        teacherId,
        date,
        timeSlot: In(timeSlots),
        status: AvailabilityStatus.AVAILABLE
      },
      {
        status: AvailabilityStatus.BOOKED,
        bookingId
      }
    );
  }

  /**
   * 釋放已預約的時間槽
   */
  async releaseBookedSlots(
    teacherId: string,
    date: string,
    timeSlots: number[]
  ): Promise<void> {
    await this.availabilityRepository.update(
      {
        teacherId,
        date,
        timeSlot: In(timeSlots)
      },
      {
        status: AvailabilityStatus.AVAILABLE,
        bookingId: null,
        reason: null
      }
    );
  }

  /**
   * 取得教師指定時間槽的詳細資訊
   */
  async getTimeSlotInfo(id: string) {
    const availability = await this.availabilityRepository.findOne({
      where: { id },
      relations: ['teacher']
    });

    if (!availability) {
      throw new NotFoundException('Time slot not found');
    }

    return {
      id: availability.id,
      uid: availability.teacher.id,
      storeId: 5608, // 模擬原 API 的 storeId
      tname: availability.teacher.name,
      date: availability.date,
      time: availability.timeString,
      isOnline: availability.status === AvailabilityStatus.AVAILABLE ? 1 : 
                availability.status === AvailabilityStatus.BOOKED ? 2 : 0,
      canReserve: availability.canReserve ? 1 : 0,
      reason: availability.reason || (availability.status === AvailabilityStatus.BOOKED ? '已被约' : null)
    };
  }

  /**
   * 批量設定教師一週的可用時間
   */
  async setWeeklyAvailability(
    teacherId: string,
    startDate: string,
    weeklySchedule: { [dayOfWeek: number]: number[] } // 0=Sunday, 1=Monday, etc.
  ): Promise<void> {
    const startDateObj = new Date(startDate);
    const promises: Promise<void>[] = [];

    // 設定一週的可用時間
    for (let i = 0; i < 7; i++) {
      const currentDate = new Date(startDateObj);
      currentDate.setDate(startDateObj.getDate() + i);
      const dateStr = currentDate.toISOString().split('T')[0];
      const dayOfWeek = currentDate.getDay();

      if (weeklySchedule[dayOfWeek] && weeklySchedule[dayOfWeek].length > 0) {
        promises.push(
          this.setTeacherAvailability(teacherId, dateStr, weeklySchedule[dayOfWeek])
        );
      }
    }

    await Promise.all(promises);
  }
}
