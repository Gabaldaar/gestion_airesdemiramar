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
      setAuthError(null);

      if (!firebaseUser || !firebaseUser.email) {
        setUser(null);
        setAppUser(null);
        setLoading(false);
        return;
      }
      
      setUser(firebaseUser);

      try {
        const userProfile = await getProviderByEmail(firebaseUser.email);

        if (userProfile) {
          setAppUser(userProfile);
        } else {
          // If no profile, check if this should be the first admin
          const providersQuery = query(collection(db, 'providers'), limit(1));
          const providersSnapshot = await getDocs(providersQuery);

          if (providersSnapshot.empty) {
            console.log("No providers found. Promoting first user to admin.");
            const newAdminProfile: Omit<Provider, 'id'> = {
              name: firebaseUser.displayName || 'Admin',
              email: firebaseUser.email,
              role: 'admin',
              status: 'active',
              managementType: 'tasks',
              userId: firebaseUser.uid,
            };
            const createdAdmin = await addProviderDb(newAdminProfile);
            setAppUser(createdAdmin);
          } else {
            // Not the first user, and not found in DB -> unauthorized.
            setAppUser(null);
          }
        }
      } catch (error: any) {
        console.error("Auth Provider Error:", error);
        setAppUser(null);
        setAuthError(error.message || "An unknown error occurred during authentication.");
      } finally {
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
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setAuthError((error as Error).message || "Failed to sign in.");
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setAppUser(null);
    setAuthError(null);
  };

  const value = { user, appUser, loading, authError, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
