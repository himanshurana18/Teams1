/*
  # Fix team_members and profiles relationship

  1. Changes
    - Drop existing foreign key constraint on team_members.user_id
    - Add new foreign key constraint referencing profiles(id) instead of auth.users(id)
    - This enables direct joins between team_members and profiles tables

  2. Security
    - Maintain existing RLS policies
    - No changes to data access patterns
*/

-- Drop the existing foreign key constraint
ALTER TABLE team_members DROP CONSTRAINT IF EXISTS team_members_user_id_fkey;

-- Add new foreign key constraint referencing profiles table
ALTER TABLE team_members ADD CONSTRAINT team_members_user_id_fkey 
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE;