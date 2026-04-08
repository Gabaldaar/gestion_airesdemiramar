
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, limit } from 'firebase/firestore';
import { Provider } from '@/lib/data';
import { useRouter } from 'next/navigation';

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
        const providersCollectionRef = collection(db, 'providers');
        
        // Check if ANY provider exists to determine if this is a first-time setup.
        const allProvidersSnapshot = await getDocs(query(providersCollectionRef, limit(1)));

        // SCENARIO A: No providers exist. Create the first user as admin.
        if (allProvidersSnapshot.empty) {
          console.log("No providers found, creating first admin user from Google Account.");
          
          // The email might be null, but we cannot block the first admin.
          // Create them with a blank email and let them fix it in the app later.
          const userEmail = firebaseUser.email || firebaseUser.providerData[0]?.email;

          const newAdminUser: Omit<Provider, 'id'> = {
            name: firebaseUser.displayName || 'Administrador Principal',
            email: userEmail || '', // <-- KEY CHANGE: Use empty string if email is null
            role: 'admin',
            status: 'active',
            userId: firebaseUser.uid, // The crucial link
            managementType: 'tasks',
            rating: 0,
            phone: '',
            countryCode: '+54',
            address: '',
            notes: 'Usuario creado automáticamente como primer administrador.',
            adminNote: '',
            billingType: null,
            rateCurrency: null,
            hourlyRate: null,
            perVisitRate: null,
          };
          const newUserRef = await addDoc(providersCollectionRef, newAdminUser);
          
          setUser(firebaseUser);
          setAppUser({ id: newUserRef.id, ...newAdminUser } as AppUser);
          console.log("First admin user created and logged in successfully.");

        } else {
          // SCENARIO B: Providers exist. Use the standard verification flow.
          let foundUser: AppUser | null = null;
          
          // Step 1: Find user by UID (most efficient and secure)
          const providersQueryByUid = query(collection(db, 'providers'), where('userId', '==', firebaseUser.uid), limit(1));
          const uidSnapshot = await getDocs(providersQueryByUid);

          if (!uidSnapshot.empty) {
              const userDoc = uidSnapshot.docs[0];
              foundUser = { id: userDoc.id, ...userDoc.data() } as AppUser;
          } else {
              // Step 2: If not found by UID (first login), try to link by email.
              const userEmail = firebaseUser.email || firebaseUser.providerData[0]?.email;

              if (userEmail) {
                  const snapshot = await getDocs(providersCollectionRef);
                  const providers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Provider));
                  const lowercasedEmail = userEmail.toLowerCase();
                  const userDocMatch = providers.find(p => p.email && p.email.toLowerCase() === lowercasedEmail);

                  if (userDocMatch) {
                      await updateDoc(doc(db, 'providers', userDocMatch.id), { userId: firebaseUser.uid });
                      foundUser = { ...userDocMatch, userId: firebaseUser.uid } as AppUser;
                      console.log(`User account for ${userEmail} successfully linked via email.`);
                  }
              }
          }

          // Step 3: Evaluate the found user
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
              // If still not found, it means they are not registered.
              const userEmail = firebaseUser.email || firebaseUser.providerData[0]?.email;
              const errorMessage = `Tu cuenta de Google no está registrada para acceder a esta aplicación.\n\nEl email que se intentó usar es:\n\n${userEmail}\n\nPor favor, confirma que este es el email correcto y contacta al administrador para que lo registre.`;
              throw new Error(errorMessage);
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
    provider.addScope('email');
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
