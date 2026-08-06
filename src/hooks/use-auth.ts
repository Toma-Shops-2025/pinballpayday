import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { type User } from '@supabase/supabase-js';
import { toast } from 'sonner';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const isInitialFetchDone = useRef(false);

  const fetchProfile = useCallback(async (userId: string) => {
    try {
        console.log("⚓ Fetching profile for:", userId);
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();

        if (data) {
            console.log("⚓ Profile found:", data);
            setProfile(data);
        } else {
            console.log("⚓ No profile found, creating one...");
            // Extract username from metadata or email
            const { data: { session } } = await supabase.auth.getSession();
            const username = session?.user?.user_metadata?.username || session?.user?.email?.split('@')[0] || 'Pirate';

            const { data: newP, error: insertError } = await supabase
                .from('profiles')
                .insert({
                    id: userId,
                    username: username,
                    cash_balance: 0,
                    total_earned: 0
                })
                .select()
                .single();

            if (newP) {
                console.log("⚓ New profile created:", newP);
                setProfile(newP);
            } else if (insertError) {
                console.error("⚓ Error creating profile:", insertError);
            }
        }
    } catch (e) {
        console.error("⚓ Profile fetch exception:", e);
    } finally {
        setLoading(false);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
          setUser(session.user);
          if (!isInitialFetchDone.current) {
            fetchProfile(session.user.id);
            isInitialFetchDone.current = true;
          }
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

  // Real-time listener for the balance
  useEffect(() => {
    if (!user) return;

    console.log("⚓ Setting up real-time listener for user:", user.id);
    const channel = supabase
        .channel(`profile-${user.id}`)
        .on('postgres_changes', {
            event: 'UPDATE',
            schema: 'public',
            table: 'profiles',
            filter: `id=eq.${user.id}`
        }, (payload) => {
            console.log("⚓ Real-time update received:", payload.new);
            setProfile(payload.new);
        })
        .subscribe((status) => {
            console.log("⚓ Real-time status:", status);
        });

    return () => {
        console.log("⚓ Removing real-time listener");
        supabase.removeChannel(channel);
    };
  }, [user]);

  const addCash = useCallback(async (amount: number) => {
    if (!user) return;
    const val = parseFloat(amount.toFixed(4));

    try {
        console.log(`⚓ Adding $${val} to balance...`);
        const { error: rpcError } = await supabase.rpc('claim_game_reward', {
            p_game: 'loot_lagoon_action',
            p_score: 0,
            p_reward_est: val
        });

        if (rpcError) {
            console.warn("⚓ RPC failed, trying manual update...", rpcError);
            const { data: current } = await supabase.from('profiles').select('cash_balance').eq('id', user.id).single();
            const newTotal = parseFloat(((current?.cash_balance || 0) + val).toFixed(4));
            await supabase.from('profiles').update({ cash_balance: newTotal }).eq('id', user.id);
            // Refresh manually if RPC fails
            fetchProfile(user.id);
        }
    } catch (e: any) {
        console.error("⚓ Error in addCash:", e);
    }
  }, [user, fetchProfile]);

  const signIn = useCallback(async (email: string, pass: string) => {
      const { error } = await supabase.auth.signInWithPassword({ email, password: pass });
      if (error) throw error;
  }, []);

  const signUp = useCallback(async (email: string, pass: string, username: string) => {
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
  }, []);

  const signOut = useCallback(() => supabase.auth.signOut(), []);

  return { user, profile, loading, signIn, signUp, signOut, addCash, fetchProfile, supabase };
}
