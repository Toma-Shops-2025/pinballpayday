import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const ADGEM_SECRET = "3c3il038e67hb9lheeild833"

serve(async (req) => {
  const url = new URL(req.url)
  const secret = url.searchParams.get("secret")
  const userId = url.searchParams.get("user_id")
  const amount = parseInt(url.searchParams.get("amount") || "0")
  const transactionId = url.searchParams.get("transaction_id")

  // 1. Verify Security
  if (secret !== ADGEM_SECRET) {
    return new Response("Unauthorized", { status: 401 })
  }

  if (!userId || !amount) {
    return new Response("Missing parameters", { status: 400 })
  }

  // 2. Initialize Supabase Admin (using Service Role Key)
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
  )

  // 3. Prevent Duplicate Transactions
  const { data: existing } = await supabaseAdmin
    .from('transactions')
    .select('id')
    .eq('id', transactionId)
    .single()

  if (existing) {
    return new Response("Duplicate Transaction", { status: 200 })
  }

  // 4. Update User Points
  const { error: updateError } = await supabaseAdmin.rpc('claim_game_reward', {
    p_game: 'adgem_offerwall',
    p_score: 0,
    p_reward_est: amount
  })

  if (updateError) {
    console.error("Error updating points:", updateError)
    return new Response("Database Error", { status: 500 })
  }

  return new Response("Success", { status: 200 })
})
