import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripeWebhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!);

Deno.serve(async (req) => {
  try {
    // Handle OPTIONS request for CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response(null, { status: 204 });
    }

    if (req.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    // get the signature from the header
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('No signature found', { status: 400 });
    }

    // get the raw body
    const body = await req.text();

    // verify the webhook signature
    let event: Stripe.Event;

    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, stripeWebhookSecret);
    } catch (error: any) {
      console.error(`Webhook signature verification failed: ${error.message}`);
      return new Response(`Webhook signature verification failed: ${error.message}`, { status: 400 });
    }

    EdgeRuntime.waitUntil(handleEvent(event));

    return Response.json({ received: true });
  } catch (error: any) {
    console.error('Error processing webhook:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

async function handleEvent(event: Stripe.Event) {
  const stripeData = event?.data?.object ?? {};

  if (!stripeData) {
    return;
  }

  if (!('customer' in stripeData)) {
    return;
  }

  // Handle trial ending - pause subscription instead of charging
  if (event.type === 'invoice.payment_failed') {
    const invoice = stripeData as Stripe.Invoice;
    if (invoice.billing_reason === 'subscription_cycle' && invoice.subscription && invoice.attempt_count === 1) {
      try {
        // Pause the subscription when trial ends and payment fails
        await stripe.subscriptions.update(invoice.subscription as string, {
          pause_collection: {
            behavior: 'void',
          },
        });
        console.info(`Paused subscription ${invoice.subscription} after trial ended`);
      } catch (error) {
        console.error(`Failed to pause subscription ${invoice.subscription}:`, error);
      }
    }
  }

  // Handle successful trial setup - CRITICAL: Sync immediately when trial starts
  if (event.type === 'customer.subscription.created') {
    const subscription = stripeData as Stripe.Subscription;
    console.info(`Subscription created: ${subscription.id}, status: ${subscription.status}`);
    // Always sync when subscription is created, regardless of status
    EdgeRuntime.waitUntil(syncCustomerFromStripe(subscription.customer as string));
    return;
  }

  // Handle subscription updates (including trial to active transitions)
  if (event.type === 'customer.subscription.updated') {
    const subscription = stripeData as Stripe.Subscription;
    console.info(`Subscription updated: ${subscription.id}, status: ${subscription.status}`);
    EdgeRuntime.waitUntil(syncCustomerFromStripe(subscription.customer as string));
    return;
  }

  // Handle checkout session completion - CRITICAL: Sync immediately after checkout
  if (event.type === 'checkout.session.completed') {
    const session = stripeData as Stripe.Checkout.Session;
    console.info(`Checkout session completed: ${session.id}, mode: ${session.mode}`);
    
    if (session.mode === 'subscription') {
      // For subscription mode, sync immediately to capture trial status
      EdgeRuntime.waitUntil(syncCustomerFromStripe(session.customer as string));
    } else if (session.mode === 'payment' && session.payment_status === 'paid') {
      // Handle one-time payment
      try {
        const {
          id: checkout_session_id,
          payment_intent,
          amount_subtotal,
          amount_total,
          currency,
        } = session;

        const { error: orderError } = await supabase.from('stripe_orders').insert({
          checkout_session_id,
          payment_intent_id: payment_intent,
          customer_id: session.customer,
          amount_subtotal,
          amount_total,
          currency,
          payment_status: session.payment_status,
          status: 'completed',
        });

        if (orderError) {
          console.error('Error inserting order:', orderError);
          return;
        }
        console.info(`Successfully processed one-time payment for session: ${checkout_session_id}`);
      } catch (error) {
        console.error('Error processing one-time payment:', error);
      }
    }
    return;
  }

  // for one time payments, we only listen for the checkout.session.completed event
  if (event.type === 'payment_intent.succeeded' && event.data.object.invoice === null) {
    return;
  }

  const { customer: customerId } = stripeData;

  if (!customerId || typeof customerId !== 'string') {
    console.error(`No customer received on event: ${JSON.stringify(event)}`);
    return;
  }

  // For other events, sync the customer data
  console.info(`Processing event ${event.type} for customer: ${customerId}`);
  await syncCustomerFromStripe(customerId);
}

// based on the excellent https://github.com/t3dotgg/stripe-recommendations
async function syncCustomerFromStripe(customerId: string) {
  try {
    console.log(`Starting sync for customer: ${customerId}`);
    
    // fetch latest subscription data from Stripe
    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      limit: 1,
      status: 'all',
      expand: ['data.default_payment_method'],
    });

    if (subscriptions.data.length === 0) {
      console.info(`No subscriptions found for customer: ${customerId}`);
      const { error: noSubError } = await supabase.from('stripe_subscriptions').upsert(
        {
          customer_id: customerId,
          status: 'not_started',
        },
        {
          onConflict: 'customer_id',
        },
      );

      if (noSubError) {
        console.error('Error updating subscription status:', noSubError);
        throw new Error('Failed to update subscription status in database');
      }
      return;
    }

    // assumes that a customer can only have a single subscription
    const subscription = subscriptions.data[0];
    
    console.log(`Syncing subscription ${subscription.id} with status: ${subscription.status}`);
    console.log(`Trial start: ${subscription.trial_start}, Trial end: ${subscription.trial_end}`);
    console.log(`Current period: ${subscription.current_period_start} - ${subscription.current_period_end}`);

    // store subscription state - CRITICAL: Ensure all trial information is captured
    const { error: subError } = await supabase.from('stripe_subscriptions').upsert(
      {
        customer_id: customerId,
        subscription_id: subscription.id,
        price_id: subscription.items.data[0].price.id,
        current_period_start: subscription.current_period_start,
        current_period_end: subscription.current_period_end,
        cancel_at_period_end: subscription.cancel_at_period_end,
        status: subscription.status, // This should capture 'trialing' status correctly
        ...(subscription.default_payment_method && typeof subscription.default_payment_method !== 'string'
          ? {
              payment_method_brand: subscription.default_payment_method.card?.brand ?? null,
              payment_method_last4: subscription.default_payment_method.card?.last4 ?? null,
            }
          : {}),
      },
      {
        onConflict: 'customer_id',
      },
    );

    if (subError) {
      console.error('Error syncing subscription:', subError);
      throw new Error('Failed to sync subscription in database');
    }
    
    console.info(`Successfully synced subscription for customer: ${customerId} with status: ${subscription.status}`);
  } catch (error) {
    console.error(`Failed to sync subscription for customer ${customerId}:`, error);
    throw error;
  }
}