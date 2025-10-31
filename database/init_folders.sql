-- 初始化資料夾樹與對應教材分類
-- 根資料夾
INSERT INTO folders (name, parent_id, path, description) VALUES
('English Materials', NULL, '/English Materials', '英語教學教材'),
('Other Materials', NULL, '/Other Materials', '其他教學教材');

-- 子資料夾與教材分類
DO $$
DECLARE
    english_id UUID;
    other_id UUID;
    beginner_id UUID;
    advanced_id UUID;
BEGIN
    -- 取得根資料夾 ID
    SELECT id INTO english_id FROM folders WHERE name = 'English Materials' AND parent_id IS NULL;
    SELECT id INTO other_id FROM folders WHERE name = 'Other Materials' AND parent_id IS NULL;

    -- 第二層資料夾
    INSERT INTO folders (name, parent_id, path, description) VALUES
    ('Beginner', english_id, '/English Materials/Beginner', '初級英語教材'),
    ('Intermediate', english_id, '/English Materials/Intermediate', '中級英語教材'),
    ('Advanced', english_id, '/English Materials/Advanced', '高級英語教材');

    -- 取得第二層資料夾 ID
    SELECT id INTO beginner_id FROM folders WHERE name = 'Beginner' AND parent_id = english_id;
    SELECT id INTO advanced_id FROM folders WHERE name = 'Advanced' AND parent_id = english_id;

    -- 第三層資料夾
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
