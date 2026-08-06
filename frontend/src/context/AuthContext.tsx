import React, { createContext, useContext, useState, useEffect } from 'react';
import type { User } from '../types/auth';
import { loginUser, registerUser } from '../services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (u: string, p: string) => Promise<void>;
  register: (u: string, p: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('shelf_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('shelf_user');
      }
    }
    setLoading(false);
  }, []);

  const login = async (u: string, p: string) => {
    const userData = await loginUser(u, p);
    setUser(userData);
    localStorage.setItem('shelf_user', JSON.stringify(userData));
  };

  const register = async (u: string, p: string) => {
    const userData = await registerUser(u, p);
    setUser(userData);
    localStorage.setItem('shelf_user', JSON.stringify(userData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('shelf_user');
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};
