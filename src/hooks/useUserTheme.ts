"use client";

import { useEffect, useCallback } from "react";
import { useTheme } from "next-themes";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, onSnapshot, setDoc } from "firebase/firestore";

type ThemeOption = "light" | "dark" | "system";

/**
 * Fixed light mode invisible text + DropdownMenu toggle + Firebase sync per user
 */
export function useUserTheme() {
  const { theme, setTheme, systemTheme } = useTheme();
  const { user } = useAuth();

  // Listen for realtime theme updates from Firebase
  useEffect(() => {
    if (!user) return;

    const userRef = doc(db, "users", user.uid);
    const unsubscribe = onSnapshot(userRef, (snap) => {
      const data = snap.data();
      const cloudTheme = data?.settings?.appTheme as ThemeOption | undefined;
      
      if (cloudTheme && cloudTheme !== theme) {
        setTheme(cloudTheme);
      }
    });

    return () => unsubscribe();
  }, [user, setTheme, theme]);

  // Handle theme changes and sync to Firestore
  const updateTheme = useCallback(async (newTheme: ThemeOption) => {
    setTheme(newTheme);
    
    if (user) {
      try {
        const userRef = doc(db, "users", user.uid);
        await setDoc(userRef, { 
          settings: { appTheme: newTheme } 
        }, { merge: true });
      } catch (err) {
        console.error("Firebase Theme Sync Error:", err);
      }
    }
  }, [user, setTheme]);

  return {
    theme: (theme as ThemeOption) || "system",
    setTheme: updateTheme,
    systemTheme: systemTheme as ThemeOption,
  };
}
