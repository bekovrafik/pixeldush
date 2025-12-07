-- Create boss rush leaderboard table
CREATE TABLE public.boss_rush_scores (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  completion_time_seconds NUMERIC NOT NULL,
  total_score INTEGER NOT NULL DEFAULT 0,
  bosses_defeated INTEGER NOT NULL DEFAULT 3,
  is_endless_mode BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.boss_rush_scores ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Anyone can view boss rush scores" 
ON public.boss_rush_scores 
FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own scores" 
ON public.boss_rush_scores 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = boss_rush_scores.profile_id 
  AND profiles.user_id = auth.uid()
));

-- Create boss rush challenges table
CREATE TABLE public.boss_rush_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  challenge_type TEXT NOT NULL, -- 'daily' or 'weekly'
  requirement_type TEXT NOT NULL, -- 'complete_rush', 'beat_time', 'endless_waves', 'total_score'
  requirement_value INTEGER NOT NULL,
  reward_coins INTEGER NOT NULL DEFAULT 100,
  reward_xp INTEGER NOT NULL DEFAULT 50,
  icon TEXT NOT NULL DEFAULT '⚡',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.boss_rush_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view boss rush challenges" 
ON public.boss_rush_challenges 
FOR SELECT 
USING (true);

-- User progress on boss rush challenges
CREATE TABLE public.user_boss_rush_challenges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  challenge_id UUID NOT NULL REFERENCES public.boss_rush_challenges(id) ON DELETE CASCADE,
  challenge_date DATE NOT NULL DEFAULT CURRENT_DATE,
  current_progress INTEGER NOT NULL DEFAULT 0,
  is_completed BOOLEAN NOT NULL DEFAULT false,
  is_claimed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, challenge_id, challenge_date)
);

ALTER TABLE public.user_boss_rush_challenges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own challenge progress" 
ON public.user_boss_rush_challenges 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = user_boss_rush_challenges.profile_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can insert their challenge progress" 
ON public.user_boss_rush_challenges 
FOR INSERT 
WITH CHECK (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = user_boss_rush_challenges.profile_id 
  AND profiles.user_id = auth.uid()
));

CREATE POLICY "Users can update their challenge progress" 
ON public.user_boss_rush_challenges 
FOR UPDATE 
USING (EXISTS (
  SELECT 1 FROM profiles 
  WHERE profiles.id = user_boss_rush_challenges.profile_id 
  AND profiles.user_id = auth.uid()
));

-- Insert default boss rush challenges
INSERT INTO public.boss_rush_challenges (title, description, challenge_type, requirement_type, requirement_value, reward_coins, reward_xp, icon) VALUES
('Speed Runner', 'Complete Boss Rush in under 60 seconds', 'daily', 'beat_time', 60, 200, 100, '⏱️'),
('Rush Champion', 'Complete 3 Boss Rush runs today', 'daily', 'complete_rush', 3, 150, 75, '🏆'),
('Endless Survivor', 'Survive 5 waves in Endless Mode', 'daily', 'endless_waves', 5, 250, 125, '♾️'),
('Weekly Warrior', 'Complete 10 Boss Rush runs this week', 'weekly', 'complete_rush', 10, 500, 250, '⚔️'),
('Time Trial Master', 'Beat Boss Rush in under 45 seconds', 'weekly', 'beat_time', 45, 750, 400, '🎯'),
('Endless Legend', 'Survive 10 waves in Endless Mode', 'weekly', 'endless_waves', 10, 1000, 500, '👑');