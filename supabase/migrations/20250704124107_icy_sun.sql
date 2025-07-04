/*
  # Create admin account functionality
  
  1. New Tables
    - `admin_users`: Track admin users who get free access to all features
      - `id` (uuid, primary key)
      - `user_id` (uuid): References the authenticated user
      - `email` (text): Admin email address
      - `created_at` (timestamptz): When admin status was granted
  
  2. Functions
    - `is_admin_user`: Check if a user is an admin
    - `grant_admin_access`: Grant admin access to a user by email
  
  3. Security
    - Enable RLS on admin_users table
    - Add policies for admin access
    - Update embed access functions to include admin check
*/

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- RLS Policies for admin_users (only service role can manage)
CREATE POLICY "Service role can manage admin users"
  ON admin_users
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to check if a user is an admin
CREATE OR REPLACE FUNCTION is_admin_user(user_uuid uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_users 
    WHERE user_id = user_uuid
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to grant admin access by email
CREATE OR REPLACE FUNCTION grant_admin_access(admin_email text)
RETURNS boolean AS $$
DECLARE
  target_user_id uuid;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = admin_email;
  
  -- If user doesn't exist, return false
  IF target_user_id IS NULL THEN
    RETURN false;
  END IF;
  
  -- Insert admin record (ignore if already exists)
  INSERT INTO admin_users (user_id, email)
  VALUES (target_user_id, admin_email)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update the embed access function to include admin check
CREATE OR REPLACE FUNCTION user_has_active_embed_access(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  subscription_record user_subscriptions%ROWTYPE;
BEGIN
  -- Check if user is an admin first
  IF is_admin_user(user_uuid) THEN
    RETURN true;
  END IF;

  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = user_uuid;
  
  -- If no subscription record, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Free plan has no embed access (unless admin)
  IF subscription_record.plan_type = 'free' THEN
    RETURN false;
  END IF;
  
  -- Lifetime plan always has access if active
  IF subscription_record.plan_type = 'pro_lifetime' AND subscription_record.status = 'active' THEN
    RETURN true;
  END IF;
  
  -- Monthly plan: check if trial is active or subscription is active and not expired
  IF subscription_record.plan_type = 'pro_monthly' THEN
    -- Check trial period
    IF subscription_record.status = 'trial' AND subscription_record.trial_ends_at > now() THEN
      RETURN true;
    END IF;
    
    -- Check active subscription
    IF subscription_record.status = 'active' AND 
       (subscription_record.subscription_ends_at IS NULL OR subscription_record.subscription_ends_at > now()) THEN
      RETURN true;
    END IF;
  END IF;
  
  RETURN false;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant admin access to the specified email
SELECT grant_admin_access('austincardwell523@gmail.com');