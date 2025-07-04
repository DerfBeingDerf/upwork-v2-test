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
      return 'active';
    }

    // Check for active subscription
    const subscription = await getUserSubscription();
    if (!subscription) {
      return 'no_trial';
    }

    // Determine state based on subscription status
    switch (subscription.subscription_status) {
      case 'trialing':
      case 'active':
        return 'active';
      case 'paused':
        return 'trial_ended';
      case 'not_started':
        return 'no_trial';
      default:
        return 'trial_ended'; // For canceled, unpaid, etc.
    }
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

const activeStatuses = ['trialing', 'active'];
return activeStatuses.includes(subscription.subscription_status);
try {
  // First get the collection owner
  const { data: collection, error: collectionError } = await supabase
    .from('collections')
    .select('user_id')
    .eq('id', collectionId)
    .single();

  if (collectionError) {
    console.error('Error fetching collection:', collectionError);
    return false;
  }

  // Then check if the owner has embed access
  return await hasActiveEmbedAccess(collection.user_id);
} catch (error) {
  console.error('Error checking collection embed access:', error);
  return false;
}