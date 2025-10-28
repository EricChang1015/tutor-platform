import { DateTime } from 'luxon';

/**
 * 時區工具類
 * 使用 Luxon 處理時區轉換和驗證
 */
export class TimezoneUtil {
  /**
   * 驗證時區是否有效（統一使用 Asia/Taipei）
   * @param timezone IANA 時區名稱
   * @returns 是否有效
   */
  static isValidTimezone(timezone: string): boolean {
    // 統一使用 Asia/Taipei 時區，不再驗證其他時區
    return timezone === 'Asia/Taipei';
  }

  /**
   * 將日期和時間槽轉換為 UTC DateTime（統一使用 Asia/Taipei）
   * @param date 日期字串 (YYYY-MM-DD)
   * @param timeSlot 時間槽 (0-47)
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns UTC DateTime 物件
   */
  static slotToUtc(date: string, timeSlot: number, timezone: string = 'Asia/Taipei'): DateTime {
    const hours = Math.floor(timeSlot / 2);
    const minutes = (timeSlot % 2) * 30;
    
    // 在 Asia/Taipei 時區創建 DateTime
    const localDateTime = DateTime.fromISO(`${date}T${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:00`, {
      zone: 'Asia/Taipei'
    });

    // 轉換為 UTC
    return localDateTime.toUTC();
  }

  /**
   * 將 UTC DateTime 轉換為 Asia/Taipei 時區的日期和時間槽
   * @param utcDateTime UTC DateTime 物件
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns { date: string, timeSlot: number }
   */
  static utcToSlot(utcDateTime: DateTime, timezone: string = 'Asia/Taipei'): { date: string; timeSlot: number } {
    const localDateTime = utcDateTime.setZone('Asia/Taipei');
    const hours = localDateTime.hour;
    const minutes = localDateTime.minute;
    const timeSlot = hours * 2 + (minutes >= 30 ? 1 : 0);
    
    return {
      date: localDateTime.toISODate() || '',
      timeSlot
    };
  }

  /**
   * 驗證預約時間
   * @param startsAt 開始時間 (ISO 8601 字串或 Date)
   * @param durationMinutes 持續時間（分鐘）
   * @returns { valid: boolean, error?: string }
   */
  static validateBookingTime(
    startsAt: string | Date,
    durationMinutes: number
  ): { valid: boolean; error?: string } {
    let startDateTime: DateTime;

    if (typeof startsAt === 'string') {
      startDateTime = DateTime.fromISO(startsAt);
    } else {
      startDateTime = DateTime.fromJSDate(startsAt);
    }

    if (!startDateTime.isValid) {
      return { valid: false, error: 'Invalid start time format' };
    }

    // 檢查是否為未來時間（允許5分鐘的緩衝時間用於測試）
    const now = DateTime.now();
    const bufferMinutes = 5;
    if (startDateTime < now.minus({ minutes: bufferMinutes })) {
      return { valid: false, error: 'Start time must be in the future' };
    }

    // 檢查持續時間是否為 30 分鐘的倍數
    if (durationMinutes % 30 !== 0) {
      return { valid: false, error: 'Duration must be a multiple of 30 minutes' };
    }

    // 檢查持續時間是否合理（最少 30 分鐘，最多 4 小時）
    if (durationMinutes < 30 || durationMinutes > 240) {
      return { valid: false, error: 'Duration must be between 30 and 240 minutes' };
    }

    return { valid: true };
  }

  /**
   * 計算預約佔用的時間槽（統一使用 Asia/Taipei）
   * @param startsAt 開始時間 (ISO 8601 字串或 Date)
   * @param durationMinutes 持續時間（分鐘）
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns 時間槽陣列
   */
  static calculateOccupiedSlots(
    startsAt: string | Date,
    durationMinutes: number,
    timezone: string = 'Asia/Taipei'
  ): number[] {
    let startDateTime: DateTime;

    if (typeof startsAt === 'string') {
      startDateTime = DateTime.fromISO(startsAt);
    } else {
      startDateTime = DateTime.fromJSDate(startsAt);
    }

    // 轉換到 Asia/Taipei 時區
    const localDateTime = startDateTime.setZone('Asia/Taipei');
    const startHour = localDateTime.hour;
    const startMinute = localDateTime.minute;
    const startSlot = startHour * 2 + (startMinute >= 30 ? 1 : 0);

    // 計算需要的時間槽數量
    const slotsNeeded = Math.ceil(durationMinutes / 30);
    const slots: number[] = [];

    for (let i = 0; i < slotsNeeded; i++) {
      slots.push(startSlot + i);
    }

    return slots;
  }

  /**
   * 將 ISO 8601 時間字串轉換為 UTC Date
   * @param isoString ISO 8601 時間字串
   * @returns Date 物件
   */
  static isoToUtcDate(isoString: string): Date {
    const dateTime = DateTime.fromISO(isoString);
    return dateTime.toUTC().toJSDate();
  }

  /**
   * 將 Date 轉換為 Asia/Taipei 時區的 ISO 8601 字串
   * @param date Date 物件
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns ISO 8601 字串
   */
  static dateToIsoInTimezone(date: Date, timezone: string = 'Asia/Taipei'): string {
    const dateTime = DateTime.fromJSDate(date).setZone('Asia/Taipei');
    return dateTime.toISO() || '';
  }

  /**
   * 格式化時間為易讀格式（統一使用 Asia/Taipei）
   * @param date Date 物件或 ISO 字串
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @param format 格式字串（Luxon 格式）
   * @returns 格式化後的字串
   */
  static formatTime(
    date: Date | string,
    timezone: string = 'Asia/Taipei',
    format: string = 'yyyy-MM-dd HH:mm:ss'
  ): string {
    let dateTime: DateTime;

    if (typeof date === 'string') {
      dateTime = DateTime.fromISO(date);
    } else {
      dateTime = DateTime.fromJSDate(date);
    }

    return dateTime.setZone('Asia/Taipei').toFormat(format);
  }

  /**
   * 獲取當前 UTC 時間
   * @returns Date 物件
   */
  static nowUtc(): Date {
    return DateTime.utc().toJSDate();
  }

  /**
   * 獲取 Asia/Taipei 時區的當前時間
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns Date 物件
   */
  static nowInTimezone(timezone: string = 'Asia/Taipei'): Date {
    return DateTime.now().setZone('Asia/Taipei').toJSDate();
  }

  /**
   * 計算兩個時間之間的分鐘差
   * @param start 開始時間
   * @param end 結束時間
   * @returns 分鐘數
   */
  static minutesBetween(start: Date | string, end: Date | string): number {
    let startDateTime: DateTime;
    let endDateTime: DateTime;

    if (typeof start === 'string') {
      startDateTime = DateTime.fromISO(start);
    } else {
      startDateTime = DateTime.fromJSDate(start);
    }

    if (typeof end === 'string') {
      endDateTime = DateTime.fromISO(end);
    } else {
      endDateTime = DateTime.fromJSDate(end);
    }

    return endDateTime.diff(startDateTime, 'minutes').minutes;
  }

  /**
   * 檢查時間是否在指定範圍內
   * @param time 要檢查的時間
   * @param start 範圍開始時間
   * @param end 範圍結束時間
   * @returns 是否在範圍內
   */
  static isTimeInRange(
    time: Date | string,
    start: Date | string,
    end: Date | string
  ): boolean {
    let timeDateTime: DateTime;
    let startDateTime: DateTime;
    let endDateTime: DateTime;

    if (typeof time === 'string') {
      timeDateTime = DateTime.fromISO(time);
    } else {
      timeDateTime = DateTime.fromJSDate(time);
    }

    if (typeof start === 'string') {
      startDateTime = DateTime.fromISO(start);
    } else {
      startDateTime = DateTime.fromJSDate(start);
    }

    if (typeof end === 'string') {
      endDateTime = DateTime.fromISO(end);
    } else {
      endDateTime = DateTime.fromJSDate(end);
    }

    return timeDateTime >= startDateTime && timeDateTime <= endDateTime;
  }

  /**
   * 將 Asia/Taipei 時間字串轉換為 UTC
   * @param localTimeString 本地時間字串 (YYYY-MM-DD HH:MM:SS)
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns UTC Date 物件
   */
  static localToUtc(localTimeString: string, timezone: string = 'Asia/Taipei'): Date {
    const dateTime = DateTime.fromFormat(localTimeString, 'yyyy-MM-dd HH:mm:ss', {
      zone: 'Asia/Taipei'
    });
    return dateTime.toUTC().toJSDate();
  }

  /**
   * 將 UTC 時間轉換為 Asia/Taipei 時間字串
   * @param utcDate UTC Date 物件
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns 本地時間字串 (YYYY-MM-DD HH:MM:SS)
   */
  static utcToLocal(utcDate: Date, timezone: string = 'Asia/Taipei'): string {
    const dateTime = DateTime.fromJSDate(utcDate).setZone('Asia/Taipei');
    return dateTime.toFormat('yyyy-MM-dd HH:mm:ss');
  }

  /**
   * 將 UTC Date 轉換為 Asia/Taipei 時區的 DateTime 物件
   * @param utcDate UTC Date 物件
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns Luxon DateTime 物件
   */
  static utcToDateTime(utcDate: Date, timezone: string = 'Asia/Taipei'): DateTime {
    return DateTime.fromJSDate(utcDate).setZone('Asia/Taipei');
  }

  /**
   * 將 Asia/Taipei 日期時間字串轉換為 UTC Date
   * @param localDateTimeString 本地日期時間字串 (YYYY-MM-DD HH:MM:SS)
   * @param timezone IANA 時區名稱（忽略，統一使用 Asia/Taipei）
   * @returns UTC Date 物件
   */
  static dateToUtc(localDateTimeString: string, timezone: string = 'Asia/Taipei'): Date {
    const dateTime = DateTime.fromFormat(localDateTimeString, 'yyyy-MM-dd HH:mm:ss', {
      zone: 'Asia/Taipei'
    });
    return dateTime.toUTC().toJSDate();
  }
}

