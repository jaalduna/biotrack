import React, { createContext, useContext, useState, useEffect } from "react";

// Runtime config interface (injected by docker-entrypoint.sh in production)
declare global {
  interface Window {
    __RUNTIME_CONFIG__?: {
      API_BASE_URL: string;
    };
  }
}

// Get API URL: prefer runtime config, then default
function getApiBaseUrl(): string {
  if (typeof window !== "undefined" && window.__RUNTIME_CONFIG__?.API_BASE_URL) {
    return window.__RUNTIME_CONFIG__.API_BASE_URL;
  }
  return "http://localhost:8000/api/v1";
}

const API_BASE_URL = getApiBaseUrl();

export interface User {
  id: string;
  name: string;
  email: string;
  role: "basic" | "advanced";
  team_id: string | null;
  team_role: "owner" | "admin" | "member" | null;
  is_active: boolean;
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string, role?: "basic" | "advanced") => Promise<void>;
  betaLogin: (name: string, email: string) => Promise<void>;
  logout: () => void;
  resendVerificationEmail: () => Promise<void>;
  isAuthenticated: boolean;
  isAdvanced: boolean;
  isBetaMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Load auth state from localStorage on mount
  useEffect(() => {
    const storedToken = localStorage.getItem("biotrack_token");
    const storedUser = localStorage.getItem("biotrack_user");

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Login failed");
    }

    const data = await response.json();

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("biotrack_token", data.access_token);
    localStorage.setItem("biotrack_user", JSON.stringify(data.user));
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: "basic" | "advanced" = "basic"
  ) => {
    const response = await fetch(`${API_BASE_URL}/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Registration failed");
    }

    const data = await response.json();

    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem("biotrack_token", data.access_token);
    localStorage.setItem("biotrack_user", JSON.stringify(data.user));
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("biotrack_token");
    localStorage.removeItem("biotrack_user");
    localStorage.removeItem("biotrack_beta_mode");
  };

  const betaLogin = async (name: string, email: string) => {
    const betaUser: User = {
      id: `beta_${Date.now()}`,
      name,
      email,
      role: "advanced",
      team_id: "beta_team_001",
      team_role: "member",
      is_active: true,
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const betaToken = `beta_token_${Date.now()}`;

    setUser(betaUser);
    setToken(betaToken);
    localStorage.setItem("biotrack_token", betaToken);
    localStorage.setItem("biotrack_user", JSON.stringify(betaUser));
    localStorage.setItem("biotrack_beta_mode", "true");
  };

  const resendVerificationEmail = async () => {
    if (!token) {
      throw new Error("Not authenticated");
    }

    const response = await fetch(`${API_BASE_URL}/auth/resend-verification-email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to resend verification email");
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        login,
        register,
        betaLogin,
        logout,
        resendVerificationEmail,
        isAuthenticated: !!user,
        isAdvanced: user?.role === "advanced",
        isBetaMode: localStorage.getItem("biotrack_beta_mode") === "true",
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
