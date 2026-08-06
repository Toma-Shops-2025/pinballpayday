import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type User } from '@supabase/supabase-js';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isFetching = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    if (isFetching.current) return;
    isFetching.current = true;
    try {
        const { data } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
        if (data) setProfile(data);
    } catch (e) {
        console.error("Auth Hook: Profile fetch error", e);
    } finally {
        setLoading(false);
        isFetching.current = false;
    }
  }, []);

  useEffect(() => {
    // Initial Session Check
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setLoading(false);
      }
    });

    // Listen for Auth Changes
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

  const addCash = useCallback(async (amount: number) => {
    if (!user) return;
    try {
        await supabase.rpc('claim_game_reward', {
            p_game: 'app_action',
            p_score: 0,
            p_reward_est: amount
        });
        // Manual refresh after action to be safe
        fetchProfile(user.id);
    } catch (e) {
        console.error("Auth Hook: Add cash error", e);
    }
  }, [user, fetchProfile]);

  const signIn = useCallback(async (email: string, pass: string) => {
      return await supabase.auth.signInWithPassword({ email, password: pass });
  }, []);

  const signUp = useCallback(async (email: string, pass: string, username: string) => {
      const res = await supabase.auth.signUp({
          email,
          password: pass,
          options: { data: { username } }
      });
      if (res.data.user) {
          await supabase.from('profiles').insert({ id: res.data.user.id, username, email, cash_balance: 0 });
      }
      return res;
  }, []);

  return { user, profile, loading, signIn, signUp, signOut: () => supabase.auth.signOut(), addCash, fetchProfile, supabase };
}
