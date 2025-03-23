
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'
import { corsHeaders } from '../_shared/cors.ts'
import Stripe from 'https://esm.sh/stripe@13.6.0?target=deno'

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
})

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Get request body
    const { userId } = await req.json()

    console.log('Cancelling subscription for user:', userId)

    if (!userId) {
      return new Response(
        JSON.stringify({ success: false, message: 'User ID is required' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
      )
    }

    // Get subscription from Supabase
    const { data: subscription, error: fetchError } = await supabaseClient
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle()

    if (fetchError) {
      console.error('Error fetching subscription:', fetchError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error fetching subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    if (!subscription) {
      console.log('No subscription found for user:', userId)
      return new Response(
        JSON.stringify({ success: false, message: 'No subscription found' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Found subscription:', subscription)

    // If subscription has stripe_subscription_id, cancel it through Stripe
    if (subscription.stripe_subscription_id) {
      try {
        console.log('Cancelling subscription in Stripe')
        await stripe.subscriptions.update(subscription.stripe_subscription_id, {
          cancel_at_period_end: true,
        })
        console.log('Stripe subscription cancelled at period end')
      } catch (stripeError) {
        console.error('Error updating Stripe subscription:', stripeError)
        // Continue with database update even if Stripe operation fails
      }
    }

    // Update subscription in Supabase
    console.log('Updating subscription in Supabase')
    const { error: updateError } = await supabaseClient
      .from('subscriptions')
      .update({ cancel_at_period_end: true })
      .eq('user_id', userId)

    if (updateError) {
      console.error('Error updating subscription:', updateError)
      return new Response(
        JSON.stringify({ success: false, message: 'Error updating subscription' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      )
    }

    console.log('Subscription successfully cancelled')
    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return new Response(
      JSON.stringify({ success: false, message: error.message || 'An unexpected error occurred' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    )
  }
})
