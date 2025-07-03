import { supabase } from './supabase';

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

// Get user's current subscription
export const getUserSubscription = async (userId: string): Promise<UserSubscription | null> => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      // No subscription found, create default free subscription
      return await createDefaultSubscription(userId);
    }
    throw new Error(`Error fetching subscription: ${error.message}`);
  }

  return data;
};

// Create default free subscription for new users
export const createDefaultSubscription = async (userId: string): Promise<UserSubscription> => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .insert({
      user_id: userId,
      plan_type: 'free',
      status: 'active'
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error creating default subscription: ${error.message}`);
  }

  return data;
};

// Start a trial subscription
export const startTrialSubscription = async (userId: string): Promise<UserSubscription> => {
  const trialEndDate = new Date();
  trialEndDate.setDate(trialEndDate.getDate() + 7); // 7 days from now

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_type: 'pro_monthly',
      status: 'trial',
      trial_ends_at: trialEndDate.toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error starting trial: ${error.message}`);
  }

  return data;
};

// Upgrade to monthly subscription
export const upgradeToMonthly = async (userId: string): Promise<UserSubscription> => {
  const subscriptionEndDate = new Date();
  subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1); // 1 month from now

  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_type: 'pro_monthly',
      status: 'active',
      trial_ends_at: null,
      subscription_ends_at: subscriptionEndDate.toISOString(),
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error upgrading to monthly: ${error.message}`);
  }

  return data;
};

// Upgrade to lifetime subscription
export const upgradeToLifetime = async (userId: string): Promise<UserSubscription> => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .upsert({
      user_id: userId,
      plan_type: 'pro_lifetime',
      status: 'active',
      trial_ends_at: null,
      subscription_ends_at: null, // Lifetime has no end date
      updated_at: new Date().toISOString()
    })
    .select()
    .single();

  if (error) {
    throw new Error(`Error upgrading to lifetime: ${error.message}`);
  }

  return data;
};

// Cancel subscription
export const cancelSubscription = async (userId: string): Promise<UserSubscription> => {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update({
      status: 'cancelled',
      updated_at: new Date().toISOString()
    })
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    throw new Error(`Error cancelling subscription: ${error.message}`);
  }

  return data;
};

// Check if user has active embed access
export const hasActiveEmbedAccess = async (userId: string): Promise<boolean> => {
  const { data, error } = await supabase
    .rpc('user_has_active_embed_access', { user_uuid: userId });

  if (error) {
    console.error('Error checking embed access:', error);
    return false;
  }

  return data || false;
};

// Check if collection owner has active embed access
export const checkCollectionEmbedAccess = async (collectionId: string): Promise<boolean> => {
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
};