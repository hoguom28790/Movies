"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, updateDoc } from "firebase/firestore";

function AniListCallbackContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState("Authenticating...");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setError("No authorization code found.");
      return;
    }

    const exchangeToken = async () => {
      try {
        const res = await fetch("/api/auth/anilist/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code }),
        });

        const data = await res.json();
        if (data.error) {
           setError(data.error);
           return;
        }

        if (user) {
          const userRef = doc(db, "users", user.uid);
          await updateDoc(userRef, {
            anilist_token: data.access_token,
            anilist_token_type: data.token_type,
            anilist_expires_at: Date.now() + (data.expires_in * 1000),
            anilist_connected_at: Date.now()
          });
          setStatus("Connected successfully! Redirecting...");
          setTimeout(() => router.push("/truyen"), 2000);
        } else {
           setStatus("Waiting for user session...");
        }
      } catch (err: any) {
        console.error("AniList OAuth failure:", err);
        setError(err.message || "Failed to exchange token.");
      }
    };

    if (user) {
       exchangeToken();
    }
  }, [searchParams, user, router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-surface theme-truyen p-6 text-center">
      <div className="max-w-md w-full glass p-8 rounded-3xl border border-outline-variant/10">
        <h1 className="text-3xl font-black font-headline text-on-surface uppercase tracking-tighter mb-4">
          AniList Sync
        </h1>
        {error ? (
          <div className="text-error font-body">
            <p className="mb-4">Error: {error}</p>
            <button 
              onClick={() => router.push("/truyen")}
              className="px-6 py-2 bg-primary text-white rounded-full font-bold uppercase tracking-widest text-xs"
            >
              Go Back
            </button>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-on-surface-variant font-body">{status}</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AniListCallbackPage() {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <AniListCallbackContent />
        </Suspense>
    );
}
