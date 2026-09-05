import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AuthUser, UserProfileData, UserMembershipData } from '../types';
import { apiRequest, getStoredToken, setStoredToken } from '../lib/api';

interface RegisterData {
  name: string;
  email: string;
  password: string;
  confirmPassword?: string;
  phone?: string;
  dateOfBirth?: string;
  gender?: string;
  fitnessGoal?: string;
}

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfileData | null;
  membership: UserMembershipData | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<AuthUser>;
  register: (data: RegisterData) => Promise<AuthUser>;
  logout: () => Promise<void>;
  updateProfile: (data: Partial<UserProfileData & { name?: string; phone?: string; gender?: string; fitnessGoal?: string }>) => Promise<void>;
  changePassword: (currentPassword: string, newPassword: string) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [membership, setMembership] = useState<UserMembershipData | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on boot or token change
  const refreshUser = useCallback(async () => {
    const currentToken = getStoredToken();
    if (!currentToken) {
      setUser(null);
      setProfile(null);
      setMembership(null);
      setIsLoading(false);
      return;
    }

    try {
      const data = await apiRequest<{
        user: AuthUser;
        profile: UserProfileData | null;
        membership: UserMembershipData | null;
      }>('/auth/me');

      setUser(data.user);
      setProfile(data.profile);
      setMembership(data.membership);
    } catch (err) {
      console.warn('Session expired or invalid:', err);
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setProfile(null);
      setMembership(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshUser();
  }, [refreshUser]);

  const login = async (email: string, password: string, rememberMe = false): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const data = await apiRequest<{ token: string; user: AuthUser }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password, rememberMe }),
      });

      setStoredToken(data.token);
      setToken(data.token);
      setUser(data.user);

      // Fetch profile and membership in background
      refreshUser();

      return data.user;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const res = await apiRequest<{ token: string; user: AuthUser }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      });

      setStoredToken(res.token);
      setToken(res.token);
      setUser(res.user);

      refreshUser();
      return res.user;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await apiRequest('/auth/logout', { method: 'POST' }).catch(() => {});
    } finally {
      setStoredToken(null);
      setToken(null);
      setUser(null);
      setProfile(null);
      setMembership(null);
    }
  };

  const updateProfile = async (
    data: Partial<UserProfileData & { name?: string; phone?: string; gender?: string; fitnessGoal?: string }>
  ): Promise<void> => {
    const res = await apiRequest<{ user: AuthUser; profile: UserProfileData }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
    setUser(res.user);
    setProfile(res.profile);
  };

  const changePassword = async (currentPassword: string, newPassword: string): Promise<void> => {
    await apiRequest('/auth/change-password', {
      method: 'PUT',
      body: JSON.stringify({ currentPassword, newPassword }),
    });
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        membership,
        token,
        isLoading,
        login,
        register,
        logout,
        updateProfile,
        changePassword,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
