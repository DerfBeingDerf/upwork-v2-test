/*
  # Add paused status to stripe subscription enum
  
  1. Changes
    - Add 'paused' to stripe_subscription_status enum type if it doesn't exist
    - This allows tracking when subscriptions are paused after trial ends
  
  2. Security
    - No changes to RLS policies needed
*/

-- Add 'paused' to the stripe_subscription_status enum if it doesn't already exist
DO $$
BEGIN
  -- Check if 'paused' value already exists in the enum
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum 
    WHERE enumlabel = 'paused' 
    AND enumtypid = (
      SELECT oid FROM pg_type WHERE typname = 'stripe_subscription_status'
    )
  ) THEN
    -- Add 'paused' to the enum
    ALTER TYPE stripe_subscription_status ADD VALUE 'paused';
  END IF;
END $$;