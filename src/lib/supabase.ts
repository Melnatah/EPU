import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ URL ou Clé Supabase manquante. Veuillez vérifier votre fichier .env.local");
}

export const supabase = createClient(supabaseUrl || "https://placeholder-project-id.supabase.co", supabaseAnonKey || "placeholder-anon-key");
