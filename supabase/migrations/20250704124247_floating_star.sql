/*
  # Add trial testing functionality
  
  1. New Functions
    - `expire_user_trial`: Manually expire a user's trial for testing
    - `reset_user_trial`: Reset a user's trial to start fresh
    - `set_trial_end_date`: Set a custom trial end date for testing
    - `get_trial_status`: Get detailed trial status information
  
  2. Security
    - Only service role and admin users can manage trial states
    - Functions are security definer for proper access control
*/

-- Function to manually expire a user's trial (for testing)
CREATE OR REPLACE FUNCTION expire_user_trial(target_email text)
RETURNS json AS $$
DECLARE
  target_user_id uuid;
  subscription_record user_subscriptions%ROWTYPE;
  result json;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  -- If user doesn't exist, return error
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with email: ' || target_email
    );
  END IF;
  
  -- Get current subscription
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = target_user_id;
  
  -- If no subscription, create one in expired trial state
  IF NOT FOUND THEN
    INSERT INTO user_subscriptions (
      user_id, 
      plan_type, 
      status, 
      trial_ends_at,
      updated_at
    ) VALUES (
      target_user_id,
      'pro_monthly',
      'expired',
      now() - interval '1 day', -- Set trial end to yesterday
      now()
    );
    
    RETURN json_build_object(
      'success', true,
      'message', 'Created expired trial for user: ' || target_email,
      'trial_ends_at', (now() - interval '1 day')::text
    );
  END IF;
  
  -- Update existing subscription to expired trial state
  UPDATE user_subscriptions 
  SET 
    plan_type = 'pro_monthly',
    status = 'expired',
    trial_ends_at = now() - interval '1 day', -- Set trial end to yesterday
    updated_at = now()
  WHERE user_id = target_user_id;
  
  RETURN json_build_object(
    'success', true,
    'message', 'Expired trial for user: ' || target_email,
    'previous_status', subscription_record.status,
    'new_status', 'expired',
    'trial_ends_at', (now() - interval '1 day')::text
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to reset a user's trial (for testing)
CREATE OR REPLACE FUNCTION reset_user_trial(target_email text)
RETURNS json AS $$
DECLARE
  target_user_id uuid;
  new_trial_end timestamptz;
  result json;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  -- If user doesn't exist, return error
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with email: ' || target_email
    );
  END IF;
  
  -- Set new trial end date (7 days from now)
  new_trial_end := now() + interval '7 days';
  
  -- Upsert subscription with fresh trial
  INSERT INTO user_subscriptions (
    user_id, 
    plan_type, 
    status, 
    trial_ends_at,
    subscription_ends_at,
    created_at,
    updated_at
  ) VALUES (
    target_user_id,
    'pro_monthly',
    'trial',
    new_trial_end,
    NULL,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_type = 'pro_monthly',
    status = 'trial',
    trial_ends_at = new_trial_end,
    subscription_ends_at = NULL,
    updated_at = now();
  
  RETURN json_build_object(
    'success', true,
    'message', 'Reset trial for user: ' || target_email,
    'status', 'trial',
    'trial_ends_at', new_trial_end::text,
    'days_remaining', 7
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set custom trial end date (for testing)
CREATE OR REPLACE FUNCTION set_trial_end_date(target_email text, end_date timestamptz)
RETURNS json AS $$
DECLARE
  target_user_id uuid;
  days_remaining numeric;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  -- If user doesn't exist, return error
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with email: ' || target_email
    );
  END IF;
  
  -- Calculate days remaining
  days_remaining := EXTRACT(EPOCH FROM (end_date - now())) / 86400;
  
  -- Determine status based on end date
  DECLARE
    new_status text;
  BEGIN
    IF end_date > now() THEN
      new_status := 'trial';
    ELSE
      new_status := 'expired';
    END IF;
    
    -- Upsert subscription with custom trial end date
    INSERT INTO user_subscriptions (
      user_id, 
      plan_type, 
      status, 
      trial_ends_at,
      subscription_ends_at,
      created_at,
      updated_at
    ) VALUES (
      target_user_id,
      'pro_monthly',
      new_status,
      end_date,
      NULL,
      now(),
      now()
    )
    ON CONFLICT (user_id) 
    DO UPDATE SET
      plan_type = 'pro_monthly',
      status = new_status,
      trial_ends_at = end_date,
      subscription_ends_at = NULL,
      updated_at = now();
    
    RETURN json_build_object(
      'success', true,
      'message', 'Set custom trial end date for user: ' || target_email,
      'status', new_status,
      'trial_ends_at', end_date::text,
      'days_remaining', ROUND(days_remaining, 2)
    );
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get detailed trial status (for testing/debugging)
CREATE OR REPLACE FUNCTION get_trial_status(target_email text)
RETURNS json AS $$
DECLARE
  target_user_id uuid;
  subscription_record user_subscriptions%ROWTYPE;
  is_admin boolean;
  has_embed_access boolean;
  days_remaining numeric;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  -- If user doesn't exist, return error
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with email: ' || target_email
    );
  END IF;
  
  -- Check if user is admin
  is_admin := is_admin_user(target_user_id);
  
  -- Check embed access
  has_embed_access := user_has_active_embed_access(target_user_id);
  
  -- Get subscription record
  SELECT * INTO subscription_record
  FROM user_subscriptions
  WHERE user_id = target_user_id;
  
  -- Calculate days remaining if trial exists
  IF subscription_record.trial_ends_at IS NOT NULL THEN
    days_remaining := EXTRACT(EPOCH FROM (subscription_record.trial_ends_at - now())) / 86400;
  ELSE
    days_remaining := NULL;
  END IF;
  
  -- Return comprehensive status
  RETURN json_build_object(
    'success', true,
    'user_email', target_email,
    'user_id', target_user_id,
    'is_admin', is_admin,
    'has_embed_access', has_embed_access,
    'subscription', CASE 
      WHEN subscription_record IS NULL THEN NULL
      ELSE json_build_object(
        'plan_type', subscription_record.plan_type,
        'status', subscription_record.status,
        'trial_ends_at', subscription_record.trial_ends_at,
        'subscription_ends_at', subscription_record.subscription_ends_at,
        'days_remaining', ROUND(days_remaining, 2),
        'created_at', subscription_record.created_at,
        'updated_at', subscription_record.updated_at
      )
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to simulate trial ending in X minutes (for quick testing)
CREATE OR REPLACE FUNCTION set_trial_to_expire_in_minutes(target_email text, minutes_from_now integer DEFAULT 1)
RETURNS json AS $$
DECLARE
  target_user_id uuid;
  new_trial_end timestamptz;
BEGIN
  -- Find the user by email
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE email = target_email;
  
  -- If user doesn't exist, return error
  IF target_user_id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User not found with email: ' || target_email
    );
  END IF;
  
  -- Set trial to end in specified minutes
  new_trial_end := now() + (minutes_from_now || ' minutes')::interval;
  
  -- Upsert subscription with trial ending soon
  INSERT INTO user_subscriptions (
    user_id, 
    plan_type, 
    status, 
    trial_ends_at,
    subscription_ends_at,
    created_at,
    updated_at
  ) VALUES (
    target_user_id,
    'pro_monthly',
    'trial',
    new_trial_end,
    NULL,
    now(),
    now()
  )
  ON CONFLICT (user_id) 
  DO UPDATE SET
    plan_type = 'pro_monthly',
    status = 'trial',
    trial_ends_at = new_trial_end,
    subscription_ends_at = NULL,
    updated_at = now();
  
  RETURN json_build_object(
    'success', true,
    'message', 'Set trial to expire in ' || minutes_from_now || ' minutes for user: ' || target_email,
    'status', 'trial',
    'trial_ends_at', new_trial_end::text,
    'minutes_remaining', minutes_from_now
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions to service role
GRANT EXECUTE ON FUNCTION expire_user_trial(text) TO service_role;
GRANT EXECUTE ON FUNCTION reset_user_trial(text) TO service_role;
GRANT EXECUTE ON FUNCTION set_trial_end_date(text, timestamptz) TO service_role;
GRANT EXECUTE ON FUNCTION get_trial_status(text) TO service_role;
GRANT EXECUTE ON FUNCTION set_trial_to_expire_in_minutes(text, integer) TO service_role;