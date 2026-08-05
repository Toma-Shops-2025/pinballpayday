-- LOOT LAGOON - COMPLETE DATABASE SETUP
-- Copy and Paste this into the Supabase SQL Editor

-- 1. PROFILES TABLE
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE,
  display_name TEXT,
  avatar_url TEXT,
  reward_points BIGINT DEFAULT 0,
  total_earnings_usd DECIMAL(12,2) DEFAULT 0.00,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  type TEXT NOT NULL, -- 'offerwall', 'ad_bonus', 'payout', 'game'
  provider TEXT, -- 'lootably', 'revlum', 'adgem', 'bitlabs', 'unity'
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. PAYOUT REQUESTS TABLE
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  amount INT NOT NULL,
  method TEXT NOT NULL,
  details TEXT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

-- 5. POLICIES
DO $policy$
BEGIN
    -- Profiles
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Public profiles viewable') THEN
        CREATE POLICY "Public profiles viewable" ON public.profiles FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users update own profile') THEN
        CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
    END IF;

    -- Transactions
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own transactions') THEN
        CREATE POLICY "Users view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
    END IF;

    -- Payouts
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users view own payouts') THEN
        CREATE POLICY "Users view own payouts" ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users create payouts') THEN
        CREATE POLICY "Users create payouts" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $policy$;

-- 6. FUNCTION: claim_game_reward
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
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Simple check: cap reward at 500 points per game session
  v_actual_reward := LEAST(p_reward_est, 500);

  -- Log as transaction
  INSERT INTO public.transactions (user_id, amount, type, provider)
  VALUES (v_user_id, v_actual_reward, 'game', p_game);

  -- Update profile
  UPDATE public.profiles
  SET reward_points = reward_points + v_actual_reward
  WHERE id = v_user_id
  RETURNING reward_points INTO new_total_points;

  reward_points := v_actual_reward;
  RETURN NEXT;
END;
$function$;

-- 7. FUNCTION: request_payout
CREATE OR REPLACE FUNCTION public.request_payout(
  p_amount INT,
  p_method TEXT,
  p_details TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_current_balance INT;
BEGIN
  SELECT reward_points INTO v_current_balance FROM public.profiles WHERE id = auth.uid();
  IF v_current_balance < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;

  INSERT INTO public.payout_requests (user_id, amount, method, details)
  VALUES (auth.uid(), p_amount, p_method, p_details);

  UPDATE public.profiles SET reward_points = reward_points - p_amount WHERE id = auth.uid();

  INSERT INTO public.transactions (user_id, amount, type, provider, status)
  VALUES (auth.uid(), -p_amount, 'payout', p_method, 'pending');

  RETURN TRUE;
END;
$function$;

-- 8. AUTO-CREATE PROFILE
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
