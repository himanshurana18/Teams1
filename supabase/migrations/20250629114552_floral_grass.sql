/*
  # Add score fields to events table

  1. New Columns
    - `home_score` (integer) - Score for home team
    - `away_score` (integer) - Score for away team  
    - `game_status` (text) - Game status/period (Final, 1st Period, etc.)

  2. Changes
    - Add score tracking fields to events table
    - Set default values for existing events
*/

-- Add score fields to events table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'home_score'
  ) THEN
    ALTER TABLE events ADD COLUMN home_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'away_score'
  ) THEN
    ALTER TABLE events ADD COLUMN away_score INTEGER DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'events' AND column_name = 'game_status'
  ) THEN
    ALTER TABLE events ADD COLUMN game_status TEXT DEFAULT 'FINAL';
  END IF;
END $$;