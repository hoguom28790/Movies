"use client";

import { useEffect, useRef, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';

function CallbackHandlerInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    const isProcessing = useRef(false);
    
    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code || !state || !user || isProcessing.current) return;
        
        const processCallback = async () => {
            isProcessing.current = true;
            console.log("Processing Auth Callback:", { state });

            if (state.startsWith('anilist:')) {
                const userIdInState = state.replace('anilist:', '');
                if (userIdInState !== user.uid) {
                    console.error("User mismatch in AniList state");
                    return;
                }
                
                try {
                    const res = await fetch("/api/auth/anilist/exchange", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ code }),
                    });
                    const data = await res.json();
                    if (!data.error) {
                        const userRef = doc(db, "users", user.uid);
                        await updateDoc(userRef, {
                            anilist_token: data.access_token,
                            anilist_token_type: data.token_type,
                            anilist_expires_at: Date.now() + (data.expires_in * 1000),
                            anilist_connected_at: Date.now()
                        });
                        console.log("AniList Connected Successfully");
                        router.replace(window.location.pathname);
                    } else {
                        console.error("AniList Exchange Error:", data.error);
                    }
                } catch (err) {
                    console.error("AniList Exchange Failure:", err);
                }
            } else if (state.startsWith('trakt:')) {
                const userIdInState = state.replace('trakt:', '');
                if (userIdInState !== user.uid) {
                    console.error("User mismatch in Trakt state");
                    return;
                }
                
                try {
                     const res = await fetch(`/api/auth/trakt/callback?code=${code}&state=${user.uid}`);
                     const data = await res.json().catch(() => ({}));
                     if (res.ok) {
                         console.log("Trakt Connected Successfully");
                         router.replace(window.location.pathname);
                     } else {
                         console.error("Trakt Callback Error");
                     }
                } catch (err) {
                    console.error("Trakt Callback Failure:", err);
                }
            }
        };
        
        processCallback();
    }, [searchParams, user, router]);
    
    return null;
}

export function SyncCallbackHandler() {
    return (
        <Suspense fallback={null}>
            <CallbackHandlerInner />
        </Suspense>
    );
}
