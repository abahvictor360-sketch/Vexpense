import { create } from 'zustand';
import type { User, Session } from '@supabase/supabase-js';
import type { Profile } from '../types';
import { supabase } from '../lib/supabase';

interface AuthState {
  user: User | null;
  profile: Profile | null;
  session: Session | null;
  loading: boolean;
  setUser: (user: User | null) => void;
  setProfile: (profile: Profile | null) => void;
  setSession: (session: Session | null) => void;
  setLoading: (loading: boolean) => void;
  fetchProfile: (userId: string) => Promise<void>;
  updateProfile: (updates: Partial<Profile>) => Promise<void>;
  signOut: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  session: null,
  loading: true,

  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile }),
  setSession: (session) => set({ session }),
  setLoading: (loading) => set({ loading }),

  fetchProfile: async (userId: string) => {
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (data) {
      set({ profile: data as Profile });
      return;
    }

    // No profile row — this happens when a user registered before the migration ran.
    // Create a minimal profile so the app works.
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data: upserted } = await supabase
        .from('profiles')
        .upsert({
          id: userId,
          email: user.email ?? '',
          full_name: (user.user_metadata?.full_name as string) ?? '',
          country_code: (user.user_metadata?.country_code as string) ?? 'NG',
          country_name: (user.user_metadata?.country_name as string) ?? 'Nigeria',
          currency: (user.user_metadata?.currency as string) ?? 'NGN',
          avatar_color: '#534AB7',
          monthly_income: 0,
          onboarding_done: false,
        })
        .select()
        .single();
      if (upserted) set({ profile: upserted as Profile });
    } catch { /* non-blocking */ }
  },

  updateProfile: async (updates: Partial<Profile>) => {
    const { user } = get();
    if (!user) return;
    const { data } = await supabase
      .from('profiles')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', user.id)
      .select()
      .single();
    if (data) set({ profile: data as Profile });
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null, session: null });
  },
}));
