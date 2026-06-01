'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { auth, db } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect, getRedirectResult, onAuthStateChanged, signOut as firebaseSignOut, User } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, Timestamp, FieldValue } from 'firebase/firestore';

const ADMIN_EMAILS = ['yousefgaafer85@gmail.com'];

interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'user';
  createdAt: Timestamp | FieldValue;
}

interface AuthContextType {
  user: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null, userProfile: null, loading: true, isAdmin: false,
  signInWithGoogle: async () => {}, signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        try {
          const userDoc = await getDoc(doc(db, 'users', firebaseUser.uid));
          if (userDoc.exists()) {
            setUserProfile(userDoc.data() as UserProfile);
          } else {
            const isAdmin = ADMIN_EMAILS.includes(firebaseUser.email || '');
            const newProfile: UserProfile = {
              uid: firebaseUser.uid, email: firebaseUser.email || '',
              displayName: firebaseUser.displayName || 'User',
              role: isAdmin ? 'admin' : 'user', createdAt: serverTimestamp(),
            };
            await setDoc(doc(db, 'users', firebaseUser.uid), newProfile);
            setUserProfile(newProfile);
          }
        } catch (err) { console.error(err); setUserProfile(null); }
      } else { setUserProfile(null); }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    getRedirectResult(auth).then((result) => {
      if (result?.user) {
        window.location.href = '/';
      }
    }).catch((err) => {
      if (err.code !== 'auth/no-redirect-data') {
        console.warn('getRedirectResult:', err.code || err);
      }
    });
  }, []);

  const signInWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const isStandalone = typeof window !== 'undefined' &&
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      await signInWithRedirect(auth, provider);
      return;
    }

    try {
      await signInWithPopup(auth, provider);
    } catch (err: unknown) {
      const authErr = err as { code?: string; message?: string };
      console.error('Google sign-in error:', authErr.code || err, authErr.message || err);
      if (authErr.code === 'auth/popup-blocked' || authErr.code === 'auth/popup-closed-by-user') {
        await signInWithRedirect(auth, provider);
      } else {
        throw authErr;
      }
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
    setUserProfile(null);
  };

  const isAdmin = ADMIN_EMAILS.includes(user?.email || '');

  return (
    <AuthContext.Provider value={{ user, userProfile, loading, isAdmin, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
