-- 優化UTC時間查詢的遷移腳本
-- 創建時間: 2025-10-06
-- 目的: 添加索引以支援新的UTC時間查詢邏輯

-- 1. 添加複合索引以支援教師可用時間的UTC查詢
CREATE INDEX IF NOT EXISTS idx_teacher_availability_teacher_utc_status 
ON teacher_availability(teacher_id, start_time_utc, end_time_utc, status);

-- 2. 添加索引以支援時間範圍查詢
CREATE INDEX IF NOT EXISTS idx_teacher_availability_utc_range 
ON teacher_availability(start_time_utc, end_time_utc) 
WHERE status = 'available';

-- 3. 添加索引以支援預約衝突檢查
CREATE INDEX IF NOT EXISTS idx_bookings_time_overlap 
ON bookings(starts_at, ends_at, status);

-- 4. 添加複合索引以支援學生和教師的預約查詢
CREATE INDEX IF NOT EXISTS idx_bookings_student_time 
ON bookings(student_id, starts_at, ends_at, status);

CREATE INDEX IF NOT EXISTS idx_bookings_teacher_time_status 
ON bookings(teacher_id, starts_at, ends_at, status);

-- 5. 優化Between查詢的索引
CREATE INDEX IF NOT EXISTS idx_teacher_availability_utc_between 
ON teacher_availability(teacher_id, status, start_time_utc, end_time_utc);

-- 6. 添加註釋
COMMENT ON INDEX idx_teacher_availability_teacher_utc_status IS '支援教師UTC時間可用性查詢';
COMMENT ON INDEX idx_teacher_availability_utc_range IS '支援UTC時間範圍查詢';
COMMENT ON INDEX idx_bookings_time_overlap IS '支援預約時間重疊檢查';
COMMENT ON INDEX idx_bookings_student_time IS '支援學生預約時間查詢';
COMMENT ON INDEX idx_bookings_teacher_time_status IS '支援教師預約時間查詢';
COMMENT ON INDEX idx_teacher_availability_utc_between IS '優化Between查詢效能';

-- 7. 分析表統計信息以優化查詢計劃
ANALYZE teacher_availability;
ANALYZE bookings;

COMMIT;
