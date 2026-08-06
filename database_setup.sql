-- LOOT LAGOON - EMPIRE EDITION SETUP
-- Copy and Paste this into the Supabase SQL Editor

-- 1. EXTEND PROFILES TABLE
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cash_balance DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_earned DECIMAL(12,2) DEFAULT 0.00;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email TEXT;

-- 2. CREATE PAYOUT_REQUESTS TABLE (REFINED)
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  reward_name TEXT NOT NULL,
  points_cost BIGINT NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. FUNCTION TO INCREMENT BALANCE SECURELY
CREATE OR REPLACE FUNCTION public.increment_cash_balance(user_id UUID, amount DECIMAL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  UPDATE public.profiles
  SET
    cash_balance = cash_balance + amount,
    total_earned = CASE WHEN amount > 0 THEN total_earned + amount ELSE total_earned END
  WHERE id = user_id;
END;
$function$;

-- 4. VIEW FOR LEADERBOARD (EXACTLY LIKE PLAYNPAYDAY)
CREATE OR REPLACE VIEW public.global_leaderboard AS
SELECT id, username, display_name, avatar_url, cash_balance, total_earned
FROM public.profiles
ORDER BY total_earned DESC;

-- 5. RE-ENABLE RLS AND POLICIES
ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DO $policy$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can create own payout requests') THEN
        CREATE POLICY "Users can create own payout requests" ON public.payout_requests FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own payout requests') THEN
        CREATE POLICY "Users can view own payout requests" ON public.payout_requests FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $policy$;
