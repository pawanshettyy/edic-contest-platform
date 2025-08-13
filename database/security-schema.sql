-- Database security enhancements for production
-- Run these commands to improve database security

-- Enable row-level security for teams table
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

-- Create policy for teams access (teams can only access their own data)
CREATE POLICY team_access_policy ON teams
  FOR ALL
  TO authenticated_users
  USING (id = current_setting('app.current_team_id')::uuid);

-- Create role for application database access
CREATE ROLE contest_app_user;

-- Grant minimal necessary permissions
GRANT CONNECT ON DATABASE neondb TO contest_app_user;
GRANT USAGE ON SCHEMA public TO contest_app_user;

-- Table permissions (minimal required)
GRANT SELECT, INSERT, UPDATE ON teams TO contest_app_user;
GRANT SELECT, INSERT, UPDATE ON voting_sessions TO contest_app_user;
GRANT SELECT, INSERT, UPDATE ON team_presentations TO contest_app_user;
GRANT SELECT, INSERT, UPDATE, DELETE ON votes TO contest_app_user;

-- Sequence permissions
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO contest_app_user;

-- Create audit log table for security events
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  event_type VARCHAR(100) NOT NULL,
  user_id VARCHAR(255),
  team_id UUID,
  ip_address INET,
  user_agent TEXT,
  request_path VARCHAR(500),
  details JSONB,
  severity VARCHAR(20) DEFAULT 'INFO', -- INFO, WARN, ERROR, CRITICAL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_severity ON audit_logs(severity);

-- Grant permissions for audit logs
GRANT SELECT, INSERT ON audit_logs TO contest_app_user;

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  p_event_type VARCHAR(100),
  p_user_id VARCHAR(255) DEFAULT NULL,
  p_team_id UUID DEFAULT NULL,
  p_ip_address INET DEFAULT NULL,
  p_user_agent TEXT DEFAULT NULL,
  p_request_path VARCHAR(500) DEFAULT NULL,
  p_details JSONB DEFAULT NULL,
  p_severity VARCHAR(20) DEFAULT 'INFO'
)
RETURNS UUID AS $$
DECLARE
  log_id UUID;
BEGIN
  INSERT INTO audit_logs (
    event_type, user_id, team_id, ip_address, 
    user_agent, request_path, details, severity
  )
  VALUES (
    p_event_type, p_user_id, p_team_id, p_ip_address,
    p_user_agent, p_request_path, p_details, p_severity
  )
  RETURNING id INTO log_id;
  
  RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION log_security_event TO contest_app_user;

-- Create rate limiting table (for production use with Redis alternative)
CREATE TABLE IF NOT EXISTS rate_limits (
  identifier_hash VARCHAR(64) PRIMARY KEY,
  attempt_count INTEGER NOT NULL DEFAULT 0,
  reset_time TIMESTAMP WITH TIME ZONE NOT NULL,
  locked_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Auto-cleanup old rate limit entries
CREATE INDEX IF NOT EXISTS idx_rate_limits_reset_time ON rate_limits(reset_time);

-- Grant permissions for rate limiting
GRANT SELECT, INSERT, UPDATE, DELETE ON rate_limits TO contest_app_user;

-- Create session blacklist table for logout/security
CREATE TABLE IF NOT EXISTS session_blacklist (
  jti VARCHAR(32) PRIMARY KEY, -- JWT ID
  user_id VARCHAR(255) NOT NULL,
  blacklisted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  reason VARCHAR(100) DEFAULT 'logout'
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_session_blacklist_expires ON session_blacklist(expires_at);
CREATE INDEX IF NOT EXISTS idx_session_blacklist_user ON session_blacklist(user_id);

-- Grant permissions for session management
GRANT SELECT, INSERT, DELETE ON session_blacklist TO contest_app_user;

-- Create function to clean expired entries
CREATE OR REPLACE FUNCTION cleanup_expired_entries()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  -- Clean expired rate limits
  DELETE FROM rate_limits 
  WHERE reset_time < NOW() - INTERVAL '1 day';
  
  -- Clean expired session blacklist
  DELETE FROM session_blacklist 
  WHERE expires_at < NOW();
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  
  -- Log cleanup
  PERFORM log_security_event(
    'CLEANUP_EXPIRED_ENTRIES',
    'system',
    NULL,
    NULL,
    NULL,
    '/system/cleanup',
    jsonb_build_object('deleted_count', deleted_count),
    'INFO'
  );
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execution permission
GRANT EXECUTE ON FUNCTION cleanup_expired_entries TO contest_app_user;

-- Create database configuration table for security settings
CREATE TABLE IF NOT EXISTS security_config (
  key VARCHAR(100) PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by VARCHAR(255)
);

-- Insert default security configurations
INSERT INTO security_config (key, value, description) VALUES
('max_login_attempts', '5', 'Maximum failed login attempts before lockout'),
('lockout_duration_minutes', '15', 'Duration of account lockout in minutes'),
('session_timeout_hours', '24', 'Session timeout in hours'),
('password_min_length', '8', 'Minimum password length'),
('jwt_expiry_hours', '24', 'JWT token expiry in hours')
ON CONFLICT (key) DO NOTHING;

-- Grant permissions for security config
GRANT SELECT ON security_config TO contest_app_user;

-- Create triggers for automatic cleanup
CREATE OR REPLACE FUNCTION trigger_cleanup_expired()
RETURNS TRIGGER AS $$
BEGIN
  -- Randomly trigger cleanup (1% chance)
  IF random() < 0.01 THEN
    PERFORM cleanup_expired_entries();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Add cleanup triggers
DROP TRIGGER IF EXISTS cleanup_on_rate_limit ON rate_limits;
CREATE TRIGGER cleanup_on_rate_limit
  AFTER INSERT ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION trigger_cleanup_expired();

-- Add updated_at triggers for tables
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply updated_at triggers
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at
  BEFORE UPDATE ON teams
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_rate_limits_updated_at ON rate_limits;
CREATE TRIGGER update_rate_limits_updated_at
  BEFORE UPDATE ON rate_limits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Security views for monitoring
CREATE OR REPLACE VIEW security_dashboard AS
SELECT 
  (SELECT COUNT(*) FROM teams WHERE status = 'active') as active_teams,
  (SELECT COUNT(*) FROM audit_logs WHERE timestamp > NOW() - INTERVAL '24 hours') as events_24h,
  (SELECT COUNT(*) FROM audit_logs WHERE severity IN ('ERROR', 'CRITICAL') AND timestamp > NOW() - INTERVAL '24 hours') as critical_events_24h,
  (SELECT COUNT(*) FROM rate_limits WHERE locked_until > NOW()) as currently_locked_users,
  (SELECT COUNT(*) FROM session_blacklist WHERE expires_at > NOW()) as blacklisted_sessions;

-- Grant view access
GRANT SELECT ON security_dashboard TO contest_app_user;

-- Create admin security monitoring view
CREATE OR REPLACE VIEW admin_security_summary AS
SELECT 
  event_type,
  COUNT(*) as event_count,
  MAX(timestamp) as last_occurrence,
  COUNT(DISTINCT user_id) as unique_users
FROM audit_logs 
WHERE timestamp > NOW() - INTERVAL '7 days'
GROUP BY event_type
ORDER BY event_count DESC;

-- Grant view access
GRANT SELECT ON admin_security_summary TO contest_app_user;
