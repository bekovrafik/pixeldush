-- Create friendships table
CREATE TABLE public.friendships (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  requester_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  addressee_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(requester_id, addressee_id),
  CHECK (requester_id != addressee_id)
);

-- Enable RLS
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Users can view friendships they're part of
CREATE POLICY "Users can view their friendships"
ON public.friendships
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE (profiles.id = friendships.requester_id OR profiles.id = friendships.addressee_id) 
    AND profiles.user_id = auth.uid()
  )
);

-- Users can send friend requests
CREATE POLICY "Users can send friend requests"
ON public.friendships
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = friendships.requester_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Users can update friendships they received (accept/reject)
CREATE POLICY "Users can respond to friend requests"
ON public.friendships
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE profiles.id = friendships.addressee_id 
    AND profiles.user_id = auth.uid()
  )
);

-- Users can delete their friendships
CREATE POLICY "Users can delete their friendships"
ON public.friendships
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles 
    WHERE (profiles.id = friendships.requester_id OR profiles.id = friendships.addressee_id) 
    AND profiles.user_id = auth.uid()
  )
);

-- Add tutorial_completed column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tutorial_completed BOOLEAN NOT NULL DEFAULT false;

-- Create trigger for updated_at
CREATE TRIGGER update_friendships_updated_at
BEFORE UPDATE ON public.friendships
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();