import React, { createContext, useContext, useEffect, useState } from 'react';
import { type User, onAuthStateChanged, signInWithPopup, signOut } from 'firebase/auth';

const DEMO = import.meta.env.VITE_DEMO_MODE === 'true';

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signIn: () => Promise<void>;
  handleSignOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

function RealAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Dynamic import avoids crashing when Firebase config is missing
    import('../firebase').then(({ auth, googleProvider }) => {
      const unsubscribe = onAuthStateChanged(auth, (u) => {
        setUser(u);
        setLoading(false);
      });
      return unsubscribe;
    }).catch(() => setLoading(false));
  }, []);

  const signIn = async () => {
    const { auth, googleProvider } = await import('../firebase');
    await signInWithPopup(auth, googleProvider);
  };

  const handleSignOut = async () => {
    const { auth } = await import('../firebase');
    await signOut(auth);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, handleSignOut }}>
      {children}
    </AuthContext.Provider>
  );
}

const DEMO_USER = { uid: 'demo', email: 'demo@example.com', displayName: 'Demo User' } as unknown as User;

function DemoAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(DEMO_USER);
  return (
    <AuthContext.Provider value={{
      user, loading: false,
      signIn: async () => setUser(DEMO_USER),
      handleSignOut: async () => setUser(null),
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return DEMO ? <DemoAuthProvider>{children}</DemoAuthProvider> : <RealAuthProvider>{children}</RealAuthProvider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
