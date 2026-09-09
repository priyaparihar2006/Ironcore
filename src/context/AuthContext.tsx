import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api, AuthUser } from "../services/api";

interface AuthContextType {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string, rememberMe: boolean) => Promise<AuthUser>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function restoreSession() {
      const storedToken = localStorage.getItem("ironcore_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        // /auth/me returns { user, profile, membership } — pull out .user
        const { user: me } = await api.getMe();
        setUser(me);
      } catch {
        // covers both 401 (invalid/expired token) and 403 (deactivated account)
        localStorage.removeItem("ironcore_token");
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    }

    restoreSession();
  }, []);

  async function login(email: string, password: string, rememberMe: boolean) {
    const { token, user: loggedUser } = await api.login(email, password, rememberMe);
    localStorage.setItem("ironcore_token", token);
    setUser(loggedUser);
    return loggedUser;
  }

  function logout() {
    localStorage.removeItem("ironcore_token");
    setUser(null);
    // fire-and-forget — backend /auth/logout doesn't invalidate anything server-side
    // (no token blacklist exists in auth.ts), it's just a formality
    api.logout().catch(() => {});
  }

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}