/*
  # Fix subscription status handling for free trial

  1. Database Schema Updates
    - Update stripe_subscription_status enum to include all Stripe statuses
    - Ensure proper status mapping for trials
    
  2. Security
    - Maintain existing RLS policies
    - No changes to access control
*/

-- First, add any missing statuses to the enum if they don't exist
DO $$ 
BEGIN
    -- Check if 'trialing' status exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'trialing' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stripe_subscription_status')
    ) THEN
        ALTER TYPE stripe_subscription_status ADD VALUE 'trialing';
    END IF;
    
    -- Check if 'incomplete' status exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'incomplete' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stripe_subscription_status')
    ) THEN
        ALTER TYPE stripe_subscription_status ADD VALUE 'incomplete';
    END IF;
    
    -- Check if 'incomplete_expired' status exists, if not add it
    IF NOT EXISTS (
        SELECT 1 FROM pg_enum 
        WHERE enumlabel = 'incomplete_expired' 
        AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'stripe_subscription_status')
    ) THEN
        ALTER TYPE stripe_subscription_status ADD VALUE 'incomplete_expired';
    END IF;
END $$;

-- Update any existing 'not_started' subscriptions that should be 'trialing'
-- This handles cases where webhooks might have missed or been delayed
UPDATE stripe_subscriptions 
SET status = 'trialing'::stripe_subscription_status
WHERE status = 'not_started'::stripe_subscription_status
  AND subscription_id IS NOT NULL
  AND current_period_end IS NOT NULL
  AND current_period_end > EXTRACT(epoch FROM NOW());

-- Create an index to speed up subscription status queries
CREATE INDEX IF NOT EXISTS idx_stripe_subscriptions_status_active 
ON stripe_subscriptions (customer_id, status) 
WHERE status IN ('trialing', 'active', 'incomplete', 'incomplete_expired');