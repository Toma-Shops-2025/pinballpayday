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
        console.error("Profile Error:", e);
    } finally {
        isFetching.current = false;
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          fetchProfile(session.user.id);
      } else {
          setLoading(false);
      }
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

  // REAL-TIME LISTENER: This updates the balance instantly when the DB changes
  useEffect(() => {
    if (!user) return;
    const channel = supabase.channel(`ll-profile-${user.id}`)
      .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${user.id}`
      }, (payload) => {
          setProfile(payload.new);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const addCash = useCallback(async (amount: number) => {
    if (!user) return;
    try {
        await supabase.rpc('claim_game_reward', {
            p_game: 'app_reward',
            p_score: 0,
            p_reward_est: amount
        });
    } catch (e) {
        console.error("Add Cash Error:", e);
    }
  }, [user]);

  return {
    user,
    profile,
    loading,
    signIn: (e: string, p: string) => supabase.auth.signInWithPassword({ email: e, password: p }),
    signUp: async (e: string, p: string, u: string) => {
        const res = await supabase.auth.signUp({ email: e, password: p, options: { data: { username: u } } });
        if (res.data.user) {
            await supabase.from('profiles').upsert({ id: res.data.user.id, username: u, email: e, cash_balance: 0 });
        }
        return res;
    },
    signOut: () => supabase.auth.signOut(),
    addCash,
    fetchProfile,
    supabase
  };
}
