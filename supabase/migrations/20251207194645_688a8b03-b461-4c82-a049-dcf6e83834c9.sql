-- Create battle pass seasons table
CREATE TABLE public.battle_pass_seasons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  end_date TIMESTAMP WITH TIME ZONE NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create battle pass tiers table
CREATE TABLE public.battle_pass_tiers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  season_id UUID REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  tier_number INTEGER NOT NULL,
  xp_required INTEGER NOT NULL,
  free_reward_type TEXT NOT NULL, -- 'coins', 'skin', 'none'
  free_reward_value TEXT, -- coin amount or skin_id
  premium_reward_type TEXT NOT NULL,
  premium_reward_value TEXT,
  UNIQUE(season_id, tier_number)
);

-- Create user battle pass progress table
CREATE TABLE public.user_battle_pass (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  season_id UUID NOT NULL REFERENCES public.battle_pass_seasons(id) ON DELETE CASCADE,
  current_xp INTEGER NOT NULL DEFAULT 0,
  current_tier INTEGER NOT NULL DEFAULT 0,
  is_premium BOOLEAN NOT NULL DEFAULT false,
  claimed_free_tiers INTEGER[] DEFAULT '{}',
  claimed_premium_tiers INTEGER[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, season_id)
);

-- Enable RLS
ALTER TABLE public.battle_pass_seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_pass_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_battle_pass ENABLE ROW LEVEL SECURITY;

-- Policies for battle_pass_seasons (read-only for all)
CREATE POLICY "Anyone can view battle pass seasons" ON public.battle_pass_seasons FOR SELECT USING (true);

-- Policies for battle_pass_tiers (read-only for all)
CREATE POLICY "Anyone can view battle pass tiers" ON public.battle_pass_tiers FOR SELECT USING (true);

-- Policies for user_battle_pass
CREATE POLICY "Users can view their own battle pass progress" ON public.user_battle_pass FOR SELECT USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));
CREATE POLICY "Users can insert their own battle pass progress" ON public.user_battle_pass FOR INSERT WITH CHECK (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));
CREATE POLICY "Users can update their own battle pass progress" ON public.user_battle_pass FOR UPDATE USING (auth.uid() IN (SELECT user_id FROM public.profiles WHERE id = profile_id));

-- Insert default season with 30 tiers
INSERT INTO public.battle_pass_seasons (id, name, start_date, end_date, is_active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Season 1: Neon Dreams', now(), now() + interval '30 days', true);

-- Insert 30 battle pass tiers
INSERT INTO public.battle_pass_tiers (season_id, tier_number, xp_required, free_reward_type, free_reward_value, premium_reward_type, premium_reward_value)
VALUES
  ('00000000-0000-0000-0000-000000000001', 1, 100, 'coins', '50', 'coins', '100'),
  ('00000000-0000-0000-0000-000000000001', 2, 200, 'coins', '75', 'coins', '150'),
  ('00000000-0000-0000-0000-000000000001', 3, 300, 'none', NULL, 'coins', '200'),
  ('00000000-0000-0000-0000-000000000001', 4, 400, 'coins', '100', 'coins', '250'),
  ('00000000-0000-0000-0000-000000000001', 5, 500, 'coins', '150', 'skin', 'neon_runner'),
  ('00000000-0000-0000-0000-000000000001', 6, 600, 'none', NULL, 'coins', '300'),
  ('00000000-0000-0000-0000-000000000001', 7, 700, 'coins', '100', 'coins', '350'),
  ('00000000-0000-0000-0000-000000000001', 8, 800, 'coins', '125', 'coins', '400'),
  ('00000000-0000-0000-0000-000000000001', 9, 900, 'none', NULL, 'coins', '450'),
  ('00000000-0000-0000-0000-000000000001', 10, 1000, 'coins', '200', 'skin', 'cyber_ninja'),
  ('00000000-0000-0000-0000-000000000001', 11, 1100, 'coins', '150', 'coins', '500'),
  ('00000000-0000-0000-0000-000000000001', 12, 1200, 'none', NULL, 'coins', '550'),
  ('00000000-0000-0000-0000-000000000001', 13, 1300, 'coins', '175', 'coins', '600'),
  ('00000000-0000-0000-0000-000000000001', 14, 1400, 'coins', '200', 'coins', '650'),
  ('00000000-0000-0000-0000-000000000001', 15, 1500, 'coins', '250', 'skin', 'shadow_blade'),
  ('00000000-0000-0000-0000-000000000001', 16, 1600, 'none', NULL, 'coins', '700'),
  ('00000000-0000-0000-0000-000000000001', 17, 1700, 'coins', '200', 'coins', '750'),
  ('00000000-0000-0000-0000-000000000001', 18, 1800, 'coins', '225', 'coins', '800'),
  ('00000000-0000-0000-0000-000000000001', 19, 1900, 'none', NULL, 'coins', '850'),
  ('00000000-0000-0000-0000-000000000001', 20, 2000, 'coins', '300', 'skin', 'golden_warrior'),
  ('00000000-0000-0000-0000-000000000001', 21, 2100, 'coins', '250', 'coins', '900'),
  ('00000000-0000-0000-0000-000000000001', 22, 2200, 'none', NULL, 'coins', '950'),
  ('00000000-0000-0000-0000-000000000001', 23, 2300, 'coins', '275', 'coins', '1000'),
  ('00000000-0000-0000-0000-000000000001', 24, 2400, 'coins', '300', 'coins', '1100'),
  ('00000000-0000-0000-0000-000000000001', 25, 2500, 'coins', '350', 'skin', 'plasma_phantom'),
  ('00000000-0000-0000-0000-000000000001', 26, 2600, 'none', NULL, 'coins', '1200'),
  ('00000000-0000-0000-0000-000000000001', 27, 2700, 'coins', '300', 'coins', '1300'),
  ('00000000-0000-0000-0000-000000000001', 28, 2800, 'coins', '350', 'coins', '1400'),
  ('00000000-0000-0000-0000-000000000001', 29, 2900, 'none', NULL, 'coins', '1500'),
  ('00000000-0000-0000-0000-000000000001', 30, 3000, 'coins', '500', 'skin', 'legendary_phoenix');

-- Update timestamp trigger
CREATE TRIGGER update_user_battle_pass_updated_at
BEFORE UPDATE ON public.user_battle_pass
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();