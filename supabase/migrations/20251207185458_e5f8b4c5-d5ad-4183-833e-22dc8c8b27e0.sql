-- Create achievements table
CREATE TABLE public.achievements (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT NOT NULL,
  icon TEXT NOT NULL,
  requirement_type TEXT NOT NULL, -- 'score', 'distance', 'coins', 'runs', 'streak'
  requirement_value INTEGER NOT NULL,
  reward_coins INTEGER NOT NULL DEFAULT 0
);

-- Create user achievements junction table
CREATE TABLE public.user_achievements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  achievement_id TEXT REFERENCES public.achievements(id) ON DELETE CASCADE NOT NULL,
  unlocked_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, achievement_id)
);

-- Create daily rewards table
CREATE TABLE public.daily_rewards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  day_number INTEGER NOT NULL, -- 1-7 for weekly cycle
  coins_reward INTEGER NOT NULL,
  claimed_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add coins column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS coins INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS current_world TEXT NOT NULL DEFAULT 'city';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS login_streak INTEGER NOT NULL DEFAULT 0;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_daily_claim DATE;

-- Enable RLS
ALTER TABLE public.achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_rewards ENABLE ROW LEVEL SECURITY;

-- Achievements are readable by everyone
CREATE POLICY "Anyone can view achievements" 
ON public.achievements FOR SELECT 
USING (true);

-- User achievements policies
CREATE POLICY "Users can view their achievements" 
ON public.user_achievements FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND user_id = auth.uid()));

CREATE POLICY "Users can unlock achievements" 
ON public.user_achievements FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND user_id = auth.uid()));

-- Daily rewards policies
CREATE POLICY "Users can view their rewards" 
ON public.daily_rewards FOR SELECT 
USING (EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND user_id = auth.uid()));

CREATE POLICY "Users can claim rewards" 
ON public.daily_rewards FOR INSERT 
WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = profile_id AND user_id = auth.uid()));

-- Insert default achievements
INSERT INTO public.achievements (id, name, description, icon, requirement_type, requirement_value, reward_coins) VALUES
('first_run', 'First Steps', 'Complete your first run', '🏃', 'runs', 1, 10),
('score_100', 'Getting Started', 'Score 100 points', '⭐', 'score', 100, 25),
('score_500', 'Rising Star', 'Score 500 points', '🌟', 'score', 500, 50),
('score_1000', 'Champion', 'Score 1000 points', '🏆', 'score', 1000, 100),
('score_5000', 'Legend', 'Score 5000 points', '👑', 'score', 5000, 500),
('coins_50', 'Coin Collector', 'Collect 50 coins total', '🪙', 'coins', 50, 25),
('coins_200', 'Treasure Hunter', 'Collect 200 coins total', '💰', 'coins', 200, 100),
('coins_1000', 'Midas Touch', 'Collect 1000 coins total', '💎', 'coins', 1000, 500),
('distance_1000', 'Marathon Runner', 'Run 1000m in one run', '🎽', 'distance', 1000, 50),
('distance_5000', 'Ultra Runner', 'Run 5000m in one run', '🏅', 'distance', 5000, 200),
('runs_10', 'Dedicated', 'Complete 10 runs', '💪', 'runs', 10, 30),
('runs_50', 'Addicted', 'Complete 50 runs', '🔥', 'runs', 50, 100),
('runs_100', 'No Life', 'Complete 100 runs', '😅', 'runs', 100, 250),
('streak_3', 'Consistent', 'Login 3 days in a row', '📅', 'streak', 3, 50),
('streak_7', 'Weekly Warrior', 'Login 7 days in a row', '🗓️', 'streak', 7, 150);