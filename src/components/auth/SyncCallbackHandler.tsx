"use client";

import { useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { useAniList } from '@/hooks/useAniList';
import { useTrakt } from '@/hooks/useTrakt';

function CallbackHandlerInner() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const { user } = useAuth();
    
    useEffect(() => {
        const code = searchParams.get('code');
        const state = searchParams.get('state');
        
        if (!code || !state || !user) return;
        
        const processCallback = async () => {
            if (state.startsWith('anilist:')) {
                const userIdInState = state.replace('anilist:', '');
                if (userIdInState !== user.uid) return;
                
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
                        // Clean URL but stay on page
                        router.replace('/truyen');
                    }
                } catch (err) {}
            } else if (state.startsWith('trakt:')) {
                const userIdInState = state.replace('trakt:', '');
                if (userIdInState !== user.uid) return;
                
                // Trakt callback (handled via API route usually, but here we can hit the API route manually)
                try {
                     const res = await fetch(`/api/auth/trakt/callback?code=${code}&state=${user.uid}`);
                     if (res.ok) {
                         router.replace('/truyen');
                     }
                } catch (err) {}
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
