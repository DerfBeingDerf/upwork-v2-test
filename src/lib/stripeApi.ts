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
  const { data, error } = await supabase
    .from('stripe_user_subscriptions')
    .select('*')
    .maybeSingle();

  if (error) {
    console.error('Error fetching user subscription:', error);
    return null;
  }

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
  
  const activeStatuses = ['trialing', 'active'];
  return activeStatuses.includes(subscription.subscription_status);
};

export const hasLifetimeAccess = async (): Promise<boolean> => {
  try {
    const orders = await getUserOrders();
    return orders.some(order => 
      order.payment_status === 'paid' && 
      order.order_status === 'completed'
    );
  } catch (error) {
    console.error('Error checking lifetime access:', error);
    return false;
  }
};

export const hasEmbedAccess = async (): Promise<boolean> => {
  const [subscription, hasLifetime] = await Promise.all([
    getUserSubscription(),
    hasLifetimeAccess()
  ]);

  return hasLifetime || hasActiveSubscription(subscription);
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