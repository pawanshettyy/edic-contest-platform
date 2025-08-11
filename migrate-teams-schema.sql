-- Migration to add missing columns to teams table for compatibility
-- Run this in production database to fix the authentication routes

-- Add missing columns to teams table
ALTER TABLE teams 
ADD COLUMN IF NOT EXISTS leader_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS leader_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS members JSONB DEFAULT '[]';

-- Update existing teams with leader information from team_members and users
UPDATE teams 
SET 
  leader_name = (
    SELECT u.username 
    FROM team_members tm 
    JOIN users u ON tm.user_id = u.id 
    WHERE tm.team_id = teams.id AND tm.is_leader = true 
    LIMIT 1
  ),
  leader_email = (
    SELECT u.email 
    FROM team_members tm 
    JOIN users u ON tm.user_id = u.id 
    WHERE tm.team_id = teams.id AND tm.is_leader = true 
    LIMIT 1
  ),
  members = (
    SELECT COALESCE(
      json_agg(
        json_build_object(
          'id', u.id,
          'name', u.username,
          'email', u.email,
          'isLeader', tm.is_leader
        ) ORDER BY tm.is_leader DESC, u.username
      ), 
      '[]'::json
    )
    FROM team_members tm 
    JOIN users u ON tm.user_id = u.id 
    WHERE tm.team_id = teams.id
  )
WHERE id IN (
  SELECT DISTINCT team_id FROM team_members
);

-- Create index on new columns
CREATE INDEX IF NOT EXISTS idx_teams_leader_email ON teams(leader_email);
CREATE INDEX IF NOT EXISTS idx_teams_leader_name ON teams(leader_name);

SELECT 'Migration completed successfully!' as status;
