import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuthStore } from '../store/authStore';

export function useAuth() {
  const { setUser, setSession, setLoading, fetchProfile } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    // Resolve initial session (page load / refresh)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes (sign in, sign out, email confirmation)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          await fetchProfile(session.user.id);
          // Redirect to dashboard on any sign-in event (includes email confirmation)
          if (event === 'SIGNED_IN') {
            navigate('/dashboard', { replace: true });
          }
        }

        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);
}
