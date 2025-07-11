/*
  # Create user_profiles table for authentication

  1. New Tables
    - `user_profiles`
      - `id` (uuid, primary key, references auth.users)
      - `username` (text, unique)
      - `full_name` (text, required)
      - `email_address` (text, required, unique)
      - `is_active` (boolean, default true)
      - `profile_created_at` (timestamp, default now)
      - `profile_updated_at` (timestamp, default now)
      - `role` (text, default 'client')
      - `phone` (text, optional)
      - `linkedin_profile` (text, optional)
      - `wellfound_profile` (text, optional)
      - `program_start_date` (date, optional)
      - `program_end_date` (date, optional)

  2. Security
    - Enable RLS on `user_profiles` table
    - Add policies for users to manage their own profiles
    - Add index on username for performance

  3. Changes
    - Creates the missing table that authentication system expects
    - Ensures proper foreign key relationship with auth.users
    - Sets up secure access policies
*/

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username text UNIQUE,
  full_name text NOT NULL,
  email_address text NOT NULL UNIQUE,
  is_active boolean DEFAULT TRUE,
  profile_created_at timestamp with time zone DEFAULT now(),
  profile_updated_at timestamp with time zone DEFAULT now(),
  role text DEFAULT 'client',
  phone text,
  linkedin_profile text,
  wellfound_profile text,
  program_start_date date,
  program_end_date date
);

-- Enable Row Level Security
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can insert their own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = id);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_username ON public.user_profiles (username);
CREATE INDEX IF NOT EXISTS idx_user_profiles_email ON public.user_profiles (email_address);