 "use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { apiGet, apiPost, apiPut, ApiError } from "../api/http";
import type {
  AuthResponse,
  AuthUser,
  LoginRequest,
  RegisterEmployerRequest,
  RegisterWorkerRequest,
} from "../types/auth";

type AuthStatus = "idle" | "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  user: AuthUser | null;
  status: AuthStatus;
  error: string | null;
  login: (payload: LoginRequest) => Promise<AuthResponse>;
  registerEmployer: (payload: RegisterEmployerRequest) => Promise<AuthResponse>;
  registerWorker: (payload: RegisterWorkerRequest) => Promise<AuthResponse>;
  logout: () => void;
  updateProfile: (payload: Partial<Pick<AuthUser, "fullName" | "address">>) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

const TOKEN_KEY = "fa_token";
const USER_KEY = "fa_user";

function persistSession(token: string, user: AuthUser) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(TOKEN_KEY, token);
  window.localStorage.setItem(USER_KEY, JSON.stringify(user));
}

function clearSession() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(TOKEN_KEY);
  window.localStorage.removeItem(USER_KEY);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [status, setStatus] = useState<AuthStatus>("idle");
  const [error, setError] = useState<string | null>(null);

  // Bootstrap from localStorage and optionally refresh from /api/users/me
  useEffect(() => {
    if (typeof window === "undefined") return;

    const token = window.localStorage.getItem(TOKEN_KEY);
    const rawUser = window.localStorage.getItem(USER_KEY);

    if (!token || !rawUser) {
      setStatus("unauthenticated");
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as AuthUser;
      setUser(parsed);
      setStatus("loading");

      apiGet<AuthUser>("/api/users/me", { auth: true })
        .then((freshUser) => {
          setUser(freshUser);
          persistSession(token, freshUser);
          setStatus("authenticated");
        })
        .catch(() => {
          clearSession();
          setUser(null);
          setStatus("unauthenticated");
        });
    } catch {
      clearSession();
      setStatus("unauthenticated");
    }
  }, []);

  const handleAuthSuccess = useCallback((res: AuthResponse) => {
    persistSession(res.token, res.user);
    setUser(res.user);
    setStatus("authenticated");
    setError(null);
  }, []);

  const login = useCallback(
    async (payload: LoginRequest): Promise<AuthResponse> => {
      setStatus("loading");
      setError(null);
      try {
        const res = await apiPost<LoginRequest, AuthResponse>(
          "/api/auth/login",
          payload,
        );
        handleAuthSuccess(res);
        return res;
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Login failed");
        setStatus("unauthenticated");
        throw err;
      }
    },
    [handleAuthSuccess],
  );

  const registerEmployer = useCallback(
    async (payload: RegisterEmployerRequest): Promise<AuthResponse> => {
      setStatus("loading");
      setError(null);
      try {
        const res = await apiPost<RegisterEmployerRequest, AuthResponse>(
          "/api/auth/register-employer",
          payload,
        );
        handleAuthSuccess(res);
        return res;
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Registration failed");
        setStatus("unauthenticated");
        throw err;
      }
    },
    [handleAuthSuccess],
  );

  const registerWorker = useCallback(
    async (payload: RegisterWorkerRequest): Promise<AuthResponse> => {
      setStatus("loading");
      setError(null);
      try {
        const res = await apiPost<RegisterWorkerRequest, AuthResponse>(
          "/api/auth/register-worker",
          payload,
        );
        handleAuthSuccess(res);
        return res;
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Registration failed");
        setStatus("unauthenticated");
        throw err;
      }
    },
    [handleAuthSuccess],
  );

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    setStatus("unauthenticated");
    setError(null);
  }, []);

  const updateProfile = useCallback(
    async (
      payload: Partial<Pick<AuthUser, "fullName" | "address">>,
    ): Promise<void> => {
      if (!user) return;
      setStatus("loading");
      setError(null);
      try {
        const updated = await apiPut<
          Partial<Pick<AuthUser, "fullName" | "address">>,
          AuthUser
        >("/api/users/me", payload, { auth: true });
        setUser(updated);
        const token =
          typeof window !== "undefined"
            ? window.localStorage.getItem(TOKEN_KEY) ?? ""
            : "";
        if (token) {
          persistSession(token, updated);
        }
        setStatus("authenticated");
      } catch (err) {
        const e = err as ApiError;
        setError(e.message ?? "Profile update failed");
        setStatus("authenticated");
        throw err;
      }
    },
    [user],
  );

  const value: AuthContextValue = {
    user,
    status,
    error,
    login,
    registerEmployer,
    registerWorker,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}


