# 時區支援文檔 (v1.2.0)

## 概述

家教平台現已支援完整的時區功能，確保全球用戶都能正確預約和查看課程時間。系統採用「資料庫存 UTC，前端顯示本地時間」的設計原則。

**最新更新 (v1.2.0)**:
- ✅ **重大修復**: 修復不同時區用戶獲取當地時間可用性問題
- ✅ **預約衝突優化**: 修復相鄰時段預約衝突問題
- ✅ **UTC 時間查詢**: 完全基於 UTC 時間的查詢邏輯，移除 timeslot 依賴
- ✅ **時間重疊邏輯**: 使用正確的時間重疊檢查 (start_time_utc <= x < end_time_utc)

## 核心設計原則

### 1. 資料庫層面
- 所有時間戳都以 UTC 時間儲存（使用 TIMESTAMPTZ 類型）
- 用戶表新增 `timezone` 欄位，預設為 `Asia/Taipei`
- teacher_availability 表的 `start_time_utc` 和 `end_time_utc` 欄位為主要查詢依據
- 資料庫觸發器使用 UTC 時間進行衝突檢查
- 優化的索引支援 UTC 時間範圍查詢

### 2. API 層面
- 所有時間相關 API 支援 `timezone` 查詢參數
- 輸入時間使用 ISO 8601 格式（含時區資訊）
- 輸出同時提供 UTC 時間和用戶時區時間
- 自動處理夏令時間轉換
- **修復**: 不同時區用戶查詢同一日期，現在正確返回各自時區的可用時間

### 3. 業務邏輯
- 預約衝突檢查基於 UTC 時間，避免時區混淆
- 教師可用時間查詢基於用戶請求的時區日期範圍
- 跨時區預約自動轉換時間
- **修復**: 相鄰時段預約 (09:00-09:30 + 09:30-10:00) 不再產生錯誤衝突

## API 端點時區支援

### 教師可用時間搜尋
```http
GET /teacher-availability/search-teachers?date=2025-10-06&fromTime=14:00&toTime=15:00&timezone=America/New_York
```

**回應範例：**
```json
{
  "code": 0,
  "msg": "ok",
  "data": ["teacher-id-1", "teacher-id-2"]
}
```

### 教師時間表查詢 (修復後)
```http
GET /teacher-availability/teacher-timetable?teacherId=xxx&date=2025-10-06&timezone=Asia/Shanghai
```

**修復前問題**: 不同時區用戶查詢同一日期，返回的是資料庫中該日期的時間槽，而非用戶時區的日期。

**修復後行為**: 現在正確返回用戶時區 2025-10-06 對應的可用時間。

**上海時區回應範例：**
```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "id": "slot-id",
      "uid": 0,
      "date": "2025-10-06",
      "time": "09:00",
      "timeSlot": 18,
      "localTime": "09:00",
      "localTimeFormatted": "2025-10-06 09:00",
      "startTimeUtc": "2025-10-06T01:00:00.000Z",
      "endTimeUtc": "2025-10-06T01:30:00.000Z",
      "teacherTimezone": "Asia/Taipei",
      "userTimezone": "Asia/Shanghai",
      "isOnline": 1,
      "canReserve": 1
    }
  ]
}
```

**紐約時區回應範例：**
```http
GET /teacher-availability/teacher-timetable?teacherId=xxx&date=2025-10-06&timezone=America/New_York
```
```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "id": "slot-id",
      "uid": 0,
      "date": "2025-10-06",
      "time": "00:00",
      "timeSlot": 0,
      "localTime": "00:00",
      "localTimeFormatted": "2025-10-06 00:00",
      "startTimeUtc": "2025-10-06T04:00:00.000Z",
      "endTimeUtc": "2025-10-06T04:30:00.000Z",
      "teacherTimezone": "Asia/Taipei",
      "userTimezone": "America/New_York",
      "isOnline": 1,
      "canReserve": 1
    }
  ]
}
```

**關鍵修復點**:
- 查詢邏輯改為基於用戶時區的 UTC 時間範圍
- `date` 欄位現在返回用戶時區的日期
- `time` 和 `timeSlot` 基於用戶時區計算

### 預約創建
```http
POST /bookings
Content-Type: application/json
Authorization: Bearer <token>

{
  "teacherId": "teacher-id",
  "startsAt": "2025-10-06T14:00:00+08:00",
  "durationMinutes": 30,
  "timezone": "Asia/Taipei",
  "courseTitle": "英語會話課程"
}
```

**回應範例：**
```json
{
  "id": "booking-id",
  "startsAt": "2025-10-06T06:00:00.000Z",
  "endsAt": "2025-10-06T06:30:00.000Z",
  "startsAtLocal": "2025-10-06 14:00:00",
  "endsAtLocal": "2025-10-06 14:30:00",
  "teacherLocalTime": "2025-10-06 14:00:00",
  "timezones": {
    "teacher": "Asia/Taipei",
    "user": "Asia/Taipei"
  }
}
```

### 預約列表查詢
```http
GET /bookings?timezone=America/New_York
```

**回應範例：**
```json
{
  "items": [
    {
      "id": "booking-id",
      "startsAt": "2025-10-06T06:00:00.000Z",
      "startsAtLocal": "2025-10-06 02:00:00",
      "teacherLocalTime": "2025-10-06 14:00:00",
      "timezones": {
        "teacher": "Asia/Taipei",
        "user": "America/New_York"
      }
    }
  ],
  "timezone": "America/New_York"
}
```

## 支援的時區

系統支援所有 IANA 時區，常用時區包括：

- **亞洲**: Asia/Taipei, Asia/Tokyo, Asia/Shanghai, Asia/Hong_Kong, Asia/Singapore
- **美洲**: America/New_York, America/Los_Angeles, America/Chicago
- **歐洲**: Europe/London, Europe/Paris, Europe/Berlin
- **大洋洲**: Australia/Sydney, Australia/Melbourne
- **UTC**: UTC

## 時間格式規範

### 輸入格式
- **ISO 8601 含時區**: `2025-10-06T14:00:00+08:00`
- **ISO 8601 UTC**: `2025-10-06T06:00:00Z`

### 輸出格式
- **UTC 時間**: `2025-10-06T06:00:00.000Z`
- **本地時間**: `2025-10-06 14:00:00`
- **格式化時間**: `2025-10-06 14:00`

## 實現細節 (v1.2.0 更新)

### 修復後的查詢邏輯
教師可用時間查詢現在基於 UTC 時間範圍：

```typescript
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
```

### 修復後的預約衝突檢查
新的觸發器使用 UTC 時間進行衝突檢查：

```sql
CREATE OR REPLACE FUNCTION check_booking_utc_conflict()
RETURNS TRIGGER AS $$
DECLARE
    available_count INTEGER;
    required_duration_minutes INTEGER;
    required_slots INTEGER;
BEGIN
    -- 計算預約持續時間（分鐘）
    required_duration_minutes := EXTRACT(EPOCH FROM (NEW.ends_at - NEW.starts_at)) / 60;
    required_slots := CEIL(required_duration_minutes / 30.0);

    -- 檢查教師在該UTC時間範圍內是否有足夠的可用時間槽
    -- 使用正確的時間重疊邏輯：start_time_utc < end_time AND end_time_utc > start_time
    SELECT COUNT(*) INTO available_count
    FROM teacher_availability
    WHERE teacher_id = NEW.teacher_id
      AND start_time_utc < NEW.ends_at
      AND end_time_utc > NEW.starts_at
      AND status = 'available';

    -- 如果可用時間槽數量不足，拋出錯誤
    IF available_count < required_slots THEN
        RAISE EXCEPTION 'Teacher is not available for the requested time slots. Required: %, Available: %', required_slots, available_count;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 資料庫索引優化
新增的索引支援 UTC 時間查詢：

```sql
-- 支援教師UTC時間可用性查詢
CREATE INDEX idx_teacher_availability_teacher_utc_status
ON teacher_availability(teacher_id, start_time_utc, end_time_utc, status);

-- 支援UTC時間範圍查詢
CREATE INDEX idx_teacher_availability_utc_range
ON teacher_availability(start_time_utc, end_time_utc)
WHERE status = 'available';

-- 支援預約衝突檢查
CREATE INDEX idx_bookings_time_overlap
ON bookings(starts_at, ends_at, status);
```

## 測試範例 (v1.2.0)

### 時區修復驗證測試
```bash
# 測試上海時區用戶查詢 2025-10-06
curl "http://localhost:3001/teacher-availability/teacher-timetable?teacherId=xxx&date=2025-10-06&timezone=Asia/Shanghai"
# 預期: 返回上海時區 2025-10-06 的可用時間

# 測試紐約時區用戶查詢同一日期
curl "http://localhost:3001/teacher-availability/teacher-timetable?teacherId=xxx&date=2025-10-06&timezone=America/New_York"
# 預期: 返回紐約時區 2025-10-06 的可用時間（與上海時區不同的UTC時間範圍）
```

### 相鄰時段預約測試
```bash
# 第一個預約: 09:00-09:30
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "teacherId": "teacher-id",
    "startsAt": "2025-10-07T09:00:00+08:00",
    "durationMinutes": 30,
    "timezone": "Asia/Shanghai"
  }'

# 第二個預約: 09:30-10:00 (相鄰時段，修復後應該成功)
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "teacherId": "teacher-id",
    "startsAt": "2025-10-07T09:30:00+08:00",
    "durationMinutes": 30,
    "timezone": "Asia/Shanghai"
  }'
```

### 重疊時段衝突測試
```bash
# 嘗試預約重疊時段 (應該失敗)
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "teacherId": "teacher-id",
    "startsAt": "2025-10-07T09:15:00+08:00",
    "durationMinutes": 30,
    "timezone": "Asia/Shanghai"
  }'
# 預期: 返回衝突錯誤
```

### 完整 API 測試套件
```bash
# 執行完整測試
chmod +x test_all_apis.sh
./test_all_apis.sh
```

## 修復總結 (v1.2.0)

### 主要問題修復
1. **時區查詢問題**:
   - **修復前**: 不同時區用戶查詢同一日期，返回資料庫中該日期的記錄
   - **修復後**: 基於用戶時區的 UTC 時間範圍查詢，返回正確的當地時間可用性

2. **相鄰時段衝突問題**:
   - **修復前**: 09:00-09:30 和 09:30-10:00 被錯誤判定為衝突
   - **修復後**: 使用正確的時間重疊邏輯，相鄰時段可以正常預約

3. **查詢效能優化**:
   - 添加 UTC 時間索引
   - 優化資料庫觸發器
   - 移除對 timeslot 索引的依賴

### 技術改進
- 完全基於 UTC 時間的查詢邏輯
- 正確的時間重疊檢查算法
- 優化的資料庫索引結構
- 完善的 API 測試覆蓋

## 注意事項

1. **夏令時間**: 系統自動處理夏令時間轉換，無需手動調整
2. **時區驗證**: API 會驗證時區名稱的有效性，支援所有 IANA 時區
3. **向下相容**: 現有 API 在不提供 timezone 參數時使用預設時區
4. **效能考量**: 新的 UTC 時間索引確保查詢效能
5. **資料一致性**: 所有時間計算都基於 UTC，確保全球一致性
6. **測試覆蓋**: 完整的測試套件驗證所有時區功能
7. **錯誤處理**: 完善的錯誤處理和用戶友好的錯誤訊息
