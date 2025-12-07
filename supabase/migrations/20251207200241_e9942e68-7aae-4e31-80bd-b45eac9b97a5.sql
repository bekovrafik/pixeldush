-- Create table for tracking boss defeats
CREATE TABLE public.boss_defeats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  boss_type TEXT NOT NULL,
  kill_time_seconds NUMERIC,
  defeated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  distance_at_defeat INTEGER,
  UNIQUE(profile_id, boss_type, defeated_at)
);

-- Enable RLS
ALTER TABLE public.boss_defeats ENABLE ROW LEVEL SECURITY;

-- Users can view their own boss defeats
CREATE POLICY "Users can view their own boss defeats"
ON public.boss_defeats
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = boss_defeats.profile_id 
  AND profiles.user_id = auth.uid()
));

-- Users can insert their own boss defeats
CREATE POLICY "Users can insert their own boss defeats"
ON public.boss_defeats
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = boss_defeats.profile_id 
  AND profiles.user_id = auth.uid()
));

-- Create table for VIP subscriptions
CREATE TABLE public.vip_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  status TEXT NOT NULL DEFAULT 'inactive',
  current_period_start TIMESTAMP WITH TIME ZONE,
  current_period_end TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vip_subscriptions ENABLE ROW LEVEL SECURITY;

-- Users can view their own VIP status
CREATE POLICY "Users can view their own VIP status"
ON public.vip_subscriptions
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = vip_subscriptions.profile_id 
  AND profiles.user_id = auth.uid()
));

-- Add VIP exclusive skins to character_skins table
INSERT INTO public.character_skins (id, name, description, price, is_premium, speed_bonus, coin_multiplier, jump_power_bonus, shield_duration_bonus)
VALUES 
  ('diamond', 'Diamond Elite', 'Exclusive VIP skin with maximum bonuses', 0, true, 25, 2.5, 20, 40),
  ('phoenix', 'Phoenix Flame', 'Rise from the ashes with fiery power', 0, true, 20, 2.0, 25, 30),
  ('shadow_king', 'Shadow King', 'Rule the darkness with ultimate stealth', 0, true, 30, 1.8, 15, 50)
ON CONFLICT (id) DO NOTHING;

-- Add trigger for updated_at
CREATE TRIGGER update_vip_subscriptions_updated_at
BEFORE UPDATE ON public.vip_subscriptions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();