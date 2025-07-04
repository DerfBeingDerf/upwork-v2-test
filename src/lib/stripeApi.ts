import { supabase } from './supabase';

export interface CheckoutSessionRequest {
  priceId: string;
  successUrl: string;
  cancelUrl: string;
  mode: 'payment' | 'subscription';
}

export interface CheckoutSessionResponse {
  sessionId: string;
  url: string;
}

export interface StripeSubscription {
  customer_id: string;
  subscription_id: string | null;
  subscription_status: string;
  price_id: string | null;
  current_period_start: number | null;
  current_period_end: number | null;
  cancel_at_period_end: boolean;
  payment_method_brand: string | null;
  payment_method_last4: string | null;
}

export interface StripeOrder {
  customer_id: string;
  order_id: number;
  checkout_session_id: string;
  payment_intent_id: string;
  amount_subtotal: number;
  amount_total: number;
  currency: string;
  payment_status: string;
  order_status: string;
  order_date: string;
}

export const createCheckoutSession = async (
  request: CheckoutSessionRequest
): Promise<CheckoutSessionResponse> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.access_token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      price_id: request.priceId,
      success_url: request.successUrl,
      cancel_url: request.cancelUrl,
      mode: request.mode,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create checkout session');
  }

  return await response.json();
};

export const getUserSubscription = async (): Promise<StripeSubscription | null> => {
  console.log('🔍 Fetching user subscription from database...');
  
  const { data, error } = await supabase
    .from('stripe_user_subscriptions')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('❌ Error fetching user subscription:', error);
    return null;
  }

  console.log('📊 Raw subscription data from DB:', JSON.stringify(data, null, 2));
  
  if (!data) {
    console.log('ℹ️ No subscription data found in database');
    return null;
  }

  // Log the specific status for debugging
  console.log('📋 Subscription status from database:', data.subscription_status);
  console.log('📅 Current period end:', data.current_period_end);
  console.log('📅 Current period end (date):', data.current_period_end ? new Date(data.current_period_end * 1000).toISOString() : 'null');
  console.log('📅 Current timestamp:', Math.floor(Date.now() / 1000));
  console.log('📅 Current timestamp (date):', new Date().toISOString());
  console.log('🆔 Subscription ID:', data.subscription_id);

  return data;
};

export const getUserOrders = async (): Promise<StripeOrder[]> => {
  const { data, error } = await supabase
    .from('stripe_user_orders')
    .select('*')
    .order('order_date', { ascending: false });

  if (error) {
    console.error('Error fetching user orders:', error);
    return [];
  }

  return data || [];
};

export const hasActiveSubscription = (subscription: StripeSubscription | null): boolean => {
  if (!subscription) return false;
  
  // CRITICAL: Include 'trialing' as an active status
  const activeStatuses = ['trialing', 'active', 'incomplete', 'incomplete_expired'];
  const isActive = activeStatuses.includes(subscription.subscription_status);
  
  console.log('🔍 Checking if subscription is active:');
  console.log('  Status:', subscription.subscription_status);
  console.log('  Active statuses:', activeStatuses);
  console.log('  Result:', isActive);
  
  return isActive;
};

export const hasLifetimeAccess = async (): Promise<boolean> => {
  console.log('🔍 Checking for lifetime access...');
  
  const orders = await getUserOrders();
  const hasLifetime = orders.some(order => 
    order.payment_status === 'paid' && 
    order.order_status === 'completed'
  );
  
  console.log('💎 Lifetime access check result:', hasLifetime);
  console.log('📦 Orders found:', orders.length);
  
  return hasLifetime;
};

export const hasEmbedAccess = async (): Promise<boolean> => {
  console.log('🔍 Checking embed access...');
  
  const [subscription, hasLifetime] = await Promise.all([
    getUserSubscription(),
    hasLifetimeAccess()
  ]);

  if (hasLifetime) {
    console.log('✅ Embed access granted: Lifetime access');
    return true;
  }
  
  if (!subscription) {
    console.log('❌ Embed access denied: No subscription');
    return false;
  }
  
  // CRITICAL: Check for active subscription states including 'trialing'
  const activeStates = ['trialing', 'active', 'incomplete', 'incomplete_expired'];
  if (activeStates.includes(subscription.subscription_status)) {
    console.log('✅ Embed access granted: Active subscription state -', subscription.subscription_status);
    return true;
  }
  
  // Check if canceled but still within current period
  if ((subscription.subscription_status === 'canceled' || subscription.subscription_status === 'cancelled') && 
      subscription.current_period_end && 
      subscription.current_period_end > Math.floor(Date.now() / 1000)) {
    console.log('✅ Embed access granted: Canceled but within period');
    return true;
  }
  
  console.log('❌ Embed access denied: Status -', subscription.subscription_status);
  return false;
};

export const cancelSubscription = async (): Promise<void> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.access_token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-cancel-subscription`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to cancel subscription');
  }
};

export const createCustomerPortalSession = async (): Promise<{ url: string }> => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError || !session?.access_token) {
    throw new Error('User not authenticated');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-customer-portal`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({
      return_url: `${window.location.origin}/profile`
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || 'Failed to create customer portal session');
  }

  return await response.json();
};