
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
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  appUser: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<AppUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setLoading(true);

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
          // Scenario 1: User profile found in the database.
          setAppUser(userProfile);
        } else {
          // Scenario 2: No profile found. Check if this is the very first user.
          const providersQuery = query(collection(db, 'providers'), limit(1));
          const providersSnapshot = await getDocs(providersQuery);

          if (providersSnapshot.empty) {
            // Database is empty. This is the first user, promote to admin.
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
            // Database is NOT empty, but this user is not in it. They are unauthorized.
            setAppUser(null);
          }
        }
      } catch (error) {
        console.error("Auth Provider Error:", error);
        setAppUser(null);
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
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUser(null);
    setAppUser(null);
  };

  const value = { user, appUser, loading, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
