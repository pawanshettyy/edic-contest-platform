-- Complete Database Setup for EDIC Contest Platform
-- Version: 2.0.0
-- Description: Full schema with updated sample data for 4 categories only
-- Created: 2025-08-11
-- Categories: Capital, Marketing, Strategy, Team Building

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) DEFAULT 'admin',
  permissions JSONB DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_sessions table
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
  session_token VARCHAR(255) UNIQUE NOT NULL,
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_logs table
CREATE TABLE IF NOT EXISTS admin_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
  action VARCHAR(100) NOT NULL,
  target_type VARCHAR(50),
  target_id VARCHAR(255),
  details JSONB,
  ip_address INET,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contest_config table
CREATE TABLE IF NOT EXISTS contest_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contest_name VARCHAR(255) NOT NULL,
  contest_description TEXT,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  registration_deadline TIMESTAMP WITH TIME ZONE,
  max_teams INTEGER DEFAULT 50,
  team_size INTEGER DEFAULT 5,
  registration_open BOOLEAN DEFAULT true,
  contest_active BOOLEAN DEFAULT false,
  quiz_active BOOLEAN DEFAULT false,
  quiz_time_limit_minutes INTEGER DEFAULT 30,
  voting_active BOOLEAN DEFAULT false,
  current_round INTEGER DEFAULT 1,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create contest_rounds table
CREATE TABLE IF NOT EXISTS contest_rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_number INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT false,
  start_time TIMESTAMP WITH TIME ZONE,
  end_time TIMESTAMP WITH TIME ZONE,
  time_limit_minutes INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(round_number)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_name VARCHAR(255) NOT NULL,
  team_code VARCHAR(50) UNIQUE NOT NULL,
  status VARCHAR(20) DEFAULT 'active',
  score DECIMAL(10,2) DEFAULT 0.00,
  penalties INTEGER DEFAULT 0,
  presentation_order INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  username VARCHAR(255) NOT NULL,
  email VARCHAR(255),
  role VARCHAR(50) DEFAULT 'member',
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_questions table (NO time_limit column)
CREATE TABLE IF NOT EXISTS quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  points INTEGER DEFAULT 1,
  category VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_options table
CREATE TABLE IF NOT EXISTS quiz_options (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  is_correct BOOLEAN DEFAULT false,
  order_index INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create quiz_sessions table
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

-- Create quiz_submissions table
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

-- Create voting_sessions table
CREATE TABLE IF NOT EXISTS voting_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  round_id UUID REFERENCES contest_rounds(id),
  current_presenting_team UUID REFERENCES teams(id),
  phase VARCHAR(20) DEFAULT 'setup',
  phase_start_time TIMESTAMP WITH TIME ZONE,
  phase_end_time TIMESTAMP WITH TIME ZONE,
  pitch_duration INTEGER DEFAULT 300,
  voting_duration INTEGER DEFAULT 120,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create voting_teams table
CREATE TABLE IF NOT EXISTS voting_teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  has_presented BOOLEAN DEFAULT false,
  downvotes_used INTEGER DEFAULT 0,
  presentation_order INTEGER,
  UNIQUE(session_id, team_id)
);

-- Create votes table
CREATE TABLE IF NOT EXISTS votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
  voter_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  target_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
  vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, voter_team_id, target_team_id, vote_type)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user ON admin_sessions(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_teams_code ON teams(team_code);
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_active ON voting_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_voter ON votes(voter_team_id);
CREATE INDEX IF NOT EXISTS idx_votes_target ON votes(target_team_id);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, email, password_hash, role, permissions) VALUES
('admin', 'admin@techpreneur3.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkC6q3MqPpsDx5i', 'super_admin', '{"all": true, "teams": true, "config": true, "users": true, "logs": true, "questions": true}')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = true,
  updated_at = NOW();

-- Insert default contest configuration
INSERT INTO contest_config (
  contest_name, 
  contest_description, 
  start_date, 
  end_date,
  registration_deadline,
  max_teams, 
  team_size, 
  quiz_time_limit_minutes,
  current_round
) VALUES (
  'Techpreneur 3.0', 
  'Business Decision Making Challenge', 
  NOW(), 
  NOW() + INTERVAL '7 days',
  NOW() + INTERVAL '2 days',
  50, 
  5, 
  30,
  1
) ON CONFLICT DO NOTHING;

-- Insert sample questions for the four categories: Capital, Marketing, Strategy, Team Building
-- NO explanations included - just direct business scenario questions
INSERT INTO quiz_questions (question, category, is_active) VALUES
-- Capital questions (5 questions)
('Your startup needs $500K to scale operations. What financing option gives you the most control?', 'Capital', true),
('A potential investor wants 25% equity for $1M investment. Your startup is valued at:', 'Capital', true),
('What is the primary advantage of bootstrapping over external funding?', 'Capital', true),
('Which metric is most important when presenting to venture capitalists?', 'Capital', true),
('Your runway shows 8 months left. What should be your immediate priority?', 'Capital', true),

-- Marketing questions (5 questions)
('Your CAC is $100 and LTV is $250. What does this indicate?', 'Marketing', true),
('Which marketing channel typically has the lowest customer acquisition cost for B2B startups?', 'Marketing', true),
('Your conversion rate from trial to paid is 2%. Industry average is 15%. What should you focus on?', 'Marketing', true),
('A competitor launched a similar product. What is your best marketing response?', 'Marketing', true),
('Your organic reach dropped 60%. What is the most cost-effective solution?', 'Marketing', true),

-- Strategy questions (5 questions)
('Your main competitor just raised $50M. What should be your strategic response?', 'Strategy', true),
('Market research shows demand in Asia. Your product needs localization. What do you do?', 'Strategy', true),
('Revenue growth stalled at $2M ARR. What strategic pivot should you consider?', 'Strategy', true),
('A large corporation wants to acquire you for 3x revenue. What factors should you consider?', 'Strategy', true),
('Your product serves both B2B and B2C markets. Which strategic focus is better?', 'Strategy', true),

-- Team Building questions (5 questions)
('Your co-founder wants to quit after 2 years. How do you handle their equity?', 'Team Building', true),
('Remote team productivity dropped 30%. What is your first action?', 'Team Building', true),
('Two key developers are leaving for better pay. What is your best retention strategy?', 'Team Building', true),
('Your team doubled in 6 months but communication is breaking down. What structure do you implement?', 'Team Building', true),
('A star performer is demotivating others with their attitude. How do you handle this?', 'Team Building', true);

-- Insert sample options for all questions
DO $$
DECLARE
    q_record RECORD;
    capital_options TEXT[][] := ARRAY[
        ['Debt financing', 'Self-funding/bootstrapping', 'Venture capital', 'Crowdfunding'],
        ['$2 million', '$4 million', '$6 million', '$8 million'],
        ['Faster growth', 'Full ownership retention', 'Better credibility', 'Access to networks'],
        ['Team size', 'Market size and growth', 'Office location', 'Product features'],
        ['Reduce expenses', 'Start fundraising immediately', 'Pivot business model', 'Hire more sales people']
    ];
    marketing_options TEXT[][] := ARRAY[
        ['Excellent unit economics', 'Poor unit economics', 'Need more data', 'Unsustainable model'],
        ['Social media ads', 'Content marketing', 'Cold outreach', 'Trade shows'],
        ['Product features', 'Onboarding experience', 'Pricing strategy', 'Customer support'],
        ['Lower your prices', 'Differentiate your positioning', 'Copy their features', 'Increase ad spend'],
        ['Buy more ads', 'Improve SEO/content', 'Hire influencers', 'Switch platforms']
    ];
    strategy_options TEXT[][] := ARRAY[
        ['Raise more money', 'Focus on profitability', 'Compete directly', 'Find new market niche'],
        ['Enter immediately', 'Test with pilot program', 'Wait for more resources', 'Partner with local company'],
        ['Expand to new markets', 'Improve current product', 'Reduce costs', 'Change business model'],
        ['Accept immediately', 'Negotiate higher price', 'Decline and continue', 'Ask for strategic partnership'],
        ['Focus on B2B only', 'Focus on B2C only', 'Serve both equally', 'Create separate products']
    ];
    team_options TEXT[][] := ARRAY[
        ['Buyback at fair value', 'Keep their equity', 'Give equity to team', 'Negotiate vesting acceleration'],
        ['Implement daily standups', 'Organize team building', 'Review remote work policies', 'Hire project managers'],
        ['Match competitor offers', 'Offer equity compensation', 'Improve work environment', 'All of the above'],
        ['Flat hierarchy', 'Team leads for each function', 'External consultants', 'More meetings'],
        ['Immediate termination', 'Performance improvement plan', 'Direct conversation', 'Team mediation']
    ];
    correct_answers INTEGER[] := ARRAY[2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 4, 2, 2, 3, 1, 1, 2, 4, 2, 3];
    question_index INTEGER := 1;
    category_index INTEGER;
    option_index INTEGER;
    current_options TEXT[];
BEGIN
    FOR q_record IN 
        SELECT id, category FROM quiz_questions WHERE category IN ('Capital', 'Marketing', 'Strategy', 'Team Building')
        ORDER BY 
            CASE category 
                WHEN 'Capital' THEN 1 
                WHEN 'Marketing' THEN 2 
                WHEN 'Strategy' THEN 3 
                WHEN 'Team Building' THEN 4 
            END, created_at
    LOOP
        -- Determine which set of options to use
        CASE q_record.category
            WHEN 'Capital' THEN 
                category_index := ((question_index - 1) % 5) + 1;
                current_options := capital_options[category_index];
            WHEN 'Marketing' THEN 
                category_index := ((question_index - 6) % 5) + 1;
                current_options := marketing_options[category_index];
            WHEN 'Strategy' THEN 
                category_index := ((question_index - 11) % 5) + 1;
                current_options := strategy_options[category_index];
            WHEN 'Team Building' THEN 
                category_index := ((question_index - 16) % 5) + 1;
                current_options := team_options[category_index];
        END CASE;

        -- Insert 4 options for each question
        FOR option_index IN 1..4 LOOP
            INSERT INTO quiz_options (
                question_id, 
                option_text, 
                is_correct, 
                order_index
            ) VALUES (
                q_record.id,
                current_options[option_index],
                option_index = correct_answers[question_index],
                option_index
            );
        END LOOP;

        question_index := question_index + 1;
    END LOOP;
END $$;

SELECT 'Database setup completed successfully!' as status;
SELECT 'Admin user created: admin / admin123' as credentials;
SELECT 'Sample questions created for: Capital, Marketing, Strategy, Team Building' as content;
