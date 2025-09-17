-- 為 teacher1@example.com 添加完整的可用時段測試數據
-- 時間：早上8點到晚上9點，每個時段1小時，週一到週日

-- 首先清除現有的 teacher1 可用時段
DELETE FROM availability_slot WHERE teacher_id = '200b765d-8989-487c-b116-b11ceee4ebd5';

-- 使用循環插入所有時段
DO $$
DECLARE
    day_num INTEGER;
    hour_num INTEGER;
    start_hour TEXT;
    end_hour TEXT;
BEGIN
    -- 週日到週六 (0-6)
    FOR day_num IN 0..6 LOOP
        -- 早上8點到晚上9點 (8-20)
        FOR hour_num IN 8..20 LOOP
            start_hour := LPAD(hour_num::TEXT, 2, '0') || ':00:00';
            end_hour := LPAD((hour_num + 1)::TEXT, 2, '0') || ':00:00';
            
            INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity)
            VALUES (
                uuid_generate_v4(),
                '200b765d-8989-487c-b116-b11ceee4ebd5',
                day_num,
                start_hour::TIME,
                end_hour::TIME,
                2
            );
        END LOOP;
    END LOOP;
END $$;

-- 顯示插入結果
SELECT 'Teacher availability test data inserted successfully' as status;
SELECT COUNT(*) as total_slots FROM availability_slot WHERE teacher_id = '200b765d-8989-487c-b116-b11ceee4ebd5';
SELECT weekday, COUNT(*) as slots_per_day FROM availability_slot WHERE teacher_id = '200b765d-8989-487c-b116-b11ceee4ebd5' GROUP BY weekday ORDER BY weekday;

-- 顯示一些示例時段
SELECT weekday, start_time, end_time, capacity 
FROM availability_slot 
WHERE teacher_id = '200b765d-8989-487c-b116-b11ceee4ebd5' 
ORDER BY weekday, start_time 
LIMIT 10;
