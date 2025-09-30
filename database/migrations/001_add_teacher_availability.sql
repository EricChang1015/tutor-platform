-- Migration: Add Teacher Availability System
-- Date: 2025-09-30
-- Description: Add teacher_availability table and related indexes

BEGIN;

-- 教師可用時間表
CREATE TABLE IF NOT EXISTS teacher_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot INTEGER NOT NULL CHECK (time_slot >= 0 AND time_slot <= 47),
    status VARCHAR(20) CHECK (status IN ('available', 'booked', 'unavailable')) DEFAULT 'available',
    booking_id UUID NULL REFERENCES bookings(id) ON DELETE SET NULL,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, date, time_slot)
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_date ON teacher_availability(date);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_status ON teacher_availability(status);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_date ON teacher_availability(teacher_id, date);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_date_time_slot ON teacher_availability(date, time_slot);
CREATE INDEX IF NOT EXISTS idx_teacher_availability_search ON teacher_availability(date, time_slot, status) WHERE status = 'available';

-- 建立觸發器以自動更新 updated_at 欄位
CREATE OR REPLACE FUNCTION update_teacher_availability_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_teacher_availability_updated_at
    BEFORE UPDATE ON teacher_availability
    FOR EACH ROW
    EXECUTE FUNCTION update_teacher_availability_updated_at();

-- 為現有教師建立範例可用時間（可選）
-- 這裡為每個教師建立未來7天的基本可用時間槽
INSERT INTO teacher_availability (teacher_id, date, time_slot, status)
SELECT
    u.id as teacher_id,
    (CURRENT_DATE + i)::date as date,
    slot as time_slot,
    'available' as status
FROM users u
CROSS JOIN generate_series(1, 7) as i  -- 未來7天
CROSS JOIN generate_series(18, 47) as slot  -- 09:00 到 23:30 的時間槽
WHERE u.role = 'teacher' AND u.active = true
ON CONFLICT (teacher_id, date, time_slot) DO NOTHING;

-- 建立函數來檢查時間槽衝突
CREATE OR REPLACE FUNCTION check_booking_time_slot_conflict()
RETURNS TRIGGER AS $$
DECLARE
    start_slot INTEGER;
    end_slot INTEGER;
    slot_count INTEGER;
    available_count INTEGER;
BEGIN
    -- 計算開始和結束時間槽
    start_slot := EXTRACT(HOUR FROM NEW.starts_at) * 2 + 
                  CASE WHEN EXTRACT(MINUTE FROM NEW.starts_at) >= 30 THEN 1 ELSE 0 END;
    end_slot := EXTRACT(HOUR FROM NEW.ends_at) * 2 + 
                CASE WHEN EXTRACT(MINUTE FROM NEW.ends_at) >= 30 THEN 1 ELSE 0 END;
    
    -- 檢查教師在該時間段是否可用
    SELECT COUNT(*) INTO available_count
    FROM teacher_availability
    WHERE teacher_id = NEW.teacher_id
      AND date = NEW.starts_at::date
      AND time_slot >= start_slot
      AND time_slot < end_slot
      AND status = 'available';
    
    slot_count := end_slot - start_slot;
    
    -- 如果可用時間槽數量不足，拋出錯誤
    IF available_count < slot_count THEN
        RAISE EXCEPTION 'Teacher is not available for the requested time slots';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 建立觸發器來檢查預約時間衝突
CREATE TRIGGER trigger_check_booking_conflict
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION check_booking_time_slot_conflict();

COMMIT;
