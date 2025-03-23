
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Define CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('Received OPTIONS request');
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Webhook called - processing request');
    
    // Get the stripe signature from headers
    const signature = req.headers.get('stripe-signature');
    
    if (!signature) {
      console.error('No Stripe signature found in headers');
      console.log('Headers received:', Object.fromEntries(req.headers.entries()));
      throw new Error('No signature provided');
    }

    // Get the raw body
    const body = await req.text();
    console.log('Received webhook body length:', body.length);

    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET');
    if (!webhookSecret) {
      console.error('STRIPE_WEBHOOK_SECRET not found in environment');
      throw new Error('Webhook secret not configured');
    }

    // Verify the event using constructEventAsync instead of constructEvent
    console.log('Attempting to construct event with signature:', signature.substring(0, 10) + '...');
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    console.log('Event verified. Event type:', event.type);

    switch (event.type) {
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        const subscription = event.data.object;
        const customerId = subscription.customer as string;
        
        // Get customer to find Supabase user ID
        console.log('Retrieving customer:', customerId);
        const customer = await stripe.customers.retrieve(customerId);
        const userId = customer.metadata.supabaseUserId;

        if (!userId) {
          console.error('No user ID found in customer metadata');
          throw new Error('No user ID found in customer metadata');
        }

        console.log('Updating subscription for user:', userId);

        // Update subscription in database
        const { error: upsertError } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: userId,
            stripe_customer_id: customerId,
            stripe_subscription_id: subscription.id,
            status: subscription.status,
            current_period_end: new Date(subscription.current_period_end * 1000),
            trial_end: subscription.trial_end 
              ? new Date(subscription.trial_end * 1000)
              : null,
          });

        if (upsertError) {
          console.error('Error updating subscription:', upsertError);
          throw upsertError;
        }

        console.log('Successfully updated subscription');
        break;

      default:
        console.log('Unhandled event type:', event.type);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (err) {
    console.error('Error processing webhook:', err);
    console.error('Error details:', err.message);
    return new Response(
      JSON.stringify({ error: err.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
