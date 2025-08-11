-- Migration Script: Remove time_limit and update categories
-- Version: 2.0.0
-- Description: Updates existing database to remove time limits and filter categories
-- Run Date: 2025-08-11

-- Remove time_limit column from quiz_questions if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'quiz_questions' AND column_name = 'time_limit') THEN
        ALTER TABLE quiz_questions DROP COLUMN time_limit;
        RAISE NOTICE 'Removed time_limit column from quiz_questions';
    ELSE
        RAISE NOTICE 'time_limit column does not exist in quiz_questions';
    END IF;
END $$;

-- Remove questions that are not in the four allowed categories
DELETE FROM quiz_questions 
WHERE category NOT IN ('Capital', 'Marketing', 'Strategy', 'Team Building');

-- Update contest_config to include new fields if they don't exist
DO $$
BEGIN
    -- Add registration_deadline if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contest_config' AND column_name = 'registration_deadline') THEN
        ALTER TABLE contest_config ADD COLUMN registration_deadline TIMESTAMP WITH TIME ZONE;
        RAISE NOTICE 'Added registration_deadline column to contest_config';
    END IF;

    -- Add quiz_active if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contest_config' AND column_name = 'quiz_active') THEN
        ALTER TABLE contest_config ADD COLUMN quiz_active BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added quiz_active column to contest_config';
    END IF;

    -- Add voting_active if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contest_config' AND column_name = 'voting_active') THEN
        ALTER TABLE contest_config ADD COLUMN voting_active BOOLEAN DEFAULT false;
        RAISE NOTICE 'Added voting_active column to contest_config';
    END IF;

    -- Add quiz_time_limit_minutes if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'contest_config' AND column_name = 'quiz_time_limit_minutes') THEN
        ALTER TABLE contest_config ADD COLUMN quiz_time_limit_minutes INTEGER DEFAULT 30;
        RAISE NOTICE 'Added quiz_time_limit_minutes column to contest_config';
    END IF;
END $$;

-- Create quiz_sessions table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  member_name VARCHAR(255) NOT NULL,
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  submitted_at TIMESTAMP WITH TIME ZONE,
  is_active BOOLEAN DEFAULT true,
  total_score INTEGER DEFAULT 0,
  questions_answered INTEGER DEFAULT 0,
  auto_submitted BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_submissions table if it doesn't exist
CREATE TABLE IF NOT EXISTS quiz_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  selected_option_id UUID REFERENCES quiz_options(id) ON DELETE CASCADE,
  time_spent INTEGER DEFAULT 0,
  points_earned INTEGER DEFAULT 0,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, question_id)
);

-- Update existing questions to remove any explanation content and make them more direct
UPDATE quiz_questions SET 
    question = CASE 
        WHEN question LIKE '%explanation%' OR question LIKE '%because%' OR question LIKE '%This is%' 
        THEN SUBSTRING(question FROM 1 FOR POSITION('.' IN question) - 1) 
        ELSE question 
    END
WHERE category IN ('Capital', 'Marketing', 'Strategy', 'Team Building');

-- Set default contest configuration
INSERT INTO contest_config (
    contest_name, 
    contest_description, 
    quiz_time_limit_minutes,
    current_round,
    contest_active,
    quiz_active,
    voting_active,
    registration_open
) VALUES (
    'Techpreneur 3.0', 
    'Business Decision Making Challenge', 
    30,
    1,
    false,
    false,
    false,
    true
) ON CONFLICT DO NOTHING;

SELECT 'Migration completed successfully!' as status;
SELECT 'Categories limited to: Capital, Marketing, Strategy, Team Building' as categories;
SELECT 'Time limits removed from questions' as changes;
SELECT 'Contest control fields added' as features;
