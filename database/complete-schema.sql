-- Techpreneur 3.0 Summit Platform - Complete Database Schema
-- Run this script to set up your PostgreSQL database for the platform
-- This consolidates all required tables, functions, and initial data

-- Create extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ===========================================
-- MAIN PLATFORM TABLES
-- ===========================================

-- Teams table (create first to resolve circular reference)
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(255) UNIQUE NOT NULL,
    team_code VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    current_round INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    is_disqualified BOOLEAN DEFAULT FALSE,
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
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, user_id)
);

-- Contest rounds table
CREATE TABLE contest_rounds (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER NOT NULL UNIQUE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    start_time TIMESTAMP WITH TIME ZONE,
    end_time TIMESTAMP WITH TIME ZONE,
    time_limit_minutes INTEGER,
    is_active BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team progress tracking
CREATE TABLE team_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    round_number INTEGER REFERENCES contest_rounds(round_number) ON DELETE CASCADE,
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    score INTEGER DEFAULT 0,
    is_completed BOOLEAN DEFAULT FALSE,
    is_qualified BOOLEAN DEFAULT FALSE,
    submission_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, round_number)
);

-- Quiz questions table
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER REFERENCES contest_rounds(round_number) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(50) DEFAULT 'multiple_choice', -- multiple_choice, true_false, short_answer
    options JSONB, -- For multiple choice questions
    correct_answer TEXT NOT NULL,
    points INTEGER DEFAULT 1,
    order_number INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team quiz responses
CREATE TABLE quiz_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    response TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT FALSE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, question_id)
);

-- Team submissions (general submissions for any round)
CREATE TABLE team_submissions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    round_number INTEGER REFERENCES contest_rounds(round_number) ON DELETE CASCADE,
    submission_type VARCHAR(100) NOT NULL, -- quiz, project, vote, etc.
    submission_data JSONB NOT NULL,
    score INTEGER DEFAULT 0,
    status VARCHAR(50) DEFAULT 'pending', -- pending, accepted, rejected, under_review
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    feedback TEXT
);

-- Voting items (for voting rounds)
CREATE TABLE voting_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_number INTEGER REFERENCES contest_rounds(round_number) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_url VARCHAR(500),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team votes
CREATE TABLE team_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    voting_item_id UUID REFERENCES voting_items(id) ON DELETE CASCADE,
    vote_value INTEGER NOT NULL, -- 1-5 rating or ranking
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, voting_item_id)
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
    role VARCHAR(50) DEFAULT 'admin', -- admin, super_admin, moderator
    permissions JSONB DEFAULT '{}',
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Contest configuration table
CREATE TABLE contest_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_name VARCHAR(255) NOT NULL DEFAULT 'Techpreneur 3.0 Summit',
    contest_description TEXT,
    start_date TIMESTAMP WITH TIME ZONE,
    end_date TIMESTAMP WITH TIME ZONE,
    max_teams INTEGER DEFAULT 1000,
    team_size INTEGER DEFAULT 4,
    registration_open BOOLEAN DEFAULT TRUE,
    contest_active BOOLEAN DEFAULT FALSE,
    current_round INTEGER DEFAULT 1,
    config_data JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin activity logs
CREATE TABLE admin_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_user_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(255) NOT NULL,
    target_type VARCHAR(100), -- team, user, round, config
    target_id UUID,
    details JSONB,
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

-- Contest announcements
CREATE TABLE announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    type VARCHAR(50) DEFAULT 'info', -- info, warning, success, error
    is_active BOOLEAN DEFAULT TRUE,
    target_audience VARCHAR(50) DEFAULT 'all', -- all, teams, admins
    created_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ===========================================
-- INDEXES FOR PERFORMANCE
-- ===========================================

-- Main platform indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_teams_team_name ON teams(team_name);
CREATE INDEX idx_teams_team_code ON teams(team_code);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_team_members_user_id ON team_members(user_id);
CREATE INDEX idx_team_progress_team_id ON team_progress(team_id);
CREATE INDEX idx_team_progress_round_number ON team_progress(round_number);
CREATE INDEX idx_quiz_responses_team_id ON quiz_responses(team_id);
CREATE INDEX idx_team_votes_team_id ON team_votes(team_id);
CREATE INDEX idx_team_submissions_team_id ON team_submissions(team_id);
CREATE INDEX idx_team_submissions_status ON team_submissions(status);
CREATE INDEX idx_team_submissions_submitted_at ON team_submissions(submitted_at);
CREATE INDEX idx_teams_total_score ON teams(total_score);

-- Admin system indexes
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_timestamp ON admin_logs(timestamp);
CREATE INDEX idx_admin_logs_action ON admin_logs(action);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
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

-- Function to get submission statistics
CREATE OR REPLACE FUNCTION get_submission_stats()
RETURNS TABLE (
  status TEXT,
  count BIGINT,
  percentage NUMERIC
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.status::TEXT,
    COUNT(*) as count,
    ROUND((COUNT(*) * 100.0 / SUM(COUNT(*)) OVER()), 2) as percentage
  FROM team_submissions s
  WHERE s.submitted_at >= NOW() - INTERVAL '24 hours'
  GROUP BY s.status
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

-- Function to get admin activity statistics
CREATE OR REPLACE FUNCTION get_admin_activity_stats()
RETURNS TABLE (
  action_type TEXT,
  count BIGINT,
  last_performed TIMESTAMPTZ
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    al.action::TEXT,
    COUNT(*) as count,
    MAX(al.timestamp) as last_performed
  FROM admin_logs al
  WHERE al.timestamp >= NOW() - INTERVAL '7 days'
  GROUP BY al.action
  ORDER BY count DESC;
END;
$$ LANGUAGE plpgsql;

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

-- ===========================================
-- INITIAL DATA
-- ===========================================

-- Insert initial contest rounds for Techpreneur 3.0 Summit
INSERT INTO contest_rounds (round_number, title, description, is_active) VALUES
(1, 'Innovation Quiz Round', 'Test your entrepreneurship knowledge and innovation skills', true),
(2, 'Pitch & Voting Round', 'Present your ideas and vote on innovative solutions', false),
(3, 'Final Results Round', 'Final evaluation and announcement of winners', false);

-- Insert default admin user (CHANGE PASSWORD IN PRODUCTION!)
INSERT INTO admin_users (username, email, password_hash, role, permissions) VALUES
('admin', 'admin@techpreneur3.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkC6q3MqPpsDx5i', 'super_admin', '{"all": true, "teams": true, "config": true, "users": true, "logs": true}')
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
  max_teams,
  team_size,
  registration_open,
  contest_active
) VALUES (
  'Techpreneur 3.0 Summit', 
  'A 3-day innovation summit featuring entrepreneurship challenges and team competitions across 3 exciting rounds.',
  NOW() + INTERVAL '1 day', 
  NOW() + INTERVAL '4 days',
  500,
  4,
  true,
  false
) ON CONFLICT (id) DO NOTHING;

-- ===========================================
-- VERIFICATION QUERIES
-- ===========================================

-- Verify setup
SELECT 'Database setup completed successfully!' as status;

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

-- IMPORTANT NOTES:
-- 1. Default admin credentials: username 'admin', password 'admin123'
-- 2. CHANGE THE ADMIN PASSWORD immediately after first login!
-- 3. The contest is set to start tomorrow and run for 3 days
-- 4. Registration is open for up to 500 teams of 4 members each
-- 5. Update contest dates and configuration as needed
