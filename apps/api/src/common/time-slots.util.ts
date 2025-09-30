/**
 * Time Slots 工具類
 * 時間槽以整數為基準，從 00:00 開始，每 30 分鐘為一個 time slot
 */

export class TimeSlotUtil {
  /**
   * 將時間字串轉換為時間槽索引
   * @param timeStr 時間字串，格式: "HH:MM"
   * @returns 時間槽索引 (0-47)
   */
  static timeToSlot(timeStr: string): number {
    const [hours, minutes] = timeStr.split(':').map(Number);
    return hours * 2 + (minutes >= 30 ? 1 : 0);
  }

  /**
   * 將時間槽索引轉換為時間字串
   * @param slot 時間槽索引 (0-47)
   * @returns 時間字串，格式: "HH:MM"
   */
  static slotToTime(slot: number): string {
    const hours = Math.floor(slot / 2);
    const minutes = (slot % 2) * 30;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  }

  /**
   * 將 Date 物件轉換為時間槽索引
   * @param date Date 物件
   * @returns 時間槽索引
   */
  static dateToSlot(date: Date): number {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    return hours * 2 + (minutes >= 30 ? 1 : 0);
  }

  /**
   * 將時間槽索引轉換為當日的 Date 物件
   * @param slot 時間槽索引
   * @param date 基準日期
   * @returns Date 物件
   */
  static slotToDate(slot: number, date: Date): Date {
    const hours = Math.floor(slot / 2);
    const minutes = (slot % 2) * 30;
    const result = new Date(date);
    result.setHours(hours, minutes, 0, 0);
    return result;
  }

  /**
   * 獲取時間範圍內的所有時間槽
   * @param startTime 開始時間 "HH:MM"
   * @param endTime 結束時間 "HH:MM"
   * @returns 時間槽陣列
   */
  static getSlotRange(startTime: string, endTime: string): number[] {
    const startSlot = this.timeToSlot(startTime);
    const endSlot = this.timeToSlot(endTime);
    const slots: number[] = [];
    
    for (let slot = startSlot; slot < endSlot; slot++) {
      slots.push(slot);
    }
    
    return slots;
  }

  /**
   * 檢查時間槽是否有效 (0-47)
   * @param slot 時間槽索引
   * @returns 是否有效
   */
  static isValidSlot(slot: number): boolean {
    return slot >= 0 && slot <= 47;
  }

  /**
   * 獲取一天所有時間槽的時間字串陣列
   * @returns 時間字串陣列
   */
  static getAllTimeSlots(): string[] {
    const slots: string[] = [];
    for (let i = 0; i < 48; i++) {
      slots.push(this.slotToTime(i));
    }
    return slots;
  }

  /**
   * 計算兩個時間槽之間的持續時間（分鐘）
   * @param startSlot 開始時間槽
   * @param endSlot 結束時間槽
   * @returns 持續時間（分鐘）
   */
  static getSlotDuration(startSlot: number, endSlot: number): number {
    return (endSlot - startSlot) * 30;
  }

  /**
   * 根據持續時間計算需要的時間槽數量
   * @param durationMinutes 持續時間（分鐘）
   * @returns 時間槽數量
   */
  static getDurationSlots(durationMinutes: number): number {
    return Math.ceil(durationMinutes / 30);
  }
}
