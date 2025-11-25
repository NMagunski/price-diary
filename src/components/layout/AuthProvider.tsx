"use client";

import {
  onAuthStateChanged,
  User,
} from "firebase/auth";
import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { auth } from "@/lib/firebase/auth";
import { ensureUserProfile } from "@/lib/firebase/firestore";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // гарантираме, че има документ в users/{uid}
        await ensureUserProfile(firebaseUser);
      }
      setUser(firebaseUser);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuthContext must be used within AuthProvider");
  }
  return ctx;
}
