-- Tutor Platform 種子數據
-- 用於初始化系統的基本數據

-- 插入管理員用戶 (密碼: admin123)
INSERT INTO app_user (id, email, password_hash, role, name, is_active, timezone, created_at, updated_at)
VALUES (
    'admin-seed-uuid-0000-000000000001',
    'admin@example.com',
    '$2b$10$rQZ8kHWKQOZ8kHWKQOZ8kOZ8kHWKQOZ8kHWKQOZ8kHWKQOZ8kHWKQO', -- admin123
    'admin',
    'Admin',
    true,
    'UTC',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 插入示範老師用戶 (密碼: teacher123)
INSERT INTO app_user (id, email, password_hash, role, name, is_active, timezone, created_at, updated_at)
VALUES (
    'teacher-seed-uuid-000-000000000001',
    'teacher1@example.com',
    '$2b$10$rQZ8kHWKQOZ8kHWKQOZ8kOZ8kHWKQOZ8kHWKQOZ8kHWKQOZ8kHWKQO', -- teacher123
    'teacher',
    'Teacher One',
    true,
    'UTC',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 插入示範學生用戶 (密碼: student123)
INSERT INTO app_user (id, email, password_hash, role, name, is_active, timezone, created_at, updated_at)
VALUES (
    'student-seed-uuid-000-000000000001',
    'student1@example.com',
    '$2b$10$rQZ8kHWKQOZ8kHWKQOZ8kOZ8kHWKQOZ8kHWKQOZ8kHWKQOZ8kHWKQO', -- student123
    'student',
    'Student One',
    true,
    'UTC',
    NOW(),
    NOW()
) ON CONFLICT (email) DO NOTHING;

-- 為老師創建 teacher_profile
INSERT INTO teacher_profile (id, user_id, display_name, bio, created_at, updated_at)
VALUES (
    'teacher-profile-uuid-00-000000000001',
    'teacher-seed-uuid-000-000000000001',
    'Teacher One',
    'Experienced English teacher with 5+ years of teaching experience.',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 為學生創建 student_profile
INSERT INTO student_profile (id, user_id, parent_contact, preferences, created_at, updated_at)
VALUES (
    'student-profile-uuid-00-000000000001',
    'student-seed-uuid-000-000000000001',
    '{}',
    '{}',
    NOW(),
    NOW()
) ON CONFLICT (user_id) DO NOTHING;

-- 插入示範課程
INSERT INTO course (id, title, description, duration_min, type, default_price_cents, active, created_at, updated_at)
VALUES (
    'course-seed-uuid-0000-000000000001',
    'English 1-on-1',
    '25-minute one-on-one English conversation practice',
    25,
    'one_on_one',
    700,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 插入全域定價規則
INSERT INTO pricing_rule (id, scope, target_id, price_cents, commission_pct, priority, active, valid_from, valid_to, created_at, updated_at)
VALUES (
    'pricing-global-uuid-00-000000000001',
    'global',
    NULL,
    700,
    40,
    1,
    true,
    '2025-01-01 00:00:00+00',
    NULL,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 插入老師可用時段示例
INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity, active, created_at, updated_at)
VALUES (
    'availability-uuid-0000-000000000001',
    'teacher-profile-uuid-00-000000000001',
    1, -- Monday
    '09:00:00',
    '12:00:00',
    3,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

INSERT INTO availability_slot (id, teacher_id, weekday, start_time, end_time, capacity, active, created_at, updated_at)
VALUES (
    'availability-uuid-0000-000000000002',
    'teacher-profile-uuid-00-000000000001',
    3, -- Wednesday
    '14:00:00',
    '17:00:00',
    2,
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 插入示範課程包
INSERT INTO Renamedpackage (id, student_id, course_id, total_sessions, remaining_sessions, notes, created_at, updated_at)
VALUES (
    'package-seed-uuid-000-000000000001',
    'student-profile-uuid-00-000000000001',
    'course-seed-uuid-0000-000000000001',
    10,
    10,
    'Initial package for demo student',
    NOW(),
    NOW()
) ON CONFLICT (id) DO NOTHING;

-- 更新序列值（如果使用自增 ID）
-- 這確保新插入的記錄不會與種子數據衝突
-- SELECT setval('app_user_id_seq', 1000, false);
-- SELECT setval('course_id_seq', 1000, false);

-- 顯示插入結果
SELECT 'Seed data inserted successfully' as status;
SELECT COUNT(*) as user_count FROM app_user;
SELECT COUNT(*) as course_count FROM course;
SELECT COUNT(*) as teacher_profile_count FROM teacher_profile;
SELECT COUNT(*) as student_profile_count FROM student_profile;
SELECT COUNT(*) as pricing_rule_count FROM pricing_rule;
SELECT COUNT(*) as availability_slot_count FROM availability_slot;
SELECT COUNT(*) as package_count FROM Renamedpackage;
