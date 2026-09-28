import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchDemoRole: (roleName: string) => Promise<void>;
  hasRole: (roles: UserRole | UserRole[]) => boolean;
  hasPermission: (permissionCode: string) => boolean;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('techno_token'));
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = async () => {
    try {
      if (localStorage.getItem('techno_token')) {
        const userData = await api.auth.getMe();
        setUser(userData);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Failed to fetch user session:', err);
      localStorage.removeItem('techno_token');
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: If no token exists, auto login as President for instant evaluation!
    const initAuth = async () => {
      const existingToken = localStorage.getItem('techno_token');
      if (existingToken) {
        await refreshUser();
      } else {
        try {
          // Auto initialize with President demo role for seamless evaluation
          const data = await api.auth.switchDemoRole('president');
          localStorage.setItem('techno_token', data.access_token);
          setToken(data.access_token);
          setUser(data.user);
        } catch (e) {
          console.warn('Backend not ready or demo login failed:', e);
        } finally {
          setLoading(false);
        }
      }
    };
    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('techno_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const switchDemoRole = async (roleName: string) => {
    setLoading(true);
    try {
      const data = await api.auth.switchDemoRole(roleName);
      localStorage.setItem('techno_token', data.access_token);
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('techno_token');
    setToken(null);
    setUser(null);
  };

  const hasRole = (roles: UserRole | UserRole[]): boolean => {
    if (!user) return false;
    if (user.is_superuser) return true;
    const roleList = Array.isArray(roles) ? roles : [roles];
    return roleList.includes(user.role.name);
  };

  const hasPermission = (permissionCode: string): boolean => {
    if (!user) return false;
    if (user.is_superuser || user.role.name === 'President') return true;
    return user.role.permissions.some(p => p.code === permissionCode);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        switchDemoRole,
        hasRole,
        hasPermission,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
