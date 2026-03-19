"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User, signInWithPopup, GoogleAuthProvider } from "firebase/auth";
import { auth, db } from "@/lib/firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 3-second fallback to unlock the UI if Firebase initialization completely hangs
    const timeout = setTimeout(() => setLoading(false), 3000);

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      clearTimeout(timeout);
      setUser(currentUser);
      
      try {
        if (currentUser) {
          const userRef = doc(db, "users", currentUser.uid);
          const snap = await getDoc(userRef);
          if (!snap.exists()) {
            await setDoc(userRef, {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              createdAt: Date.now()
            });
          }
        }
      } catch (err) {
        console.error("Lỗi đồng bộ Firebase user (có thể do thiếu API Key hoặc quyền Firestore):", err);
      } finally {
        setLoading(false);
      }
    }, (error) => {
      console.error("Lỗi onAuthStateChanged:", error);
      clearTimeout(timeout);
      setLoading(false);
    });

    return () => {
      clearTimeout(timeout);
      unsubscribe();
    };
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    await signInWithPopup(auth, provider);
  };

  const logout = async () => auth.signOut();

  return (
    <AuthContext.Provider value={{ user, loading, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
