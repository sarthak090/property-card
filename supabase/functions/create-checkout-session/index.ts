
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";
import { corsHeaders } from '../_shared/cors.ts';

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY')!, {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
});

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

Deno.serve(async (req) => {
  console.log('Received request method:', req.method);
  
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const token = req.headers.get('authorization')?.replace('Bearer ', '');
    console.log('Received token:', token ? 'present' : 'missing');

    if (!token) {
      throw new Error('No authorization token provided');
    }

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    
    if (authError || !user) {
      console.error('Auth error:', authError);
      throw new Error('Invalid authentication');
    }

    const { userId } = await req.json();
    console.log('Received userId:', userId);

    if (!userId || userId !== user.id) {
      throw new Error('Invalid user ID provided');
    }

    // Create Stripe customer
    const customer = await stripe.customers.create({
      metadata: {
        supabaseUserId: user.id
      }
    });

    // Create checkout session with thank you page redirect
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      payment_method_types: ['card'],
      mode: 'subscription',
      line_items: [
        {
          price: Deno.env.get('STRIPE_PRICE_ID')!,
          quantity: 1,
        },
      ],
      success_url: `${req.headers.get('origin')}/thank-you`,
      cancel_url: `${req.headers.get('origin')}`,
      subscription_data: {
        trial_period_days: 2
      }
    });

    console.log('Created session:', session.id);

    return new Response(
      JSON.stringify({ url: session.url }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      },
    );
  }
});
