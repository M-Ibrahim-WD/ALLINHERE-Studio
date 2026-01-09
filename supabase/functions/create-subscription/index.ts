import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  const { userId, plan, provider } = await req.json()

  if (provider !== 'stripe') {
    return new Response(
      JSON.stringify({ error: 'Only stripe is supported currently' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    // 1. Get or create customer
    const customers = await stripe.customers.search({
      query: `metadata['supabase_id']:'${userId}'`,
    })

    let customerId
    if (customers.data.length > 0) {
      customerId = customers.data[0].id
    } else {
      const customer = await stripe.customers.create({
        metadata: { supabase_id: userId },
      })
      customerId = customer.id
    }

    // 2. Create subscription (or PaymentIntent for one-time)
    // For simplicity, we'll create a PaymentIntent for now as "subscription" logic varies
    // But for a real SaaS, you'd create a Subscription here.
    
    // Mapping plan to price ID (You need to set these in your Stripe Dashboard)
    const priceId = plan === 'PRO' ? 'price_pro_id' : 'price_basic_id'

    // Example: Create a subscription
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      payment_settings: { save_default_payment_method: 'on_subscription' },
      expand: ['latest_invoice.payment_intent'],
    })

    const invoice = subscription.latest_invoice as any
    const paymentIntent = invoice.payment_intent as any

    return new Response(
      JSON.stringify({
        subscriptionId: subscription.id,
        clientSecret: paymentIntent.client_secret,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
