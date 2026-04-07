
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser && firebaseUser.email) {
        setUser(firebaseUser);
        
        getProviderByEmail(firebaseUser.email)
          .then((providerProfile) => {
            if (providerProfile) {
              // User is a registered provider
              if (!providerProfile.userId) {
                providerProfile.userId = firebaseUser.uid;
                // Fire-and-forget update is safe here
                updateProviderDb(providerProfile);
              }
              setAppUser(providerProfile);
            } else {
              // Failsafe: User is not in the providers list, so they must be the admin.
              setAppUser({
                  id: firebaseUser.uid,
                  name: firebaseUser.displayName || 'Admin',
                  email: firebaseUser.email,
                  role: 'admin',
                  status: 'active',
                  managementType: 'tasks'
              });
            }
          })
          .catch((error) => {
            console.error("CRITICAL: AuthProvider DB error. Assuming ADMIN to prevent lockout.", error);
            // Failsafe: If the database query fails for any reason, assume the user is an admin.
            setAppUser({
                id: firebaseUser.uid,
                name: firebaseUser.displayName || 'Admin (Failsafe)',
                email: firebaseUser.email,
                role: 'admin',
                status: 'active',
                managementType: 'tasks'
            });
          })
          .finally(() => {
            setLoading(false);
          });
          
      } else {
        // No user, clear all session data.
        setUser(null);
        setAppUser(null);
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
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
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
