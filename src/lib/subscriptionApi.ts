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
    console.log('=== EMBED ACCESS CHECK START ===');
    console.log('Checking embed access for user:', userId);
    
    // Check for lifetime access first (one-time payment)
    const hasLifetime = await hasLifetimeAccess();
    console.log('Has lifetime access:', hasLifetime);
    if (hasLifetime) {
      console.log('✅ EMBED ACCESS GRANTED: Lifetime access');
      return 'active';
    }

    // Check for active subscription
    const subscription = await getUserSubscription();
    console.log('Raw subscription data:', JSON.stringify(subscription, null, 2));
    
    if (!subscription) {
      console.log('❌ No subscription found');
      return 'no_trial';
    }

    // Determine state based on subscription status
    const status = subscription.subscription_status;
    console.log('Subscription status from DB:', status);
    
    // CRITICAL: Active states that allow embed access
    const activeStates = [
      'trialing',           // Free trial period
      'active',             // Paid and active
      'incomplete',         // Payment processing but trial active
      'incomplete_expired'  // Payment failed but might still be in grace period
    ];
    
    console.log('Checking if status is in active states:', activeStates);
    console.log('Status check result:', activeStates.includes(status));
    
    if (activeStates.includes(status)) {
      // Additional check for incomplete states - ensure we're still within valid period
      if (status === 'incomplete' || status === 'incomplete_expired') {
        const now = Math.floor(Date.now() / 1000);
        const periodEnd = subscription.current_period_end;
        console.log('Incomplete status check - Now:', now, 'Period end:', periodEnd);
        
        if (periodEnd && periodEnd > now) {
          console.log('✅ EMBED ACCESS GRANTED: Incomplete but within period');
          return 'active';
        } else {
          console.log('❌ EMBED ACCESS DENIED: Incomplete and period expired');
          return 'trial_ended';
        }
      }
      
      console.log('✅ EMBED ACCESS GRANTED: Active subscription state');
      return 'active';
    }
    
    // Check if canceled but still within current period
    if (status === 'canceled' || status === 'cancelled') {
      const now = Math.floor(Date.now() / 1000);
      const periodEnd = subscription.current_period_end;
      console.log('Canceled status check - Now:', now, 'Period end:', periodEnd);
      
      if (periodEnd && periodEnd > now) {
        console.log('✅ EMBED ACCESS GRANTED: Canceled but still within period');
        return 'active';
      } else {
        console.log('❌ EMBED ACCESS DENIED: Canceled and period ended');
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
      console.log('❌ EMBED ACCESS DENIED: Subscription in ended state:', status);
      return 'trial_ended';
    }
    
    // Not started state
    if (status === 'not_started') {
      console.log('❌ EMBED ACCESS DENIED: Subscription not started');
      return 'no_trial';
    }
    
    // Default to trial ended for unknown states
    console.log('❌ EMBED ACCESS DENIED: Unknown subscription state, defaulting to trial_ended');
    console.log('=== EMBED ACCESS CHECK END ===');
    return 'trial_ended';
    
  } catch (error) {
    console.error('❌ ERROR checking embed access state:', error);
    console.log('=== EMBED ACCESS CHECK END (ERROR) ===');
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
    console.log('=== COLLECTION EMBED ACCESS CHECK START ===');
    console.log('Checking embed access for collection:', collectionId);
    
    // First get the collection owner
    const { data: collection, error: collectionError } = await supabase
      .from('collections')
      .select('user_id')
      .eq('id', collectionId)
      .single();

    if (collectionError) {
      console.error('❌ Error fetching collection:', collectionError);
      return 'error';
    }

    console.log('Collection owner user ID:', collection.user_id);
    
    // Then check the owner's embed access state
    const accessState = await getEmbedAccessState(collection.user_id);
    console.log('Collection owner embed access state:', accessState);
    console.log('=== COLLECTION EMBED ACCESS CHECK END ===');
    
    return accessState;
  } catch (error) {
    console.error('❌ Error checking collection embed access state:', error);
    console.log('=== COLLECTION EMBED ACCESS CHECK END (ERROR) ===');
    return 'error';
  }
};

// Legacy function for backward compatibility
export const checkCollectionEmbedAccess = async (collectionId: string): Promise<boolean> => {
  const state = await checkCollectionEmbedAccessState(collectionId);
  return state === 'active';
};