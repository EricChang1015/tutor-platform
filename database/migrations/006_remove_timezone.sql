-- 移除 timezone 功能遷移腳本
-- 建立時間: 2025-10-28
-- 目的: 簡化系統，移除多時區支援，統一使用 Asia/Taipei

-- 1. 移除 users 表中的 timezone 欄位
ALTER TABLE users DROP COLUMN IF EXISTS timezone;

-- 2. 更新觸發器函數，移除時區相關邏輯
CREATE OR REPLACE FUNCTION calculate_availability_utc()
RETURNS TRIGGER AS $$
DECLARE
    local_datetime TIMESTAMP;
    hours INTEGER;
    minutes INTEGER;
BEGIN
    -- 計算時間槽對應的小時和分鐘
    hours := NEW.time_slot / 2;
    minutes := (NEW.time_slot % 2) * 30;

    -- 構建本地時間（統一使用 Asia/Taipei 時區）
    local_datetime := (NEW.date || ' ' || LPAD(hours::TEXT, 2, '0') || ':' || LPAD(minutes::TEXT, 2, '0') || ':00')::TIMESTAMP;

    -- 轉換為 UTC（假設本地時間在 Asia/Taipei 時區）
    NEW.start_time_utc := timezone('UTC', timezone('Asia/Taipei', local_datetime));

    -- 結束時間是開始時間 + 30 分鐘
    NEW.end_time_utc := NEW.start_time_utc + INTERVAL '30 minutes';

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. 移除 timezone 相關的註釋
COMMENT ON COLUMN users.timezone IS NULL;

-- 4. 更新現有資料，確保一致性（如果有需要的話）
-- 由於我們移除了 timezone 欄位，這裡不需要額外的資料更新

COMMIT;
