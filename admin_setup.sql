-- 1. Création de la table pour les administrateurs
CREATE TABLE IF NOT EXISTS public.admins (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  username text NOT NULL UNIQUE,
  password text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Désactivation du Row Level Security pour la lecture de la table admin depuis le composant React
ALTER TABLE public.admins DISABLE ROW LEVEL SECURITY;

-- 2. Création de votre compte unique !
INSERT INTO public.admins (username, password)
VALUES ('Mohamed', 'adele');
