-- 更新 teacher_gallery 表結構以支援管理員功能

-- 檢查表是否存在，如果不存在則創建
CREATE TABLE IF NOT EXISTS teacher_gallery (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    upload_id UUID,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'audio', 'other')),
    url TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 如果表已存在，添加缺失的欄位
DO $$
BEGIN
    -- 添加 upload_id 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teacher_gallery' AND column_name = 'upload_id') THEN
        ALTER TABLE teacher_gallery ADD COLUMN upload_id UUID;
    END IF;

    -- 添加 title 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teacher_gallery' AND column_name = 'title') THEN
        ALTER TABLE teacher_gallery ADD COLUMN title VARCHAR(255) NOT NULL DEFAULT 'Untitled';
    END IF;

    -- 添加 description 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teacher_gallery' AND column_name = 'description') THEN
        ALTER TABLE teacher_gallery ADD COLUMN description TEXT;
    END IF;

    -- 添加 sort_order 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teacher_gallery' AND column_name = 'sort_order') THEN
        ALTER TABLE teacher_gallery ADD COLUMN sort_order INTEGER DEFAULT 0;
    END IF;

    -- 重命名舊欄位
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_gallery' AND column_name = 'type') THEN
        ALTER TABLE teacher_gallery RENAME COLUMN type TO media_type;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_gallery' AND column_name = 'caption') THEN
        ALTER TABLE teacher_gallery RENAME COLUMN caption TO description;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_gallery' AND column_name = 'uploaded_at') THEN
        ALTER TABLE teacher_gallery RENAME COLUMN uploaded_at TO created_at;
    END IF;

    -- 添加 updated_at 欄位
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'teacher_gallery' AND column_name = 'updated_at') THEN
        ALTER TABLE teacher_gallery ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP;
    END IF;

    -- 刪除不需要的欄位
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'teacher_gallery' AND column_name = 'filename') THEN
        ALTER TABLE teacher_gallery DROP COLUMN filename;
    END IF;
END $$;

-- 創建索引
CREATE INDEX IF NOT EXISTS idx_teacher_gallery_teacher_id ON teacher_gallery(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_gallery_sort_order ON teacher_gallery(sort_order);

-- 創建更新時間觸發器
CREATE OR REPLACE FUNCTION update_teacher_gallery_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

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
