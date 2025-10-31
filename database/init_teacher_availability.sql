-- 初始化 teacher_availability（未來7天 09:00~23:30，每30分鐘）
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
