/*
  # Fix Infinite Recursion in RLS Policies

  1. Problem
    - Current policies create infinite recursion when checking team membership
    - team_members policies reference themselves when checking access

  2. Solution
    - Drop all problematic policies
    - Create simple, non-recursive policies
    - Use direct ownership checks where possible
    - Avoid self-referencing queries in team_members table

  3. Security
    - Maintain security while eliminating recursion
    - Use team ownership and direct user checks
    - Simplify policy logic to prevent circular references
*/

-- Drop ALL existing policies to start fresh
DROP POLICY IF EXISTS "Users can view their teams" ON teams;
DROP POLICY IF EXISTS "Users can create teams" ON teams;
DROP POLICY IF EXISTS "Team creators and managers can update teams" ON teams;
DROP POLICY IF EXISTS "Users can view team members of their teams" ON team_members;
DROP POLICY IF EXISTS "Users can join teams" ON team_members;
DROP POLICY IF EXISTS "Users can leave teams" ON team_members;
DROP POLICY IF EXISTS "Team creators can manage all members" ON team_members;
DROP POLICY IF EXISTS "Team members can view team events" ON events;
DROP POLICY IF EXISTS "Team managers can manage events" ON events;
DROP POLICY IF EXISTS "Users can view attendance for their team events" ON attendance;
DROP POLICY IF EXISTS "Users can manage own attendance" ON attendance;
DROP POLICY IF EXISTS "Team members can view team fees" ON fees;
DROP POLICY IF EXISTS "Team managers can manage fees" ON fees;
DROP POLICY IF EXISTS "Users can view payments for their team fees" ON payments;
DROP POLICY IF EXISTS "Users can manage own payments" ON payments;
DROP POLICY IF EXISTS "Team members can view team messages" ON messages;
DROP POLICY IF EXISTS "Team members can send messages" ON messages;
DROP POLICY IF EXISTS "Team members can view team tasks" ON tasks;
DROP POLICY IF EXISTS "Team managers can manage tasks" ON tasks;
DROP POLICY IF EXISTS "Users can update assigned tasks" ON tasks;

-- Create simple, non-recursive policies

-- Teams policies - only check direct ownership
CREATE POLICY "Users can view teams they created" ON teams 
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Users can create teams" ON teams 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators can update their teams" ON teams 
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Team creators can delete their teams" ON teams 
  FOR DELETE USING (created_by = auth.uid());

-- Team members policies - simple and direct
CREATE POLICY "Users can view their own memberships" ON team_members 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can join teams" ON team_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON team_members 
  FOR DELETE USING (auth.uid() = user_id);

-- Team creators can manage members of their teams
CREATE POLICY "Team creators can view all members" ON team_members 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = team_members.team_id 
      AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Team creators can manage members" ON team_members 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = team_members.team_id 
      AND t.created_by = auth.uid()
    )
  );

-- Events policies - only team creators can manage
CREATE POLICY "Users can view events of teams they created" ON events 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = events.team_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Team creators can manage events" ON events 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = events.team_id AND t.created_by = auth.uid()
    )
  );

-- Attendance policies - simple ownership
CREATE POLICY "Users can view their own attendance" ON attendance 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own attendance" ON attendance 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Team creators can view all attendance" ON attendance 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM events e
      JOIN teams t ON e.team_id = t.id
      WHERE e.id = attendance.event_id AND t.created_by = auth.uid()
    )
  );

-- Fees policies - team creators only
CREATE POLICY "Users can view fees of teams they created" ON fees 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = fees.team_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Team creators can manage fees" ON fees 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = fees.team_id AND t.created_by = auth.uid()
    )
  );

-- Payments policies - simple ownership
CREATE POLICY "Users can view their own payments" ON payments 
  FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Users can manage own payments" ON payments 
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Team creators can view all payments" ON payments 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM fees f
      JOIN teams t ON f.team_id = t.id
      WHERE f.id = payments.fee_id AND t.created_by = auth.uid()
    )
  );

-- Messages policies - team creators only
CREATE POLICY "Users can view messages of teams they created" ON messages 
  FOR SELECT USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = messages.team_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Team creators can send messages" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = messages.team_id AND t.created_by = auth.uid()
    )
  );

-- Tasks policies - team creators only
CREATE POLICY "Users can view tasks of teams they created" ON tasks 
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = tasks.team_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Team creators can manage tasks" ON tasks 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = tasks.team_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update assigned tasks" ON tasks 
  FOR UPDATE USING (auth.uid() = assigned_to);

-- Add missing columns to teams table for the new form
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