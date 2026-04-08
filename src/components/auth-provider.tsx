
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, limit } from 'firebase/firestore';
import { useRouter } from 'next/navigation';
import { Provider } from '@/lib/data';

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
  const router = useRouter();

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
        let foundUser: AppUser | null = null;
        
        // Step 1: Try to find user by UID first (most efficient)
        const providersQueryByUid = query(collection(db, 'providers'), where('userId', '==', firebaseUser.uid), limit(1));
        const uidSnapshot = await getDocs(providersQueryByUid);
        
        if (!uidSnapshot.empty) {
            const userDoc = uidSnapshot.docs[0];
            foundUser = { id: userDoc.id, ...userDoc.data() } as AppUser;
        } else {
            // Step 2: If not found by UID, try to link by email (for first-time logins)
            const userEmail = firebaseUser.email || firebaseUser.providerData[0]?.email;
            
            if (userEmail) {
                const snapshot = await getDocs(collection(db, 'providers'));
                const providers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
                const lowercasedEmail = userEmail.toLowerCase();
                
                const userDocMatch = providers.find(p => p.email && p.email.toLowerCase() === lowercasedEmail);

                if (userDocMatch) {
                    await updateDoc(doc(db, 'providers', userDocMatch.id), { userId: firebaseUser.uid });
                    foundUser = { ...userDocMatch, userId: firebaseUser.uid } as AppUser;
                    console.log(`User account for ${userEmail} successfully linked via email.`);
                }
            } else if (firebaseUser.displayName) {
                // Step 3: Last resort, for cases where email is null, try to link by display name.
                const providersQueryByName = query(collection(db, 'providers'), where('name', '==', firebaseUser.displayName), limit(2));
                const nameSnapshot = await getDocs(providersQueryByName);
                
                if (nameSnapshot.size === 1) {
                    const userDoc = nameSnapshot.docs[0];
                    await updateDoc(userDoc.ref, { userId: firebaseUser.uid });
                    foundUser = { id: userDoc.id, ...userDoc.data(), userId: firebaseUser.uid } as AppUser;
                    console.log(`User account for ${firebaseUser.displayName} successfully linked via display name.`);
                } else if (nameSnapshot.size > 1) {
                    throw new Error(`Error de vinculación: Se encontraron múltiples colaboradores con el nombre "${firebaseUser.displayName}". Por favor, contacte al administrador para resolverlo.`);
                }
            }
        }

        if (foundUser) {
            if (foundUser.status === 'active') {
                setUser(firebaseUser);
                setAppUser(foundUser);
            } else {
                setUser(firebaseUser);
                setAppUser(null);
                router.push('/pending-activation');
            }
        } else {
            // Step 4: Handle first-ever user for the app
            const providersCollectionRef = collection(db, 'providers');
            const allProvidersSnapshot = await getDocs(query(providersCollectionRef, limit(1)));

            if (allProvidersSnapshot.empty) {
                console.log("No providers found, creating first admin user.");
                const userEmail = firebaseUser.email || firebaseUser.providerData[0]?.email;
                if (!userEmail) {
                    throw new Error("No se pudo obtener el email de la cuenta de Google para crear el primer administrador.");
                }

                const newAdminUser: Omit<Provider, 'id'> = {
                    name: firebaseUser.displayName || 'Administrador Principal',
                    email: userEmail,
                    role: 'admin',
                    status: 'active',
                    userId: firebaseUser.uid,
                    managementType: 'tasks',
                    rating: 0
                };
                const newUserRef = await addDoc(providersCollectionRef, newAdminUser);
                setUser(firebaseUser);
                setAppUser({ id: newUserRef.id, ...newAdminUser } as AppUser);
            } else {
                // If not first user and not found, then they are not authorized.
                const attemptedEmail = firebaseUser.email || (firebaseUser.providerData[0] && firebaseUser.providerData[0].email) || 'desconocido';
                throw new Error(`Tu cuenta de Google (${attemptedEmail}) no está registrada para acceder a esta aplicación.`);
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
  }, [router]);


  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({
      prompt: 'select_account'
    });
    setLoading(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Error signing in with Google: ", error);
      setAuthError((error as Error).message || "Falló el inicio de sesión.");
      setLoading(false);
      throw error;
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  const value = { user, appUser, loading, authError, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
