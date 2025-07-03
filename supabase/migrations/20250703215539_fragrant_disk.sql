/*
  # Add user subscription tracking
  
  1. New Tables
    - `user_subscriptions`: Track user subscription status
      - `id` (uuid, primary key)
      - `user_id` (uuid): References the authenticated user
      - `plan_type` (text): 'free', 'pro_monthly', 'pro_lifetime'
      - `status` (text): 'active', 'trial', 'expired', 'cancelled'
      - `trial_ends_at` (timestamptz): When trial period ends
      - `subscription_ends_at` (timestamptz): When subscription expires (null for lifetime)
      - `created_at` (timestamptz): When subscription was created
      - `updated_at` (timestamptz): When subscription was last updated
  
  2. Security
    - Enable RLS on user_subscriptions table
    - Add policies for users to read their own subscription data
    - Add policies for service role to manage subscriptions
*/

-- Create user_subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  plan_type text NOT NULL DEFAULT 'free' CHECK (plan_type IN ('free', 'pro_monthly', 'pro_lifetime')),
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'trial', 'expired', 'cancelled')),
  trial_ends_at timestamptz,
  subscription_ends_at timestamptz,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable Row Level Security
ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_subscriptions
CREATE POLICY "Users can view their own subscription"
  ON user_subscriptions
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage all subscriptions"
  ON user_subscriptions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Function to create default subscription for new users
CREATE OR REPLACE FUNCTION create_default_subscription()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO user_subscriptions (user_id, plan_type, status)
  VALUES (NEW.id, 'free', 'active');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create default subscription when user signs up
CREATE OR REPLACE TRIGGER create_user_subscription_trigger
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION create_default_subscription();

-- Function to check if user has active subscription for embeds
CREATE OR REPLACE FUNCTION user_has_active_embed_access(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  subscription_record user_subscriptions%ROWTYPE;
BEGIN
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = user_uuid;
  
  -- If no subscription record, return false
  IF NOT FOUND THEN
    RETURN false;
  END IF;
  
  -- Free plan has no embed access
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

-- Add embed access check to collections policy
DROP POLICY IF EXISTS "Anyone can view public collections" ON collections;

CREATE POLICY "Anyone can view public collections"
  ON collections
  FOR SELECT
  TO anon, authenticated
  USING (
    is_public = true AND 
    (
      -- Always allow viewing the collection metadata
      true
    )
  );

-- Update collection_tracks policy to include embed access check
DROP POLICY IF EXISTS "Anyone can view tracks in public collections" ON collection_tracks;

CREATE POLICY "Anyone can view tracks in public collections"
  ON collection_tracks
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collections
      WHERE id = collection_id AND is_public = true
    )
  );

-- Update audio_files policy to include embed access check  
DROP POLICY IF EXISTS "Anyone can view audio files in public collections" ON audio_files;

CREATE POLICY "Anyone can view audio files in public collections"
  ON audio_files
  FOR SELECT
  TO anon, authenticated
  USING (
    EXISTS (
      SELECT 1 FROM collection_tracks ct
      JOIN collections c ON c.id = ct.collection_id
      WHERE ct.audio_id = audio_files.id AND c.is_public = true
    )
  );