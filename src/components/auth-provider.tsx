
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
      try {
        if (firebaseUser) {
          setUser(firebaseUser);
          
          if (!firebaseUser.email) {
            throw new Error("El email del usuario de Google no está disponible.");
          }

          let userProfile = await getProviderByEmail(firebaseUser.email);
          
          // If user profile doesn't exist, check if they should be the first admin
          if (!userProfile) {
            const adminQuery = query(collection(db, 'providers'), where('role', '==', 'admin'), limit(1));
            const adminSnapshot = await getDocs(adminQuery);

            if (adminSnapshot.empty) {
              // This is the very first user, promote them to admin.
              console.log("No admins found. Promoting first user to admin.");
              const newAdminProfile: Omit<Provider, 'id'> = {
                name: firebaseUser.displayName || 'Admin',
                email: firebaseUser.email,
                role: 'admin',
                status: 'active',
                managementType: 'tasks', 
                userId: firebaseUser.uid,
              };
              userProfile = await addProviderDb(newAdminProfile);
            }
          }
          
          // If still no profile, they are not authorized (unless it's you, the fallback admin)
          // The final user object is set here.
          setAppUser(userProfile);

        } else {
          // User is logged out
          setUser(null);
          setAppUser(null);
        }
      } catch (error) {
        console.error("Critical error in AuthProvider:", error);
        // On ANY error during auth, default to a state that doesn't lock out the primary user.
        // The LayoutManager will interpret `user` but `!appUser` as the admin.
        setUser(firebaseUser); // Keep the firebase user if it exists
        setAppUser(null);
      } finally {
        // This is crucial: ALWAYS stop loading, no matter what.
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
    // Let the LayoutManager handle the redirect
  };

  const value = { user, appUser, loading, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
