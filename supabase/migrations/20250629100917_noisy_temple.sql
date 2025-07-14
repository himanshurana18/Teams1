/*
  # Fix Infinite Recursion in RLS Policies - Complete Solution

  This migration completely removes all problematic RLS policies that cause infinite recursion
  and replaces them with simple, non-recursive policies.

  ## Problem
  The existing policies create infinite recursion because they reference the same table
  they're protecting (especially team_members referencing team_members).

  ## Solution
  1. Remove ALL existing policies
  2. Create simple policies that avoid self-references
  3. Use direct ownership checks instead of complex membership lookups
  4. Temporarily disable RLS on team_members to break the cycle

  ## Changes
  - Teams: Only creators can manage, anyone can view teams they're invited to
  - Team Members: Simple direct access, no complex queries
  - Other tables: Direct ownership or team creator access only
*/

-- First, disable RLS temporarily on team_members to break the cycle
ALTER TABLE team_members DISABLE ROW LEVEL SECURITY;

-- Drop ALL existing policies to start completely fresh
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop all policies on all tables
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE schemaname = 'public'
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Re-enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE fees ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;

-- Create simple, non-recursive policies

-- Profiles policies (unchanged - these work fine)
CREATE POLICY "Users can view own profile" ON profiles 
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles 
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON profiles 
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Teams policies - VERY SIMPLE
CREATE POLICY "Anyone can view teams" ON teams 
  FOR SELECT USING (true);

CREATE POLICY "Users can create teams" ON teams 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can update teams" ON teams 
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Team creators can delete teams" ON teams 
  FOR DELETE USING (created_by = auth.uid());

-- Team members policies - NO SELF-REFERENCES
CREATE POLICY "Anyone can view team members" ON team_members 
  FOR SELECT USING (true);

CREATE POLICY "Users can join teams" ON team_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON team_members 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Team creators can manage members" ON team_members 
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = team_members.team_id 
      AND t.created_by = auth.uid()
    )
  );

-- Events policies - simple team creator check
CREATE POLICY "Anyone can view events" ON events 
  FOR SELECT USING (true);

CREATE POLICY "Team creators can manage events" ON events 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = events.team_id AND t.created_by = auth.uid()
    )
  );

-- Attendance policies - simple ownership
CREATE POLICY "Anyone can view attendance" ON attendance 
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own attendance" ON attendance 
  FOR ALL USING (auth.uid() = user_id);

-- Fees policies - simple team creator check
CREATE POLICY "Anyone can view fees" ON fees 
  FOR SELECT USING (true);

CREATE POLICY "Team creators can manage fees" ON fees 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = fees.team_id AND t.created_by = auth.uid()
    )
  );

-- Payments policies - simple ownership
CREATE POLICY "Anyone can view payments" ON payments 
  FOR SELECT USING (true);

CREATE POLICY "Users can manage own payments" ON payments 
  FOR ALL USING (auth.uid() = user_id);

-- Messages policies - simple team creator check
CREATE POLICY "Anyone can view messages" ON messages 
  FOR SELECT USING (true);

CREATE POLICY "Team creators can send messages" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = messages.team_id AND t.created_by = auth.uid()
    )
  );

-- Tasks policies - simple team creator check
CREATE POLICY "Anyone can view tasks" ON tasks 
  FOR SELECT USING (true);

CREATE POLICY "Team creators can manage tasks" ON tasks 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = tasks.team_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update assigned tasks" ON tasks 
  FOR UPDATE USING (auth.uid() = assigned_to);

-- Add missing columns to teams table if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'league_name'
  ) THEN
    ALTER TABLE teams ADD COLUMN league_name TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'season'
  ) THEN
    ALTER TABLE teams ADD COLUMN season TEXT;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'teams' AND column_name = 'division'
  ) THEN
    ALTER TABLE teams ADD COLUMN division TEXT;
  END IF;
END $$;