'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { getProviderByEmail, updateProviderDb, Provider } from '@/lib/data';
import { useRouter } from 'next/navigation';

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
        // User is logged in, find their profile.
        setUser(firebaseUser);
        let userProfile: AppUser | null = null;
        try {
          if (!firebaseUser.email) {
            throw new Error("El email del usuario de Google no está disponible.");
          }
          // Check if the user is a registered provider
          const providerProfile = await getProviderByEmail(firebaseUser.email);
          if (providerProfile) {
            userProfile = { ...providerProfile, role: 'provider' };
            // Link Firebase UID on first active login if not already present
            if (providerProfile.status === 'active' && !providerProfile.userId) {
              await updateProviderDb({ ...providerProfile, userId: firebaseUser.uid });
            }
          }
        } catch (error) {
          console.error("Error al buscar el perfil de proveedor. Se asumirá rol de admin. Error:", error);
        }

        // If after all checks, userProfile is still null, it means the user is not a provider.
        // In this app, that means they are the ADMIN. This is the failsafe.
        if (!userProfile) {
          userProfile = {
            id: firebaseUser.uid,
            name: firebaseUser.displayName || 'Admin',
            email: firebaseUser.email || "",
            role: 'admin',
            status: 'active',
            managementType: 'tasks'
          };
        }
        setAppUser(userProfile);

      } else {
        // User is logged out
        setUser(null);
        setAppUser(null);
      }
      
      // Crucially, set loading to false after all async operations are done.
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
