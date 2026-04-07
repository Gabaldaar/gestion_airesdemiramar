
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getProviderByEmail, addProviderDb, Provider } from '@/lib/data';
import { collection, getDocs, query, limit } from 'firebase/firestore';

export type AppUser = Provider;

interface AuthContextType {
  user: User | null;
  appUser: AppUser | null;
  loading: boolean;
  authError: string | null;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  authError: null,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);
      
      if (!firebaseUser) {
        setUser(null);
        setAppUser(null);
        setAuthError(null);
        setLoading(false);
        return;
      }
      
      // We have a firebase user, now let's get their app profile.
      try {
        const userProfile = await getProviderByEmail(firebaseUser.email || '');

        // This is the crucial part. We set all states before we stop loading.
        setUser(firebaseUser);
        setAppUser(userProfile || null); // If not found, it's null.
        setAuthError(null);

      } catch (error: any) {
        console.error("Auth Provider Error:", error);
        setUser(firebaseUser); // Still set firebase user
        setAppUser(null); // But no app profile
        setAuthError(error.message || "An unknown authentication error occurred.");
      } finally {
        // This guarantees loading is always set to false at the end of the process.
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setAuthError((error as Error).message || "Failed to sign in.");
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    // onAuthStateChanged will handle the state clearing
  };

  const value = { user, appUser, loading, authError, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
