"use client";

import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useState, useCallback, useEffect } from "react";

export function useTrakt() {
    const { user } = useAuth();
    const [status, setStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
    const [traktToken, setTraktToken] = useState<string | null>(null);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                setStatus("loading");
                const docRef = doc(db, "users", user.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.trakt_token) {
                        setTraktToken(data.trakt_token);
                        setStatus("connected");
                    } else {
                        setStatus("disconnected");
                    }
                } else {
                    setStatus("disconnected");
                }
            } else {
              setStatus("idle");
            }
        };
        fetchUserData();
    }, [user]);

    const login = useCallback(() => {
        const clientId = process.env.NEXT_PUBLIC_TRAKT_CLIENT_ID;
        const redirectUri = process.env.NEXT_PUBLIC_TRAKT_REDIRECT_URI;
        window.location.href = `https://trakt.tv/oauth/authorize?response_type=code&client_id=${clientId}&redirect_uri=${redirectUri}`;
    }, []);

    const isConnected = status === "connected";

    return { status, isConnected, login, traktToken };
}
