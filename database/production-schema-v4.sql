-- COMPLETE PRODUCTION SCHEMA v4.0
-- Enhanced voting system with break phases, quiz questions, and full security
-- Safe to run multiple times (includes IF NOT EXISTS checks)

BEGIN;

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ================================
-- CORE TABLES
-- ================================

-- Teams table (enhanced)
CREATE TABLE IF NOT EXISTS teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(100) UNIQUE NOT NULL,
    leader_name VARCHAR(100) NOT NULL,
    leader_email VARCHAR(100) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    members JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disqualified')),
    presentation_order INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Users table for session management
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100),
    is_leader BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    session_token VARCHAR(255),
    session_expires TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- QUIZ SYSTEM
-- ================================

-- Quiz questions with enhanced structure
CREATE TABLE IF NOT EXISTS quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'multiple_choice' CHECK (question_type IN ('multiple_choice', 'true_false', 'short_answer')),
    options JSONB DEFAULT '[]',
    correct_answer TEXT NOT NULL,
    explanation TEXT,
    difficulty_level INTEGER DEFAULT 1 CHECK (difficulty_level BETWEEN 1 AND 5),
    category VARCHAR(50) DEFAULT 'general',
    points INTEGER DEFAULT 1,
    time_limit INTEGER DEFAULT 30,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz sessions
CREATE TABLE IF NOT EXISTS quiz_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_name VARCHAR(50) DEFAULT 'preliminary',
    is_active BOOLEAN DEFAULT false,
    time_limit INTEGER DEFAULT 900, -- 15 minutes
    max_questions INTEGER DEFAULT 20,
    started_at TIMESTAMP,
    ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Quiz responses
CREATE TABLE IF NOT EXISTS quiz_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES quiz_sessions(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    selected_answer TEXT NOT NULL,
    is_correct BOOLEAN DEFAULT false,
    points_earned INTEGER DEFAULT 0,
    time_taken INTEGER DEFAULT 0,
    answered_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, team_id, question_id)
);

-- ================================
-- VOTING SYSTEM (Enhanced)
-- ================================

-- Voting sessions with break phase support
CREATE TABLE IF NOT EXISTS voting_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    round_id VARCHAR(50) NOT NULL DEFAULT 'round2',
    current_presenting_team UUID REFERENCES teams(id) ON DELETE SET NULL,
    phase VARCHAR(20) DEFAULT 'waiting' CHECK (phase IN ('waiting', 'pitching', 'voting', 'break', 'completed')),
    time_remaining INTEGER DEFAULT 0,
    phase_start_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    phase_duration INTEGER DEFAULT 90, -- Current phase duration
    pitch_duration INTEGER DEFAULT 90, -- 1.5 minutes for pitching
    voting_duration INTEGER DEFAULT 120, -- 2 minutes for voting  
    break_duration INTEGER DEFAULT 120, -- 2 minutes break between teams
    voting_enabled BOOLEAN DEFAULT true,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Team presentations tracking
CREATE TABLE IF NOT EXISTS team_presentations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    presentation_order INTEGER NOT NULL,
    has_presented BOOLEAN DEFAULT false,
    pitch_started_at TIMESTAMP,
    pitch_ended_at TIMESTAMP,
    voting_started_at TIMESTAMP,
    voting_ended_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, team_id),
    UNIQUE(session_id, presentation_order)
);

-- Votes table
CREATE TABLE IF NOT EXISTS votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES voting_sessions(id) ON DELETE CASCADE,
    from_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    to_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    vote_type VARCHAR(10) NOT NULL CHECK (vote_type IN ('upvote', 'downvote')),
    points INTEGER DEFAULT 1,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(session_id, from_team_id, to_team_id)
);

-- ================================
-- ADMIN SYSTEM
-- ================================

-- Admin users
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(50) UNIQUE NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(20) DEFAULT 'admin' CHECK (role IN ('admin', 'moderator')),
    is_active BOOLEAN DEFAULT true,
    last_login TIMESTAMP,
    session_token VARCHAR(255),
    session_expires TIMESTAMP,
    failed_login_attempts INTEGER DEFAULT 0,
    locked_until TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Contest configuration
CREATE TABLE IF NOT EXISTS contest_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    contest_active BOOLEAN DEFAULT false,
    current_phase VARCHAR(20) DEFAULT 'setup' CHECK (current_phase IN ('setup', 'quiz', 'voting', 'results', 'completed')),
    quiz_duration INTEGER DEFAULT 900, -- 15 minutes
    voting_duration INTEGER DEFAULT 600, -- 10 minutes
    max_team_size INTEGER DEFAULT 4,
    max_downvotes INTEGER DEFAULT 3,
    allow_self_voting BOOLEAN DEFAULT false,
    registration_open BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- SECURITY & AUDIT TABLES
-- ================================

-- Rate limiting
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    identifier VARCHAR(255) NOT NULL, -- IP or user ID
    action VARCHAR(100) NOT NULL,
    count INTEGER DEFAULT 1,
    window_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP DEFAULT (CURRENT_TIMESTAMP + INTERVAL '1 hour'),
    UNIQUE(identifier, action)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID,
    admin_id UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    action VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id UUID,
    details JSONB DEFAULT '{}',
    ip_address INET,
    user_agent TEXT,
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Security events
CREATE TABLE IF NOT EXISTS security_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(50) NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'critical')),
    source_ip INET,
    user_agent TEXT,
    details JSONB DEFAULT '{}',
    resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP,
    resolved_by UUID REFERENCES admin_users(id) ON DELETE SET NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ================================
-- INDEXES FOR PERFORMANCE
-- ================================

-- Core indexes
CREATE INDEX IF NOT EXISTS idx_teams_status ON teams(status);
CREATE INDEX IF NOT EXISTS idx_teams_presentation_order ON teams(presentation_order);
CREATE INDEX IF NOT EXISTS idx_users_team_id ON users(team_id);
CREATE INDEX IF NOT EXISTS idx_users_session_token ON users(session_token);
CREATE INDEX IF NOT EXISTS idx_users_session_expires ON users(session_expires);

-- Quiz indexes
CREATE INDEX IF NOT EXISTS idx_quiz_questions_active ON quiz_questions(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_category ON quiz_questions(category);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_difficulty ON quiz_questions(difficulty_level);
CREATE INDEX IF NOT EXISTS idx_quiz_sessions_active ON quiz_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_session_team ON quiz_responses(session_id, team_id);
CREATE INDEX IF NOT EXISTS idx_quiz_responses_question ON quiz_responses(question_id);

-- Voting indexes
CREATE INDEX IF NOT EXISTS idx_voting_sessions_active ON voting_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_phase ON voting_sessions(phase);
CREATE INDEX IF NOT EXISTS idx_voting_sessions_current_team ON voting_sessions(current_presenting_team);
CREATE INDEX IF NOT EXISTS idx_team_presentations_session ON team_presentations(session_id);
CREATE INDEX IF NOT EXISTS idx_team_presentations_order ON team_presentations(session_id, presentation_order);
CREATE INDEX IF NOT EXISTS idx_votes_session ON votes(session_id);
CREATE INDEX IF NOT EXISTS idx_votes_from_team ON votes(from_team_id);
CREATE INDEX IF NOT EXISTS idx_votes_to_team ON votes(to_team_id);

-- Admin indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);
CREATE INDEX IF NOT EXISTS idx_admin_users_session ON admin_users(session_token);
CREATE INDEX IF NOT EXISTS idx_admin_users_active ON admin_users(is_active);

-- Security indexes
CREATE INDEX IF NOT EXISTS idx_rate_limits_identifier ON rate_limits(identifier, action);
CREATE INDEX IF NOT EXISTS idx_rate_limits_expires ON rate_limits(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_security_events_created ON security_events(created_at);
CREATE INDEX IF NOT EXISTS idx_security_events_type ON security_events(event_type);
CREATE INDEX IF NOT EXISTS idx_security_events_severity ON security_events(severity);

-- ================================
-- TRIGGERS FOR AUTOMATIC UPDATES
-- ================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to relevant tables
DROP TRIGGER IF EXISTS update_teams_updated_at ON teams;
CREATE TRIGGER update_teams_updated_at BEFORE UPDATE ON teams FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_questions_updated_at ON quiz_questions;
CREATE TRIGGER update_quiz_questions_updated_at BEFORE UPDATE ON quiz_questions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_quiz_sessions_updated_at ON quiz_sessions;
CREATE TRIGGER update_quiz_sessions_updated_at BEFORE UPDATE ON quiz_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_voting_sessions_updated_at ON voting_sessions;
CREATE TRIGGER update_voting_sessions_updated_at BEFORE UPDATE ON voting_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_users_updated_at ON admin_users;
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_contest_config_updated_at ON contest_config;
CREATE TRIGGER update_contest_config_updated_at BEFORE UPDATE ON contest_config FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================
-- INITIAL DATA SETUP
-- ================================

-- Create default admin user (if not exists)
INSERT INTO admin_users (username, email, password_hash, role)
SELECT 'admin', 'admin@edic.com', '$2b$12$K8YX.4f5V8nK8tN3L9R7PeE8X4L9M2C5Y7U6T1K3M9N8P2Q5R7S6', 'admin'
WHERE NOT EXISTS (SELECT 1 FROM admin_users WHERE email = 'admin@edic.com');

-- Create default contest config (if not exists)
INSERT INTO contest_config (contest_active, current_phase, quiz_duration, voting_duration, max_team_size, max_downvotes)
SELECT false, 'setup', 900, 600, 4, 3
WHERE NOT EXISTS (SELECT 1 FROM contest_config);

-- ================================
-- SAMPLE QUIZ QUESTIONS
-- ================================

-- Insert sample questions for testing (only if none exist)
INSERT INTO quiz_questions (question_text, question_type, options, correct_answer, explanation, difficulty_level, category, points)
SELECT * FROM (VALUES
    (
        'What does HTML stand for?',
        'multiple_choice',
        '["HyperText Markup Language", "High Tech Modern Language", "Home Tool Markup Language", "Hyperlink and Text Markup Language"]'::jsonb,
        'HyperText Markup Language',
        'HTML stands for HyperText Markup Language, which is the standard markup language for web pages.',
        1,
        'web_development',
        1
    ),
    (
        'Which programming language is known as the "mother of all languages"?',
        'multiple_choice',
        '["C", "Assembly", "FORTRAN", "COBOL"]'::jsonb,
        'C',
        'C is often called the mother of all languages because many modern languages are derived from it.',
        2,
        'programming',
        2
    ),
    (
        'What is the time complexity of binary search?',
        'multiple_choice',
        '["O(n)", "O(log n)", "O(n²)", "O(1)"]'::jsonb,
        'O(log n)',
        'Binary search has O(log n) time complexity because it eliminates half the search space in each step.',
        3,
        'algorithms',
        2
    ),
    (
        'React is a JavaScript library for building user interfaces.',
        'true_false',
        '["True", "False"]'::jsonb,
        'True',
        'React is indeed a JavaScript library developed by Facebook for building user interfaces.',
        1,
        'web_development',
        1
    ),
    (
        'Which database type is PostgreSQL?',
        'multiple_choice',
        '["NoSQL", "Relational", "Graph", "Document"]'::jsonb,
        'Relational',
        'PostgreSQL is a relational database management system that uses SQL.',
        2,
        'database',
        2
    ),
    (
        'What does API stand for?',
        'multiple_choice',
        '["Application Programming Interface", "Automated Program Integration", "Advanced Programming Interface", "Application Process Integration"]'::jsonb,
        'Application Programming Interface',
        'API stands for Application Programming Interface, which allows different software applications to communicate.',
        1,
        'general',
        1
    ),
    (
        'Which HTTP status code indicates "Not Found"?',
        'multiple_choice',
        '["200", "404", "500", "403"]'::jsonb,
        '404',
        'HTTP status code 404 indicates that the requested resource was not found on the server.',
        2,
        'web_development',
        2
    ),
    (
        'Python is a compiled language.',
        'true_false',
        '["True", "False"]'::jsonb,
        'False',
        'Python is an interpreted language, not a compiled language.',
        2,
        'programming',
        1
    ),
    (
        'What does CSS stand for?',
        'multiple_choice',
        '["Cascading Style Sheets", "Computer Style Sheets", "Creative Style Sheets", "Colorful Style Sheets"]'::jsonb,
        'Cascading Style Sheets',
        'CSS stands for Cascading Style Sheets, used for styling web pages.',
        1,
        'web_development',
        1
    ),
    (
        'Which company developed the Java programming language?',
        'multiple_choice',
        '["Microsoft", "Sun Microsystems", "Google", "Apple"]'::jsonb,
        'Sun Microsystems',
        'Java was originally developed by Sun Microsystems, which was later acquired by Oracle.',
        2,
        'programming',
        2
    ),
    (
        'Git is a distributed version control system.',
        'true_false',
        '["True", "False"]'::jsonb,
        'True',
        'Git is indeed a distributed version control system, allowing multiple developers to work on projects simultaneously.',
        1,
        'tools',
        1
    ),
    (
        'What is the default port for HTTPS?',
        'multiple_choice',
        '["80", "443", "8080", "22"]'::jsonb,
        '443',
        'HTTPS (HTTP Secure) uses port 443 by default.',
        2,
        'networking',
        2
    ),
    (
        'Which sorting algorithm has the best average-case time complexity?',
        'multiple_choice',
        '["Bubble Sort", "Quick Sort", "Merge Sort", "Selection Sort"]'::jsonb,
        'Merge Sort',
        'Merge Sort has consistent O(n log n) time complexity in all cases, while Quick Sort can degrade to O(n²) in worst case.',
        3,
        'algorithms',
        3
    ),
    (
        'Docker is used for containerization.',
        'true_false',
        '["True", "False"]'::jsonb,
        'True',
        'Docker is a platform that uses containerization technology to package applications and their dependencies.',
        2,
        'devops',
        1
    ),
    (
        'What does SQL stand for?',
        'multiple_choice',
        '["Structured Query Language", "Standard Query Language", "Simple Query Language", "System Query Language"]'::jsonb,
        'Structured Query Language',
        'SQL stands for Structured Query Language, used for managing relational databases.',
        1,
        'database',
        1
    ),
    (
        'Which data structure follows LIFO principle?',
        'multiple_choice',
        '["Queue", "Stack", "Array", "Linked List"]'::jsonb,
        'Stack',
        'Stack follows LIFO (Last In, First Out) principle, where the last element added is the first one to be removed.',
        2,
        'data_structures',
        2
    ),
    (
        'Machine Learning is a subset of Artificial Intelligence.',
        'true_false',
        '["True", "False"]'::jsonb,
        'True',
        'Machine Learning is indeed a subset of Artificial Intelligence that focuses on algorithms that can learn from data.',
        1,
        'ai_ml',
        1
    ),
    (
        'What is the primary purpose of a firewall?',
        'multiple_choice',
        '["Data Storage", "Network Security", "Data Processing", "User Interface"]'::jsonb,
        'Network Security',
        'A firewall is a network security device that monitors and controls incoming and outgoing network traffic.',
        2,
        'security',
        2
    ),
    (
        'Which protocol is used for secure email transmission?',
        'multiple_choice',
        '["HTTP", "FTP", "SMTP", "HTTPS"]'::jsonb,
        'HTTPS',
        'HTTPS (HTTP Secure) provides secure communication over a computer network, including email transmission in web clients.',
        3,
        'networking',
        2
    ),
    (
        'Agile is a software development methodology.',
        'true_false',
        '["True", "False"]'::jsonb,
        'True',
        'Agile is indeed a software development methodology that promotes iterative development and customer collaboration.',
        1,
        'software_engineering',
        1
    )
) AS quiz_data(question_text, question_type, options, correct_answer, explanation, difficulty_level, category, points)
WHERE NOT EXISTS (SELECT 1 FROM quiz_questions LIMIT 1);

COMMIT;

-- Display setup completion message
DO $$
BEGIN
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'PRODUCTION SCHEMA v4.0 SETUP COMPLETE!';
    RAISE NOTICE '==================================================';
    RAISE NOTICE 'Features installed:';
    RAISE NOTICE '✅ Enhanced voting system with break phases';
    RAISE NOTICE '✅ Comprehensive quiz system with 20 sample questions';
    RAISE NOTICE '✅ Full security and audit logging';
    RAISE NOTICE '✅ Rate limiting and session management';
    RAISE NOTICE '✅ Performance indexes and triggers';
    RAISE NOTICE '';
    RAISE NOTICE 'Default admin credentials:';
    RAISE NOTICE 'Email: admin@edic.com';
    RAISE NOTICE 'Username: admin';
    RAISE NOTICE 'Password: admin123';
    RAISE NOTICE '';
    RAISE NOTICE 'Quiz questions: % added', (SELECT COUNT(*) FROM quiz_questions);
    RAISE NOTICE 'System ready for production use!';
    RAISE NOTICE '==================================================';
END
$$;
