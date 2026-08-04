-- 1. PROFILES TABLE
-- Stores user basic info and their current reward point balance
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  reward_points BIGINT DEFAULT 0,
  total_earnings_usd DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. GAME SESSIONS TABLE
-- Tracks every game played, the score, and the reward issued
CREATE TABLE IF NOT EXISTS public.game_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  game_name TEXT DEFAULT 'pinball_pirate',
  score BIGINT NOT NULL,
  reward_points_earned INT DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.game_sessions ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles are viewable by everyone') THEN
        CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can update own profile') THEN
        CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own sessions') THEN
        CREATE POLICY "Users can view own sessions" ON public.game_sessions FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. FUNCTION: claim_game_reward
CREATE OR REPLACE FUNCTION public.claim_game_reward(
  p_game TEXT,
  p_score BIGINT,
  p_reward_est INT
)
RETURNS TABLE (new_total_points BIGINT, reward_points INT)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_actual_reward INT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Logic check: 10,000 score = 1 point.
  v_actual_reward := LEAST(p_reward_est, (p_score / 5000)::INT);

  INSERT INTO public.game_sessions (user_id, game_name, score, reward_points_earned)
  VALUES (v_user_id, p_game, p_score, v_actual_reward);

  UPDATE public.profiles
  SET reward_points = reward_points + v_actual_reward
  WHERE id = v_user_id
  RETURNING reward_points INTO new_total_points;

  reward_points := v_actual_reward;
  RETURN NEXT;
END;
$function$;

-- 6. FUNCTION: award_points
CREATE OR REPLACE FUNCTION public.award_points(
  p_points INT,
  p_source TEXT
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
  v_new_total BIGINT;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  UPDATE public.profiles
  SET reward_points = reward_points + p_points
  WHERE id = v_user_id
  RETURNING reward_points INTO v_new_total;

  RETURN v_new_total;
END;
$function$;

-- 7. AUTO-CREATE PROFILE ON SIGNUP
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $function$
BEGIN
  INSERT INTO public.profiles (id, username, display_name, avatar_url)
  VALUES (new.id, new.raw_user_meta_data->>'username', new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'avatar_url');
  RETURN new;
END;
$function$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
