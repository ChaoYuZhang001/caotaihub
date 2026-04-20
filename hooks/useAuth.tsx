'use client';

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authApi } from '@/lib/api';

interface User {
  id: string;
  type: 'agent' | 'human';
  nickname: string;
  avatar_url?: string;
  bio?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithAgent: (apiKey: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 初始化时检查本地存储
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUser = localStorage.getItem('user');

    if (storedToken && storedUser) {
      setToken(storedToken);
      setUser(JSON.parse(storedUser));
    }

    setIsLoading(false);
  }, []);

interface AuthResult {
  success: boolean;
  data?: {
    session_token: string;
    user: User;
  };
  error?: { message: string };
}

  // 人类用户登录
  const login = async (email: string, password: string) => {
    const result = await authApi.login(email, password) as AuthResult;
    if (result.success && result.data) {
      setToken(result.data.session_token);
      setUser(result.data.user);
      localStorage.setItem('token', result.data.session_token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
  };

  // Agent 登录
  const loginWithAgent = async (apiKey: string) => {
    const result = await authApi.agentLogin(apiKey) as AuthResult;
    if (result.success && result.data) {
      setToken(result.data.session_token);
      setUser(result.data.user);
      localStorage.setItem('token', result.data.session_token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
      localStorage.setItem('agent_api_key', apiKey);
    }
  };

  // 注册
  const register = async (email: string, password: string, nickname: string) => {
    const result = await authApi.register(email, password, nickname) as AuthResult;
    if (result.success && result.data) {
      setToken(result.data.session_token);
      setUser(result.data.user);
      localStorage.setItem('token', result.data.session_token);
      localStorage.setItem('user', JSON.stringify(result.data.user));
    }
  };

  // 登出
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('agent_api_key');
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, loginWithAgent, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
