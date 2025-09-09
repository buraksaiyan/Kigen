# 🚀 SUPABASE SETUP QUICK START

## Step 1: Create Supabase Project (5 minutes)
1. Go to https://supabase.com
2. Sign up/Login with GitHub
3. Click "New Project"
4. Name: "Kigen App" (or whatever you prefer)
5. Create strong database password (save it!)
6. Wait ~2 minutes for setup

## Step 2: Get Your Credentials
1. In your new project, go to: **Settings → API**
2. Copy these two values:
   - **Project URL** (like: https://abcdefghijk.supabase.co)
   - **anon public** key (long JWT token)

## Step 3: Update Environment File
1. Open the `.env` file in your project root (I created it for you)
2. Replace these lines:
   ```
   EXPO_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
   EXPO_PUBLIC_SUPABASE_ANON_KEY=your_actual_anon_key_here
   ```
   With your real values

## Step 4: Setup Database
1. In Supabase dashboard, go to: **SQL Editor**
2. Copy the SQL from `supabase/schema.sql` file
3. Paste and run it (creates tables + test data)

## Step 5: Test Connection
1. Restart your Expo app: `expo start` (important!)
2. In the app, you'll see a "🔍 Debug Supabase" button in dev mode
3. Tap it to test the connection

## What You'll Get:
- ✅ Working leaderboard with real data
- ✅ 5 test users with different ranks (Bronze to Diamond)
- ✅ Monthly/weekly point tracking
- ✅ Real-time sync between devices

## Troubleshooting:
- **"Connection failed"**: Check URL and key are correct
- **"Permission denied"**: Make sure you ran the schema.sql
- **"Can't see debug button"**: Make sure you restarted Expo after editing .env

Once connected, your leaderboard will work in both Expo Go and published apps!
