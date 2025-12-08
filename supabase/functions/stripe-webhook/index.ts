import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import Stripe from "https://esm.sh/stripe@18.5.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const stripe = new Stripe(Deno.env.get("STRIPE_SECRET_KEY") || "", {
  apiVersion: "2025-08-27.basil",
});

const supabaseAdmin = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  { auth: { persistSession: false } }
);

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[STRIPE-WEBHOOK] ${step}${detailsStr}`);
};

serve(async (req) => {
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = Deno.env.get("STRIPE_WEBHOOK_SECRET");

  if (!signature) {
    logStep("ERROR", { message: "No signature provided" });
    return new Response("No signature", { status: 400 });
  }

  let event: Stripe.Event;
  const body = await req.text();

  try {
    // If webhook secret is configured, verify the signature
    if (webhookSecret) {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } else {
      // For testing without webhook secret (not recommended for production)
      event = JSON.parse(body) as Stripe.Event;
      logStep("WARNING", { message: "No webhook secret configured, skipping signature verification" });
    }
  } catch (err) {
    logStep("ERROR", { message: "Webhook signature verification failed", error: err instanceof Error ? err.message : String(err) });
    return new Response(`Webhook Error: ${err instanceof Error ? err.message : "Unknown error"}`, { status: 400 });
  }

  logStep("Event received", { type: event.type, id: event.id });

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        await handleCheckoutCompleted(session);
        break;
      }

      case "customer.subscription.created":
      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionUpdate(subscription);
        break;
      }

      case "customer.subscription.deleted": {
        const subscription = event.data.object as Stripe.Subscription;
        await handleSubscriptionCancelled(subscription);
        break;
      }

      case "invoice.payment_succeeded": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentSucceeded(invoice);
        break;
      }

      case "invoice.payment_failed": {
        const invoice = event.data.object as Stripe.Invoice;
        await handleInvoicePaymentFailed(invoice);
        break;
      }

      default:
        logStep("Unhandled event type", { type: event.type });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { "Content-Type": "application/json" },
      status: 200,
    });
  } catch (error) {
    logStep("ERROR processing event", { error: error instanceof Error ? error.message : String(error) });
    return new Response(JSON.stringify({ error: "Webhook handler failed" }), {
      headers: { "Content-Type": "application/json" },
      status: 500,
    });
  }
});

async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  logStep("Processing checkout completed", { sessionId: session.id, mode: session.mode });

  const customerEmail = session.customer_email || session.customer_details?.email;
  if (!customerEmail) {
    logStep("ERROR", { message: "No customer email found" });
    return;
  }

  // Find user by email
  const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
  const user = userData?.users?.find(u => u.email === customerEmail);
  
  if (!user) {
    logStep("ERROR", { message: "User not found", email: customerEmail });
    return;
  }

  // Get profile
  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    logStep("ERROR", { message: "Profile not found", userId: user.id });
    return;
  }

  const metadata = session.metadata || {};

  // Handle coin purchases
  if (metadata.coins) {
    const coins = parseInt(metadata.coins);
    const { error } = await supabaseAdmin
      .from("profiles")
      .update({ coins: supabaseAdmin.rpc("", {}) }) // We need to increment
      .eq("id", profile.id);
    
    // Actually increment coins
    const { data: currentProfile } = await supabaseAdmin
      .from("profiles")
      .select("coins")
      .eq("id", profile.id)
      .single();
    
    if (currentProfile) {
      await supabaseAdmin
        .from("profiles")
        .update({ coins: (currentProfile.coins || 0) + coins })
        .eq("id", profile.id);
      
      logStep("Coins added", { profileId: profile.id, coins });
    }
  }

  // Handle skin purchases
  if (metadata.skinId) {
    const { data: existing } = await supabaseAdmin
      .from("owned_skins")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("skin_id", metadata.skinId)
      .maybeSingle();

    if (!existing) {
      await supabaseAdmin
        .from("owned_skins")
        .insert({ profile_id: profile.id, skin_id: metadata.skinId });
      
      logStep("Skin unlocked", { profileId: profile.id, skinId: metadata.skinId });
    }
  }

  // Handle VIP subscription
  if (session.mode === "subscription" && session.subscription) {
    const subscription = await stripe.subscriptions.retrieve(session.subscription as string);
    await updateVipSubscription(profile.id, subscription, session.customer as string);
  }
}

async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  logStep("Processing subscription update", { 
    subscriptionId: subscription.id, 
    status: subscription.status 
  });

  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) {
    logStep("ERROR", { message: "Customer deleted" });
    return;
  }

  const customerEmail = (customer as Stripe.Customer).email;
  if (!customerEmail) {
    logStep("ERROR", { message: "No customer email" });
    return;
  }

  // Find user and profile
  const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
  const user = userData?.users?.find(u => u.email === customerEmail);
  
  if (!user) {
    logStep("ERROR", { message: "User not found", email: customerEmail });
    return;
  }

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) {
    logStep("ERROR", { message: "Profile not found" });
    return;
  }

  await updateVipSubscription(profile.id, subscription, customerId);
}

async function handleSubscriptionCancelled(subscription: Stripe.Subscription) {
  logStep("Processing subscription cancelled", { subscriptionId: subscription.id });

  const customerId = subscription.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  
  if (customer.deleted) return;

  const customerEmail = (customer as Stripe.Customer).email;
  if (!customerEmail) return;

  const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
  const user = userData?.users?.find(u => u.email === customerEmail);
  if (!user) return;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return;

  // Update subscription status to cancelled
  await supabaseAdmin
    .from("vip_subscriptions")
    .update({
      status: "cancelled",
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);

  logStep("VIP subscription cancelled", { profileId: profile.id });
}

async function handleInvoicePaymentSucceeded(invoice: Stripe.Invoice) {
  if (!invoice.subscription) return;
  
  logStep("Invoice payment succeeded", { 
    invoiceId: invoice.id, 
    subscriptionId: invoice.subscription 
  });

  // Subscription renewal - update the period dates
  const subscription = await stripe.subscriptions.retrieve(invoice.subscription as string);
  
  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const customerEmail = (customer as Stripe.Customer).email;
  if (!customerEmail) return;

  const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
  const user = userData?.users?.find(u => u.email === customerEmail);
  if (!user) return;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return;

  // Update VIP stats for renewal
  await supabaseAdmin
    .from("vip_stats")
    .update({
      months_subscribed: supabaseAdmin.rpc("", {}),
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);

  // Actually increment months
  const { data: stats } = await supabaseAdmin
    .from("vip_stats")
    .select("months_subscribed")
    .eq("profile_id", profile.id)
    .single();

  if (stats) {
    await supabaseAdmin
      .from("vip_stats")
      .update({ 
        months_subscribed: (stats.months_subscribed || 0) + 1,
        updated_at: new Date().toISOString(),
      })
      .eq("profile_id", profile.id);
  }

  await updateVipSubscription(profile.id, subscription, customerId);
  logStep("VIP renewed", { profileId: profile.id });
}

async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  logStep("Invoice payment failed", { 
    invoiceId: invoice.id, 
    subscriptionId: invoice.subscription 
  });

  const customerId = invoice.customer as string;
  const customer = await stripe.customers.retrieve(customerId);
  if (customer.deleted) return;

  const customerEmail = (customer as Stripe.Customer).email;
  if (!customerEmail) return;

  const { data: userData } = await supabaseAdmin.auth.admin.listUsers();
  const user = userData?.users?.find(u => u.email === customerEmail);
  if (!user) return;

  const { data: profile } = await supabaseAdmin
    .from("profiles")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!profile) return;

  // Update subscription status to past_due
  await supabaseAdmin
    .from("vip_subscriptions")
    .update({
      status: "past_due",
      updated_at: new Date().toISOString(),
    })
    .eq("profile_id", profile.id);

  logStep("VIP payment failed - marked as past_due", { profileId: profile.id });
}

async function updateVipSubscription(
  profileId: string, 
  subscription: Stripe.Subscription,
  stripeCustomerId: string
) {
  const status = subscription.status === "active" || subscription.status === "trialing" 
    ? "active" 
    : subscription.status;

  const { data: existing } = await supabaseAdmin
    .from("vip_subscriptions")
    .select("id")
    .eq("profile_id", profileId)
    .maybeSingle();

  const subscriptionData = {
    profile_id: profileId,
    status,
    stripe_customer_id: stripeCustomerId,
    stripe_subscription_id: subscription.id,
    current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
    current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
    updated_at: new Date().toISOString(),
  };

  if (existing) {
    await supabaseAdmin
      .from("vip_subscriptions")
      .update(subscriptionData)
      .eq("profile_id", profileId);
  } else {
    await supabaseAdmin
      .from("vip_subscriptions")
      .insert({ ...subscriptionData, created_at: new Date().toISOString() });
    
    // Create VIP stats entry
    await supabaseAdmin
      .from("vip_stats")
      .upsert({
        profile_id: profileId,
        first_subscribed_at: new Date().toISOString(),
        months_subscribed: 1,
        loyalty_tier: "bronze",
      }, { onConflict: "profile_id" });
  }

  logStep("VIP subscription updated", { profileId, status });
}
