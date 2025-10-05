# 時區支援文檔

## 概述

家教平台現已支援完整的時區功能，確保全球用戶都能正確預約和查看課程時間。系統採用「資料庫存 UTC，前端顯示本地時間」的設計原則。

## 核心設計原則

### 1. 資料庫層面
- 所有時間戳都以 UTC 時間儲存（使用 TIMESTAMPTZ 類型）
- 用戶表新增 `timezone` 欄位，預設為 `Asia/Taipei`
- teacher_availability 表新增 `start_time_utc` 和 `end_time_utc` 欄位
- 資料庫觸發器自動計算 UTC 時間

### 2. API 層面
- 所有時間相關 API 支援 `timezone` 查詢參數
- 輸入時間使用 ISO 8601 格式（含時區資訊）
- 輸出同時提供 UTC 時間和本地時間
- 自動處理夏令時間轉換

### 3. 業務邏輯
- 預約衝突檢查考慮時區差異
- 教師可用時間以教師本地時區為準
- 跨時區預約自動轉換時間

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

### 教師時間表查詢
```http
GET /teacher-availability/teacher-timetable?teacherId=xxx&date=2025-10-06&timezone=Europe/London
```

**回應範例：**
```json
{
  "code": 0,
  "msg": "ok",
  "data": [
    {
      "id": "slot-id",
      "date": "2025-10-06",
      "time": "14:00",
      "timeSlot": 28,
      "localTime": "06:00",
      "localTimeFormatted": "2025-10-06 06:00",
      "startTimeUtc": "2025-10-06T06:00:00.000Z",
      "endTimeUtc": "2025-10-06T06:30:00.000Z",
      "teacherTimezone": "Asia/Taipei",
      "userTimezone": "Europe/London",
      "isOnline": 1,
      "canReserve": 1
    }
  ]
}
```

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

## 實現細節

### 資料庫觸發器
系統使用 PostgreSQL 觸發器自動計算 UTC 時間：

```sql
CREATE OR REPLACE FUNCTION calculate_utc_times()
RETURNS TRIGGER AS $$
DECLARE
    teacher_timezone VARCHAR(50);
BEGIN
    SELECT timezone INTO teacher_timezone 
    FROM users WHERE id = NEW.teacher_id;
    
    NEW.start_time_utc := timezone('UTC', 
        timezone(teacher_timezone, 
            (NEW.date || ' ' || time_slot_to_time(NEW.time_slot))::timestamp));
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 預約衝突檢查
預約創建時的衝突檢查考慮時區轉換：

```sql
CREATE OR REPLACE FUNCTION check_booking_time_slot_conflict()
RETURNS TRIGGER AS $$
DECLARE
    teacher_timezone VARCHAR(50);
    local_start_time TIMESTAMP;
BEGIN
    SELECT timezone INTO teacher_timezone 
    FROM users WHERE id = NEW.teacher_id;
    
    local_start_time := NEW.starts_at AT TIME ZONE teacher_timezone;
    
    -- 檢查教師可用性...
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

## 測試範例

### 跨時區預約測試
```bash
# 台北用戶預約台北教師 14:00 的課程
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "teacherId": "teacher-id",
    "startsAt": "2025-10-06T14:00:00+08:00",
    "timezone": "Asia/Taipei"
  }'

# 紐約用戶預約同一時段（紐約時間 02:00）
curl -X POST http://localhost:3001/bookings \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{
    "teacherId": "teacher-id",
    "startsAt": "2025-10-06T02:00:00-05:00",
    "timezone": "America/New_York"
  }'
```

兩個請求都會預約到台北時間 14:00 的同一時段。

## 注意事項

1. **夏令時間**: 系統自動處理夏令時間轉換，無需手動調整
2. **時區驗證**: API 會驗證時區名稱的有效性
3. **向下相容**: 現有 API 在不提供 timezone 參數時使用預設時區
4. **效能考量**: UTC 時間索引確保查詢效能
5. **資料一致性**: 所有時間計算都在資料庫層面進行，確保一致性
