-- 創建資料夾表以支援多級資料夾結構
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    parent_id UUID NULL REFERENCES folders(id) ON DELETE CASCADE,
    path TEXT NOT NULL, -- 完整路徑，如 /English Materials/Beginner
    description TEXT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 創建索引
CREATE INDEX idx_folders_parent_id ON folders(parent_id);
CREATE INDEX idx_folders_path ON folders(path);
CREATE INDEX idx_folders_name ON folders(name);

-- 創建更新觸發器
CREATE OR REPLACE FUNCTION update_folders_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_folders_updated_at
    BEFORE UPDATE ON folders
    FOR EACH ROW
    EXECUTE FUNCTION update_folders_updated_at();

-- 更新 materials 表的外鍵約束
ALTER TABLE materials 
ADD CONSTRAINT fk_materials_folder_id 
FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL;

-- 插入初始資料夾結構
-- 先插入根資料夾
INSERT INTO folders (name, parent_id, path, description) VALUES
('English Materials', NULL, '/English Materials', '英語教學教材'),
('Other Materials', NULL, '/Other Materials', '其他教學教材');

-- 獲取根資料夾的 ID 並插入子資料夾
DO $$
DECLARE
    english_id UUID;
    other_id UUID;
    beginner_id UUID;
    advanced_id UUID;
BEGIN
    -- 獲取根資料夾 ID
    SELECT id INTO english_id FROM folders WHERE name = 'English Materials' AND parent_id IS NULL;
    SELECT id INTO other_id FROM folders WHERE name = 'Other Materials' AND parent_id IS NULL;

    -- 插入第二層資料夾
    INSERT INTO folders (name, parent_id, path, description) VALUES
    ('Beginner', english_id, '/English Materials/Beginner', '初級英語教材'),
    ('Intermediate', english_id, '/English Materials/Intermediate', '中級英語教材'),
    ('Advanced', english_id, '/English Materials/Advanced', '高級英語教材');

    -- 獲取第二層資料夾 ID
    SELECT id INTO beginner_id FROM folders WHERE name = 'Beginner' AND parent_id = english_id;
    SELECT id INTO advanced_id FROM folders WHERE name = 'Advanced' AND parent_id = english_id;

    -- 插入第三層資料夾
    INSERT INTO folders (name, parent_id, path, description) VALUES
    ('Grammar', beginner_id, '/English Materials/Beginner/Grammar', '基礎文法教材'),
    ('Vocabulary', beginner_id, '/English Materials/Beginner/Vocabulary', '基礎詞彙教材'),
    ('Business English', advanced_id, '/English Materials/Advanced/Business English', '商業英語教材'),
    ('IELTS', advanced_id, '/English Materials/Advanced/IELTS', 'IELTS 考試教材');

    -- 更新現有教材的資料夾分類
    UPDATE materials SET folder_id = (SELECT id FROM folders WHERE name = 'Grammar' AND parent_id = beginner_id) WHERE title ILIKE '%grammar%';
    UPDATE materials SET folder_id = (SELECT id FROM folders WHERE name = 'Business English' AND parent_id = advanced_id) WHERE title ILIKE '%business%';
    UPDATE materials SET folder_id = (SELECT id FROM folders WHERE name = 'IELTS' AND parent_id = advanced_id) WHERE title ILIKE '%ielts%';
    UPDATE materials SET folder_id = beginner_id WHERE title ILIKE '%basic%' OR title ILIKE '%fundamental%';
    UPDATE materials SET folder_id = other_id WHERE folder_id IS NULL;
END $$;
