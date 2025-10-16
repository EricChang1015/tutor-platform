-- 修正 bookings 觸發器：避免在僅更新非時間欄位（如老師回報）時觸發可用時段檢查
-- 說明：原 check_booking_utc_conflict() 會在任何 UPDATE 觸發，
-- 導致更新 teacher_comment / teacher_report_submitted_at 等欄位也被檢查，
-- 在教師可用時段資料已被調整或不存在時，會錯誤地拋出「Teacher is not available...」。
-- 這裡改為：只有在 INSERT，或 starts_at/ends_at/teacher_id 變更時才做可用時段檢查。

BEGIN;

CREATE OR REPLACE FUNCTION check_booking_utc_conflict()
RETURNS TRIGGER AS $$
DECLARE
    available_count INTEGER;
    required_duration_minutes INTEGER;
    required_slots INTEGER;
    check_needed BOOLEAN := FALSE;
BEGIN
    -- 僅在 INSERT 或時間/教師變更時檢查
    IF TG_OP = 'INSERT' THEN
        check_needed := TRUE;
    ELSIF TG_OP = 'UPDATE' THEN
        IF (OLD.starts_at IS DISTINCT FROM NEW.starts_at)
           OR (OLD.ends_at IS DISTINCT FROM NEW.ends_at)
           OR (OLD.teacher_id IS DISTINCT FROM NEW.teacher_id) THEN
            check_needed := TRUE;
        END IF;
    END IF;

    IF check_needed THEN
        -- 計算預約持續時間（分鐘）
        required_duration_minutes := EXTRACT(EPOCH FROM (NEW.ends_at - NEW.starts_at)) / 60;
        required_slots := CEIL(required_duration_minutes / 30.0);

        -- 檢查教師在該UTC時間範圍內是否有足夠的可用時間槽
        SELECT COUNT(*) INTO available_count
        FROM teacher_availability
        WHERE teacher_id = NEW.teacher_id
          AND start_time_utc < NEW.ends_at
          AND end_time_utc > NEW.starts_at
          AND status = 'available';

        IF available_count < required_slots THEN
            RAISE EXCEPTION 'Teacher is not available for the requested time slots. Required: %, Available: %', required_slots, available_count;
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

