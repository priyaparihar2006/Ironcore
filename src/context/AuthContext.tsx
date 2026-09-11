import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react";
import { api, AuthUser, UserProfile } from "../services/api";

interface AuthContextType {
  user: AuthUser | null;
  profile: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<AuthUser>;
  register: (data: Parameters<typeof api.register>[0]) => Promise<AuthUser>;
  logout: () => void;
  // Re-fetches /auth/me and updates both user and profile — call after any
  // profile/measurement update so the UI reflects what was actually saved.
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    // /auth/me returns { user, profile, membership }
    const { user: me, profile: meProfile } = await api.getMe();
    setUser(me);
    setProfile(meProfile);
  }, []);

  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem("ironcore_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        await refreshUser();
      } catch {
        // covers both 401 (invalid/expired token) and 403 (deactivated account)
        localStorage.removeItem("ironcore_token");
        setUser(null);
        setProfile(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, [refreshUser]);

  async function login(email: string, password: string, rememberMe: boolean) {
    const { token, user: loggedUser } = await api.login(email, password, rememberMe);
    localStorage.setItem("ironcore_token", token);
    setUser(loggedUser);
    return loggedUser;
  }

  async function register(data: Parameters<typeof api.register>[0]) {
    const { token, user: newUser } = await api.register(data);
    localStorage.setItem("ironcore_token", token);
    setUser(newUser);
    return newUser;
  }

  function logout() {
    localStorage.removeItem("ironcore_token");
    setUser(null);
    setProfile(null);
    // fire-and-forget — backend /auth/logout doesn't invalidate anything server-side
    // (no token blacklist exists in auth.ts), it's just a formality
    api.logout().catch(() => {});
  }

  return (
    <AuthContext.Provider
      value={{ user, profile, isAuthenticated: !!user, isLoading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}