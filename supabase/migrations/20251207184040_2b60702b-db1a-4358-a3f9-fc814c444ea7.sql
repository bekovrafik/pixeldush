-- Create profiles table for player data
CREATE TABLE public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  username TEXT NOT NULL DEFAULT 'Player',
  high_score INTEGER NOT NULL DEFAULT 0,
  total_runs INTEGER NOT NULL DEFAULT 0,
  total_distance INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Create leaderboard entries table
CREATE TABLE public.leaderboard_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  score INTEGER NOT NULL,
  distance INTEGER NOT NULL,
  character_skin TEXT NOT NULL DEFAULT 'default',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create character skins table
CREATE TABLE public.character_skins (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price INTEGER NOT NULL DEFAULT 0,
  description TEXT,
  is_premium BOOLEAN NOT NULL DEFAULT false
);

-- Create owned skins junction table
CREATE TABLE public.owned_skins (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  profile_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  skin_id TEXT REFERENCES public.character_skins(id) ON DELETE CASCADE NOT NULL,
  purchased_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(profile_id, skin_id)
);

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.leaderboard_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.character_skins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.owned_skins ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view all profiles" 
ON public.profiles FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

-- Leaderboard policies (anyone can view, only profile owner can insert)
CREATE POLICY "Anyone can view leaderboard" 
ON public.leaderboard_entries FOR SELECT 
USING (true);

CREATE POLICY "Users can insert their own scores" 
ON public.leaderboard_entries FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_id AND user_id = auth.uid()
  )
);

-- Character skins are readable by everyone
CREATE POLICY "Anyone can view skins" 
ON public.character_skins FOR SELECT 
USING (true);

-- Owned skins policies
CREATE POLICY "Users can view their owned skins" 
ON public.owned_skins FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_id AND user_id = auth.uid()
  )
);

CREATE POLICY "Users can purchase skins" 
ON public.owned_skins FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = profile_id AND user_id = auth.uid()
  )
);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, username)
  VALUES (new.id, COALESCE(new.raw_user_meta_data ->> 'username', 'Player'));
  RETURN new;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Insert default character skins
INSERT INTO public.character_skins (id, name, price, description, is_premium) VALUES
('default', 'Runner', 0, 'The classic pixel adventurer', false),
('cat', 'Pixel Cat', 100, 'A swift feline runner', false),
('robot', 'Robo Runner', 250, 'Mechanical precision', false),
('ninja', 'Shadow Ninja', 500, 'Silent and deadly', true),
('zombie', 'Undead Runner', 350, 'Never stops running', true),
('astronaut', 'Space Explorer', 750, 'Out of this world', true);

-- Create index for faster leaderboard queries
CREATE INDEX idx_leaderboard_score ON public.leaderboard_entries(score DESC);
CREATE INDEX idx_leaderboard_created ON public.leaderboard_entries(created_at DESC);