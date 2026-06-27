import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem('supwork-demo-user');
    if (stored) {
      setUser(JSON.parse(stored) as User);
    }
  }, []);

  const login = async (email: string, pass: string) => {
    return new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        if (pass !== 'demo') {
          reject(new Error('Invalid password'));
          return;
        }
        if (email === 'interviewee@demo.supwork.local') {
          const nextUser: User = { id: 'u_interviewee_maya', email, role: 'interviewee', name: 'Maya Tan' };
          setUser(nextUser);
          window.localStorage.setItem('supwork-demo-user', JSON.stringify(nextUser));
          resolve();
        } else if (email === 'hr@demo.supwork.local') {
          const nextUser: User = { id: 'u_hr_alex', email, role: 'hr', name: 'Alex Lee' };
          setUser(nextUser);
          window.localStorage.setItem('supwork-demo-user', JSON.stringify(nextUser));
          resolve();
        } else {
          reject(new Error('User not found'));
        }
      }, 500);
    });
  };

  const logout = () => {
    setUser(null);
    window.localStorage.removeItem('supwork-demo-user');
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
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
