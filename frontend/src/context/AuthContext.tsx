import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { getMe, login as backendLogin } from '@/api/supworkClient';
import { AuthSession, User } from '../types';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  backendAvailable: boolean;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [backendAvailable, setBackendAvailable] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const stored = window.localStorage.getItem('supwork-demo-session');
    if (stored) {
      const session = JSON.parse(stored) as AuthSession;
      setUser(session.user);
      setAccessToken(session.accessToken);
      setBackendAvailable(session.backendAvailable);
      if (session.backendAvailable && session.accessToken) {
        void getMe(session.accessToken).catch(() => {
          if (cancelled) return;
          setUser(null);
          setAccessToken(null);
          setBackendAvailable(false);
          window.localStorage.removeItem('supwork-demo-session');
        });
      }
      return () => {
        cancelled = true;
      };
    }
    const legacy = window.localStorage.getItem('supwork-demo-user');
    if (legacy) {
      setUser(JSON.parse(legacy) as User);
    }
    return () => {
      cancelled = true;
    };
  }, []);

  const login = async (email: string, pass: string) => {
    try {
      const session = await backendLogin(email, pass);
      setUser(session.user);
      setAccessToken(session.accessToken);
      setBackendAvailable(true);
      window.localStorage.setItem('supwork-demo-session', JSON.stringify(session));
      window.localStorage.removeItem('supwork-demo-user');
      return;
    } catch {
      if (pass !== 'demo') {
        throw new Error('Invalid password');
      }
      const nextUser = fallbackUser(email);
      const session: AuthSession = {
        accessToken: '',
        backendAvailable: false,
        user: nextUser,
      };
      setUser(nextUser);
      setAccessToken(null);
      setBackendAvailable(false);
      window.localStorage.setItem('supwork-demo-session', JSON.stringify(session));
      window.localStorage.removeItem('supwork-demo-user');
    }
  };

  const logout = () => {
    setUser(null);
    setAccessToken(null);
    setBackendAvailable(false);
    window.localStorage.removeItem('supwork-demo-session');
    window.localStorage.removeItem('supwork-demo-user');
  };

  return (
    <AuthContext.Provider value={{ user, accessToken, backendAvailable, login, logout }}>
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

function fallbackUser(email: string): User {
  if (email === 'interviewee@demo.supwork.local') {
    return { id: 'u_interviewee_maya', email, role: 'interviewee', name: 'Maya Tan' };
  }
  if (email === 'hr@demo.supwork.local') {
    return { id: 'u_hr_alex', email, role: 'hr', name: 'Alex Lee' };
  }
  throw new Error('User not found');
}
