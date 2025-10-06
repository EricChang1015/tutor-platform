-- 更新預約衝突檢查觸發器
-- 創建時間: 2025-10-06
-- 目的: 修改觸發器使用UTC時間而非時間槽邏輯

-- 1. 刪除舊的觸發器
DROP TRIGGER IF EXISTS trigger_check_booking_conflict ON bookings;
DROP FUNCTION IF EXISTS check_booking_time_slot_conflict();

-- 2. 創建新的基於UTC時間的衝突檢查函數
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

-- 3. 創建新的觸發器
CREATE TRIGGER trigger_check_booking_utc_conflict
    BEFORE INSERT OR UPDATE ON bookings
    FOR EACH ROW
    EXECUTE FUNCTION check_booking_utc_conflict();

-- 4. 添加註釋
COMMENT ON FUNCTION check_booking_utc_conflict() IS '基於UTC時間檢查預約衝突，避免時間槽索引問題';
COMMENT ON TRIGGER trigger_check_booking_utc_conflict ON bookings IS '預約前檢查教師UTC時間可用性';

COMMIT;
