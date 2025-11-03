import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { api } from "../lib/api.js";

type User = {
  id: string;
  email: string;
  name?: string | null;
  role: string;
  customer?: {
    id: string;
    name: string;
    phone?: string | null;
    email?: string | null;
  } | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isLoading: boolean;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load token from localStorage on mount
  useEffect(() => {
    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      setToken(savedToken);
      // Fetch user info
      fetchUserInfo(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  async function fetchUserInfo(authToken: string) {
    try {
      const userInfo = await api<User>("/auth/me", {
        headers: {
          Authorization: `Bearer ${authToken}`
        }
      });
      setUser(userInfo);
    } catch (error) {
      console.error("Failed to fetch user info:", error);
      // Token might be invalid, clear it
      localStorage.removeItem("token");
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string) {
    const response = await api<{ token: string; user: User }>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password })
    });
    
    localStorage.setItem("token", response.token);
    setToken(response.token);
    setUser(response.user);
  }

  async function register(name: string, email: string, password: string) {
    const response = await api<{ token: string; user: User }>("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password })
    });
    
    localStorage.setItem("token", response.token);
    setToken(response.token);
    setUser(response.user);
  }

  function logout() {
    localStorage.removeItem("token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, token, login, register, logout, isLoading }}>
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

