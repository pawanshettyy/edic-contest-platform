-- Add team participation tracking for voting sessions
-- This will help track which teams have participated and lock voting appropriately

BEGIN;

-- Add team participation tracking
CREATE TABLE IF NOT EXISTS team_voting_participation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    has_participated BOOLEAN DEFAULT false,
    participation_completed_at TIMESTAMP,
    votes_cast INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, team_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_team_voting_participation_session ON team_voting_participation(session_id);
CREATE INDEX IF NOT EXISTS idx_team_voting_participation_team ON team_voting_participation(team_id);
CREATE INDEX IF NOT EXISTS idx_team_voting_participation_completed ON team_voting_participation(has_participated);

-- Add trigger to automatically update participation when votes are cast
CREATE OR REPLACE FUNCTION update_team_voting_participation()
RETURNS TRIGGER AS $$
BEGIN
    -- Update or insert participation record
    INSERT INTO team_voting_participation (session_id, team_id, has_participated, votes_cast, participation_completed_at)
    VALUES (NEW.session_id, NEW.from_team_id, true, 1, CURRENT_TIMESTAMP)
    ON CONFLICT (session_id, team_id) 
    DO UPDATE SET 
        votes_cast = team_voting_participation.votes_cast + 1,
        has_participated = true,
        participation_completed_at = CURRENT_TIMESTAMP,
        updated_at = CURRENT_TIMESTAMP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for vote insertion
DROP TRIGGER IF EXISTS trigger_update_team_voting_participation ON votes;
CREATE TRIGGER trigger_update_team_voting_participation
    AFTER INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION update_team_voting_participation();

-- Add session completion tracking to voting_sessions
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP;
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS total_teams_participated INTEGER DEFAULT 0;
ALTER TABLE voting_sessions ADD COLUMN IF NOT EXISTS total_votes_cast INTEGER DEFAULT 0;

COMMIT;
