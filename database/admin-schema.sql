-- Admin System Database Schema
-- Run this after the main schema.sql

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
    contest_name VARCHAR(255) NOT NULL DEFAULT 'EDIC Contest 2025',
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
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
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

-- Team disqualifications and penalties
CREATE TABLE team_penalties (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    penalty_type VARCHAR(100) NOT NULL, -- warning, time_penalty, disqualification
    reason TEXT NOT NULL,
    penalty_value INTEGER DEFAULT 0, -- time penalty in minutes, etc.
    is_active BOOLEAN DEFAULT TRUE,
    applied_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    applied_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- System statistics and metrics
CREATE TABLE system_metrics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    metric_type VARCHAR(100) NOT NULL,
    metric_value NUMERIC NOT NULL,
    metadata JSONB DEFAULT '{}',
    recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for admin system
CREATE INDEX idx_admin_users_username ON admin_users(username);
CREATE INDEX idx_admin_users_email ON admin_users(email);
CREATE INDEX idx_admin_sessions_admin_user_id ON admin_sessions(admin_user_id);
CREATE INDEX idx_admin_sessions_expires_at ON admin_sessions(expires_at);
CREATE INDEX idx_admin_logs_admin_user_id ON admin_logs(admin_user_id);
CREATE INDEX idx_admin_logs_created_at ON admin_logs(created_at);
CREATE INDEX idx_announcements_is_active ON announcements(is_active);
CREATE INDEX idx_team_penalties_team_id ON team_penalties(team_id);
CREATE INDEX idx_system_metrics_type_time ON system_metrics(metric_type, recorded_at);

-- Triggers for admin system
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_contest_config_updated_at BEFORE UPDATE ON contest_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default admin user (change password after first login)
INSERT INTO admin_users (username, email, password_hash, role) VALUES
('admin', 'admin@axiostechnology.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LeZDzI/3Ea4JhkG5e', 'super_admin'); -- password: admin123

-- Insert default contest configuration
INSERT INTO contest_config (contest_name, start_date, end_date) VALUES
('EDIC Contest 2025', NOW() + INTERVAL '1 day', NOW() + INTERVAL '3 days');

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
