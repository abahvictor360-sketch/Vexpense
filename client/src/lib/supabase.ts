import { createClient } from '@supabase/supabase-js';

const supabaseUrl     = (import.meta.env.VITE_SUPABASE_URL     as string) || 'https://placeholder.supabase.co';
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY as string) || 'placeholder-key';

if (
  supabaseUrl === 'https://placeholder.supabase.co' ||
  supabaseAnonKey === 'placeholder-key'
) {
  console.warn('⚠️  Supabase env vars missing — add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your environment.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
