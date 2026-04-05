import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/src/lib/supabase';

interface AuthContextType {
  user: any | null;
  profile: any | null;
  isAdmin: boolean;
  isRegistered: boolean;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (!error && data) {
      setProfile(data);
    }
  };

  useEffect(() => {
    // 1. Récupérer la session initiale
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    // 2. Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchProfile(session.user.id);
      } else {
        setProfile(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = (userData: any) => {
    // Cette fonction est conservée pour la compatibilité avec le système de "résident" actuel
    // mais à terme, tout devrait passer par supabase.auth
    setUser(userData);
  };
  
  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    localStorage.removeItem('biopsie_user');
  };

  const isAdmin = profile?.role === 'admin';
  const isRegistered = !!user;

  if (loading) {
    return null; // Ou un loader global
  }

  return (
    <AuthContext.Provider value={{ user, profile, isAdmin, isRegistered, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
