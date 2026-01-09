import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@12.0.0"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') ?? '', {
  apiVersion: '2022-11-15',
})

serve(async (req) => {
  const { subscriptionId, provider } = await req.json()

  if (provider !== 'stripe') {
    return new Response(
      JSON.stringify({ error: 'Only stripe is supported currently' }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }

  try {
    const deleted = await stripe.subscriptions.cancel(subscriptionId)

    return new Response(
      JSON.stringify({ status: deleted.status }),
      { headers: { 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    )
  }
})
