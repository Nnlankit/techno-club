import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, UserRole, ProfileUpdatePayload } from '../types';
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
  updateUserProfile: (data: ProfileUpdatePayload) => Promise<User>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('techno_token'));
  const [user, setUser] = useState<User | null>(() => {
    const savedToken = localStorage.getItem('techno_token');
    const savedUser = localStorage.getItem('techno_user');
    if (savedToken && savedUser) {
      try {
        return JSON.parse(savedUser);
      } catch {
        return null;
      }
    }
    return null;
  });
  const [loading, setLoading] = useState<boolean>(() => {
    const savedToken = localStorage.getItem('techno_token');
    const savedUser = localStorage.getItem('techno_user');
    if (!savedToken) return false;
    return !savedUser;
  });

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('techno_token');
    if (!currentToken) {
      setUser(null);
      localStorage.removeItem('techno_user');
      setLoading(false);
      return;
    }

    try {
      const userData = await api.auth.getMe();
      setUser(userData);
      localStorage.setItem('techno_user', JSON.stringify(userData));
    } catch (err: any) {
      console.error('Failed to validate user session:', err);
      // ONLY invalidate authentication if backend explicitly rejected credentials with 401
      if (err?.response?.status === 401) {
        localStorage.removeItem('techno_token');
        localStorage.removeItem('techno_user');
        setUser(null);
        setToken(null);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial load: Validate existing session token if present
    const initAuth = async () => {
      const existingToken = localStorage.getItem('techno_token');
      if (existingToken) {
        await refreshUser();
      } else {
        setUser(null);
        setToken(null);
        setLoading(false);
      }
    };
    initAuth();

    const handleUnauthorized = () => {
      localStorage.removeItem('techno_token');
      localStorage.removeItem('techno_user');
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth:unauthorized', handleUnauthorized);
    return () => {
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const data = await api.auth.login(email, password);
      localStorage.setItem('techno_token', data.access_token);
      localStorage.setItem('techno_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
      return data.user;
    } finally {
      setLoading(false);
    }
  };

  const switchDemoRole = async (roleName: string) => {
    setLoading(true);
    try {
      const data = await api.auth.switchDemoRole(roleName);
      localStorage.setItem('techno_token', data.access_token);
      localStorage.setItem('techno_user', JSON.stringify(data.user));
      setToken(data.access_token);
      setUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('techno_token');
    localStorage.removeItem('techno_user');
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

  const updateUserProfile = async (data: ProfileUpdatePayload): Promise<User> => {
    const updatedUser = await api.auth.updateProfile(data);
    setUser(updatedUser);
    localStorage.setItem('techno_user', JSON.stringify(updatedUser));
    return updatedUser;
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
        updateUserProfile,
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
