-- Create daily challenges table
CREATE TABLE public.daily_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  challenge_type text NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_value integer NOT NULL,
  reward_coins integer NOT NULL DEFAULT 50,
  icon text NOT NULL DEFAULT '🎯',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create user daily challenges progress table
CREATE TABLE public.user_daily_challenges (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id uuid NOT NULL REFERENCES public.daily_challenges(id) ON DELETE CASCADE,
  challenge_date date NOT NULL DEFAULT CURRENT_DATE,
  current_progress integer NOT NULL DEFAULT 0,
  is_completed boolean NOT NULL DEFAULT false,
  is_claimed boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(profile_id, challenge_id, challenge_date)
);

-- Enable RLS
ALTER TABLE public.daily_challenges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_daily_challenges ENABLE ROW LEVEL SECURITY;

-- Anyone can view challenges
CREATE POLICY "Anyone can view daily challenges"
ON public.daily_challenges
FOR SELECT
USING (true);

-- Users can view their own progress
CREATE POLICY "Users can view their challenge progress"
ON public.user_daily_challenges
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = user_daily_challenges.profile_id
  AND profiles.user_id = auth.uid()
));

-- Users can insert their own progress
CREATE POLICY "Users can insert their challenge progress"
ON public.user_daily_challenges
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = user_daily_challenges.profile_id
  AND profiles.user_id = auth.uid()
));

-- Users can update their own progress
CREATE POLICY "Users can update their challenge progress"
ON public.user_daily_challenges
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM profiles
  WHERE profiles.id = user_daily_challenges.profile_id
  AND profiles.user_id = auth.uid()
));

-- Insert default daily challenges
INSERT INTO public.daily_challenges (challenge_type, title, description, target_value, reward_coins, icon) VALUES
('score', 'Score Master', 'Score 500 points in a single run', 500, 50, '🏆'),
('score', 'High Scorer', 'Score 1000 points in a single run', 1000, 100, '⭐'),
('distance', 'Distance Runner', 'Run 500 meters in a single run', 500, 40, '🏃'),
('distance', 'Marathon Runner', 'Run 1500 meters in a single run', 1500, 80, '🎽'),
('coins', 'Coin Collector', 'Collect 20 coins in a single run', 20, 30, '🪙'),
('coins', 'Gold Hunter', 'Collect 50 coins in a single run', 50, 75, '💰'),
('runs', 'Daily Dedication', 'Complete 3 runs today', 3, 60, '🎮'),
('runs', 'Gaming Session', 'Complete 5 runs today', 5, 100, '🕹️'),
('powerups', 'Power Player', 'Collect 2 power-ups in a single run', 2, 45, '⚡'),
('powerups', 'Power Master', 'Collect 5 power-ups in a single run', 5, 90, '🔮');