-- Create table to track VIP statistics
CREATE TABLE public.vip_stats (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL UNIQUE REFERENCES public.profiles(id) ON DELETE CASCADE,
  ad_free_revives_used integer NOT NULL DEFAULT 0,
  total_bonus_coins_earned integer NOT NULL DEFAULT 0,
  months_subscribed integer NOT NULL DEFAULT 0,
  loyalty_tier text NOT NULL DEFAULT 'bronze',
  first_subscribed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vip_stats ENABLE ROW LEVEL SECURITY;

-- Users can view their own VIP stats
CREATE POLICY "Users can view their own VIP stats"
ON public.vip_stats
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = vip_stats.profile_id
  AND profiles.user_id = auth.uid()
));

-- Users can update their own VIP stats
CREATE POLICY "Users can update their own VIP stats"
ON public.vip_stats
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = vip_stats.profile_id
  AND profiles.user_id = auth.uid()
));

-- Users can insert their own VIP stats
CREATE POLICY "Users can insert their own VIP stats"
ON public.vip_stats
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = vip_stats.profile_id
  AND profiles.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_vip_stats_updated_at
BEFORE UPDATE ON public.vip_stats
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();