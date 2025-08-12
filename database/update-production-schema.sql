-- PRODUCTION SCHEMA UPDATE SCRIPT
-- Run this script ONCE in production to update the database to the latest schema
-- This script is safe to run multiple times (uses IF NOT EXISTS)

-- Create extensions if they don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Update teams table to add missing columns
ALTER TABLE teams ADD COLUMN IF NOT EXISTS presentation_order INTEGER DEFAULT 0;

-- Drop the old voting_sessions table if it exists with wrong schema and recreate
DROP TABLE IF EXISTS voting_sessions CASCADE;

-- Create voting sessions table (complete schema)
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

-- Create voting teams table
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

-- Create team votes table
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

-- Create missing indexes for voting tables
CREATE INDEX IF NOT EXISTS idx_teams_presentation_order ON teams(presentation_order);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_active ON voting_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_phase ON voting_sessions(phase);
CREATE INDEX IF NOT EXISTS idx_voting_teams_session_id ON voting_teams(session_id);
CREATE INDEX IF NOT EXISTS idx_voting_teams_team_id ON voting_teams(team_id);
CREATE INDEX IF NOT EXISTS idx_team_votes_session_id ON team_votes(session_id);
CREATE INDEX IF NOT EXISTS idx_team_votes_from_team ON team_votes(from_team_id);
CREATE INDEX IF NOT EXISTS idx_team_votes_to_team ON team_votes(to_team_id);

-- Update existing tables with any missing columns
ALTER TABLE quiz_questions ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;
ALTER TABLE quiz_responses ADD COLUMN IF NOT EXISTS is_correct BOOLEAN DEFAULT false;

-- Ensure admin user exists (update if exists, insert if not)
INSERT INTO admin_users (email, password_hash, role)
SELECT 'admin@edic.com', '$2b$10$8K1p/a0dUWr6DT3Zh7W8qO2J6J1.5Z4YJ9Zh7W8qO2J6J1.5Z4YJ2', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@edic.com')
ON CONFLICT (email) DO NOTHING;

-- Update contest config if needed
UPDATE contest_config 
SET quiz_duration = 15, voting_duration = 10, max_team_size = 4 
WHERE id = (SELECT id FROM contest_config LIMIT 1);

-- If no contest config exists, create one
INSERT INTO contest_config (contest_active, current_phase, quiz_duration, voting_duration, max_team_size)
SELECT false, 'setup', 15, 10, 4
WHERE NOT EXISTS (SELECT 1 FROM contest_config);

COMMIT;
