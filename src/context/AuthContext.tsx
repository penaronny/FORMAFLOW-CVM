import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User } from '../types/form.js';
import { DataService } from '../services/dataService.js';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isServerOnline: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  register: (name: string, email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginAsDemo: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('formflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);

  useEffect(() => {
    async function checkAuth() {
      try {
        const online = await DataService.isServerOnline();
        setIsServerOnline(online);
        const currentUser = await DataService.getCurrentUser();
        setUser(currentUser);
      } catch (err) {
        console.error('Failed to verify session:', err);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }
    checkAuth();
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const res = await DataService.login(email, password);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Credenciales inválidas' };
    } catch {
      return { success: false, error: 'Error al procesar el inicio de sesión' };
    }
  };

  const register = async (name: string, email: string, password: string) => {
    try {
      const res = await DataService.register(name, email, password);
      if (res.success && res.user) {
        setUser(res.user);
        return { success: true };
      }
      return { success: false, error: res.error || 'Error al registrar usuario' };
    } catch {
      return { success: false, error: 'Error al procesar el registro' };
    }
  };

  const loginAsDemo = async () => {
    await login('demo@asesoresvisa.com', 'Password123!');
  };

  const logout = async () => {
    try {
      await DataService.logout();
    } finally {
      setUser(null);
      setToken(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{ user, token, isLoading, isServerOnline, login, register, loginAsDemo, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
