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

-- Insert sample questions for the four categories (Capital, Marketing, Strategy, Team Building)
INSERT INTO quiz_questions (question, category, is_active) VALUES
-- Capital questions
('Your startup needs $500K to scale operations. What financing option gives you the most control?', 'Capital', true),
('A potential investor wants 25% equity for $1M investment. Your startup is valued at:', 'Capital', true),
('What is the primary advantage of bootstrapping over external funding?', 'Capital', true),
('Which metric is most important when presenting to venture capitalists?', 'Capital', true),
('Your runway shows 8 months left. What should be your immediate priority?', 'Capital', true),

-- Marketing questions  
('Your CAC is $100 and LTV is $250. What does this indicate?', 'Marketing', true),
('Which marketing channel typically has the lowest customer acquisition cost for B2B startups?', 'Marketing', true),
('Your conversion rate from trial to paid is 2%. Industry average is 15%. What should you focus on?', 'Marketing', true),
('A competitor launched a similar product. What is your best marketing response?', 'Marketing', true),
('Your organic reach dropped 60%. What is the most cost-effective solution?', 'Marketing', true),

-- Strategy questions
('Your main competitor just raised $50M. What should be your strategic response?', 'Strategy', true),
('Market research shows demand in Asia. Your product needs localization. What do you do?', 'Strategy', true),
('Revenue growth stalled at $2M ARR. What strategic pivot should you consider?', 'Strategy', true),
('A large corporation wants to acquire you for 3x revenue. What factors should you consider?', 'Strategy', true),
('Your product serves both B2B and B2C markets. Which strategic focus is better?', 'Strategy', true),

-- Team Building questions
('Your co-founder wants to quit after 2 years. How do you handle their equity?', 'Team Building', true),
('Remote team productivity dropped 30%. What is your first action?', 'Team Building', true),
('Two key developers are leaving for better pay. What is your best retention strategy?', 'Team Building', true),
('Your team doubled in 6 months but communication is breaking down. What structure do you implement?', 'Team Building', true),
('A star performer is demotivating others with their attitude. How do you handle this?', 'Team Building', true);

-- Insert sample options for all questions
DO $$
DECLARE
    q_record RECORD;
    capital_options TEXT[][] := ARRAY[
        ['Debt financing', 'Self-funding/bootstrapping', 'Venture capital', 'Crowdfunding'],
        ['$2 million', '$4 million', '$6 million', '$8 million'],
        ['Faster growth', 'Full ownership retention', 'Better credibility', 'Access to networks'],
        ['Team size', 'Market size and growth', 'Office location', 'Product features'],
        ['Reduce expenses', 'Start fundraising immediately', 'Pivot business model', 'Hire more sales people']
    ];
    marketing_options TEXT[][] := ARRAY[
        ['Excellent unit economics', 'Poor unit economics', 'Need more data', 'Unsustainable model'],
        ['Social media ads', 'Content marketing', 'Cold outreach', 'Trade shows'],
        ['Product features', 'Onboarding experience', 'Pricing strategy', 'Customer support'],
        ['Lower your prices', 'Differentiate your positioning', 'Copy their features', 'Increase ad spend'],
        ['Buy more ads', 'Improve SEO/content', 'Hire influencers', 'Switch platforms']
    ];
    strategy_options TEXT[][] := ARRAY[
        ['Raise more money', 'Focus on profitability', 'Compete directly', 'Find new market niche'],
        ['Enter immediately', 'Test with pilot program', 'Wait for more resources', 'Partner with local company'],
        ['Expand to new markets', 'Improve current product', 'Reduce costs', 'Change business model'],
        ['Accept immediately', 'Negotiate higher price', 'Decline and continue', 'Ask for strategic partnership'],
        ['Focus on B2B only', 'Focus on B2C only', 'Serve both equally', 'Create separate products']
    ];
    team_options TEXT[][] := ARRAY[
        ['Buyback at fair value', 'Keep their equity', 'Give equity to team', 'Negotiate vesting acceleration'],
        ['Implement daily standups', 'Organize team building', 'Review remote work policies', 'Hire project managers'],
        ['Match competitor offers', 'Offer equity compensation', 'Improve work environment', 'All of the above'],
        ['Flat hierarchy', 'Team leads for each function', 'External consultants', 'More meetings'],
        ['Immediate termination', 'Performance improvement plan', 'Direct conversation', 'Team mediation']
    ];
    correct_answers INTEGER[] := ARRAY[2, 2, 2, 2, 2, 1, 2, 2, 2, 2, 4, 2, 2, 3, 1, 1, 2, 4, 2, 3];
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
                category_index := ((question_index - 1) % 5) + 1;
                current_options := capital_options[category_index];
            WHEN 'Marketing' THEN 
                category_index := ((question_index - 6) % 5) + 1;
                current_options := marketing_options[category_index];
            WHEN 'Strategy' THEN 
                category_index := ((question_index - 11) % 5) + 1;
                current_options := strategy_options[category_index];
            WHEN 'Team Building' THEN 
                category_index := ((question_index - 16) % 5) + 1;
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

SELECT 'Sample questions and options created for Capital, Marketing, Strategy, and Team Building categories!' as status;
