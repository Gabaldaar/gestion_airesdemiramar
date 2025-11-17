
'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, signInWithRedirect, GoogleAuthProvider, signOut as firebaseSignOut, User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // onAuthStateChanged es la única fuente de verdad.
    // Maneja el estado inicial, los inicios de sesión, los cierres de sesión
    // y el resultado de signInWithRedirect automáticamente.
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setUser(user);
      setLoading(false);
    });

    // Limpiar la suscripción al desmontar el componente.
    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      // signInWithRedirect es más robusto en diferentes entornos.
      await signInWithRedirect(auth, provider);
      // No es necesario manejar el resultado aquí, onAuthStateChanged lo hará.
    } catch (error) {
      console.error("Error signing in with Google: ", error);
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      // onAuthStateChanged se encargará de poner user a null y el LayoutManager redirigirá.
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  const value = { user, loading, signInWithGoogle, signOut };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  return useContext(AuthContext);
};
