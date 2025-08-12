-- Migration Script: Move categories from questions to options
-- Version: 3.0.0
-- Description: Updates database schema to support category per option instead of per question
-- Run Date: 2025-08-12

-- Add missing columns to quiz_options table
DO $$
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quiz_options' AND column_name = 'category') THEN
        ALTER TABLE quiz_options ADD COLUMN category VARCHAR(100) DEFAULT 'Capital';
        RAISE NOTICE 'Added category column to quiz_options';
    ELSE
        RAISE NOTICE 'category column already exists in quiz_options';
    END IF;

    -- Add points column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quiz_options' AND column_name = 'points') THEN
        ALTER TABLE quiz_options ADD COLUMN points INTEGER DEFAULT 0;
        RAISE NOTICE 'Added points column to quiz_options';
    ELSE
        RAISE NOTICE 'points column already exists in quiz_options';
    END IF;

    -- Add option_order column if it doesn't exist (rename from order_index if needed)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quiz_options' AND column_name = 'option_order') THEN
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'quiz_options' AND column_name = 'order_index') THEN
            ALTER TABLE quiz_options RENAME COLUMN order_index TO option_order;
            RAISE NOTICE 'Renamed order_index to option_order in quiz_options';
        ELSE
            ALTER TABLE quiz_options ADD COLUMN option_order INTEGER DEFAULT 1;
            RAISE NOTICE 'Added option_order column to quiz_options';
        END IF;
    ELSE
        RAISE NOTICE 'option_order column already exists in quiz_options';
    END IF;
END $$;

-- Migrate existing data: assign category from questions to their options
UPDATE quiz_options 
SET category = qq.category,
    points = CASE 
        WHEN quiz_options.is_correct THEN 10 
        ELSE CASE 
            WHEN qq.category IN ('Capital', 'Strategy') THEN 5
            WHEN qq.category IN ('Marketing', 'Team Building') THEN 3
            ELSE 0
        END
    END
FROM quiz_questions qq 
WHERE quiz_options.question_id = qq.id 
AND quiz_options.category = 'Capital'; -- Only update unset categories

-- Update option_order if not set properly (ensure sequential ordering per question)
WITH numbered_options AS (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY question_id ORDER BY created_at) as new_order
    FROM quiz_options
)
UPDATE quiz_options 
SET option_order = numbered_options.new_order
FROM numbered_options 
WHERE quiz_options.id = numbered_options.id;

-- Remove category column from quiz_questions table after migration
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'quiz_questions' AND column_name = 'category') THEN
        ALTER TABLE quiz_questions DROP COLUMN category;
        RAISE NOTICE 'Removed category column from quiz_questions';
    ELSE
        RAISE NOTICE 'category column does not exist in quiz_questions';
    END IF;
END $$;

-- Remove points column from quiz_questions table if it exists (moved to options)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'quiz_questions' AND column_name = 'points') THEN
        ALTER TABLE quiz_questions DROP COLUMN points;
        RAISE NOTICE 'Removed points column from quiz_questions';
    ELSE
        RAISE NOTICE 'points column does not exist in quiz_questions';
    END IF;
END $$;

-- Ensure all options have valid categories (fallback)
UPDATE quiz_options 
SET category = 'Capital' 
WHERE category IS NULL OR category NOT IN ('Capital', 'Marketing', 'Strategy', 'Team Building');

-- Add constraints for data integrity
ALTER TABLE quiz_options ADD CONSTRAINT check_category 
CHECK (category IN ('Capital', 'Marketing', 'Strategy', 'Team Building'));

ALTER TABLE quiz_options ADD CONSTRAINT check_option_order_positive 
CHECK (option_order > 0);

SELECT 'Migration v3 completed successfully!' as status;
SELECT 'Categories moved from questions to options' as change_1;
SELECT 'Points moved from questions to options' as change_2;
SELECT 'Option ordering standardized' as change_3;
SELECT 'Category constraints added' as change_4;
