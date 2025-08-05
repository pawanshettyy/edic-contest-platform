-- Additional database functions for admin APIs

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

-- Function to get team performance metrics
CREATE OR REPLACE FUNCTION get_team_performance()
RETURNS TABLE (
  team_id UUID,
  team_name TEXT,
  total_score INTEGER,
  submission_count BIGINT,
  success_rate NUMERIC,
  average_solve_time INTERVAL
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    t.id as team_id,
    t.team_name::TEXT,
    t.total_score,
    COUNT(ts.id) as submission_count,
    CASE 
      WHEN COUNT(ts.id) > 0 
      THEN ROUND((COUNT(CASE WHEN ts.status = 'accepted' THEN 1 END) * 100.0 / COUNT(ts.id)), 2)
      ELSE 0
    END as success_rate,
    AVG(
      CASE 
        WHEN ts.status = 'accepted' 
        THEN ts.submitted_at - tp.started_at 
      END
    ) as average_solve_time
  FROM teams t
  LEFT JOIN team_submissions ts ON t.id = ts.team_id
  LEFT JOIN team_progress tp ON t.id = tp.team_id AND ts.round_number = tp.round_number
  GROUP BY t.id, t.team_name, t.total_score
  ORDER BY t.total_score DESC;
END;
$$ LANGUAGE plpgsql;

-- Add some indexes for better performance
CREATE INDEX IF NOT EXISTS idx_admin_logs_timestamp ON admin_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_admin_logs_action ON admin_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_logs_admin_user ON admin_logs(admin_user_id);
CREATE INDEX IF NOT EXISTS idx_team_submissions_status ON team_submissions(status);
CREATE INDEX IF NOT EXISTS idx_team_submissions_submitted_at ON team_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_teams_total_score ON teams(total_score);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token ON admin_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires ON admin_sessions(expires_at);
