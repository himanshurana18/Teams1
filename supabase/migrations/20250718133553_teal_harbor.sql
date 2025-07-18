/*
  # Fix Messages Sender Foreign Key Relationship

  1. Changes
    - Drop existing foreign key constraint on messages.sender_id that references auth.users(id)
    - Add new foreign key constraint on messages.sender_id to reference profiles(id)
    - This aligns the database schema with the frontend query expectations

  2. Security
    - Maintains existing RLS policies
    - Preserves data integrity with CASCADE delete
*/

-- Drop the existing foreign key constraint
ALTER TABLE messages DROP CONSTRAINT IF EXISTS messages_sender_id_fkey;

-- Add new foreign key constraint to reference profiles table
ALTER TABLE messages ADD CONSTRAINT messages_sender_id_fkey 
  FOREIGN KEY (sender_id) REFERENCES profiles(id) ON DELETE CASCADE;