import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[REVENUECAT-WEBHOOK] ${step}${detailsStr}`);
};

// RevenueCat event types
type RevenueCatEventType = 
  | "INITIAL_PURCHASE"
  | "RENEWAL"
  | "CANCELLATION"
  | "UNCANCELLATION"
  | "NON_RENEWING_PURCHASE"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_EXTENDED"
  | "BILLING_ISSUE"
  | "PRODUCT_CHANGE"
  | "EXPIRATION"
  | "TRANSFER";

interface RevenueCatEvent {
  event: {
    type: RevenueCatEventType;
    app_user_id: string;
    product_id: string;
    entitlement_ids?: string[];
    price_in_purchased_currency?: number;
    currency?: string;
    purchased_at_ms?: number;
    expiration_at_ms?: number;
    store?: string;
    environment?: string;
    is_family_share?: boolean;
    original_app_user_id?: string;
  };
  api_version: string;
}

// Product ID to coins mapping
const COIN_PRODUCTS: Record<string, number> = {
  "coins_100": 100,
  "coins_500": 500,
  "coins_1000": 1000,
  "coins_5000": 5000,
  "com.pixelrunner.coins_100": 100,
  "com.pixelrunner.coins_500": 500,
  "com.pixelrunner.coins_1000": 1000,
  "com.pixelrunner.coins_5000": 5000,
};

// Skin product IDs
const SKIN_PRODUCTS: Record<string, string> = {
  "skin_cosmic_guardian": "cosmic_guardian",
  "skin_frost_queen": "frost_queen",
  "skin_thunder_lord": "thunder_lord",
  "skin_phoenix": "phoenix",
  "com.pixelrunner.skin_cosmic_guardian": "cosmic_guardian",
  "com.pixelrunner.skin_frost_queen": "frost_queen",
  "com.pixelrunner.skin_thunder_lord": "thunder_lord",
  "com.pixelrunner.skin_phoenix": "phoenix",
};

// VIP subscription products
const VIP_PRODUCTS = [
  "vip_monthly",
  "vip_yearly",
  "com.pixelrunner.vip_monthly",
  "com.pixelrunner.vip_yearly",
];

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  // Verify authorization (optional but recommended)
  const authHeader = req.headers.get("Authorization");
  const webhookSecret = Deno.env.get("REVENUECAT_WEBHOOK_SECRET");
  
  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    logStep("ERROR", { message: "Unauthorized webhook request" });
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const payload: RevenueCatEvent = await req.json();
    const event = payload.event;

    logStep("Event received", { 
      type: event.type, 
      appUserId: event.app_user_id,
      productId: event.product_id,
      environment: event.environment,
    });

    // Skip sandbox events in production if needed
    // if (event.environment === "SANDBOX") {
    //   logStep("Skipping sandbox event");
    //   return new Response(JSON.stringify({ received: true }), { status: 200 });
    // }

    // app_user_id should be the Supabase user ID
    const userId = event.app_user_id;
    
    // Get profile by user_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("id, coins")
      .eq("user_id", userId)
      .single();

    if (profileError || !profile) {
      // Try finding by profile ID directly (if app_user_id is profile.id)
      const { data: profileById } = await supabaseAdmin
        .from("profiles")
        .select("id, coins")
        .eq("id", userId)
        .single();

      if (!profileById) {
        logStep("ERROR", { message: "Profile not found", userId });
        return new Response(JSON.stringify({ error: "Profile not found" }), { status: 404 });
      }
      
      await processEvent(event, profileById);
    } else {
      await processEvent(event, profile);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR", { message: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function processEvent(
  event: RevenueCatEvent["event"], 
  profile: { id: string; coins: number }
) {
  const productId = event.product_id;

  switch (event.type) {
    case "INITIAL_PURCHASE":
    case "NON_RENEWING_PURCHASE":
      await handlePurchase(event, profile);
      break;

    case "RENEWAL":
      await handleRenewal(event, profile);
      break;

    case "CANCELLATION":
      await handleCancellation(event, profile);
      break;

    case "EXPIRATION":
      await handleExpiration(event, profile);
      break;

    case "UNCANCELLATION":
      await handleUncancellation(event, profile);
      break;

    case "BILLING_ISSUE":
      await handleBillingIssue(event, profile);
      break;

    default:
      logStep("Unhandled event type", { type: event.type });
  }
}

async function handlePurchase(
  event: RevenueCatEvent["event"],
  profile: { id: string; coins: number }
) {
  const productId = event.product_id;

  // Check if it's a coin purchase
  const coins = COIN_PRODUCTS[productId];
  if (coins) {
    const newBalance = (profile.coins || 0) + coins;
    await supabaseAdmin
      .from("profiles")
      .update({ coins: newBalance })
      .eq("id", profile.id);
    
    logStep("Coins added", { profileId: profile.id, coins, newBalance });
    return;
  }

  // Check if it's a skin purchase
  const skinId = SKIN_PRODUCTS[productId];
  if (skinId) {
    const { data: existing } = await supabaseAdmin
      .from("owned_skins")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("skin_id", skinId)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin
        .from("owned_skins")
        .insert({ profile_id: profile.id, skin_id: skinId });
      
      logStep("Skin unlocked", { profileId: profile.id, skinId });
    }
    return;
  }

  // Check if it's a VIP subscription
  if (VIP_PRODUCTS.some(p => productId.includes(p.replace("com.pixelrunner.", "")))) {
    await activateVipSubscription(event, profile);
    return;
  }

  logStep("Unknown product", { productId });
}

async function handleRenewal(
  event: RevenueCatEvent["event"],
  profile: { id: string; coins: number }
) {
  logStep("Processing renewal", { profileId: profile.id, productId: event.product_id });

  // Update VIP subscription
  await activateVipSubscription(event, profile);

  // Increment months subscribed
  const { data: stats } = await supabaseAdmin
    .from("vip_stats")
    .select("months_subscribed, loyalty_tier")
    .eq("profile_id", profile.id)
    .single();

  if (stats) {
    const newMonths = (stats.months_subscribed || 0) + 1;
    let newTier = stats.loyalty_tier;

    // Update loyalty tier based on months
    if (newMonths >= 12) newTier = "diamond";
    else if (newMonths >= 6) newTier = "gold";
    else if (newMonths >= 3) newTier = "silver";

    await supabaseAdmin
      .from("vip_stats")
      .update({ 
        months_subscribed: newMonths,
        loyalty_tier: newTier,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profile.id);

    logStep("VIP stats updated", { profileId: profile.id, months: newMonths, tier: newTier });
  }
}

async function handleCancellation(
  event: RevenueCatEvent["event"],
  profile: { id: string; coins: number }
) {
  logStep("Processing cancellation", { profileId: profile.id });

  // Note: User still has access until expiration_at_ms
  // We update the status to show it won't renew
  await supabaseAdmin
    .from("vip_subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);

  logStep("VIP marked as cancelled (access continues until expiration)", { profileId: profile.id });
}

async function handleExpiration(
  event: RevenueCatEvent["event"],
  profile: { id: string; coins: number }
) {
  logStep("Processing expiration", { profileId: profile.id });

  await supabaseAdmin
    .from("vip_subscriptions")
    .update({
      status: "expired",
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);

  logStep("VIP expired", { profileId: profile.id });
}

async function handleUncancellation(
  event: RevenueCatEvent["event"],
  profile: { id: string; coins: number }
) {
  logStep("Processing uncancellation", { profileId: profile.id });

  await activateVipSubscription(event, profile);
  logStep("VIP reactivated", { profileId: profile.id });
}

async function handleBillingIssue(
  event: RevenueCatEvent["event"],
  profile: { id: string; coins: number }
) {
  logStep("Billing issue detected", { profileId: profile.id });

  await supabaseAdmin
    .from("vip_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);
}

async function activateVipSubscription(
  event: RevenueCatEvent["event"],
  profile: { id: string; coins: number }
) {
  const expirationDate = event.expiration_at_ms 
    ? new Date(event.expiration_at_ms).toISOString() 
    : null;

  const purchaseDate = event.purchased_at_ms
    ? new Date(event.purchased_at_ms).toISOString()
    : new Date().toISOString();

  const { data: existing } = await supabaseAdmin
    .from("vip_subscriptions")
    .select("id")
    .eq("profile_id", profile.id)
    .maybeSingle();

  const subscriptionData = {
    profile_id: profile.id,
    status: "active",
    current_period_start: purchaseDate,
    current_period_end: expirationDate,
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabaseAdmin
      .from("vip_subscriptions")
      .update(subscriptionData)
      .eq("profile_id", profile.id);
  } else {
    await supabaseAdmin
      .from("vip_subscriptions")
      .insert({ ...subscriptionData, created_at: new Date().toISOString() });

    // Create VIP stats entry for new subscriber
    await supabaseAdmin
      .from("vip_stats")
      .upsert({
        profile_id: profile.id,
        first_subscribed_at: purchaseDate,
        months_subscribed: 1,
        loyalty_tier: "bronze",
      }, { onConflict: "profile_id" });
  }

  logStep("VIP subscription activated", { profileId: profile.id, expiresAt: expirationDate });
}
