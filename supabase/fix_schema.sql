-- ========================================
-- KIGEN APP - CLEAN DATABASE SCHEMA
-- ========================================
-- Run this in Supabase SQL Editor to create proper tables

-- 1. Drop existing tables if they exist
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

-- 6. Create policies for public access (you can restrict later)
CREATE POLICY "Enable read access for all users" ON leaderboard FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON leaderboard FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON leaderboard FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON user_profiles FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON user_profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON user_profiles FOR UPDATE USING (true);

CREATE POLICY "Enable read access for all users" ON user_stats FOR SELECT USING (true);
CREATE POLICY "Enable insert access for all users" ON user_stats FOR INSERT WITH CHECK (true);
CREATE POLICY "Enable update access for all users" ON user_stats FOR UPDATE USING (true);

-- 7. Create performance indexes
CREATE INDEX idx_leaderboard_total_points ON leaderboard(total_points DESC);
CREATE INDEX idx_leaderboard_monthly_points ON leaderboard(monthly_points DESC);
CREATE INDEX idx_leaderboard_weekly_points ON leaderboard(weekly_points DESC);
