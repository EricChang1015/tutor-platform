-- 新增 booking_evidences 表與擴充 bookings 欄位（報表與課後證據）

-- 1) booking_evidences
CREATE TABLE IF NOT EXISTS booking_evidences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  file_id UUID NOT NULL REFERENCES uploads(id) ON DELETE CASCADE,
  uploaded_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (booking_id, file_id)
);

CREATE INDEX IF NOT EXISTS idx_booking_evidences_booking ON booking_evidences(booking_id);

-- 2) bookings 擴充欄位
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS teacher_comment TEXT,
  ADD COLUMN IF NOT EXISTS teacher_report_submitted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS post_class_report_status VARCHAR(20) CHECK (post_class_report_status IN ('none','submitted','verified')) DEFAULT 'none';

-- 3) 註釋
COMMENT ON TABLE booking_evidences IS '課後證據：關聯 bookings 與 uploads';
COMMENT ON COLUMN booking_evidences.uploaded_by IS '上傳者（通常為該課老師或管理員）';
COMMENT ON COLUMN bookings.teacher_comment IS '老師給學生的課後評語';
COMMENT ON COLUMN bookings.teacher_report_submitted_at IS '老師課後回報提交時間';
COMMENT ON COLUMN bookings.post_class_report_status IS '課後回報狀態：none/submitted/verified';

COMMIT;
