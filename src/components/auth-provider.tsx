
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, updateDoc, limit, setDoc, Timestamp, writeBatch } from 'firebase/firestore';
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

const PERSONAL_WORKSPACE_ID = "miramar-personal-workspace";

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
        const personalWorkspaceRef = doc(db, 'workspaces', PERSONAL_WORKSPACE_ID);
        const membersCollectionRef = collection(personalWorkspaceRef, 'members');
        
        // Ensure workspace doc exists
        const workspaceSnap = await getDoc(personalWorkspaceRef);
        if (!workspaceSnap.exists()) {
            await setDoc(personalWorkspaceRef, { name: 'Personal Workspace', createdAt: Timestamp.now() });
            console.log("Personal workspace document created.");
        }

        const allMembersSnapshot = await getDocs(query(membersCollectionRef, limit(1)));

        // SCENARIO A: No members exist in the personal workspace. Create the first user as admin.
        if (allMembersSnapshot.empty) {
          console.log("No members found in personal workspace, creating first admin user from Google Account.");
          
          const userEmail = firebaseUser.email || firebaseUser.providerData[0]?.email;
          const newAdminUser: Omit<Provider, 'id'> = {
            name: firebaseUser.displayName || 'Administrador Principal',
            email: userEmail || '',
            role: 'admin',
            status: 'active',
            userId: firebaseUser.uid,
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
          const newUserRef = await addDoc(membersCollectionRef, newAdminUser);
          
          setUser(firebaseUser);
          setAppUser({ id: newUserRef.id, ...newAdminUser } as AppUser);
          console.log("First admin user created and logged in successfully.");

        } else {
          // SCENARIO B: Members exist. Use the standard verification flow for the personal workspace.
          let foundUser: AppUser | null = null;
          
          const memberDocRef = doc(membersCollectionRef, firebaseUser.uid);
          const memberDocSnap = await getDoc(memberDocRef);

          if (memberDocSnap.exists()) {
              foundUser = { id: memberDocSnap.id, ...memberDocSnap.data() } as AppUser;
          } else {
              // Fallback: try to link by email if UID not found (first login for an existing provider)
              const userEmail = firebaseUser.email || firebaseUser.providerData[0]?.email;
              if (userEmail) {
                  const q = query(membersCollectionRef, where('email', '==', userEmail.toLowerCase()), limit(1));
                  const snapshot = await getDocs(q);
                  if (!snapshot.empty) {
                      const userDoc = snapshot.docs[0];
                      // Re-create doc with UID as ID, and delete the old one.
                      const oldDocRef = doc(membersCollectionRef, userDoc.id);
                      const newDocRefWithUid = doc(membersCollectionRef, firebaseUser.uid);
                      
                      const batch = writeBatch(db);
                      batch.set(newDocRefWithUid, { ...userDoc.data(), userId: firebaseUser.uid });
                      batch.delete(oldDocRef);
                      await batch.commit();

                      foundUser = { id: newDocRefWithUid.id, ...userDoc.data(), userId: firebaseUser.uid } as AppUser;
                      console.log(`User account for ${userEmail} successfully linked via email using UID as doc ID.`);
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
              // Commercial user flow would go here. For now, they are unauthorized.
              const userEmail = firebaseUser.email || firebaseUser.providerData[0]?.email;
              const errorMessage = `Tu cuenta de Google (${userEmail}) no está registrada para acceder a este espacio de trabajo.`;
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
