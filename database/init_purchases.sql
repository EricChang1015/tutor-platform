-- 初始化 purchases 範例資料
INSERT INTO purchases (id, student_id, package_name, quantity, remaining, type, purchased_at, activated_at, expires_at, status) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '體驗卡', 2, 2, 'trial_card', NOW(), NOW(), NOW() + INTERVAL '14 days', 'active'),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '約課次卡', 10, 10, 'lesson_card', NOW(), NOW(), NOW() + INTERVAL '90 days', 'active'),
('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', '體驗卡', 2, 2, 'trial_card', NOW(), NOW(), NOW() + INTERVAL '14 days', 'active');
