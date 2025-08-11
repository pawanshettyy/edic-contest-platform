-- Migration: Add category field to quiz_options table and remove difficulty/time_limit from quiz_questions
-- This migration moves the category field from question level to option level
-- and removes time_limit and difficulty fields as they are no longer needed

-- Add category column to quiz_options table
ALTER TABLE quiz_options 
ADD COLUMN IF NOT EXISTS category VARCHAR(255) DEFAULT 'General';

-- Migrate existing categories from questions to their options
UPDATE quiz_options 
SET category = q.category
FROM quiz_questions q 
WHERE quiz_options.question_id = q.id
AND quiz_options.category = 'General';

-- Remove category, difficulty, and time_limit columns from quiz_questions table
ALTER TABLE quiz_questions DROP COLUMN IF EXISTS category;
ALTER TABLE quiz_questions DROP COLUMN IF EXISTS difficulty;
ALTER TABLE quiz_questions DROP COLUMN IF EXISTS time_limit;

-- Add index for performance on the new category column
CREATE INDEX IF NOT EXISTS idx_quiz_options_category ON quiz_options(category);

-- Verify the migration
SELECT 
    'quiz_options' as table_name,
    COUNT(*) as total_options,
    COUNT(DISTINCT category) as unique_categories
FROM quiz_options
UNION ALL
SELECT 
    'quiz_questions' as table_name,
    COUNT(*) as total_questions,
    0 as categories_moved_to_options
FROM quiz_questions;

-- Show sample data after migration
SELECT 
    q.question,
    o.option_text,
    o.category,
    o.is_correct
FROM quiz_questions q
JOIN quiz_options o ON q.id = o.question_id
ORDER BY q.question, o.option_order
LIMIT 10;
