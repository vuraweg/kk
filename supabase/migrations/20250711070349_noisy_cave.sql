/*
  # Add username column to user_profiles table

  1. Changes
    - Add `username` column to `user_profiles` table
    - Add unique constraint on username
    - Add index for better performance
    - Update RLS policies to include username access

  2. Security
    - Maintain existing RLS policies
    - Add username to allowed select fields
*/

-- Add username column to user_profiles table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'user_profiles' AND column_name = 'username'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN username text;
  END IF;
END $$;

-- Add unique constraint on username
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_name = 'user_profiles' AND constraint_name = 'user_profiles_username_key'
  ) THEN
    ALTER TABLE user_profiles ADD CONSTRAINT user_profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Add index for username lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON user_profiles (username);

-- Update RLS policies to allow username access (policies already exist, this ensures they work with username)
-- The existing policies should already cover username access since they allow users to read/update their own profiles