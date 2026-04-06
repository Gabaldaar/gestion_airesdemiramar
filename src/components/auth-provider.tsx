
'use client';

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import { getProviderByEmail, updateProviderDb, Provider } from '@/lib/data';

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

  const fetchAppUser = useCallback(async (firebaseUser: User | null) => {
    if (firebaseUser?.email) {
        const providerProfile = await getProviderByEmail(firebaseUser.email);

        if (providerProfile) {
            // The user is a registered provider
            if (!providerProfile.userId) {
                providerProfile.userId = firebaseUser.uid;
                await updateProviderDb(providerProfile);
            }
            setAppUser(providerProfile);
        } else {
            // If the user is not a provider, assume they are the admin.
            // This is a failsafe to ensure the primary user can always log in.
            setAppUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Admin',
                email: firebaseUser.email,
                role: 'admin',
                status: 'active',
                managementType: 'tasks'
            });
        }
    } else {
      setAppUser(null);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      fetchAppUser(firebaseUser);
    });

    return () => unsubscribe();
  }, [fetchAppUser]);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      setLoading(true);
      await signInWithPopup(auth, provider);
      // The onAuthStateChanged listener will handle the rest
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setAppUser(null);
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
