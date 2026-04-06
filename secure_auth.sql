-- 1. Table des profils utilisateurs
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  full_name text,
  email text,
  role text DEFAULT 'resident' CHECK (role IN ('admin', 'resident')),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Activation du RLS pour les profils
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Les utilisateurs peuvent voir leur propre profil"
  ON public.profiles FOR SELECT
  USING ( auth.uid() = id );

CREATE POLICY "Les administrateurs peuvent voir tous les profils"
  ON public.profiles FOR SELECT
  USING ( 
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 2. Trigger pour créer automatiquement un profil à l'inscription
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'resident')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 3. Sécurisation des tables existantes (RLS)
ALTER TABLE public.registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Politiques pour les documents (Public en lecture, Admin en écriture)
CREATE POLICY "Public can view documents" ON public.documents FOR SELECT USING (true);
CREATE POLICY "Admin can manage documents" ON public.documents
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Politiques pour les catégories (Public en lecture, Admin en écriture)
CREATE POLICY "Public can view categories" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admin can manage categories" ON public.categories
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Politiques pour les registrations
CREATE POLICY "Users can view own registration" ON public.registrations
  FOR SELECT USING (email = auth.jwt() ->> 'email' OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Users can update own registration" ON public.registrations
  FOR UPDATE USING (email = auth.jwt() ->> 'email') WITH CHECK (email = auth.jwt() ->> 'email');

CREATE POLICY "Admin can manage registrations" ON public.registrations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Fonctions RPC pour le Login et l'Inscription Résident (Contournement RLS contrôlé)
CREATE OR REPLACE FUNCTION public.find_registration(search_term TEXT)
RETURNS SETOF public.registrations LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  RETURN QUERY SELECT * FROM public.registrations
  WHERE email ILIKE search_term OR nom ILIKE search_term OR prenom ILIKE search_term LIMIT 1;
END; $$;

CREATE OR REPLACE FUNCTION public.register_resident(p_nom TEXT, p_prenom TEXT, p_email TEXT, p_etablissement TEXT, p_role TEXT)
RETURNS public.registrations LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE new_reg public.registrations;
BEGIN
  INSERT INTO public.registrations (nom, prenom, email, etablissement, role)
  VALUES (p_nom, p_prenom, p_email, p_etablissement, p_role)
  RETURNING * INTO new_reg;
  RETURN new_reg;
END; $$;

GRANT EXECUTE ON FUNCTION public.find_registration(TEXT) TO anon, authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.register_resident(TEXT, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated, service_role;
