
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
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
        if (firebaseUser) {
            try {
                // There are cases where the user object is available but the email is not yet.
                // We ensure we have an email before proceeding.
                if (!firebaseUser.email) {
                    throw new Error("El email del usuario no está disponible.");
                }

                setUser(firebaseUser);
                const providerProfile = await getProviderByEmail(firebaseUser.email);

                if (providerProfile) {
                    // User is a registered provider
                    if (providerProfile.status === 'pending') {
                        setAppUser({ ...providerProfile, role: 'provider' });
                    } else { // active
                        if (!providerProfile.userId) { // Link Firebase UID on first active login
                             await updateProviderDb({ ...providerProfile, userId: firebaseUser.uid });
                        }
                        setAppUser({ ...providerProfile, role: 'provider' });
                    }
                } else {
                    // If not found in providers, assume ADMIN
                    setAppUser({
                        id: firebaseUser.uid,
                        name: firebaseUser.displayName || 'Admin',
                        email: firebaseUser.email,
                        role: 'admin',
                        status: 'active',
                        managementType: 'tasks' // Default for admin
                    });
                }
            } catch (error) {
                console.error("Error during auth processing, assuming admin to prevent lockout:", error);
                // Failsafe: on any error, assume admin to prevent being locked out.
                 setAppUser({
                    id: firebaseUser.uid,
                    name: firebaseUser.displayName || 'Admin (Failsafe)',
                    email: firebaseUser.email!,
                    role: 'admin',
                    status: 'active',
                    managementType: 'tasks'
                });
            } finally {
                setLoading(false);
            }
        } else {
            // No user is signed in.
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
