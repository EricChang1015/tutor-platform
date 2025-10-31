-- 初始化 users 預設資料
INSERT INTO users (id, email, password_hash, role, name, locale) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Admin', 'zh-TW'),
('22222222-2222-2222-2222-222222222222', 'teacher1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Teacher One', 'zh-TW'),
('44444444-4444-4444-4444-444444444444', 'teacher2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Teacher Two', 'zh-TW'),
('33333333-3333-3333-3333-333333333333', 'student1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Student One', 'zh-TW'),
('55555555-5555-5555-5555-555555555555', 'student2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Student Two', 'zh-TW');
