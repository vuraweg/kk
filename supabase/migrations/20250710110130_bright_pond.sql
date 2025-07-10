/*
  # Mobile OTP Authentication Setup

  1. Database Changes
    - Update users table to use phone instead of email as primary identifier
    - Add phone column and make it the unique identifier
    - Update RLS policies for phone-based authentication
    - Update triggers and functions

  2. Security
    - Enable RLS on users table
    - Add policies for phone-based authentication
    - Update user creation trigger for phone auth
*/

-- First, let's safely add the phone column to the existing users table
DO $$
BEGIN
  -- Add phone column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'phone' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ADD COLUMN phone text;
  END IF;
END $$;

-- Update the users table structure for mobile auth
DO $$
BEGIN
  -- Make email nullable since we're using phone as primary identifier
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'users' AND column_name = 'email' AND is_nullable = 'NO' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ALTER COLUMN email DROP NOT NULL;
  END IF;
END $$;

-- Drop existing unique constraint on email if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'users' AND constraint_name = 'users_email_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users DROP CONSTRAINT users_email_key;
  END IF;
END $$;

-- Add unique constraint on phone
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'users' AND constraint_name = 'users_phone_key' AND table_schema = 'public'
  ) THEN
    ALTER TABLE public.users ADD CONSTRAINT users_phone_key UNIQUE (phone);
  END IF;
END $$;

-- Enable RLS on users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to recreate them for phone auth
DROP POLICY IF EXISTS "Users can read own data" ON public.users;
DROP POLICY IF EXISTS "Users can update own data" ON public.users;
DROP POLICY IF EXISTS "Allow insert for authenticated users" ON public.users;
DROP POLICY IF EXISTS "Allow all operations on users" ON public.users;

-- Create RLS policies for phone-based authentication
CREATE POLICY "Users can read own data"
  ON public.users
  FOR SELECT
  TO public
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data"
  ON public.users
  FOR UPDATE
  TO public
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Allow insert for authenticated users"
  ON public.users
  FOR INSERT
  TO public
  WITH CHECK (auth.uid() = id);

-- Function to handle new user creation for phone auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, phone, email, name, avatar_url, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.phone,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name', 
      NEW.raw_user_meta_data->>'name',
      CASE 
        WHEN NEW.phone IS NOT NULL THEN 'User ' || RIGHT(NEW.phone, 4)
        WHEN NEW.email IS NOT NULL THEN split_part(NEW.email, '@', 1)
        ELSE 'User'
      END
    ),
    NEW.raw_user_meta_data->>'avatar_url',
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    phone = COALESCE(EXCLUDED.phone, users.phone),
    email = COALESCE(EXCLUDED.email, users.email),
    name = COALESCE(EXCLUDED.name, users.name),
    avatar_url = COALESCE(EXCLUDED.avatar_url, users.avatar_url),
    updated_at = now();
  
  RETURN NEW;
EXCEPTION
  WHEN OTHERS THEN
    -- Log error but don't fail the auth process
    RAISE WARNING 'Error creating user profile: %', SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Create trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_users_phone ON public.users(phone);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON public.users(created_at);

-- Update existing users to have phone numbers if they don't have them
-- This is for migration purposes - in production you might handle this differently
UPDATE public.users 
SET phone = '+91' || LPAD((RANDOM() * 9000000000 + 1000000000)::bigint::text, 10, '0')
WHERE phone IS NULL AND id NOT IN (
  SELECT id FROM public.users WHERE phone IS NOT NULL
);

-- Add a function to update the updated_at timestamp automatically
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at on row updates
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();