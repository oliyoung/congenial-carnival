-- Drop tables if they exist (drop join tables first to avoid FK errors)
DROP TABLE IF EXISTS training_plan_session_logs CASCADE;
DROP TABLE IF EXISTS training_plan_goals CASCADE;
DROP TABLE IF EXISTS training_plan_assistants CASCADE;
DROP TABLE IF EXISTS goal_session_logs CASCADE;
DROP TABLE IF EXISTS ai_metadata CASCADE;
DROP TABLE IF EXISTS session_logs CASCADE;
DROP TABLE IF EXISTS goals CASCADE;
DROP TABLE IF EXISTS assistants CASCADE;
DROP TABLE IF EXISTS athletes CASCADE;
DROP TABLE IF EXISTS training_plans CASCADE;
DROP TABLE IF EXISTS coach_billing CASCADE;
DROP TABLE IF EXISTS coaches CASCADE;

-- =========================
-- 1. Base Tables
-- =========================

-- Coaches table
CREATE TABLE coaches (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) UNIQUE NOT NULL, -- Supabase auth user UUID
    email VARCHAR(255) UNIQUE NOT NULL,
    first_name VARCHAR(255),
    last_name VARCHAR(255),
    display_name VARCHAR(255),
    avatar VARCHAR(255), -- Profile picture URL
    timezone VARCHAR(100) NOT NULL DEFAULT 'UTC',
    account_status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE', -- ACTIVE, SUSPENDED, BANNED, PENDING_VERIFICATION, INCOMPLETE
    onboarding_completed BOOLEAN NOT NULL DEFAULT FALSE,
    last_login_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Coach billing table (separated for cleaner architecture)
CREATE TABLE coach_billing (
    id SERIAL PRIMARY KEY,
    coach_id INTEGER UNIQUE NOT NULL REFERENCES coaches(id) ON DELETE CASCADE,
    
    -- Stripe integration
    stripe_customer_id VARCHAR(255), -- Stripe customer ID
    subscription_status VARCHAR(50) NOT NULL DEFAULT 'TRIAL', -- TRIAL, ACTIVE, PAST_DUE, CANCELED, UNPAID, INCOMPLETE, INCOMPLETE_EXPIRED, PAUSED
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'FREE', -- FREE, STARTER, PROFESSIONAL, ENTERPRISE
    subscription_start_date TIMESTAMP,
    subscription_end_date TIMESTAMP,
    trial_end_date TIMESTAMP,
    billing_email VARCHAR(255),
    
    -- Usage tracking and limits
    monthly_athlete_limit INTEGER NOT NULL DEFAULT 5,
    current_athlete_count INTEGER NOT NULL DEFAULT 0,
    monthly_session_log_limit INTEGER NOT NULL DEFAULT 50,
    current_session_log_count INTEGER NOT NULL DEFAULT 0,
    ai_credits_remaining INTEGER DEFAULT 100,
    usage_reset_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    -- Billing metadata
    last_payment_date TIMESTAMP,
    next_billing_date TIMESTAMP,
    billing_cycle_day INTEGER DEFAULT 1, -- Day of month for billing (1-28)
    currency VARCHAR(3) NOT NULL DEFAULT 'USD',
    
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Athletes table
CREATE TABLE athletes (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    first_name VARCHAR(255) NOT NULL,
    last_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    tags TEXT[],
    notes TEXT,
    sport VARCHAR(255) NOT NULL,
    birthday VARCHAR(255),
    gender VARCHAR(50),
    fitness_level VARCHAR(50),
    training_history TEXT,
    height FLOAT,
    weight FLOAT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- Assistants table
CREATE TABLE assistants (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    sport VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    strengths TEXT[] NOT NULL,
    bio TEXT NOT NULL,
    prompt_template TEXT NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- TrainingPlans table
CREATE TABLE training_plans (
    id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) NOT NULL,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    title VARCHAR(255),
    overview TEXT,
    plan_json JSONB,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    generated_by VARCHAR(255),
    source_prompt TEXT
);

-- Goals table
CREATE TABLE goals (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    status VARCHAR(50) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP,
    due_date TIMESTAMP,
    progress_notes TEXT,
    sport VARCHAR(255),
    training_plan_id INTEGER REFERENCES training_plans(id)
);

-- SessionLogs table
CREATE TABLE session_logs (
    id SERIAL PRIMARY KEY,
    athlete_id INTEGER NOT NULL REFERENCES athletes(id),
    date TIMESTAMP NOT NULL,
    notes TEXT,
    transcript TEXT,
    summary TEXT,
    action_items TEXT[],
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP
);

-- AIMetadata table (one-to-one with session_logs)
CREATE TABLE ai_metadata (
    session_log_id INTEGER PRIMARY KEY REFERENCES session_logs(id) ON DELETE CASCADE,
    summary_generated BOOLEAN NOT NULL,
    next_steps_generated BOOLEAN NOT NULL
);

-- =========================
-- 2. Join Tables (many-to-many)
-- =========================

-- Join table: goal_session_logs (many-to-many)
CREATE TABLE goal_session_logs (
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    session_log_id INTEGER NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
    PRIMARY KEY (goal_id, session_log_id)
);

-- Join table: training_plan_assistants (many-to-many)
CREATE TABLE training_plan_assistants (
    training_plan_id INTEGER NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    assistant_id INTEGER NOT NULL REFERENCES assistants(id) ON DELETE CASCADE,
    PRIMARY KEY (training_plan_id, assistant_id)
);

-- Join table: training_plan_goals (many-to-many)
CREATE TABLE training_plan_goals (
    training_plan_id INTEGER NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    goal_id INTEGER NOT NULL REFERENCES goals(id) ON DELETE CASCADE,
    PRIMARY KEY (training_plan_id, goal_id)
);

-- Join table: training_plan_session_logs (many-to-many)
CREATE TABLE training_plan_session_logs (
    training_plan_id INTEGER NOT NULL REFERENCES training_plans(id) ON DELETE CASCADE,
    session_log_id INTEGER NOT NULL REFERENCES session_logs(id) ON DELETE CASCADE,
    PRIMARY KEY (training_plan_id, session_log_id)
);

-- =========================
-- 3. Fixture Data
-- =========================

-- Fixture data for assistants (basketball)
INSERT INTO assistants (id, name, sport, role, strengths, bio, prompt_template, created_at, updated_at) VALUES
(1, 'Coach Maverick', 'Basketball', 'Guard', ARRAY['Ball Handling', 'Basketball IQ', 'Pick-and-Roll Execution'], 'A seasoned floor general who teaches guards how to read defenses, run plays, and lead the offense with precision.', 'Create a 1-week training plan to enhance {goal} for a basketball guard. Focus on ball handling and decision-making under pressure.', NOW(), NOW()),
(2, 'Coach Titan', 'Basketball', 'Center', ARRAY['Rim Protection', 'Post Defense', 'Shot Blocking'], 'A defensive anchor with a focus on timing, footwork, and paint dominance. Teaches how to protect the rim without fouling.', 'Design a training schedule to boost rim protection skills for a basketball center. Include shot-blocking drills and positioning strategies.', NOW(), NOW()),
(3, 'Coach Blaze', 'Basketball', 'Wing', ARRAY['Shooting', 'Off-Ball Movement', 'Shot Creation'], 'An offensive specialist who trains players to create space, move without the ball, and become lethal from the perimeter.', 'Build a custom training routine to improve shooting consistency and off-ball awareness for a basketball wing.', NOW(), NOW()),
(4, 'Coach Nova', 'Basketball', 'Forward', ARRAY['Transition Offense', 'Finishing', 'Athleticism'], 'Brings explosive energy and speed-focused drills to enhance fast breaks, driving lanes, and above-the-rim finishes.', 'Develop a 5-day plan for boosting transition scoring and finishing at the rim for an athletic forward.', NOW(), NOW()),
(5, 'Coach Ice', 'Basketball', 'Guard', ARRAY['Clutch Performance', 'Free Throws', 'End-of-Game Execution'], 'A calm and collected leader who thrives under pressure. Specializes in teaching composure, free throw routines, and end-of-game execution for guards.', 'Outline a training strategy to build composure and efficiency in clutch moments for a basketball guard.', NOW(), NOW()),
(6, 'Coach Atlas', 'Basketball', 'Center', ARRAY['Rebounding', 'Strength Training', 'Box Out Fundamentals'], 'A physicality-first coach who teaches players to control the glass with technique, strength, and hustle.', 'Craft a strength-focused training plan that emphasizes rebounding technique and box-out fundamentals.', NOW(), NOW()),
(7, 'Coach Vibe', 'Basketball', 'Wing', ARRAY['Team Chemistry', 'Communication', 'Court Awareness'], 'Believes that great players make their teammates better. Focuses on awareness, unselfish play, and leadership.', 'Generate a training routine that builds communication, team cohesion, and court awareness for a versatile wing.', NOW(), NOW()),
(8, 'Coach Spark', 'Basketball', 'Guard', ARRAY['Quickness', 'Agility', 'Full-Court Pressure'], 'A high-energy coach who thrives on intensity. Trains guards to press, harass ball handlers, and change pace effectively.', 'Prepare a high-intensity plan to improve quickness, agility, and pressure defense for a basketball guard.', NOW(), NOW()),
(9, 'Coach Prism', 'Basketball', 'Forward', ARRAY['Defensive Switching', 'Versatility', 'Tactical IQ'], 'A versatile forward who excels at defensive switching and tactical play. Coaches players to read the game, adapt on the fly, and contribute in multiple roles.', 'Design a week-long training block for a forward focused on defensive switching, versatility, and tactical IQ.', NOW(), NOW()),
(10, 'Coach Echo', 'Basketball', 'Any', ARRAY['Film Study', 'Self-Assessment', 'Growth Mindset'], 'A reflective coach focused on reviewing past performances to drive future improvement through self-awareness.', 'Generate a training program that includes film breakdown, reflection prompts, and self-assessment for any basketball role.', NOW(), NOW());

-- Fixture data for athletes
INSERT INTO athletes (user_id, first_name, last_name, email, tags, notes, sport, birthday, gender, fitness_level, training_history, height, weight, created_at, updated_at, deleted_at) VALUES
('123', 'Alice', 'Smith', 'alice.smith1@example.com', ARRAY['athlete','yoga'], 'Loves yoga. See https://placekitten.com/200/200', 'Yoga', '1990-01-01', 'Female', 'Intermediate', '5 years of yoga', 165.0, 60.0, NOW(), NOW(), NULL),
('123', 'Bob', 'Johnson', 'bob.johnson2@example.com', ARRAY['runner'], 'Marathon runner. https://placekitten.com/201/200', 'Running', '1985-05-12', 'Male', 'Advanced', '10 marathons', 180.0, 75.0, NOW(), NOW(), NULL),
('123', 'Carol', 'Williams', 'carol.williams3@example.com', ARRAY['swimmer'], 'Competitive swimmer.', 'Swimming', '1992-03-15', 'Female', 'Advanced', 'Swims daily', 170.0, 62.0, NOW(), NOW(), NULL),
('123', 'David', 'Brown', 'david.brown4@example.com', ARRAY['basketball'], 'Plays center.', 'Basketball', '1988-07-22', 'Male', 'Intermediate', 'Plays in local league', 200.0, 95.0, NOW(), NOW(), NULL),
('123', 'Eva', 'Jones', 'eva.jones5@example.com', ARRAY['triathlete'], 'Training for first triathlon.', 'Triathlon', '1995-11-30', 'Female', 'Beginner', 'New to triathlon', 168.0, 58.0, NOW(), NOW(), NULL),
('123', 'Frank', 'Garcia', 'frank.garcia6@example.com', ARRAY['soccer'], 'Midfielder.', 'Soccer', '1991-09-10', 'Male', 'Intermediate', 'Plays weekly', 175.0, 70.0, NOW(), NOW(), NULL),
('123', 'Grace', 'Martinez', 'grace.martinez7@example.com', ARRAY['tennis'], 'Loves doubles.', 'Tennis', '1987-04-18', 'Female', 'Advanced', 'Competes in tournaments', 160.0, 55.0, NOW(), NOW(), NULL),
('123', 'Henry', 'Rodriguez', 'henry.rodriguez8@example.com', ARRAY['cycling'], 'Road cyclist.', 'Cycling', '1983-12-05', 'Male', 'Advanced', 'Rides 200km/week', 178.0, 72.0, NOW(), NOW(), NULL),
('123', 'Ivy', 'Lee', 'ivy.lee9@example.com', ARRAY['climbing'], 'Bouldering enthusiast.', 'Climbing', '1996-06-21', 'Female', 'Intermediate', 'Climbs 3x/week', 162.0, 54.0, NOW(), NOW(), NULL),
('123', 'Jack', 'Walker', 'jack.walker10@example.com', ARRAY['crossfit'], 'Crossfit regular.', 'CrossFit', '1993-08-14', 'Male', 'Intermediate', 'Crossfit 4x/week', 182.0, 80.0, NOW(), NOW(), NULL),
('123', 'Kara', 'Hall', 'kara.hall11@example.com', ARRAY['pilates'], 'Pilates instructor.', 'Pilates', '1989-02-27', 'Female', 'Advanced', 'Teaches pilates', 167.0, 57.0, NOW(), NOW(), NULL),
('123', 'Liam', 'Allen', 'liam.allen12@example.com', ARRAY['swimming'], 'Open water swimmer.', 'Swimming', '1994-10-09', 'Male', 'Intermediate', 'Swims lakes', 176.0, 68.0, NOW(), NOW(), NULL),
('123', 'Mia', 'Young', 'mia.young13@example.com', ARRAY['yoga'], 'Yoga teacher.', 'Yoga', '1990-05-19', 'Female', 'Advanced', 'Teaches vinyasa', 164.0, 56.0, NOW(), NOW(), NULL),
('123', 'Noah', 'King', 'noah.king14@example.com', ARRAY['basketball'], 'Point guard.', 'Basketball', '1986-03-23', 'Male', 'Advanced', 'Plays semi-pro', 188.0, 85.0, NOW(), NOW(), NULL),
('123', 'Olivia', 'Wright', 'olivia.wright15@example.com', ARRAY['running'], 'Trail runner.', 'Running', '1997-07-30', 'Female', 'Intermediate', 'Runs trails', 169.0, 59.0, NOW(), NOW(), NULL),
('123', 'Paul', 'Lopez', 'paul.lopez16@example.com', ARRAY['cycling'], 'Mountain biker.', 'Cycling', '1984-11-11', 'Male', 'Intermediate', 'Rides weekends', 181.0, 77.0, NOW(), NOW(), NULL),
('123', 'Quinn', 'Hill', 'quinn.hill17@example.com', ARRAY['rowing'], 'Rowing club.', 'Rowing', '1992-01-05', 'Non-binary', 'Beginner', 'New to rowing', 172.0, 65.0, NOW(), NOW(), NULL),
('123', 'Ruby', 'Scott', 'ruby.scott18@example.com', ARRAY['dance'], 'Ballet dancer.', 'Dance', '1995-09-17', 'Female', 'Advanced', 'Performs ballet', 158.0, 50.0, NOW(), NOW(), NULL),
('123', 'Sam', 'Green', 'sam.green19@example.com', ARRAY['football'], 'Quarterback.', 'Football', '1989-06-02', 'Male', 'Advanced', 'Plays in league', 190.0, 90.0, NOW(), NOW(), NULL),
('123', 'Tina', 'Baker', 'tina.baker20@example.com', ARRAY['yoga','running'], 'Yoga and running.', 'Yoga', '1993-12-25', 'Female', 'Intermediate', 'Mixes yoga and running', 166.0, 58.0, NOW(), NOW(), NULL);