import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  api,
  clearTokens,
  getAccessToken,
  storeTokens,
} from "@/api/client";
import type { UserProfile } from "@/api/types";

type AuthState = {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    displayName?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  updateDisplayName: (displayName: string) => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshProfile = useCallback(async () => {
    if (!getAccessToken()) {
      setUser(null);
      return;
    }
    setUser(await api.getProfile());
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (getAccessToken()) {
          const profile = await api.getProfile();
          if (!cancelled) setUser(profile);
        }
      } catch {
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    storeTokens(await api.login(email, password));
    setUser(await api.getProfile());
  }, []);

  const register = useCallback(
    async (email: string, password: string, displayName?: string) => {
      storeTokens(await api.registerAccount(email, password, displayName));
      setUser(await api.getProfile());
    },
    [],
  );

  const logout = useCallback(async () => {
    await api.logout();
    clearTokens();
    setUser(null);
  }, []);

  const updateDisplayName = useCallback(async (displayName: string) => {
    const trimmed = displayName.trim();
    setUser(await api.updateProfile(trimmed || null));
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      updateDisplayName,
    }),
    [
      user,
      loading,
      login,
      register,
      logout,
      refreshProfile,
      updateDisplayName,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
