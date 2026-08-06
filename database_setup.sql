-- LOOT LAGOON - FINAL HARMONIZED SETUP
-- Copy and Paste this into the Supabase SQL Editor

-- 1. ENSURE COLUMNS EXIST
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cash_balance DECIMAL(12,4) DEFAULT 0.0000;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS total_earned DECIMAL(12,4) DEFAULT 0.0000;

-- 2. UNIFIED REWARD FUNCTION (Handles all income)
CREATE OR REPLACE FUNCTION public.claim_game_reward(
  p_game TEXT,
  p_score BIGINT,
  p_reward_est DECIMAL -- This is now the dollar amount
)
RETURNS TABLE (new_cash_balance DECIMAL)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  v_user_id UUID;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Update profile with the dollar amount
  UPDATE public.profiles
  SET
    cash_balance = cash_balance + p_reward_est,
    total_earned = total_earned + p_reward_est
  WHERE id = v_user_id
  RETURNING cash_balance INTO new_cash_balance;

  -- Log the transaction for your records
  INSERT INTO public.transactions (user_id, amount, type, provider)
  VALUES (v_user_id, (p_reward_est * 1000)::INT, 'reward', p_game);

  RETURN NEXT;
END;
$function$;

-- 3. UPDATED LEADERBOARD VIEW
CREATE OR REPLACE VIEW public.global_leaderboard AS
SELECT id, username, display_name, avatar_url, cash_balance, total_earned
FROM public.profiles
ORDER BY total_earned DESC;
