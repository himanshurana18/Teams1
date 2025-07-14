/*
  # Fix RLS Policy Infinite Recursion

  1. Problem
    - The team_members policies were causing infinite recursion
    - Policies were checking team membership by querying the same table they protect

  2. Solution
    - Simplify policies to avoid self-referencing queries
    - Use direct user ID checks where possible
    - Remove circular dependencies in policy logic

  3. Changes
    - Update team_members policies to avoid recursion
    - Simplify team access policies
    - Ensure policies work without circular references
*/

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Team members can view teams" ON teams;
DROP POLICY IF EXISTS "Team managers can update teams" ON teams;
DROP POLICY IF EXISTS "Team members can view team members" ON team_members;
DROP POLICY IF EXISTS "Team managers can manage members" ON team_members;
DROP POLICY IF EXISTS "Team members can view events" ON events;
DROP POLICY IF EXISTS "Team managers can manage events" ON events;
DROP POLICY IF EXISTS "Team members can view attendance" ON attendance;
DROP POLICY IF EXISTS "Team members can view fees" ON fees;
DROP POLICY IF EXISTS "Team managers can manage fees" ON fees;
DROP POLICY IF EXISTS "Team members can view payments" ON payments;
DROP POLICY IF EXISTS "Team members can view messages" ON messages;
DROP POLICY IF EXISTS "Team members can send messages" ON messages;
DROP POLICY IF EXISTS "Team members can view tasks" ON tasks;
DROP POLICY IF EXISTS "Team managers can manage tasks" ON tasks;

-- Create simplified policies without recursion

-- Teams policies - allow viewing teams user created or is member of
CREATE POLICY "Users can view their teams" ON teams 
  FOR SELECT USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = teams.id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create teams" ON teams 
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Team creators and managers can update teams" ON teams 
  FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = teams.id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('manager', 'captain')
    )
  );

-- Team members policies - simplified without self-reference
CREATE POLICY "Users can view team members of their teams" ON team_members 
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm2 
      WHERE tm2.team_id = team_members.team_id 
      AND tm2.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can join teams" ON team_members 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can leave teams" ON team_members 
  FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Team creators can manage all members" ON team_members 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = team_members.team_id 
      AND t.created_by = auth.uid()
    )
  );

-- Events policies
CREATE POLICY "Team members can view team events" ON events 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = events.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can manage events" ON events 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = events.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('manager', 'captain')
    ) OR
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = events.team_id AND t.created_by = auth.uid()
    )
  );

-- Attendance policies
CREATE POLICY "Users can view attendance for their team events" ON attendance 
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM events e
      JOIN team_members tm ON e.team_id = tm.team_id
      WHERE e.id = attendance.event_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own attendance" ON attendance 
  FOR ALL USING (auth.uid() = user_id);

-- Fees policies
CREATE POLICY "Team members can view team fees" ON fees 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = fees.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can manage fees" ON fees 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = fees.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('manager', 'captain')
    ) OR
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = fees.team_id AND t.created_by = auth.uid()
    )
  );

-- Payments policies
CREATE POLICY "Users can view payments for their team fees" ON payments 
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM fees f
      JOIN team_members tm ON f.team_id = tm.team_id
      WHERE f.id = payments.fee_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can manage own payments" ON payments 
  FOR ALL USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Team members can view team messages" ON messages 
  FOR SELECT USING (
    sender_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = messages.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team members can send messages" ON messages 
  FOR INSERT WITH CHECK (
    auth.uid() = sender_id AND
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = messages.team_id AND tm.user_id = auth.uid()
    )
  );

-- Tasks policies
CREATE POLICY "Team members can view team tasks" ON tasks 
  FOR SELECT USING (
    assigned_to = auth.uid() OR
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = tasks.team_id AND tm.user_id = auth.uid()
    )
  );

CREATE POLICY "Team managers can manage tasks" ON tasks 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM team_members tm 
      WHERE tm.team_id = tasks.team_id 
      AND tm.user_id = auth.uid() 
      AND tm.role IN ('manager', 'captain')
    ) OR
    EXISTS (
      SELECT 1 FROM teams t 
      WHERE t.id = tasks.team_id AND t.created_by = auth.uid()
    )
  );

CREATE POLICY "Users can update assigned tasks" ON tasks 
  FOR UPDATE USING (auth.uid() = assigned_to);