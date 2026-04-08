
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
        // --- DIAGNOSTIC LOGIC ---
        // 1. Fetch all providers from Firestore
        const providersQuery = query(collection(db, 'providers'));
        const providersSnapshot = await getDocs(providersQuery);
        const allProviders = providersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // 2. Construct a detailed diagnostic message
        const diagnosticInfo = {
            firebaseUserObject: JSON.stringify(firebaseUser, null, 2),
            firestoreProviders: JSON.stringify(allProviders, null, 2),
        };

        const diagnosticError = `
Intento de Depuración:
=====================
Objeto de Usuario de Google (lo que se recibe de Firebase):
---------------------------------------------------------
${diagnosticInfo.firebaseUserObject}

=====================
Colaboradores en Base de Datos (lo que se lee de Firestore):
----------------------------------------------------------
${diagnosticInfo.firestoreProviders}
        `;

        // 3. Throw this error to display it on the screen
        throw new Error(diagnosticError);
        // --- END OF DIAGNOSTIC LOGIC ---

      } catch (error: any) {
        console.error("Auth Provider Diagnostic Error:", error);
        setUser(firebaseUser); // Keep firebase user so the error screen has context
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
