-- Enable UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users and roles
CREATE TABLE app_user (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  email TEXT UNIQUE NOT NULL,
  phone TEXT,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin','teacher','student')),
  name TEXT NOT NULL,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  timezone TEXT DEFAULT 'UTC',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE teacher_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
  display_name TEXT,
  bio                   TEXT NULL,
  photo_url             TEXT NULL,
  intro_video_url       TEXT NULL,
  default_rate_cents INTEGER,                 -- 可不填，走 global
  default_commission_pct INTEGER,             -- 0~100，可不填，走 global
  meeting_provider TEXT NOT NULL DEFAULT 'custom', -- 'custom' 先行
  meeting_account_meta JSONB DEFAULT '{}'::jsonb,  -- 可存 Zoom 個人會議室 ID 等
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE student_profile (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL UNIQUE REFERENCES app_user(id) ON DELETE CASCADE,
  parent_contact JSONB,
  preferences JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE course (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT,
  duration_min INTEGER NOT NULL DEFAULT 25,
  type TEXT NOT NULL CHECK (type IN ('one_on_one','group')),
  default_price_cents INTEGER NOT NULL DEFAULT 700, -- 7 USD
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Pricing rules with override and priority
CREATE TABLE pricing_rule (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  scope TEXT NOT NULL CHECK (scope IN ('global','teacher','course')),
  teacher_id UUID REFERENCES teacher_profile(id) ON DELETE CASCADE,
  course_id UUID REFERENCES course(id) ON DELETE CASCADE,
  price_mode TEXT NOT NULL CHECK (price_mode IN ('per_session')), -- MVP: 單堂制
  price_cents INTEGER,                   -- 若為 NULL 則沿用下層
  commission_pct INTEGER,                -- 若為 NULL 則沿用下層
  priority INTEGER NOT NULL DEFAULT 1,   -- 數字越大優先
  active BOOLEAN NOT NULL DEFAULT TRUE,
  valid_from TIMESTAMPTZ,
  valid_to TIMESTAMPTZ
);
CREATE INDEX idx_pricing_rule_prio ON pricing_rule(priority DESC, scope);
CREATE INDEX idx_pricing_rule_teacher ON pricing_rule(teacher_id);
CREATE INDEX idx_pricing_rule_course ON pricing_rule(course_id);

-- Packages (admin 手動加堂；先不串金流)
CREATE TABLE package (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE RESTRICT,
  total_sessions INTEGER NOT NULL CHECK (total_sessions >= 0),
  remaining_sessions INTEGER NOT NULL CHECK (remaining_sessions >= 0),
  paid_amount_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('active','expired')) DEFAULT 'active',
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_package_student ON package(student_id);

-- Availability slots (每週循環)
CREATE TABLE availability_slot (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teacher_profile(id) ON DELETE CASCADE,
  weekday SMALLINT NOT NULL CHECK (weekday BETWEEN 0 AND 6), -- 0=Sun
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  effective_from DATE,
  effective_to DATE
);
CREATE INDEX idx_avail_teacher_weekday ON availability_slot(teacher_id, weekday);

-- Sessions and attendees
CREATE TABLE session (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  course_id UUID NOT NULL REFERENCES course(id) ON DELETE RESTRICT,
  teacher_id UUID NOT NULL REFERENCES teacher_profile(id) ON DELETE RESTRICT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  status TEXT NOT NULL CHECK (status IN ('pending','confirmed','completed','cancelled','no_show')) DEFAULT 'pending',
  meeting_url TEXT,       -- 老師填的 Zoom/自定連結
  meeting_passcode TEXT,
  created_by TEXT NOT NULL CHECK (created_by IN ('student','teacher','admin','system')),
  cancel_reason TEXT,
  technical_issue BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_session_teacher_start ON session(teacher_id, start_at);

CREATE TABLE session_attendee (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('booked','attended','no_show','cancelled')) DEFAULT 'booked',
  joined_at TIMESTAMPTZ,
  left_at TIMESTAMPTZ,
  UNIQUE (session_id, student_id)
);
CREATE INDEX idx_attendee_student ON session_attendee(student_id);

CREATE TABLE session_proof (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL REFERENCES session(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES teacher_profile(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('screenshot','log')),
  url TEXT NOT NULL,
  meta JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE session_report (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  session_id UUID NOT NULL UNIQUE REFERENCES session(id) ON DELETE CASCADE,
  teacher_notes TEXT,
  student_goal TEXT,
  teacher_submitted_at TIMESTAMPTZ,
  student_submitted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Compensation / credit ledger for extra sessions
CREATE TABLE credit_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID NOT NULL REFERENCES student_profile(id) ON DELETE CASCADE,
  source TEXT NOT NULL CHECK (source IN ('package','bonus','compensation')),
  delta_sessions INTEGER NOT NULL,
  reason TEXT,
  session_id UUID REFERENCES session(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Payouts (月結)
CREATE TABLE payout (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  teacher_id UUID NOT NULL REFERENCES teacher_profile(id) ON DELETE CASCADE,
  period_month DATE NOT NULL, -- 用每月第一天表示
  total_cents INTEGER NOT NULL DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'USD',
  status TEXT NOT NULL CHECK (status IN ('draft','confirmed','paid')) DEFAULT 'draft',
  breakdown JSONB NOT NULL DEFAULT '[]'::jsonb,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (teacher_id, period_month)
);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_user_updated BEFORE UPDATE ON app_user FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_teacher_updated BEFORE UPDATE ON teacher_profile FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_student_updated BEFORE UPDATE ON student_profile FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_course_updated BEFORE UPDATE ON course FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_package_updated BEFORE UPDATE ON package FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_session_updated BEFORE UPDATE ON session FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_session_report_updated BEFORE UPDATE ON session_report FOR EACH ROW EXECUTE PROCEDURE set_updated_at();
CREATE TRIGGER trg_payout_updated BEFORE UPDATE ON payout FOR EACH ROW EXECUTE PROCEDURE set_updated_at();

-- Seed minimal data
INSERT INTO course (title, description, duration_min, type, default_price_cents)
VALUES ('English 1-on-1', '25-min session', 25, 'one_on_one', 700);

-- Global pricing default: 7 USD per session, commission 40%
INSERT INTO pricing_rule (scope, price_mode, price_cents, commission_pct, priority, active)
VALUES ('global', 'per_session', 700, 40, 1, TRUE);