import { supabase } from './supabase';
import { getUserSubscription, hasLifetimeAccess } from './stripeApi';

export type PlanType = 'free' | 'pro_monthly' | 'pro_lifetime';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';

export type EmbedAccessState = 
  | 'active'           // Has active subscription or lifetime access
  | 'trial_ended'      // Had a trial that ended/paused
  | 'no_trial'         // Never started a trial
  | 'error';           // Error checking status

export interface UserSubscription {
  id: string;
  user_id: string;
  plan_type: PlanType;
  status: SubscriptionStatus;
  trial_ends_at?: string;
  subscription_ends_at?: string;
  created_at: string;
  updated_at: string;
}

// Get detailed embed access state for a user
export const getEmbedAccessState = async (userId: string): Promise<EmbedAccessState> => {
  try {
    // Check for lifetime access first (one-time payment)
    const hasLifetime = await hasLifetimeAccess();
    if (hasLifetime) {
      console.log('User has lifetime access');
      return 'active';
    }

    // Check for active subscription
    const subscription = await getUserSubscription();
    console.log('Subscription data:', subscription);
    
    if (!subscription) {
      console.log('No subscription found');
      return 'no_trial';
    }

    // Determine state based on subscription status
    const status = subscription.subscription_status;
    console.log('Subscription status:', status);
    
    // Active states that allow embed access
    const activeStates = [
      'trialing',
      'active', 
      'incomplete',
      'incomplete_expired'
    ];
    
    if (activeStates.includes(status)) {
      // For incomplete states, check if we're still within trial period
      if (status === 'incomplete' || status === 'incomplete_expired') {
        if (subscription.current_period_end && subscription.current_period_end > Math.floor(Date.now() / 1000)) {
          console.log('Within trial period for incomplete subscription');
          return 'active';
        } else {
          console.log('Trial period ended for incomplete subscription');
          return 'trial_ended';
        }
      }
      
      console.log('Subscription is active');
      return 'active';
    }
    
    // Check if canceled but still within current period
    if (status === 'canceled' || status === 'cancelled') {
      if (subscription.current_period_end && subscription.current_period_end > Math.floor(Date.now() / 1000)) {
        console.log('Canceled but still within current period');
        return 'active';
      } else {
        console.log('Canceled and period ended');
        return 'trial_ended';
      }
    }
    
    // States that indicate trial ended or subscription issues
    const endedStates = [
      'paused',
      'past_due',
      'unpaid'
    ];
    
    if (endedStates.includes(status)) {
      console.log('Subscription in ended state:', status);
      return 'trial_ended';
    }
    
    // Not started state
    if (status === 'not_started') {
      console.log('Subscription not started');
      return 'no_trial';
    }
    
    // Default to trial ended for unknown states
    console.log('Unknown subscription state, defaulting to trial_ended');
    return 'trial_ended';
    
  } catch (error) {
    console.error('Error checking embed access state:', error);
    return 'error';
  }
};

// Check if user has active embed access (backward compatibility)
export const hasActiveEmbedAccess = async (userId: string): Promise<boolean> => {
  const state = await getEmbedAccessState(userId);
  return state === 'active';
};

// Check embed access state for a collection
export const checkCollectionEmbedAccessState = async (collectionId: string): Promise<EmbedAccessState> => {
  try {
    // First get the collection owner
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (collectionError) {
      console.error('Error fetching collection:', collectionError);
      return 'error';
    }

    console.log('Checking embed access for collection owner:', collection.user_id);
    
    // Then check the owner's embed access state
    return await getEmbedAccessState(collection.user_id);
  } catch (error) {
    console.error('Error checking collection embed access state:', error);
    return 'error';
  }
};

// Legacy function for backward compatibility
export const checkCollectionEmbedAccess = async (collectionId: string): Promise<boolean> => {
  const state = await checkCollectionEmbedAccessState(collectionId);
  return state === 'active';
};