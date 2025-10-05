-- 時區支援遷移腳本
-- 創建時間: 2025-10-05
-- 目的: 添加時區欄位和 UTC 時間戳支援

-- 1. 確保 users 表有 timezone 欄位（如果沒有則添加）
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'timezone'
    ) THEN
        ALTER TABLE users ADD COLUMN timezone VARCHAR(50) DEFAULT 'Asia/Taipei';
    END IF;
END $$;

-- 2. teacher_availability 添加 UTC 時間欄位
ALTER TABLE teacher_availability 
ADD COLUMN IF NOT EXISTS start_time_utc TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS end_time_utc TIMESTAMPTZ;

-- 3. 修改 bookings 表的時間欄位為 TIMESTAMPTZ（如果還不是）
DO $$ 
BEGIN
    -- 檢查 starts_at 欄位類型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'starts_at' 
        AND data_type != 'timestamp with time zone'
    ) THEN
        ALTER TABLE bookings 
        ALTER COLUMN starts_at TYPE TIMESTAMPTZ USING starts_at AT TIME ZONE 'UTC';
    END IF;

    -- 檢查 ends_at 欄位類型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'bookings' 
        AND column_name = 'ends_at' 
        AND data_type != 'timestamp with time zone'
    ) THEN
        ALTER TABLE bookings 
        ALTER COLUMN ends_at TYPE TIMESTAMPTZ USING ends_at AT TIME ZONE 'UTC';
    END IF;
END $$;

-- 4. 創建函數來自動計算 teacher_availability 的 UTC 時間
CREATE OR REPLACE FUNCTION calculate_availability_utc()
RETURNS TRIGGER AS $$
DECLARE
    teacher_tz VARCHAR(50);
    local_datetime TIMESTAMP;
    hours INTEGER;
    minutes INTEGER;
BEGIN
    -- 獲取教師的時區
    SELECT timezone INTO teacher_tz
    FROM users
    WHERE id = NEW.teacher_id;

    -- 如果沒有找到時區，使用預設值
    IF teacher_tz IS NULL THEN
        teacher_tz := 'Asia/Taipei';
    END IF;

    -- 計算時間槽對應的小時和分鐘
    hours := NEW.time_slot / 2;
    minutes := (NEW.time_slot % 2) * 30;

    -- 構建本地時間
    local_datetime := (NEW.date || ' ' || LPAD(hours::TEXT, 2, '0') || ':' || LPAD(minutes::TEXT, 2, '0') || ':00')::TIMESTAMP;

    -- 轉換為 UTC（假設本地時間在教師時區）
    NEW.start_time_utc := timezone('UTC', timezone(teacher_tz, local_datetime));
    
    -- 結束時間是開始時間 + 30 分鐘
    NEW.end_time_utc := NEW.start_time_utc + INTERVAL '30 minutes';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. 創建觸發器來自動更新 UTC 時間
DROP TRIGGER IF EXISTS trigger_calculate_availability_utc ON teacher_availability;
CREATE TRIGGER trigger_calculate_availability_utc
    BEFORE INSERT OR UPDATE ON teacher_availability
    FOR EACH ROW
    EXECUTE FUNCTION calculate_availability_utc();

-- 6. 回填現有資料的 UTC 時間（假設都是 Asia/Taipei 時區）
UPDATE teacher_availability ta
SET 
    start_time_utc = timezone('UTC', timezone('Asia/Taipei', 
        (ta.date || ' ' || 
         LPAD((ta.time_slot / 2)::TEXT, 2, '0') || ':' || 
         LPAD(((ta.time_slot % 2) * 30)::TEXT, 2, '0') || ':00')::TIMESTAMP
    )),
    end_time_utc = timezone('UTC', timezone('Asia/Taipei', 
        (ta.date || ' ' || 
         LPAD((ta.time_slot / 2)::TEXT, 2, '0') || ':' || 
         LPAD(((ta.time_slot % 2) * 30)::TEXT, 2, '0') || ':00')::TIMESTAMP
    )) + INTERVAL '30 minutes'
WHERE start_time_utc IS NULL OR end_time_utc IS NULL;

-- 7. 添加索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_teacher_availability_utc 
ON teacher_availability(start_time_utc, end_time_utc);

CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_utc 
ON teacher_availability(teacher_id, start_time_utc);

CREATE INDEX IF NOT EXISTS idx_bookings_starts_at_utc 
ON bookings(starts_at);

CREATE INDEX IF NOT EXISTS idx_bookings_teacher_time 
ON bookings(teacher_id, starts_at, ends_at);

-- 8. 添加註釋
COMMENT ON COLUMN users.timezone IS 'IANA 時區名稱，例如 Asia/Taipei, America/New_York';
COMMENT ON COLUMN teacher_availability.start_time_utc IS 'UTC 開始時間，由觸發器自動計算';
COMMENT ON COLUMN teacher_availability.end_time_utc IS 'UTC 結束時間，由觸發器自動計算';
COMMENT ON COLUMN bookings.starts_at IS 'UTC 預約開始時間';
COMMENT ON COLUMN bookings.ends_at IS 'UTC 預約結束時間';

-- 9. 驗證資料完整性
DO $$
DECLARE
    missing_utc_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO missing_utc_count
    FROM teacher_availability
    WHERE start_time_utc IS NULL OR end_time_utc IS NULL;

    IF missing_utc_count > 0 THEN
        RAISE WARNING 'Found % teacher_availability records with missing UTC times', missing_utc_count;
    ELSE
        RAISE NOTICE 'All teacher_availability records have UTC times';
    END IF;
END $$;

COMMIT;

