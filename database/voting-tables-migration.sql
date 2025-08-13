-- Voting Tables Migration
-- This script adds the missing voting tables to the production database

-- Add presentation_order column to teams table if it doesn't exist
ALTER TABLE teams ADD COLUMN IF NOT EXISTS presentation_order INTEGER DEFAULT 0;

-- Drop the old voting_sessions table if it exists with wrong schema
DROP TABLE IF EXISTS voting_sessions CASCADE;

-- Create voting sessions table (complete schema)
CREATE TABLE voting_sessions (
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
CREATE TABLE voting_teams (
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
CREATE TABLE team_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    from_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    to_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, from_team_id, to_team_id)
);

-- Create indexes for voting tables
CREATE INDEX idx_teams_presentation_order ON teams(presentation_order);
CREATE INDEX idx_voting_sessions_active ON voting_sessions(is_active);
CREATE INDEX idx_voting_sessions_phase ON voting_sessions(phase);
CREATE INDEX idx_voting_teams_session_id ON voting_teams(session_id);
CREATE INDEX idx_voting_teams_team_id ON voting_teams(team_id);
CREATE INDEX idx_team_votes_session_id ON team_votes(session_id);
CREATE INDEX idx_team_votes_from_team ON team_votes(from_team_id);
CREATE INDEX idx_team_votes_to_team ON team_votes(to_team_id);

COMMIT;
