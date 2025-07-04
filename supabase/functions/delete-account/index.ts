import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

// Helper function to create responses with CORS headers
function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    const authHeader = req.headers.get('Authorization')!;
    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    if (!user) {
      return corsResponse({ error: 'User not found' }, 404);
    }

    console.log(`Starting account deletion for user: ${user.id}`);

    // Step 1: Get Stripe customer information
    const { data: customer } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .maybeSingle();

    // Step 2: Cancel Stripe subscriptions and delete customer
    if (customer?.customer_id) {
      try {
        console.log(`Canceling Stripe subscriptions for customer: ${customer.customer_id}`);
        
        // Get all subscriptions for this customer
        const subscriptions = await stripe.subscriptions.list({
          customer: customer.customer_id,
          status: 'all',
        });

        // Cancel all active subscriptions immediately
        for (const subscription of subscriptions.data) {
          if (['active', 'trialing', 'past_due', 'unpaid'].includes(subscription.status)) {
            await stripe.subscriptions.cancel(subscription.id);
            console.log(`Canceled subscription: ${subscription.id}`);
          }
        }

        // Delete the Stripe customer
        await stripe.customers.del(customer.customer_id);
        console.log(`Deleted Stripe customer: ${customer.customer_id}`);
      } catch (stripeError) {
        console.error('Error cleaning up Stripe data:', stripeError);
        // Continue with deletion even if Stripe cleanup fails
      }
    }

    // Step 3: Delete audio files from storage
    try {
      console.log('Deleting audio files from storage...');
      
      const { data: audioFiles } = await supabase
        .from('audio_files')
        .select('storage_path')
        .eq('user_id', user.id);

      if (audioFiles && audioFiles.length > 0) {
        const filePaths = audioFiles.map(file => file.storage_path);
        const { error: storageError } = await supabase.storage
          .from('audio-files')
          .remove(filePaths);

        if (storageError) {
          console.error('Error deleting files from storage:', storageError);
          // Continue with deletion even if storage cleanup fails
        } else {
          console.log(`Deleted ${filePaths.length} files from storage`);
        }
      }
    } catch (storageError) {
      console.error('Error during storage cleanup:', storageError);
      // Continue with deletion
    }

    // Step 4: Delete cover images from storage
    try {
      console.log('Deleting cover images from storage...');
      
      const { data: collections } = await supabase
        .from('collections')
        .select('cover_url')
        .eq('user_id', user.id)
        .not('cover_url', 'is', null);

      if (collections && collections.length > 0) {
        const coverPaths = collections
          .map(collection => {
            if (collection.cover_url) {
              try {
                const url = new URL(collection.cover_url);
                const pathParts = url.pathname.split('/');
                return pathParts.slice(-3).join('/'); // Get userId/covers/filename
              } catch {
                return null;
              }
            }
            return null;
          })
          .filter(Boolean);

        if (coverPaths.length > 0) {
          const { error: coverStorageError } = await supabase.storage
            .from('audio-files')
            .remove(coverPaths);

          if (coverStorageError) {
            console.error('Error deleting cover images from storage:', coverStorageError);
          } else {
            console.log(`Deleted ${coverPaths.length} cover images from storage`);
          }
        }
      }
    } catch (coverError) {
      console.error('Error during cover image cleanup:', coverError);
      // Continue with deletion
    }

    // Step 5: Delete database records (in correct order due to foreign key constraints)
    try {
      console.log('Deleting database records...');

      // Delete collection tracks first (references collections and audio_files)
      await supabase
        .from('collection_tracks')
        .delete()
        .in('collection_id', 
          supabase
            .from('collections')
            .select('id')
            .eq('user_id', user.id)
        );

      // Delete collections
      await supabase
        .from('collections')
        .delete()
        .eq('user_id', user.id);

      // Delete audio files
      await supabase
        .from('audio_files')
        .delete()
        .eq('user_id', user.id);

      // Mark Stripe records as deleted (soft delete to preserve audit trail)
      if (customer?.customer_id) {
        await supabase
          .from('stripe_subscriptions')
          .update({ deleted_at: new Date().toISOString() })
          .eq('customer_id', customer.customer_id);

        await supabase
          .from('stripe_orders')
          .update({ deleted_at: new Date().toISOString() })
          .eq('customer_id', customer.customer_id);

        await supabase
          .from('stripe_customers')
          .update({ deleted_at: new Date().toISOString() })
          .eq('user_id', user.id);
      }

      // Delete user subscription record
      await supabase
        .from('user_subscriptions')
        .delete()
        .eq('user_id', user.id);

      // Delete admin user record if exists
      await supabase
        .from('admin_users')
        .delete()
        .eq('user_id', user.id);

      // Delete user profile
      await supabase
        .from('users')
        .delete()
        .eq('id', user.id);

      console.log('Deleted all database records');
    } catch (dbError) {
      console.error('Error deleting database records:', dbError);
      throw new Error('Failed to delete user data from database');
    }

    // Step 6: Delete the auth user (this should be last)
    try {
      console.log('Deleting auth user...');
      
      const { error: deleteAuthError } = await supabase.auth.admin.deleteUser(user.id);
      
      if (deleteAuthError) {
        console.error('Error deleting auth user:', deleteAuthError);
        throw new Error('Failed to delete user account');
      }

      console.log(`Successfully deleted auth user: ${user.id}`);
    } catch (authError) {
      console.error('Error during auth user deletion:', authError);
      throw new Error('Failed to delete user account');
    }

    console.log(`Account deletion completed for user: ${user.id}`);

    return corsResponse({ 
      success: true, 
      message: 'Account successfully deleted' 
    });

  } catch (error: any) {
    console.error(`Account deletion error: ${error.message}`);
    return corsResponse({ error: error.message }, 500);
  }
});