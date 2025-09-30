-- 家教平台資料庫結構 (PostgreSQL)
-- 建立時間: 2025-09-30

-- 建立擴展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 設定時區
SET timezone = 'UTC';

-- 用戶表
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) CHECK (role IN ('admin', 'teacher', 'student')) NOT NULL,
    name VARCHAR(255) NOT NULL,
    avatar_url VARCHAR(500) NULL,
    bio TEXT NULL,
    phone VARCHAR(50) NULL,
    timezone VARCHAR(100) NULL DEFAULT 'Asia/Taipei',
    locale VARCHAR(10) NULL DEFAULT 'zh-TW',
    settings JSONB NULL,
    active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_active ON users(active);
CREATE INDEX idx_users_deleted_at ON users(deleted_at);

-- 教師詳細資料表
CREATE TABLE teacher_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    intro TEXT NOT NULL,
    certifications JSONB NULL,
    experience_years INTEGER NOT NULL DEFAULT 0,
    domains JSONB NOT NULL,
    regions JSONB NOT NULL,
    languages JSONB NULL,
    price_policies JSONB NULL,
    unit_price_usd DECIMAL(10,2) DEFAULT 5.00,
    meeting_preference JSONB NULL,
    rating DECIMAL(3,2) DEFAULT 0.00,
    ratings_count INTEGER DEFAULT 0,
    ratings_breakdown JSONB NULL,
    next_available_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teacher_profiles_user_id ON teacher_profiles(user_id);
CREATE INDEX idx_teacher_profiles_rating ON teacher_profiles(rating);

-- 教師相簿表
CREATE TABLE teacher_gallery (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url VARCHAR(500) NOT NULL,
    type VARCHAR(20) CHECK (type IN ('image', 'video', 'other')) DEFAULT 'image',
    caption TEXT NULL,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_teacher_gallery_teacher_id ON teacher_gallery(teacher_id);

-- 購買項目表
CREATE TABLE purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    package_name VARCHAR(255) NOT NULL,
    quantity INTEGER NOT NULL,
    remaining INTEGER NOT NULL,
    type VARCHAR(30) CHECK (type IN ('lesson_card', 'trial_card', 'compensation_card', 'cancel_card')) NOT NULL,
    suggested_label VARCHAR(255) NULL,
    purchased_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    activated_at TIMESTAMP NULL,
    expires_at TIMESTAMP NULL,
    status VARCHAR(20) CHECK (status IN ('draft', 'active', 'expired', 'consumed')) DEFAULT 'active',
    notes TEXT NULL,
    meta JSONB NULL
);

CREATE INDEX idx_purchases_student_id ON purchases(student_id);
CREATE INDEX idx_purchases_type ON purchases(type);
CREATE INDEX idx_purchases_status ON purchases(status);
CREATE INDEX idx_purchases_expires_at ON purchases(expires_at);

-- 預約表
CREATE TABLE bookings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    starts_at TIMESTAMP NOT NULL,
    ends_at TIMESTAMP NOT NULL,
    status VARCHAR(20) CHECK (status IN ('scheduled', 'pending', 'pending_teacher', 'canceled', 'completed', 'noshow')) DEFAULT 'scheduled',
    source VARCHAR(20) CHECK (source IN ('student', 'admin', 'teacher', 'system')) DEFAULT 'student',
    material_id UUID NULL,
    course_title VARCHAR(255) NULL,
    message TEXT NULL,
    meeting_url VARCHAR(500) NULL,
    last_message_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bookings_student_id ON bookings(student_id);
CREATE INDEX idx_bookings_teacher_id ON bookings(teacher_id);
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_time_range ON bookings(starts_at, ends_at);

-- 教師可用時間表
CREATE TABLE teacher_availability (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    time_slot INTEGER NOT NULL CHECK (time_slot >= 0 AND time_slot <= 47),
    status VARCHAR(20) CHECK (status IN ('available', 'booked', 'unavailable')) DEFAULT 'available',
    booking_id UUID NULL REFERENCES bookings(id) ON DELETE SET NULL,
    reason TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teacher_id, date, time_slot)
);

CREATE INDEX idx_teacher_availability_teacher_id ON teacher_availability(teacher_id);
CREATE INDEX idx_teacher_availability_date ON teacher_availability(date);
CREATE INDEX idx_teacher_availability_status ON teacher_availability(status);
CREATE INDEX idx_teacher_availability_teacher_date ON teacher_availability(teacher_id, date);
CREATE INDEX idx_teacher_availability_date_time_slot ON teacher_availability(date, time_slot);
CREATE INDEX idx_teacher_availability_search ON teacher_availability(date, time_slot, status) WHERE status = 'available';

-- 通知表
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    body TEXT NOT NULL,
    data JSONB NULL,
    read_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_read_at ON notifications(read_at);

-- 插入預設資料
INSERT INTO users (id, email, password_hash, role, name, timezone, locale) VALUES
('11111111-1111-1111-1111-111111111111', 'admin@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'System Admin', 'Asia/Taipei', 'zh-TW'),
('22222222-2222-2222-2222-222222222222', 'teacher1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Teacher One', 'Asia/Taipei', 'zh-TW'),
('44444444-4444-4444-4444-444444444444', 'teacher2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'teacher', 'Teacher Two', 'Asia/Taipei', 'zh-TW'),
('33333333-3333-3333-3333-333333333333', 'student1@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Student One', 'Asia/Taipei', 'zh-TW'),
('55555555-5555-5555-5555-555555555555', 'student2@example.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'student', 'Student Two', 'Asia/Taipei', 'zh-TW');

-- 插入教師詳細資料
INSERT INTO teacher_profiles (user_id, intro, experience_years, domains, regions, unit_price_usd) VALUES
('22222222-2222-2222-2222-222222222222', '經驗豐富的英語教師，專精於會話和文法教學。', 5, '["English", "Conversation"]', '["Taiwan"]', 25.00),
('44444444-4444-4444-4444-444444444444', '母語英語教師，專精於發音和口音訓練。', 8, '["English", "Pronunciation", "IELTS"]', '["Taiwan", "Online"]', 30.00);

-- 插入教材資料
INSERT INTO materials (title, description, type, level, active) VALUES
('Free Talking', 'Open conversation practice', 'conversation', 'all', true),
('Business English Basics', 'Introduction to business communication', 'business', 'intermediate', true),
('IELTS Speaking Practice', 'IELTS speaking test preparation', 'test_prep', 'advanced', true),
('Grammar Fundamentals', 'Basic English grammar rules and exercises', 'grammar', 'beginner', true),
('Pronunciation Workshop', 'Improve your English pronunciation', 'pronunciation', 'intermediate', true);

-- 插入學生購買項目範例
INSERT INTO purchases (id, student_id, package_name, quantity, remaining, type, purchased_at, activated_at, expires_at, status) VALUES
('44444444-4444-4444-4444-444444444444', '33333333-3333-3333-3333-333333333333', '體驗卡', 2, 2, 'trial_card', NOW(), NOW(), NOW() + INTERVAL '14 days', 'active'),
('55555555-5555-5555-5555-555555555555', '33333333-3333-3333-3333-333333333333', '約課次卡', 10, 10, 'lesson_card', NOW(), NOW(), NOW() + INTERVAL '90 days', 'active'),
('66666666-6666-6666-6666-666666666666', '55555555-5555-5555-5555-555555555555', '體驗卡', 2, 2, 'trial_card', NOW(), NOW(), NOW() + INTERVAL '14 days', 'active');

COMMIT;
