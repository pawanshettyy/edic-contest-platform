-- Techpreneur 3.0 Summit Platform - Optimized Database Schema
-- This is the clean, production-ready schema based on current features
-- Run this script to set up PostgreSQL database

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- CORE TABLES (Essential for the platform)
-- ===========================================

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(255) UNIQUE NOT NULL,
    team_code VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    current_round INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    quiz_score INTEGER DEFAULT 0,
    voting_score INTEGER DEFAULT 0,
    offline_score INTEGER DEFAULT 0,
    is_disqualified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active', -- active, inactive, disqualified
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team members junction table
CREATE TABLE team_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) DEFAULT 'member', -- leader, member
    is_leader BOOLEAN DEFAULT FALSE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Contest rounds table
CREATE TABLE contest_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    duration INTEGER DEFAULT 30, -- minutes
    max_teams INTEGER DEFAULT 50,
    is_active BOOLEAN DEFAULT FALSE,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- QUIZ SYSTEM TABLES
-- ===========================================

-- Quiz questions table (based on our MCQ system)
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'mcq', -- mcq, multiple-select, true-false
    difficulty VARCHAR(50) DEFAULT 'medium', -- easy, medium, hard
    category VARCHAR(255) DEFAULT 'General',
    time_limit INTEGER DEFAULT 45, -- seconds
    explanation TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz options table
CREATE TABLE quiz_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    points INTEGER DEFAULT 0, -- can be negative
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INTEGER DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team quiz responses
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_ids UUID[] NOT NULL, -- array for multiple selections
    points_earned INTEGER DEFAULT 0,
    is_correct BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, question_id)
);

-- ===========================================
-- VOTING SYSTEM TABLES
-- ===========================================

-- Voting items (team presentations)
CREATE TABLE voting_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    presentation_url VARCHAR(500),
    vote_count INTEGER DEFAULT 0,
    downvote_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team votes
CREATE TABLE team_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    voter_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    voting_item_id UUID REFERENCES voting_items(id) ON DELETE CASCADE,
    vote_type VARCHAR(20) DEFAULT 'upvote', -- upvote, downvote
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(voter_team_id, voting_item_id)
);

-- ===========================================
-- ADMIN SYSTEM TABLES
-- ===========================================

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin
    permissions JSONB DEFAULT '{"teams": true, "config": true, "monitor": true}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin sessions for security
CREATE TABLE admin_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE CASCADE,
    session_token VARCHAR(500) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contest configuration table
CREATE TABLE contest_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_name VARCHAR(255) NOT NULL DEFAULT 'Techpreneur 3.0 Summit',
    contest_description TEXT DEFAULT 'Innovation Challenge for emerging entrepreneurs',
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    registration_deadline TIMESTAMP WITH TIME ZONE,
    max_teams INTEGER DEFAULT 50,
    team_size INTEGER DEFAULT 5,
    registration_open BOOLEAN DEFAULT TRUE,
    contest_active BOOLEAN DEFAULT FALSE,
    current_round INTEGER DEFAULT 1,
    
    -- Quiz configuration
    quiz_duration INTEGER DEFAULT 30, -- minutes
    questions_per_quiz INTEGER DEFAULT 15,
    quiz_time_per_question INTEGER DEFAULT 45, -- seconds
    quiz_passing_score INTEGER DEFAULT 60, -- percentage
    
    -- Voting configuration
    voting_enabled BOOLEAN DEFAULT TRUE,
    voting_duration INTEGER DEFAULT 120, -- minutes
    max_downvotes INTEGER DEFAULT 3,
    pitch_duration INTEGER DEFAULT 90, -- seconds
    voting_window INTEGER DEFAULT 30, -- seconds
    
    -- Scoring weights
    quiz_weight INTEGER DEFAULT 40, -- percentage
    voting_weight INTEGER DEFAULT 30, -- percentage
    offline_weight INTEGER DEFAULT 30, -- percentage
    
    -- System settings
    auto_advance_rounds BOOLEAN DEFAULT FALSE,
    enable_real_time_updates BOOLEAN DEFAULT TRUE,
    allow_late_submissions BOOLEAN DEFAULT TRUE,
    max_late_submission_time INTEGER DEFAULT 10, -- minutes
    
    config_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin activity logs
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100), -- team, user, config, question
    target_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team penalties
CREATE TABLE team_penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    penalty_points INTEGER NOT NULL,
    reason TEXT NOT NULL,
    applied_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Core indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_username ON users(username);
CREATE INDEX idx_teams_team_name ON teams(team_name);
CREATE INDEX idx_teams_team_code ON teams(team_code);
CREATE INDEX idx_teams_total_score ON teams(total_score DESC);
CREATE INDEX idx_teams_status ON teams(status);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);

-- Quiz indexes
CREATE INDEX idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX idx_quiz_questions_difficulty ON quiz_questions(difficulty);
CREATE INDEX idx_quiz_questions_is_active ON quiz_questions(is_active);
CREATE INDEX idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX idx_quiz_responses_team_id ON quiz_responses(team_id);
CREATE INDEX idx_quiz_responses_question_id ON quiz_responses(question_id);

-- Voting indexes
CREATE INDEX idx_voting_items_team_id ON voting_items(team_id);
CREATE INDEX idx_team_votes_voter_team_id ON team_votes(voter_team_id);
CREATE INDEX idx_team_votes_voting_item_id ON team_votes(voting_item_id);

-- Admin indexes
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_timestamp ON admin_logs(timestamp);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_team_penalties_team_id ON team_penalties(team_id);

-- ===========================================
-- TRIGGERS AND FUNCTIONS
-- ===========================================

-- Updated timestamp trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contest_config_updated_at BEFORE UPDATE ON contest_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contest_rounds_updated_at BEFORE UPDATE ON contest_rounds
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to log admin actions
CREATE OR REPLACE FUNCTION log_admin_action(
    p_admin_user_id UUID,
    p_action VARCHAR(255),
    p_target_type VARCHAR(100) DEFAULT NULL,
    p_target_id UUID DEFAULT NULL,
    p_details JSONB DEFAULT '{}',
    p_ip_address INET DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO admin_logs (admin_user_id, action, target_type, target_id, details, ip_address)
    VALUES (p_admin_user_id, p_action, p_target_type, p_target_id, p_details, p_ip_address);
END;
$$ LANGUAGE plpgsql;

-- Function to clean expired admin sessions
CREATE OR REPLACE FUNCTION cleanup_expired_admin_sessions()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM admin_sessions WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Function to calculate team total score
CREATE OR REPLACE FUNCTION calculate_team_total_score(p_team_id UUID)
RETURNS INTEGER AS $$
DECLARE
    quiz_weight INTEGER;
    voting_weight INTEGER;
    offline_weight INTEGER;
    total_score INTEGER;
BEGIN
    -- Get scoring weights from config
    SELECT 
        COALESCE(cc.quiz_weight, 40),
        COALESCE(cc.voting_weight, 30), 
        COALESCE(cc.offline_weight, 30)
    INTO quiz_weight, voting_weight, offline_weight
    FROM contest_config cc
    ORDER BY cc.created_at DESC
    LIMIT 1;
    
    -- Calculate weighted total score
    SELECT 
        ROUND((COALESCE(t.quiz_score, 0) * quiz_weight + 
               COALESCE(t.voting_score, 0) * voting_weight + 
               COALESCE(t.offline_score, 0) * offline_weight) / 100.0)
    INTO total_score
    FROM teams t
    WHERE t.id = p_team_id;
    
    -- Update team total score
    UPDATE teams 
    SET total_score = COALESCE(total_score, 0),
        updated_at = NOW()
    WHERE id = p_team_id;
    
    RETURN COALESCE(total_score, 0);
END;
$$ LANGUAGE plpgsql;

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- Insert initial contest rounds
INSERT INTO contest_rounds (round_number, title, description, duration, max_teams, is_active) VALUES
(1, 'Quiz Round', 'MCQ-based quiz testing entrepreneurship knowledge', 30, 50, false),
(2, 'Voting Round', 'Team presentations with peer voting', 120, 20, false),
(3, 'Final Round', 'Final presentations and evaluation', 180, 10, false);

-- Insert default admin user (CHANGE PASSWORD IN PRODUCTION!)
-- Password: admin123
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
  registration_open,
  contest_active
) VALUES (
  'Techpreneur 3.0 Summit', 
  'Innovation Challenge for emerging entrepreneurs',
  NOW() + INTERVAL '1 day', 
  NOW() + INTERVAL '4 days',
  NOW() + INTERVAL '12 hours',
  50,
  5,
  true,
  false
) ON CONFLICT DO NOTHING;

-- Insert sample quiz questions
INSERT INTO quiz_questions (id, question, question_type, difficulty, category, time_limit, explanation, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'What is the primary goal of entrepreneurship?', 'mcq', 'easy', 'Entrepreneurship Basics', 45, 'Entrepreneurship is fundamentally about creating value and solving real-world problems.', true),
('550e8400-e29b-41d4-a716-446655440002', 'Which of the following are key components of a business model canvas?', 'multiple-select', 'medium', 'Business Planning', 60, 'The Business Model Canvas includes 9 key building blocks including Value Propositions, Customer Segments, Revenue Streams, and Key Partnerships.', true),
('550e8400-e29b-41d4-a716-446655440003', 'Lean startup methodology emphasizes building a minimum viable product (MVP) first.', 'true-false', 'easy', 'Startup Methodology', 30, 'The Lean Startup methodology advocates for building an MVP to test hypotheses quickly and cost-effectively.', true);

-- Insert sample quiz options
INSERT INTO quiz_options (question_id, option_text, points, is_correct, option_order) VALUES
-- Question 1 options
('550e8400-e29b-41d4-a716-446655440001', 'To make maximum profit', -2, false, 1),
('550e8400-e29b-41d4-a716-446655440001', 'To create value and solve problems', 10, true, 2),
('550e8400-e29b-41d4-a716-446655440001', 'To become famous', -2, false, 3),
('550e8400-e29b-41d4-a716-446655440001', 'To work independently', 3, false, 4),

-- Question 2 options
('550e8400-e29b-41d4-a716-446655440002', 'Value Propositions', 8, true, 1),
('550e8400-e29b-41d4-a716-446655440002', 'Customer Segments', 8, true, 2),
('550e8400-e29b-41d4-a716-446655440002', 'Personal Hobbies', -5, false, 3),
('550e8400-e29b-41d4-a716-446655440002', 'Revenue Streams', 8, true, 4),
('550e8400-e29b-41d4-a716-446655440002', 'Key Partnerships', 8, true, 5),

-- Question 3 options
('550e8400-e29b-41d4-a716-446655440003', 'True', 10, true, 1),
('550e8400-e29b-41d4-a716-446655440003', 'False', -3, false, 2);

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Verify setup
SELECT 'Optimized database setup completed successfully!' as status;

-- Show table counts
SELECT 
  'teams' as table_name, COUNT(*) as count FROM teams
UNION ALL
SELECT 
  'users' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 
  'contest_rounds' as table_name, COUNT(*) as count FROM contest_rounds
UNION ALL
SELECT 
  'admin_users' as table_name, COUNT(*) as count FROM admin_users
UNION ALL
SELECT 
  'contest_config' as table_name, COUNT(*) as count FROM contest_config
UNION ALL
SELECT 
  'quiz_questions' as table_name, COUNT(*) as count FROM quiz_questions
UNION ALL
SELECT 
  'quiz_options' as table_name, COUNT(*) as count FROM quiz_options
ORDER BY table_name;

-- Show admin users
SELECT 
  username,
  email,
  role,
  is_active,
  created_at
FROM admin_users
WHERE is_active = true
ORDER BY created_at;

-- Show contest configuration
SELECT 
  contest_name,
  contest_description,
  start_date,
  end_date,
  max_teams,
  team_size,
  registration_open,
  contest_active
FROM contest_config
ORDER BY created_at DESC
LIMIT 1;

-- Show quiz questions count by category
SELECT 
  category,
  difficulty,
  COUNT(*) as question_count
FROM quiz_questions
WHERE is_active = true
GROUP BY category, difficulty
ORDER BY category, difficulty;

-- IMPORTANT NOTES:
-- 1. Default admin credentials: username 'admin', password 'admin123'
-- 2. CHANGE THE ADMIN PASSWORD immediately after first login!
-- 3. This schema is optimized for the current feature set
-- 4. Remove unused tables and add new ones as needed
-- 5. Quiz questions and options are now properly structured for the MCQ system
