import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
        // Fetch all potential balance columns to be safe
        const { data, error } = await supabase
            .from('profiles')
            .select('id, username, cash_balance, reward_points, total_earned')
            .eq('id', userId)
            .maybeSingle();

        if (data) {
            // Unify the balance: use cash_balance if it exists, otherwise fallback to reward_points
            const unifiedBalance = data.cash_balance ?? (Number(data.reward_points || 0) / 1000);
            setProfile({ ...data, cash_balance: unifiedBalance });
        } else {
            // Create profile if missing
            const { data: newP } = await supabase
                .from('profiles')
                .insert({ id: userId, cash_balance: 0 })
                .select()
                .single();
            if (newP) setProfile(newP);
        }
    } catch (e) {
        console.error("Profile Fetch Error:", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else { setLoading(false); }
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setUser(null);
          setProfile(null);
          setLoading(false);
      }
    });
    return () => subscription.unsubscribe();
  }, [fetchProfile]);

  const addCash = async (amount: number) => {
    if (!user) return;
    const val = parseFloat(amount.toFixed(4));

    try {
        // Try the secure database function first
        const { error: rpcError } = await supabase.rpc('increment_cash_balance', {
            user_id: user.id,
            amount: val
        });

        if (rpcError) {
            console.warn("RPC failed, trying direct update...");
            // Fallback: Direct table update if function isn't deployed yet
            const { data: current } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single();
            const newTotal = parseFloat(((current?.cash_balance || 0) + val).toFixed(4));
            await supabase.from('profiles').update({ cash_balance: newTotal }).eq('id', user.id);
        }

        // Force a fresh pull from the database
        await fetchProfile(user.id);
        toast.success(`Success! +$${val.toFixed(2)}`);
    } catch (e: any) {
        console.error("Vault Error:", e);
        toast.error("Sync Error");
    }
  };

  const signIn = async (email: string, pass: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
  };

  const signUp = async (email: string, pass: string, username: string) => {
      const { data, error } = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { username } }
      });
      if (error) throw error;
      if (data.user) {
          await supabase.from('profiles').insert({
              id: data.user.id,
              username,
              email,
              cash_balance: 0
          });
      }
  };

  const signOut = () => supabase.auth.signOut();

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile, supabase };
}
