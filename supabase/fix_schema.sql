-- ========================================
-- KIGEN APP - FIX DATABASE SCHEMA
-- ========================================
-- Run this in Supabase SQL Editor to fix the column name issue

-- 1. Drop existing table if it has wrong column names
DROP TABLE IF EXISTS leaderboard CASCADE;
DROP TABLE IF EXISTS user_stats CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- 2. Create leaderboard table with correct column names
CREATE TABLE leaderboard (
    user_id TEXT PRIMARY KEY,
    username TEXT NOT NULL,
    total_points INTEGER DEFAULT 0,
    monthly_points INTEGER DEFAULT 0,
    weekly_points INTEGER DEFAULT 0,
    overall_rating INTEGER DEFAULT 0,
    card_tier TEXT DEFAULT 'Bronze',
    country TEXT,
    last_updated TIMESTAMP DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. User profiles table
CREATE TABLE user_profiles (
    id TEXT PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    profile_image TEXT,
    country TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    last_seen TIMESTAMP DEFAULT NOW()
);

-- 4. User stats table (for detailed tracking)
CREATE TABLE user_stats (
    user_id TEXT PRIMARY KEY REFERENCES user_profiles(id),
    discipline INTEGER DEFAULT 0,
    focus INTEGER DEFAULT 0,
    journaling INTEGER DEFAULT 0,
    usage INTEGER DEFAULT 0,
    mentality INTEGER DEFAULT 0,
    physical INTEGER DEFAULT 0,
    total_sessions INTEGER DEFAULT 0,
    completed_sessions INTEGER DEFAULT 0,
    total_focus_time INTEGER DEFAULT 0,
    journal_entries INTEGER DEFAULT 0,
    last_updated TIMESTAMP DEFAULT NOW()
);

-- 5. Enable Row Level Security
ALTER TABLE leaderboard ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_stats ENABLE ROW LEVEL SECURITY;

-- 6. Create policies to allow public access
CREATE POLICY "Allow public read on leaderboard" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Allow public insert on leaderboard" ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on leaderboard" ON leaderboard FOR UPDATE USING (true);

CREATE POLICY "Allow public read on user_profiles" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Allow public insert on user_profiles" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on user_profiles" ON user_profiles FOR UPDATE USING (true);

CREATE POLICY "Allow public read on user_stats" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Allow public insert on user_stats" ON user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public update on user_stats" ON user_stats FOR UPDATE USING (true);

-- 7. Insert test data with correct column names
INSERT INTO leaderboard (user_id, username, total_points, monthly_points, weekly_points, overall_rating, card_tier, country) VALUES
('demo_user_1', 'KigenMaster', 8500, 1200, 340, 89, 'Diamond', 'USA'),
('demo_user_2', 'FocusNinja', 6200, 850, 220, 78, 'Platinum', 'Canada'),
('demo_user_3', 'ZenWarrior', 4800, 680, 180, 71, 'Gold', 'UK'),
('demo_user_4', 'MindfulSoul', 3200, 480, 120, 65, 'Silver', 'Australia'),
('demo_user_5', 'DisciplineSeeker', 1800, 320, 85, 58, 'Bronze', 'Germany');

-- 8. Create indexes for better performance
CREATE INDEX idx_leaderboard_total_points ON leaderboard(total_points DESC);
CREATE INDEX idx_leaderboard_monthly_points ON leaderboard(monthly_points DESC);
CREATE INDEX idx_leaderboard_weekly_points ON leaderboard(weekly_points DESC);

-- 9. Verify the table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leaderboard' 
ORDER BY ordinal_position;
