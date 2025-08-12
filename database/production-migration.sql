-- Production Database Migration
-- This script ensures the production database has the latest schema

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(100) UNIQUE NOT NULL,
    team_code VARCHAR(50) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    member_count INTEGER DEFAULT 0,
    quiz_score INTEGER DEFAULT 0,
    voting_score INTEGER DEFAULT 0,
    total_score INTEGER DEFAULT 0,
    presentation_order INTEGER DEFAULT 0,
    status VARCHAR(20) DEFAULT 'active',
    last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz questions table
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz options table (categories moved here from questions)
CREATE TABLE IF NOT EXISTS quiz_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('Capital', 'Marketing', 'Strategy', 'Team Building')),
    points INTEGER DEFAULT 1,
    is_correct BOOLEAN DEFAULT false,
    option_order INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz responses table
CREATE TABLE IF NOT EXISTS quiz_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_ids UUID[] NOT NULL,
    points_earned INTEGER DEFAULT 0,
    is_correct BOOLEAN DEFAULT false,
    member_name VARCHAR(100) NOT NULL,
    response_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voting sessions table (complete schema)
CREATE TABLE IF NOT EXISTS voting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id VARCHAR(50) NOT NULL DEFAULT 'round2',
    current_presenting_team UUID REFERENCES teams(id) ON DELETE SET NULL,
    phase VARCHAR(20) DEFAULT 'waiting' CHECK (phase IN ('waiting', 'pitching', 'voting', 'break', 'completed')),
    phase_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phase_end_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    pitch_duration INTEGER DEFAULT 90,
    voting_duration INTEGER DEFAULT 30,
    total_time_limit INTEGER DEFAULT 120,
    voting_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Voting teams table
CREATE TABLE IF NOT EXISTS voting_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    presentation_order INTEGER DEFAULT 1,
    has_presented BOOLEAN DEFAULT false,
    downvotes_used INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, team_id)
);

-- Team votes table
CREATE TABLE IF NOT EXISTS team_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    from_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    to_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, from_team_id, to_team_id)
);

-- Admin users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contest configuration table
CREATE TABLE IF NOT EXISTS contest_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_active BOOLEAN DEFAULT false,
    current_phase VARCHAR(20) DEFAULT 'setup' CHECK (current_phase IN ('setup', 'quiz', 'voting', 'results')),
    quiz_duration INTEGER DEFAULT 15,
    voting_duration INTEGER DEFAULT 10,
    max_team_size INTEGER DEFAULT 4,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- System logs table
CREATE TABLE IF NOT EXISTS system_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    level VARCHAR(20) NOT NULL,
    message TEXT NOT NULL,
    data JSONB,
    source VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_teams_team_name ON teams(team_name);
CREATE INDEX IF NOT EXISTS idx_teams_team_code ON teams(team_code);
CREATE INDEX IF NOT EXISTS idx_teams_presentation_order ON teams(presentation_order);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_team_id ON quiz_responses(team_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_question_id ON quiz_responses(question_id);
CREATE INDEX IF NOT EXISTS idx_quiz_options_question_id ON quiz_options(question_id);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_active ON voting_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_phase ON voting_sessions(phase);
CREATE INDEX IF NOT EXISTS idx_voting_teams_session_id ON voting_teams(session_id);
CREATE INDEX IF NOT EXISTS idx_voting_teams_team_id ON voting_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_team_votes_session_id ON team_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_team_votes_from_team ON team_votes(from_team_id);
CREATE INDEX IF NOT EXISTS idx_team_votes_to_team ON team_votes(to_team_id);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_system_logs_created_at ON system_logs(created_at);

-- Insert default contest config if not exists
INSERT INTO contest_config (contest_active, current_phase, quiz_duration, voting_duration, max_team_size)
SELECT false, 'setup', 15, 10, 4
WHERE NOT EXISTS (SELECT 1 FROM contest_config);

-- Create default admin user if not exists (password: admin123)
INSERT INTO admin_users (email, password_hash, role)
SELECT 'admin@edic.com', '$2b$10$8K1p/a0dUWr6DT3Zh7W8qO2J6J1.5Z4YJ9Zh7W8qO2J6J1.5Z4YJ2', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@edic.com');

COMMIT;
