import { useEffect } from 'react';
import { useLocation } from 'wouter';
import { useAuth } from '@/context/AuthContext';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

export function AppShell({ children }: { children: import('react').ReactNode }) {
  const { user } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!user) {
      setLocation('/');
      return;
    }

    if (user.role === 'interviewee' && location.startsWith('/hr')) {
      setLocation('/interviewee');
    }

    if (user.role === 'hr' && location.startsWith('/interviewee')) {
      setLocation('/hr');
    }
  }, [location, setLocation, user]);

  if (!user) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-background text-foreground">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <StatusBar />
        <main className="flex-1 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
