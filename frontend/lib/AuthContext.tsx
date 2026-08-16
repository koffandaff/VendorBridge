"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { api, clearTokens, getAccessToken, getRefreshToken, setTokens } from "./api";
import type { AuthUserDto, LoginResponse } from "./types";

export type UserRole = "Admin" | "Procurement Officer" | "Manager/Approver" | "Vendor";

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  role: UserRole;
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ROLE_LABEL: Record<AuthUserDto["role"], UserRole> = {
  ADMIN: "Admin",
  PROCUREMENT_OFFICER: "Procurement Officer",
  APPROVER: "Manager/Approver",
  VENDOR: "Vendor",
};

function toFrontendUser(user: AuthUserDto): User {
  return {
    id: user.id,
    username: user.name,
    name: user.name,
    email: user.email,
    role: ROLE_LABEL[user.role] ?? "Vendor",
  };
}

function storeUser(user: User): void {
  window.localStorage.setItem("auth_user", JSON.stringify(user));
}

function readStoredUser(): User | null {
  const stored = window.localStorage.getItem("auth_user");
  if (!stored) return null;
  try {
    return JSON.parse(stored) as User;
  } catch {
    return null;
  }
}

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(() =>
    typeof window !== "undefined" ? readStoredUser() : null
  );
  const [loading, setLoading] = useState(
    () => typeof window !== "undefined" && !!getAccessToken() && !!getRefreshToken()
  );
  const router = useRouter();

  useEffect(() => {
    if (!getAccessToken() || !getRefreshToken()) {
      return;
    }

    api
      .get<AuthUserDto>("/auth/me")
      .then((me) => {
        const freshUser = toFrontendUser(me);
        setUser(freshUser);
        storeUser(freshUser);
      })
      .catch(() => {
        setUser(null);
        clearTokens();
        window.localStorage.removeItem("auth_user");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const login = useCallback(
    async (email: string, password: string) => {
      const response = await api.post<LoginResponse>("/auth/login", { email, password });
      setTokens(response.accessToken, response.refreshToken);
      const loggedInUser = toFrontendUser(response.user);
      setUser(loggedInUser);
      storeUser(loggedInUser);
      router.push("/dashboard");
    },
    [router]
  );

  const logout = useCallback(async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      api.post("/auth/logout", { refreshToken }).catch(() => undefined);
    }
    setUser(null);
    clearTokens();
    window.localStorage.removeItem("auth_user");
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};