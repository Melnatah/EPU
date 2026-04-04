-- Table pour les inscrits à la formation
CREATE TABLE IF NOT EXISTS public.registrations (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  nom text NOT NULL,
  prenom text NOT NULL,
  email text NOT NULL,
  etablissement text NOT NULL,
  role text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Désactiver le RLS (Row Level Security) temporairement pour simplifier l'accès depuis le formulaire
ALTER TABLE public.registrations DISABLE ROW LEVEL SECURITY;

-- Table pour la Thémathèque (les documents PDF)
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  titre text NOT NULL,
  organe text NOT NULL,
  type text NOT NULL,
  taille text NOT NULL,
  url text NOT NULL,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Désactiver le RLS pour autoriser la lecture par tous
ALTER TABLE public.documents DISABLE ROW LEVEL SECURITY;
