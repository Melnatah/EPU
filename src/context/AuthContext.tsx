import React, { createContext, useContext, useState } from 'react';

interface AuthContextType {
  user: any | null;
  isRegistered: boolean;
  login: (userData: any) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<any | null>(() => {
    const savedUser = localStorage.getItem('biopsie_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = (userData: any) => {
    setUser(userData);
    localStorage.setItem('biopsie_user', JSON.stringify(userData));
  };
  
  const logout = () => {
    setUser(null);
    localStorage.removeItem('biopsie_user');
  };

  const isRegistered = !!user;

  return (
    <AuthContext.Provider value={{ user, isRegistered, login, logout }}>
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
