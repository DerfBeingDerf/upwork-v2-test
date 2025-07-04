import { supabase } from './supabase';
import { getUserSubscription, getUserOrders, hasLifetimeAccess } from './stripeApi';

export type PlanType = 'free' | 'pro_monthly' | 'pro_lifetime';
export type SubscriptionStatus = 'active' | 'trial' | 'expired' | 'cancelled';

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

// Check if user has active embed access using Stripe data
export const hasActiveEmbedAccess = async (userId: string): Promise<boolean> => {
  try {
    // Check for lifetime access first (one-time payment)
    const hasLifetime = await hasLifetimeAccess();
    if (hasLifetime) {
      return true;
    }

    // Check for active subscription
    const subscription = await getUserSubscription();
    if (!subscription) {
      return false;
    }

    const activeStatuses = ['trialing', 'active'];
    return activeStatuses.includes(subscription.subscription_status);
  } catch (error) {
    console.error('Error checking embed access:', error);
    return false;
  }
};

// Check if collection owner has active embed access
export const checkCollectionEmbedAccess = async (collectionId: string): Promise<boolean> => {
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
};