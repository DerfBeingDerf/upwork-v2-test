/*
  # Fix user signup database error

  1. New Tables
    - `users` table to store user profile information
      - `id` (uuid, primary key, matches auth.users.id)
      - `email` (text, user's email)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `users` table
    - Add policies for users to read/update their own data
    - Service role can manage all users

  3. Triggers
    - Create trigger function to automatically create user profile on signup
    - Handle user profile creation when auth.users record is created
*/

-- Create users table if it doesn't exist
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  -- Drop existing policies if they exist
  DROP POLICY IF EXISTS "Users can view their own profile" ON users;
  DROP POLICY IF EXISTS "Users can update their own profile" ON users;
  DROP POLICY IF EXISTS "Service role can manage all users" ON users;
  
  -- Create new policies
  CREATE POLICY "Users can view their own profile"
    ON users
    FOR SELECT
    TO authenticated
    USING (auth.uid() = id);

  CREATE POLICY "Users can update their own profile"
    ON users
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

  CREATE POLICY "Service role can manage all users"
    ON users
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);
END $$;

-- Create or replace the trigger function
CREATE OR REPLACE FUNCTION create_user_profile()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    NOW(),
    NOW()
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating user profile for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS create_user_profile_trigger ON auth.users;

-- Create the trigger
CREATE TRIGGER create_user_profile_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_user_profile();

-- Create default subscription function if it doesn't exist
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_subscriptions (user_id, plan_type, status)
  VALUES (
    NEW.id,
    'free',
    'active'
  );
  RETURN NEW;
EXCEPTION
  WHEN others THEN
    -- Log the error but don't fail the user creation
    RAISE LOG 'Error creating default subscription for %: %', NEW.id, SQLERRM;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop existing subscription trigger if it exists
DROP TRIGGER IF EXISTS create_default_subscription_trigger ON public.users;

-- Create the subscription trigger
CREATE TRIGGER create_default_subscription_trigger
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();