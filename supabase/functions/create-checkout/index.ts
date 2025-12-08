import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[CREATE-CHECKOUT] ${step}${detailsStr}`);
};

// Stripe Product/Price mapping
const STRIPE_PRODUCTS = {
  // VIP Subscriptions
  vip_monthly: { priceId: 'price_1SboDkEQjcZdgqoDYiEnHhSI', mode: 'subscription' as const },
  vip_yearly: { priceId: 'price_1Sc3B0EQjcZdgqoD1A8ANbL6', mode: 'subscription' as const },
  
  // Coin Packs (one-time)
  coins_100: { priceId: 'price_1Sc3BAEQjcZdgqoDBFfzouVE', mode: 'payment' as const, coins: 100 },
  coins_500: { priceId: 'price_1Sc3BKEQjcZdgqoDeSxIPfkq', mode: 'payment' as const, coins: 500 },
  coins_1000: { priceId: 'price_1Sc3BUEQjcZdgqoDQf7WYLMr', mode: 'payment' as const, coins: 1000 },
  coins_5000: { priceId: 'price_1Sc3BnEQjcZdgqoD5DiV8I5i', mode: 'payment' as const, coins: 5000 },
  
  // Premium Skins (one-time)
  skin_cosmic_guardian: { priceId: 'price_1Sc3CFEQjcZdgqoDFYCRGiBS', mode: 'payment' as const, skinId: 'cosmic_guardian' },
  skin_frost_queen: { priceId: 'price_1Sc3CaEQjcZdgqoDg2hDiiQf', mode: 'payment' as const, skinId: 'frost_queen' },
  skin_thunder_lord: { priceId: 'price_1Sc3CkEQjcZdgqoDjl938bzr', mode: 'payment' as const, skinId: 'thunder_lord' },
  skin_phoenix: { priceId: 'price_1Sc3CwEQjcZdgqoDtHVy0aGF', mode: 'payment' as const, skinId: 'phoenix' },
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { productId, quantity = 1 } = await req.json();
    
    if (!productId) {
      throw new Error("Product ID is required");
    }

    const product = STRIPE_PRODUCTS[productId as keyof typeof STRIPE_PRODUCTS];
    if (!product) {
      throw new Error(`Invalid product ID: ${productId}`);
    }

    logStep("Product found", { productId, product });

    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? ""
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header provided");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: userData, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !userData.user?.email) {
      throw new Error("User not authenticated or email not available");
    }

    const user = userData.user;
    logStep("User authenticated", { userId: user.id, email: user.email });

    const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
      apiVersion: "2025-08-27.basil",
    });

    // Check for existing customer
    const customers = await stripe.customers.list({ email: user.email, limit: 1 });
    let customerId: string | undefined;
    
    if (customers.data.length > 0) {
      customerId = customers.data[0].id;
      logStep("Found existing customer", { customerId });
    }

    const origin = req.headers.get("origin") || "https://117d2a10-2c0e-45f1-9de6-8106ff98d63d.lovableproject.com";
    
    // Build success URL with purchase info for fulfillment
    const successParams = new URLSearchParams({
      payment_success: 'true',
      product: productId,
    });
    
    // Add product-specific data
    if ('coins' in product) {
      successParams.set('coins', String(product.coins));
    }
    if ('skinId' in product) {
      successParams.set('skinId', product.skinId);
    }

    const sessionConfig: Stripe.Checkout.SessionCreateParams = {
      customer: customerId,
      customer_email: customerId ? undefined : user.email,
      line_items: [
        {
          price: product.priceId,
          quantity: quantity,
        },
      ],
      mode: product.mode,
      success_url: `${origin}/?${successParams.toString()}`,
      cancel_url: `${origin}/?payment_cancelled=true`,
      metadata: {
        user_id: user.id,
        product_id: productId,
        ...('coins' in product ? { coins: String(product.coins) } : {}),
        ...('skinId' in product ? { skin_id: product.skinId } : {}),
      },
    };

    logStep("Creating checkout session", sessionConfig);

    const session = await stripe.checkout.sessions.create(sessionConfig);
    logStep("Checkout session created", { sessionId: session.id, url: session.url });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
