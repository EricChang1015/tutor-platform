-- 更新 teacher_gallery 表結構以支援管理員功能

-- 添加缺失的欄位
ALTER TABLE teacher_gallery 
ADD COLUMN IF NOT EXISTS upload_id UUID,
ADD COLUMN IF NOT EXISTS title VARCHAR(255) DEFAULT 'Untitled',
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;

-- 重命名欄位
DO $$
BEGIN
    -- 重命名 type 為 media_type
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_gallery' AND column_name = 'type') THEN
        ALTER TABLE teacher_gallery RENAME COLUMN type TO media_type;
    END IF;

    -- 重命名 caption 為 description
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_gallery' AND column_name = 'caption') THEN
        ALTER TABLE teacher_gallery RENAME COLUMN caption TO description;
    END IF;

    -- 重命名 uploaded_at 為 created_at
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_gallery' AND column_name = 'uploaded_at') THEN
        ALTER TABLE teacher_gallery RENAME COLUMN uploaded_at TO created_at;
    END IF;
END $$;

-- 刪除不需要的欄位
ALTER TABLE teacher_gallery DROP COLUMN IF EXISTS filename;

-- 更新 title 欄位為 NOT NULL
UPDATE teacher_gallery SET title = 'Untitled' WHERE title IS NULL;
ALTER TABLE teacher_gallery ALTER COLUMN title SET NOT NULL;

-- 更新媒體類型檢查約束
ALTER TABLE teacher_gallery DROP CONSTRAINT IF EXISTS teacher_gallery_type_check;
ALTER TABLE teacher_gallery DROP CONSTRAINT IF EXISTS teacher_gallery_media_type_check;
ALTER TABLE teacher_gallery ADD CONSTRAINT teacher_gallery_media_type_check 
    CHECK (media_type IN ('image', 'video', 'audio', 'other'));

-- 創建新索引
CREATE INDEX IF NOT EXISTS idx_teacher_gallery_sort_order ON teacher_gallery(sort_order);

-- 刪除舊索引
DROP INDEX IF EXISTS idx_teacher_gallery_teacher_type;
DROP INDEX IF EXISTS idx_teacher_gallery_type;

-- 更新觸發器函數
CREATE OR REPLACE FUNCTION update_teacher_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 重新創建觸發器
DROP TRIGGER IF EXISTS trigger_update_teacher_gallery_updated_at ON teacher_gallery;
CREATE TRIGGER trigger_update_teacher_gallery_updated_at
    BEFORE UPDATE ON teacher_gallery
    FOR EACH ROW
    EXECUTE FUNCTION update_teacher_gallery_updated_at();

-- 添加註釋
COMMENT ON TABLE teacher_gallery IS '教師相簿表';
COMMENT ON COLUMN teacher_gallery.teacher_id IS '教師ID';
COMMENT ON COLUMN teacher_gallery.upload_id IS '上傳檔案ID';
COMMENT ON COLUMN teacher_gallery.title IS '檔案標題';
COMMENT ON COLUMN teacher_gallery.description IS '檔案描述';
COMMENT ON COLUMN teacher_gallery.media_type IS '媒體類型: image, video, audio, other';
COMMENT ON COLUMN teacher_gallery.url IS '檔案URL';
COMMENT ON COLUMN teacher_gallery.sort_order IS '排序順序';
COMMENT ON COLUMN teacher_gallery.created_at IS '創建時間';
COMMENT ON COLUMN teacher_gallery.updated_at IS '更新時間';
