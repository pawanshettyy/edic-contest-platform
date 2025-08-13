-- Voting System Database Schema
-- This script creates all necessary tables for the voting system

-- Voting Sessions Table
CREATE TABLE IF NOT EXISTS voting_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (phase IN ('waiting', 'pitching', 'voting', 'break', 'completed')),
    current_presenting_team UUID REFERENCES teams(id),
    time_remaining INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Team Presentations Table
CREATE TABLE IF NOT EXISTS team_presentations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
    presentation_order INTEGER NOT NULL,
    has_presented BOOLEAN NOT NULL DEFAULT false,
    presentation_start_time TIMESTAMP WITH TIME ZONE,
    presentation_end_time TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(team_id, session_id),
    UNIQUE(session_id, presentation_order)
);

-- Votes Table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    to_team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    session_id UUID NOT NULL REFERENCES voting_sessions(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Prevent duplicate votes from same team to same team in same session
    UNIQUE(from_team_id, to_team_id, session_id),
    -- Prevent self-voting
    CHECK (from_team_id != to_team_id)
);

-- Voting Session Logs (for audit trail)
CREATE TABLE IF NOT EXISTS voting_session_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    action VARCHAR(50) NOT NULL,
    details JSONB,
    admin_user_id UUID REFERENCES admin_users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_voting_sessions_active ON voting_sessions(is_active, created_at);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_phase ON voting_sessions(phase);
CREATE INDEX IF NOT EXISTS idx_team_presentations_session ON team_presentations(session_id, presentation_order);
CREATE INDEX IF NOT EXISTS idx_team_presentations_team ON team_presentations(team_id);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_from_team ON votes(from_team_id);
CREATE INDEX IF NOT EXISTS idx_votes_to_team ON votes(to_team_id);
CREATE INDEX IF NOT EXISTS idx_votes_type ON votes(vote_type);
CREATE INDEX IF NOT EXISTS idx_voting_session_logs_session ON voting_session_logs(session_id);

-- Views for easier querying

-- View: Current Voting Session Status
CREATE OR REPLACE VIEW current_voting_session AS
SELECT 
    vs.*,
    COUNT(DISTINCT tp.team_id) as teams_count,
    COUNT(DISTINCT v.id) as total_votes,
    COUNT(DISTINCT CASE WHEN v.vote_type = 'upvote' THEN v.id END) as total_upvotes,
    COUNT(DISTINCT CASE WHEN v.vote_type = 'downvote' THEN v.id END) as total_downvotes
FROM voting_sessions vs
LEFT JOIN team_presentations tp ON vs.id = tp.session_id
LEFT JOIN votes v ON vs.id = v.session_id
WHERE vs.is_active = true
GROUP BY vs.id, vs.phase, vs.current_presenting_team, vs.time_remaining, 
         vs.is_active, vs.created_at, vs.updated_at;

-- View: Team Voting Summary
CREATE OR REPLACE VIEW team_voting_summary AS
SELECT 
    t.id as team_id,
    t.team_name,
    tp.session_id,
    tp.presentation_order,
    tp.has_presented,
    COALESCE(upvotes.count, 0) as upvotes_received,
    COALESCE(downvotes.count, 0) as downvotes_received,
    COALESCE(upvotes.count, 0) - COALESCE(downvotes.count, 0) as total_score,
    COALESCE(votes_cast.upvotes, 0) as upvotes_cast,
    COALESCE(votes_cast.downvotes, 0) as downvotes_cast,
    COALESCE(votes_cast.total, 0) as total_votes_cast
FROM teams t
LEFT JOIN team_presentations tp ON t.id = tp.team_id
LEFT JOIN (
    SELECT to_team_id, COUNT(*) as count
    FROM votes
    WHERE vote_type = 'upvote'
    GROUP BY to_team_id
) upvotes ON t.id = upvotes.to_team_id
LEFT JOIN (
    SELECT to_team_id, COUNT(*) as count
    FROM votes
    WHERE vote_type = 'downvote'
    GROUP BY to_team_id
) downvotes ON t.id = downvotes.to_team_id
LEFT JOIN (
    SELECT 
        from_team_id,
        COUNT(CASE WHEN vote_type = 'upvote' THEN 1 END) as upvotes,
        COUNT(CASE WHEN vote_type = 'downvote' THEN 1 END) as downvotes,
        COUNT(*) as total
    FROM votes
    GROUP BY from_team_id
) votes_cast ON t.id = votes_cast.from_team_id
WHERE t.status = 'active';

-- Function: Update voting session timestamp
CREATE OR REPLACE FUNCTION update_voting_session_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-update voting session timestamp
DROP TRIGGER IF EXISTS voting_session_update_timestamp ON voting_sessions;
CREATE TRIGGER voting_session_update_timestamp
    BEFORE UPDATE ON voting_sessions
    FOR EACH ROW
    EXECUTE FUNCTION update_voting_session_timestamp();

-- Function: Log voting session changes
CREATE OR REPLACE FUNCTION log_voting_session_changes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'UPDATE' THEN
        -- Log phase changes
        IF OLD.phase != NEW.phase THEN
            INSERT INTO voting_session_logs (session_id, action, details)
            VALUES (NEW.id, 'phase_change', jsonb_build_object(
                'old_phase', OLD.phase,
                'new_phase', NEW.phase,
                'current_team', NEW.current_presenting_team
            ));
        END IF;
        
        -- Log team changes
        IF OLD.current_presenting_team IS DISTINCT FROM NEW.current_presenting_team THEN
            INSERT INTO voting_session_logs (session_id, action, details)
            VALUES (NEW.id, 'presenting_team_change', jsonb_build_object(
                'old_team', OLD.current_presenting_team,
                'new_team', NEW.current_presenting_team
            ));
        END IF;
        
        RETURN NEW;
    ELSIF TG_OP = 'INSERT' THEN
        INSERT INTO voting_session_logs (session_id, action, details)
        VALUES (NEW.id, 'session_created', jsonb_build_object(
            'initial_phase', NEW.phase
        ));
        RETURN NEW;
    END IF;
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Auto-log voting session changes
DROP TRIGGER IF EXISTS log_voting_session_changes_trigger ON voting_sessions;
CREATE TRIGGER log_voting_session_changes_trigger
    AFTER INSERT OR UPDATE ON voting_sessions
    FOR EACH ROW
    EXECUTE FUNCTION log_voting_session_changes();

-- Function: Validate vote constraints
CREATE OR REPLACE FUNCTION validate_vote_constraints()
RETURNS TRIGGER AS $$
DECLARE
    downvote_count INTEGER;
    max_downvotes INTEGER := 3; -- This could be configurable
BEGIN
    -- Check downvote limit
    IF NEW.vote_type = 'downvote' THEN
        SELECT COUNT(*) INTO downvote_count
        FROM votes
        WHERE from_team_id = NEW.from_team_id
          AND session_id = NEW.session_id
          AND vote_type = 'downvote';
          
        IF downvote_count >= max_downvotes THEN
            RAISE EXCEPTION 'Maximum % downvotes per team exceeded', max_downvotes;
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger: Validate vote constraints
DROP TRIGGER IF EXISTS validate_vote_constraints_trigger ON votes;
CREATE TRIGGER validate_vote_constraints_trigger
    BEFORE INSERT ON votes
    FOR EACH ROW
    EXECUTE FUNCTION validate_vote_constraints();

-- Sample queries for testing

-- Get current session status
/*
SELECT * FROM current_voting_session;
*/

-- Get team rankings
/*
SELECT * FROM team_voting_summary 
WHERE session_id = 'your-session-id-here'
ORDER BY total_score DESC, upvotes_received DESC;
*/

-- Get voting activity for a session
/*
SELECT 
    v.*,
    ft.team_name as from_team,
    tt.team_name as to_team
FROM votes v
JOIN teams ft ON v.from_team_id = ft.id
JOIN teams tt ON v.to_team_id = tt.id
WHERE v.session_id = 'your-session-id-here'
ORDER BY v.created_at DESC;
*/

-- Get session audit log
/*
SELECT * FROM voting_session_logs 
WHERE session_id = 'your-session-id-here'
ORDER BY created_at DESC;
*/
