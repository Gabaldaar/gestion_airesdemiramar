
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
      
      if (!firebaseUser) {
        setUser(null);
        setAppUser(null);
        setLoading(false);
        return;
      }
      
      try {
        // Robustly get the email from the user object
        const email = firebaseUser.email || (firebaseUser.providerData[0] && firebaseUser.providerData[0].email);

        if (!email) {
            throw new Error("No se pudo obtener la dirección de email de la cuenta de Google.");
        }

        const existingProvider = await getProviderByEmail(email);
        
        if (existingProvider) {
            // User exists in our DB
            setUser(firebaseUser);
            setAppUser(existingProvider);
        } else {
            // User does not exist in our DB, check if it's the very first user
            const providersQuery = query(collection(db, 'providers'), limit(1));
            const providersSnapshot = await getDocs(providersQuery);

            if (providersSnapshot.empty) {
                // This is the first user, create them as an admin
                console.log("No providers found, creating first user as admin.");
                const newAdmin: Omit<Provider, 'id'> = {
                    name: firebaseUser.displayName || 'Admin',
                    email: email, // Use the safe email
                    role: 'admin',
                    status: 'active',
                    managementType: 'tasks', // Default value
                };
                const createdAdmin = await addProviderDb(newAdmin);
                setUser(firebaseUser);
                setAppUser(createdAdmin);
            } else {
                // Other users exist, but this one is not registered
                console.log(`User ${email} not found in DB.`);
                setUser(firebaseUser); // Keep firebase user but...
                setAppUser(null);      // ...clear app user
                setAuthError(`La cuenta de Google (${email}) no está registrada para acceder a esta aplicación. Revisa que este sea el email correcto y contacta al administrador.`);
            }
        }
      } catch (error: any) {
        console.error("Auth Provider Error:", error);
        setUser(firebaseUser);
        setAppUser(null);
        setAuthError(error.message || "Ocurrió un error desconocido durante la autenticación.");
      } finally {
        setLoading(false);
      }
    });

    return () => unsubscribe();
  }, []);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
      // onAuthStateChanged will handle the rest
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setAuthError((error as Error).message || "Falló el inicio de sesión.");
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
