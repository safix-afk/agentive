import { corsHeaders } from '../_shared/cors.ts';
import Stripe from 'https://esm.sh/stripe@12.0.0?target=deno';

// Initialize Stripe
const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
});

export async function handlePurchase(req, supabase, botInfo, sandboxMode) {
  // Only handle POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Parse request body
    const body = await req.json();
    const { amount, paymentMethodId } = body;

    // Validate amount
    if (!amount || typeof amount !== 'number' || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Please provide a valid positive amount of credits to purchase' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate price
    const pricePerCredit = 0.001; // $0.001 per credit
    const totalPrice = amount * pricePerCredit;

    // Create invoice record
    const invoiceId = crypto.randomUUID();
    const invoiceData = {
      id: invoiceId,
      bot_id: botInfo.id,
      amount: amount,
      price_per_credit: pricePerCredit,
      total_price: totalPrice,
      status: 'PENDING',
      payment_provider: 'STRIPE',
      created_at: new Date().toISOString()
    };

    // For sandbox mode, simulate a successful payment
    if (sandboxMode) {
      // Generate a fake payment intent ID
      const fakePaymentIntentId = `pi_sandbox_${Date.now()}`;
      
      // Update invoice with sandbox info
      const sandboxInvoice = {
        ...invoiceData,
        stripe_payment_intent_id: fakePaymentIntentId,
        stripe_customer_id: `cus_sandbox_${botInfo.id}`,
        status: 'PAID',
        receipt_url: `https://dashboard.stripe.com/test/payments/${fakePaymentIntentId}`,
        invoice_url: `/invoices/${invoiceId}`
      };
      
      // Save the invoice
      const { error } = await supabase
        .from('invoices')
        .insert(sandboxInvoice);
      
      if (error) {
        console.error('Error saving sandbox invoice:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to save invoice' }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // Return success response
      return new Response(
        JSON.stringify({
          success: true,
          creditsRemaining: botInfo.creditsRemaining + amount,
          invoiceUrl: sandboxInvoice.invoice_url,
          invoiceId: sandboxInvoice.id
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // For real mode, process payment with Stripe
    // Save initial invoice
    const { error: saveError } = await supabase
      .from('invoices')
      .insert(invoiceData);
    
    if (saveError) {
      console.error('Error saving invoice:', saveError);
      return new Response(
        JSON.stringify({ error: 'Failed to save invoice' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    try {
      // Get or create Stripe customer
      let customerId = null;
      const { data: botData } = await supabase
        .from('bot_credentials')
        .select('stripe_customer_id')
        .eq('id', botInfo.id)
        .single();
      
      customerId = botData?.stripe_customer_id;

      if (!customerId) {
        const customer = await stripe.customers.create({
          name: botInfo.name,
          metadata: {
            botId: botInfo.id,
          },
        });
        customerId = customer.id;
        
        // Update bot with Stripe customer ID
        await supabase
          .from('bot_credentials')
          .update({ stripe_customer_id: customerId })
          .eq('id', botInfo.id);
      }

      // Create payment intent
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalPrice * 100), // Convert to cents
        currency: "usd",
        customer: customerId,
        payment_method: paymentMethodId,
        confirm: !!paymentMethodId,
        automatic_payment_methods: !paymentMethodId ? { enabled: true } : undefined,
        metadata: {
          botId: botInfo.id,
          invoiceId: invoiceId,
          credits: amount,
        },
      });

      // Update invoice with Stripe info
      await supabase
        .from('invoices')
        .update({
          stripe_payment_intent_id: paymentIntent.id,
          stripe_customer_id: customerId
        })
        .eq('id', invoiceId);

      // If payment is successful or requires no further action
      if (
        paymentIntent.status === "succeeded" ||
        paymentIntent.status === "requires_capture"
      ) {
        // Update invoice status
        await supabase
          .from('invoices')
          .update({
            status: 'PAID',
            receipt_url: `https://dashboard.stripe.com/payments/${paymentIntent.id}`,
            invoice_url: `/invoices/${invoiceId}`
          })
          .eq('id', invoiceId);

        // Update credit balance
        const { data: balanceData } = await supabase
          .from('credit_balances')
          .select('*')
          .eq('bot_id', botInfo.id)
          .single();
        
        if (balanceData) {
          await supabase
            .from('credit_balances')
            .update({
              credits_remaining: balanceData.credits_remaining + amount,
              total_credits_purchased: balanceData.total_credits_purchased + amount
            })
            .eq('bot_id', botInfo.id);
        } else {
          // Create new credit balance if it doesn't exist
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(0, 0, 0, 0);
          
          await supabase
            .from('credit_balances')
            .insert({
              bot_id: botInfo.id,
              credits_remaining: amount,
              total_credits_purchased: amount,
              daily_limit: 1000, // Default daily limit
              reset_date: tomorrow.toISOString()
            });
        }

        // Return success response
        return new Response(
          JSON.stringify({
            success: true,
            creditsRemaining: (balanceData?.credits_remaining || 0) + amount,
            invoiceUrl: `/invoices/${invoiceId}`,
            invoiceId: invoiceId
          }),
          { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      } else {
        // Payment requires further action
        return new Response(
          JSON.stringify({
            success: false,
            message: `Payment requires further action: ${paymentIntent.status}`,
            clientSecret: paymentIntent.client_secret,
            invoiceId: invoiceId
          }),
          { status: 202, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    } catch (stripeError) {
      console.error('Stripe error:', stripeError);

      // Update invoice status to failed
      await supabase
        .from('invoices')
        .update({
          status: 'FAILED',
          notes: `Payment failed: ${stripeError.message}`
        })
        .eq('id', invoiceId);

      return new Response(
        JSON.stringify({
          success: false,
          error: `Payment failed: ${stripeError.message}`
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Error processing purchase:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}
