-- Quick setup for testing - Essential tables only
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Admin users table
CREATE TABLE admin_users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'admin',
    permissions JSONB DEFAULT '{"teams": true, "config": true, "monitor": true}',
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Teams table
CREATE TABLE teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    team_name VARCHAR(255) UNIQUE NOT NULL,
    team_code VARCHAR(100) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    current_round INTEGER DEFAULT 1,
    total_score INTEGER DEFAULT 0,
    quiz_score INTEGER DEFAULT 0,
    voting_score INTEGER DEFAULT 0,
    offline_score INTEGER DEFAULT 0,
    is_disqualified BOOLEAN DEFAULT FALSE,
    status VARCHAR(50) DEFAULT 'active',
    last_activity TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz questions
CREATE TABLE quiz_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    category VARCHAR(255) DEFAULT 'General',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Quiz options
CREATE TABLE quiz_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question_id UUID REFERENCES quiz_questions(id) ON DELETE CASCADE,
    option_text TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    is_correct BOOLEAN DEFAULT FALSE,
    option_order INTEGER DEFAULT 1,
    category VARCHAR(255) DEFAULT 'General',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default admin user (password: admin123)
INSERT INTO admin_users (username, email, password_hash, role, permissions) VALUES
('admin', 'admin@techpreneur3.com', '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewkC6q3MqPpsDx5i', 'super_admin', '{"all": true, "teams": true, "config": true, "users": true, "logs": true, "questions": true}')
ON CONFLICT (username) DO UPDATE SET
  password_hash = EXCLUDED.password_hash,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  permissions = EXCLUDED.permissions,
  is_active = true,
  updated_at = NOW();

SELECT 'Quick setup completed! Admin user created.' as status;

-- Insert sample questions for the four categories
INSERT INTO quiz_questions (question, category, is_active) VALUES
-- Capital questions
('What is the primary purpose of raising capital for a startup?', 'Capital', true),
('Which of the following is considered equity financing?', 'Capital', true),
('What does ROI stand for in financial terms?', 'Capital', true),
('Which funding stage typically comes after seed funding?', 'Capital', true),

-- Marketing questions
('What is the most important metric for measuring marketing success?', 'Marketing', true),
('Which marketing strategy focuses on creating valuable content?', 'Marketing', true),
('What does CAC stand for in marketing?', 'Marketing', true),
('Which social media platform is best for B2B marketing?', 'Marketing', true),

-- Strategy questions
('What is the primary focus of a blue ocean strategy?', 'Strategy', true),
('Which framework is used for competitive analysis?', 'Strategy', true),
('What does SWOT analysis help identify?', 'Strategy', true),
('Which growth strategy involves entering new markets?', 'Strategy', true),

-- Team Building questions
('What is the most important quality in a team leader?', 'Team Building', true),
('Which team development stage involves the most conflict?', 'Team Building', true),
('What is the ideal team size for maximum productivity?', 'Team Building', true),
('Which communication style is most effective for team collaboration?', 'Team Building', true);

-- Insert sample options for all questions
DO $$
DECLARE
    q_record RECORD;
    option_categories TEXT[] := ARRAY['Capital', 'Marketing', 'Strategy', 'Team Building'];
    capital_options TEXT[][] := ARRAY[
        ['To pay salaries', 'To grow the business', 'To buy office space', 'To pay taxes'],
        ['Bank loan', 'Venture capital', 'Credit card', 'Personal savings'],
        ['Return on Investment', 'Rate of Interest', 'Revenue of Income', 'Risk of Investment'],
        ['Series A', 'IPO', 'Merger', 'Acquisition']
    ];
    marketing_options TEXT[][] := ARRAY[
        ['Cost per click', 'Customer acquisition cost', 'Return on investment', 'Brand awareness'],
        ['Content marketing', 'Cold calling', 'Print advertising', 'Radio ads'],
        ['Customer Acquisition Cost', 'Customer Attention Cycle', 'Creative Ad Campaign', 'Customer Analysis Center'],
        ['LinkedIn', 'TikTok', 'Instagram', 'Snapchat']
    ];
    strategy_options TEXT[][] := ARRAY[
        ['Creating uncontested market space', 'Competing on price', 'Following competitors', 'Reducing costs'],
        ['SWOT Analysis', 'Porter Five Forces', 'PEST Analysis', 'All of the above'],
        ['Strengths, weaknesses, opportunities, threats', 'Sales, wages, operations, targets', 'Systems, workflow, objectives, tactics', 'Structure, workforce, organization, technology'],
        ['Market penetration', 'Market development', 'Product development', 'Diversification']
    ];
    team_options TEXT[][] := ARRAY[
        ['Technical skills', 'Communication', 'Experience', 'Education'],
        ['Forming', 'Storming', 'Norming', 'Performing'],
        ['5-7 people', '10-12 people', '15-20 people', '2-3 people'],
        ['Assertive', 'Passive', 'Aggressive', 'Collaborative']
    ];
    correct_answers INTEGER[] := ARRAY[2, 2, 1, 1, 3, 1, 1, 1, 1, 4, 1, 2, 2, 2, 1, 4];
    question_index INTEGER := 1;
    category_index INTEGER;
    option_index INTEGER;
    current_options TEXT[];
BEGIN
    FOR q_record IN 
        SELECT id, category FROM quiz_questions WHERE category IN ('Capital', 'Marketing', 'Strategy', 'Team Building')
        ORDER BY 
            CASE category 
                WHEN 'Capital' THEN 1 
                WHEN 'Marketing' THEN 2 
                WHEN 'Strategy' THEN 3 
                WHEN 'Team Building' THEN 4 
            END, created_at
    LOOP
        -- Determine which set of options to use
        CASE q_record.category
            WHEN 'Capital' THEN 
                category_index := ((question_index - 1) % 4) + 1;
                current_options := capital_options[category_index];
            WHEN 'Marketing' THEN 
                category_index := ((question_index - 5) % 4) + 1;
                current_options := marketing_options[category_index];
            WHEN 'Strategy' THEN 
                category_index := ((question_index - 9) % 4) + 1;
                current_options := strategy_options[category_index];
            WHEN 'Team Building' THEN 
                category_index := ((question_index - 13) % 4) + 1;
                current_options := team_options[category_index];
        END CASE;

        -- Insert 4 options for each question
        FOR option_index IN 1..4 LOOP
            INSERT INTO quiz_options (
                question_id, 
                option_text, 
                points, 
                is_correct, 
                option_order
            ) VALUES (
                q_record.id,
                current_options[option_index],
                CASE WHEN option_index = correct_answers[question_index] THEN 10 ELSE 0 END,
                option_index = correct_answers[question_index],
                option_index
            );
        END LOOP;

        question_index := question_index + 1;
    END LOOP;
END $$;

SELECT 'Sample questions and options created for all four categories!' as status;
