
-- 1. Add columns to profiles
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS public_id text UNIQUE,
  ADD COLUMN IF NOT EXISTS name_changed_at timestamptz,
  ADD COLUMN IF NOT EXISTS display_name_normalized text;

-- Generate public_id for existing profiles that don't have one
UPDATE public.profiles
SET public_id = 'beast-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
WHERE public_id IS NULL;

-- Make public_id NOT NULL after populating
ALTER TABLE public.profiles ALTER COLUMN public_id SET NOT NULL;
ALTER TABLE public.profiles ALTER COLUMN public_id SET DEFAULT 'beast-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8);

-- Prevent updates to public_id via RLS (create restrictive update policy)
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id AND public_id = (SELECT p.public_id FROM public.profiles p WHERE p.user_id = auth.uid()));

-- 2. Create user_preferences table
CREATE TABLE public.user_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  tutorial_completed boolean NOT NULL DEFAULT false,
  sfx_enabled boolean NOT NULL DEFAULT true,
  music_enabled boolean NOT NULL DEFAULT true,
  voice_enabled boolean NOT NULL DEFAULT true,
  opponent_chat_muted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own preferences"
  ON public.user_preferences FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own preferences"
  ON public.user_preferences FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own preferences"
  ON public.user_preferences FOR UPDATE
  USING (auth.uid() = user_id);

CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Create friend_requests table
CREATE TABLE public.friend_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL,
  receiver_id uuid NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(sender_id, receiver_id),
  CONSTRAINT no_self_request CHECK (sender_id <> receiver_id)
);

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friend requests"
  ON public.friend_requests FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests"
  ON public.friend_requests FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receiver can update friend requests"
  ON public.friend_requests FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete own friend requests"
  ON public.friend_requests FOR DELETE
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE TRIGGER update_friend_requests_updated_at
  BEFORE UPDATE ON public.friend_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. Create friendships table
CREATE TABLE public.friendships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_a uuid NOT NULL,
  user_b uuid NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_a, user_b),
  CONSTRAINT canonical_order CHECK (user_a < user_b)
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own friendships"
  ON public.friendships FOR SELECT
  TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Authenticated users can create friendships"
  ON public.friendships FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "Users can delete own friendships"
  ON public.friendships FOR DELETE
  TO authenticated
  USING (auth.uid() = user_a OR auth.uid() = user_b);

-- 5. Create game_invites table
CREATE TABLE public.game_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id uuid NOT NULL,
  invitee_id uuid NOT NULL,
  session_id uuid REFERENCES public.game_sessions(id),
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT now() + interval '2 minutes'
);

ALTER TABLE public.game_invites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own invites"
  ON public.game_invites FOR SELECT
  TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create invites"
  ON public.game_invites FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = inviter_id);

CREATE POLICY "Invitee can update invites"
  ON public.game_invites FOR UPDATE
  TO authenticated
  USING (auth.uid() = invitee_id);

CREATE POLICY "Users can delete own invites"
  ON public.game_invites FOR DELETE
  TO authenticated
  USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

-- 6. Enable realtime for friend_requests and game_invites
ALTER PUBLICATION supabase_realtime ADD TABLE public.friend_requests;
ALTER PUBLICATION supabase_realtime ADD TABLE public.game_invites;

-- 7. Update handle_new_user trigger to include new tables
CREATE OR REPLACE FUNCTION public.handle_new_user()
  RETURNS trigger
  LANGUAGE plpgsql
  SECURITY DEFINER
  SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, public_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', 'Jogador'),
    'beast-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)
  );

  INSERT INTO public.user_stats (user_id) VALUES (NEW.id);

  INSERT INTO public.user_inventory (user_id, item_type, item_key) VALUES
    (NEW.id, 'monster', 'panther'),
    (NEW.id, 'monster', 'banana');

  INSERT INTO public.daily_rewards (user_id) VALUES (NEW.id);
  INSERT INTO public.player_leagues (user_id) VALUES (NEW.id);
  INSERT INTO public.season_pass (user_id) VALUES (NEW.id);
  INSERT INTO public.user_preferences (user_id) VALUES (NEW.id);

  RETURN NEW;
END;
$function$;
