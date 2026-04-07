
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getProviderByEmail, addProviderDb, Provider } from '@/lib/data';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';

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

      if (!firebaseUser) {
        // User is logged out, clear everything
        setUser(null);
        setAppUser(null);
        setLoading(false);
        return;
      }

      // User is logged in with Google
      try {
        setUser(firebaseUser);

        if (!firebaseUser.email) {
          throw new Error("El email del usuario de Google no está disponible.");
        }

        // Attempt to find user profile in 'providers' collection
        let userProfile = await getProviderByEmail(firebaseUser.email);

        if (userProfile) {
          // User exists, set them as the appUser
          setAppUser(userProfile);
        } else {
          // User does NOT exist in the database. Check if they should be the first admin.
          const providersQuery = query(collection(db, 'providers'), limit(1));
          const providersSnapshot = await getDocs(providersQuery);

          if (providersSnapshot.empty) {
            // The 'providers' collection is completely empty. This is the very first user.
            console.log("No providers found. Promoting first user to admin.");
            const newAdminProfile: Omit<Provider, 'id'> = {
              name: firebaseUser.displayName || 'Admin',
              email: firebaseUser.email,
              role: 'admin',
              status: 'active',
              managementType: 'tasks',
              userId: firebaseUser.uid,
            };
            userProfile = await addProviderDb(newAdminProfile);
            setAppUser(userProfile); // Set the newly created admin as appUser
          } else {
            // The collection is not empty, but the user was not found. They are unauthorized.
            setAppUser(null);
          }
        }
      } catch (error) {
        console.error("Critical error in AuthProvider:", error);
        // If anything fails, set to a logged out state to be safe.
        setUser(null);
        setAppUser(null);
      } finally {
        setLoading(false); // ALWAYS stop loading
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
    // Let the LayoutManager handle the redirect
  };

  const value = { user, appUser, loading, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
