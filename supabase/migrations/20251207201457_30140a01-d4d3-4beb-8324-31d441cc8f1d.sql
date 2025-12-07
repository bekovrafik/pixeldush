-- Create table for tracking VIP daily bonus claims
CREATE TABLE public.vip_daily_bonuses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  bonus_coins INTEGER NOT NULL DEFAULT 100,
  bonus_day INTEGER NOT NULL DEFAULT 1
);

-- Enable RLS
ALTER TABLE public.vip_daily_bonuses ENABLE ROW LEVEL SECURITY;

-- Users can view their own VIP bonus claims
CREATE POLICY "Users can view their own VIP bonus claims"
ON public.vip_daily_bonuses
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = vip_daily_bonuses.profile_id
  AND profiles.user_id = auth.uid()
));

-- Users can insert their own VIP bonus claims  
CREATE POLICY "Users can claim VIP bonuses"
ON public.vip_daily_bonuses
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = vip_daily_bonuses.profile_id
  AND profiles.user_id = auth.uid()
));