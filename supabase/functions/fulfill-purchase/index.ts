import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.57.2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const logStep = (step: string, details?: any) => {
  const detailsStr = details ? ` - ${JSON.stringify(details)}` : '';
  console.log(`[FULFILL-PURCHASE] ${step}${detailsStr}`);
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    logStep("Function started");

    const { productId, coins, skinId } = await req.json();
    logStep("Fulfillment request", { productId, coins, skinId });

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
    
    if (userError || !userData.user) {
      throw new Error("User not authenticated");
    }

    const userId = userData.user.id;
    logStep("User authenticated", { userId });

    // Get user's profile
    const { data: profile, error: profileError } = await supabaseClient
      .from('profiles')
      .select('id, coins')
      .eq('user_id', userId)
      .single();

    if (profileError || !profile) {
      throw new Error("Profile not found");
    }

    logStep("Profile found", { profileId: profile.id, currentCoins: profile.coins });

    // Fulfill coin purchase
    if (coins && parseInt(coins) > 0) {
      const coinsToAdd = parseInt(coins);
      const newBalance = profile.coins + coinsToAdd;

      const { error: updateError } = await supabaseClient
        .from('profiles')
        .update({ coins: newBalance })
        .eq('id', profile.id);

      if (updateError) {
        throw new Error("Failed to add coins");
      }

      logStep("Coins added", { coinsAdded: coinsToAdd, newBalance });
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: 'coins',
        amount: coinsToAdd,
        newBalance 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // Fulfill skin purchase
    if (skinId) {
      // Check if already owned
      const { data: existingSkin } = await supabaseClient
        .from('owned_skins')
        .select('id')
        .eq('profile_id', profile.id)
        .eq('skin_id', skinId)
        .single();

      if (existingSkin) {
        logStep("Skin already owned", { skinId });
        return new Response(JSON.stringify({ 
          success: true, 
          type: 'skin',
          skinId,
          alreadyOwned: true 
        }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
          status: 200,
        });
      }

      const { error: insertError } = await supabaseClient
        .from('owned_skins')
        .insert({ profile_id: profile.id, skin_id: skinId });

      if (insertError) {
        throw new Error("Failed to add skin");
      }

      logStep("Skin added", { skinId });
      
      return new Response(JSON.stringify({ 
        success: true, 
        type: 'skin',
        skinId 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    // VIP subscription is handled by check-vip-subscription polling
    if (productId?.startsWith('vip_')) {
      logStep("VIP subscription - handled by subscription check");
      return new Response(JSON.stringify({ 
        success: true, 
        type: 'vip_subscription',
        productId 
      }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    throw new Error("Unknown purchase type");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logStep("ERROR", { message: errorMessage });
    return new Response(JSON.stringify({ error: errorMessage }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
});
