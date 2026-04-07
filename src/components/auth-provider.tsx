'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { getProviderByEmail, updateProviderDb, Provider, addProviderDb } from '@/lib/data';
import { useRouter } from 'next/navigation';
import { collection, getDocs, query, where } from 'firebase/firestore';

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
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        let userProfile: AppUser | null = null;
        
        try {
          if (!firebaseUser.email) {
            throw new Error("El email del usuario de Google no está disponible.");
          }

          // 1. Check if any admin exists at all
          const adminQuery = query(collection(db, 'providers'), where('role', '==', 'admin'));
          const adminSnapshot = await getDocs(adminQuery);

          if (adminSnapshot.empty) {
            // First user ever! Make them the admin.
            console.log("No admins found. Promoting first user to admin.");
            const newAdminProfile: Omit<Provider, 'id'> = {
              name: firebaseUser.displayName || 'Admin',
              email: firebaseUser.email,
              role: 'admin',
              status: 'active',
              managementType: 'tasks',
              userId: firebaseUser.uid,
            };
            const createdAdmin = await addProviderDb(newAdminProfile);
            userProfile = createdAdmin;

          } else {
            // Admins exist, proceed with normal lookup
            const providerProfile = await getProviderByEmail(firebaseUser.email);
            if (providerProfile) {
              userProfile = providerProfile;
              // Link Firebase UID on first active login if not already present
              if (providerProfile.status === 'active' && !providerProfile.userId) {
                await updateProviderDb({ ...providerProfile, userId: firebaseUser.uid });
              }
            } else {
              // User is not in the providers list, so they are not authorized.
              userProfile = null;
            }
          }
        } catch (error) {
          console.error("Error during auth state change processing:", error);
          userProfile = null; // Default to not authorized on error
        }
        
        setAppUser(userProfile);

      } else {
        // User is logged out
        setUser(null);
        setAppUser(null);
      }
      
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    setLoading(true); // Show loading during sign-in process
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the user state update
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged will handle clearing user state
      router.push('/login');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const value = { user, appUser, loading, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
