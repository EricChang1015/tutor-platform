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
   * 修改為基於UTC時間查詢，而非timeslot
   */
  async searchAvailableTeachers(searchQuery: SearchTeachersQuery): Promise<string[]> {
    const { date, fromTime, toTime, timezone = 'Asia/Taipei' } = searchQuery;

    // 驗證時區
    if (!TimezoneUtil.isValidTimezone(timezone)) {
      throw new ConflictException(`Invalid timezone: ${timezone}`);
    }

    // 計算用戶時區的開始和結束時間的UTC時間
    const startDateTime = TimezoneUtil.dateToUtc(`${date} ${fromTime}:00`, timezone);
    const endDateTime = TimezoneUtil.dateToUtc(`${date} ${toTime}:00`, timezone);

    // 使用 UTC 時間範圍查詢可用教師
    // 查詢條件：教師的可用時間槽完全包含在請求的時間範圍內
    const query = `
      SELECT DISTINCT ta.teacher_id
      FROM teacher_availability ta
      WHERE ta.start_time_utc >= $1
        AND ta.end_time_utc <= $2
        AND ta.status = $3
        AND NOT EXISTS (
          SELECT 1 FROM teacher_availability ta2
          WHERE ta2.teacher_id = ta.teacher_id
            AND ta2.start_time_utc < $2
            AND ta2.end_time_utc > $1
            AND ta2.status != $3
        )
    `;

    const result = await this.availabilityRepository.manager.query(query, [
      startDateTime,
      endDateTime,
      AvailabilityStatus.AVAILABLE
    ]);

    return result.map(row => row.teacher_id);
  }

  /**
   * 取得教師在指定日期的時間表
   * 支援時區參數，返回本地時間和 UTC 時間
   * 修改為基於UTC時間查詢，而非timeslot
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

    // 計算用戶時區指定日期的UTC時間範圍
    const userDateStart = TimezoneUtil.dateToUtc(`${date} 00:00:00`, timezone);
    const userDateEnd = TimezoneUtil.dateToUtc(`${date} 23:59:59`, timezone);

    // 基於UTC時間範圍查詢可用時間槽
    const availability = await this.availabilityRepository.find({
      where: {
        teacherId,
        startTimeUtc: Between(userDateStart, userDateEnd)
      },
      order: { startTimeUtc: 'ASC' }
    });

    // 轉換為 API 回應格式，包含 UTC 時間和用戶時區時間
    return availability.map(slot => {
      let localTime = null;
      let localTimeFormatted = null;
      let userDate = slot.date;
      let userTimeSlot = slot.timeSlot;

      if (slot.startTimeUtc) {
        // 計算用戶時區的時間
        const userDateTime = TimezoneUtil.utcToDateTime(slot.startTimeUtc, timezone);
        localTime = userDateTime.toFormat('HH:mm');
        localTimeFormatted = userDateTime.toFormat('yyyy-MM-dd HH:mm');
        userDate = userDateTime.toFormat('yyyy-MM-dd');
        userTimeSlot = userDateTime.hour * 2 + (userDateTime.minute >= 30 ? 1 : 0);
      }

      return {
        id: slot.id,
        uid: slot.bookingId ? 1 : 0, // 模擬原 API 的 uid 欄位
        date: userDate, // 用戶時區的日期
        time: localTime || slot.timeString, // 用戶時區的時間
        timeSlot: userTimeSlot, // 用戶時區的時間槽
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
   * 檢查教師在指定UTC時間範圍是否可用
   * 檢查完全包含在時間範圍內的時間槽
   */
  async checkAvailabilityByUtc(
    teacherId: string,
    startTimeUtc: Date,
    endTimeUtc: Date
  ): Promise<boolean> {
    // 使用SQL查詢檢查完全包含在時間範圍內的可用時間槽
    const query = `
      SELECT COUNT(*) as count
      FROM teacher_availability
      WHERE teacher_id = $1
        AND start_time_utc >= $2
        AND end_time_utc <= $3
        AND status = $4
    `;

    const result = await this.availabilityRepository.manager.query(query, [
      teacherId,
      startTimeUtc,
      endTimeUtc,
      AvailabilityStatus.AVAILABLE
    ]);

    const availableSlots = parseInt(result[0].count);

    // 計算需要的時間槽數量（每30分鐘一個槽）
    const durationMinutes = (endTimeUtc.getTime() - startTimeUtc.getTime()) / (1000 * 60);
    const requiredSlots = Math.ceil(durationMinutes / 30);

    return availableSlots >= requiredSlots;
  }

  /**
   * 檢查教師在指定時間槽是否可用（保留向後兼容性）
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
   * 根據UTC時間範圍標記時間槽為已預約
   * 只標記完全包含在預約時間範圍內的時間槽
   */
  async markAsBookedByUtc(
    teacherId: string,
    startTimeUtc: Date,
    endTimeUtc: Date,
    bookingId: string
  ): Promise<void> {
    // 使用正確的時間重疊邏輯：只標記完全包含在預約時間範圍內的時間槽
    // start_time_utc >= startTimeUtc AND end_time_utc <= endTimeUtc
    const query = `
      UPDATE teacher_availability
      SET status = $1, booking_id = $2
      WHERE teacher_id = $3
        AND start_time_utc >= $4
        AND end_time_utc <= $5
        AND status = $6
    `;

    await this.availabilityRepository.manager.query(query, [
      AvailabilityStatus.BOOKED,
      bookingId,
      teacherId,
      startTimeUtc,
      endTimeUtc,
      AvailabilityStatus.AVAILABLE
    ]);
  }

  /**
   * 標記時間槽為已預約（保留向後兼容性）
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
   * 根據UTC時間範圍釋放已預約的時間槽
   */
  async releaseBookedSlot(
    teacherId: string,
    startTimeUtc: Date,
    endTimeUtc: Date
  ): Promise<void> {
    const query = `
      UPDATE teacher_availability
      SET status = $1, booking_id = NULL, reason = NULL
      WHERE teacher_id = $2
        AND start_time_utc >= $3
        AND end_time_utc <= $4
        AND status = $5
    `;

    await this.availabilityRepository.manager.query(query, [
      AvailabilityStatus.AVAILABLE,
      teacherId,
      startTimeUtc,
      endTimeUtc,
      AvailabilityStatus.BOOKED
    ]);
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
