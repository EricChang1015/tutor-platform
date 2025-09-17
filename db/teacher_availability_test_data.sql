-- 為 teacher1@example.com 添加完整的可用時段測試數據
-- 時間：早上8點到晚上9點，每個時段1小時，週一到週日

-- 首先清除現有的 teacher1 可用時段
DELETE FROM availability_slot WHERE teacher_id = '200b765d-8989-487c-b116-b11ceee4ebd5';

-- 週一 (weekday = 1) - 早上8點到晚上9點
INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity)
VALUES
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '08:00:00', '09:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '09:00:00', '10:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '10:00:00', '11:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '11:00:00', '12:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '12:00:00', '13:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '13:00:00', '14:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '14:00:00', '15:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '15:00:00', '16:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '16:00:00', '17:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '17:00:00', '18:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '18:00:00', '19:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '19:00:00', '20:00:00', 2),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 1, '20:00:00', '21:00:00', 2);

-- 週二 (weekday = 2)
INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity, active, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '08:00:00', '09:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '09:00:00', '10:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '10:00:00', '11:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '11:00:00', '12:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '12:00:00', '13:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '13:00:00', '14:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '14:00:00', '15:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '15:00:00', '16:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '16:00:00', '17:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '17:00:00', '18:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '18:00:00', '19:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '19:00:00', '20:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 2, '20:00:00', '21:00:00', 2, true, NOW(), NOW());

-- 週三 (weekday = 3)
INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity, active, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '08:00:00', '09:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '09:00:00', '10:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '10:00:00', '11:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '11:00:00', '12:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '12:00:00', '13:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '13:00:00', '14:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '14:00:00', '15:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '15:00:00', '16:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '16:00:00', '17:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '17:00:00', '18:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '18:00:00', '19:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '19:00:00', '20:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 3, '20:00:00', '21:00:00', 2, true, NOW(), NOW());

-- 週四 (weekday = 4)
INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity, active, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '08:00:00', '09:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '09:00:00', '10:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '10:00:00', '11:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '11:00:00', '12:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '12:00:00', '13:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '13:00:00', '14:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '14:00:00', '15:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '15:00:00', '16:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '16:00:00', '17:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '17:00:00', '18:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '18:00:00', '19:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '19:00:00', '20:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 4, '20:00:00', '21:00:00', 2, true, NOW(), NOW());

-- 週五 (weekday = 5)
INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity, active, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '08:00:00', '09:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '09:00:00', '10:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '10:00:00', '11:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '11:00:00', '12:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '12:00:00', '13:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '13:00:00', '14:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '14:00:00', '15:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '15:00:00', '16:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '16:00:00', '17:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '17:00:00', '18:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '18:00:00', '19:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '19:00:00', '20:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 5, '20:00:00', '21:00:00', 2, true, NOW(), NOW());

-- 週六 (weekday = 6)
INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity, active, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '08:00:00', '09:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '09:00:00', '10:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '10:00:00', '11:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '11:00:00', '12:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '12:00:00', '13:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '13:00:00', '14:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '14:00:00', '15:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '15:00:00', '16:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '16:00:00', '17:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '17:00:00', '18:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '18:00:00', '19:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '19:00:00', '20:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 6, '20:00:00', '21:00:00', 2, true, NOW(), NOW());

-- 週日 (weekday = 0)
INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity, active, created_at, updated_at)
VALUES 
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '08:00:00', '09:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '09:00:00', '10:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '10:00:00', '11:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '11:00:00', '12:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '12:00:00', '13:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '13:00:00', '14:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '14:00:00', '15:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '15:00:00', '16:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '16:00:00', '17:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '17:00:00', '18:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '18:00:00', '19:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '19:00:00', '20:00:00', 2, true, NOW(), NOW()),
  (uuid_generate_v4(), '200b765d-8989-487c-b116-b11ceee4ebd5', 0, '20:00:00', '21:00:00', 2, true, NOW(), NOW());

-- 顯示插入結果
SELECT 'Teacher availability test data inserted successfully' as status;
SELECT COUNT(*) as total_slots FROM availability_slot WHERE teacher_id = '200b765d-8989-487c-b116-b11ceee4ebd5';
SELECT weekday, COUNT(*) as slots_per_day FROM availability_slot WHERE teacher_id = '200b765d-8989-487c-b116-b11ceee4ebd5' GROUP BY weekday ORDER BY weekday;
