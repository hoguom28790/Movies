"use client";

import { getAniListAuthUrl } from "@/lib/anilist";
import { useAuth } from "@/contexts/AuthContext";
import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { ANILIST_QUERIES, ANILIST_MUTATIONS, fetchAniList } from "@/lib/anilist";
import { useState, useCallback, useEffect } from "react";

export function useAniList() {
    const { user } = useAuth();
    const [status, setStatus] = useState<"idle" | "loading" | "connected" | "disconnected">("idle");
    const [aniListToken, setAniListToken] = useState<string | null>(null);

    const [userList, setUserList] = useState<any[]>([]);

    const fetchUserList = useCallback(async (token: string) => {
        try {
            const userRes = await fetchAniList(ANILIST_QUERIES.VIEWER, {}, token);
            const viewerId = userRes?.Viewer?.id;
            
            const listRes = await fetchAniList(`
                query ($userId: Int) {
                    MediaListCollection(userId: $userId, type: MANGA) {
                        lists {
                            entries {
                                mediaId
                                status
                                progress
                                media {
                                    title { romaji english }
                                    chapters
                                }
                            }
                        }
                    }
                }
            `, { userId: viewerId }, token);

            const entries = listRes?.MediaListCollection?.lists?.flatMap((l: any) => l.entries) || [];
            setUserList(entries);
            return entries;
        } catch (err) {
            console.error("AniList list fetch failed:", err);
            return [];
        }
    }, []);

    useEffect(() => {
        const fetchUserData = async () => {
            if (user) {
                const docRef = doc(db, "users", user.uid);
                const snap = await getDoc(docRef);
                if (snap.exists()) {
                    const data = snap.data();
                    if (data.anilist_token) {
                        setAniListToken(data.anilist_token);
                        setStatus("connected");
                        fetchUserList(data.anilist_token);
                    } else {
                        setStatus("disconnected");
                    }
                }
            }
        };
        fetchUserData();
    }, [user, fetchUserList]);

    const findMediaId = useCallback(async (title: string, slug: string) => {
        if (!aniListToken) return null;

        // Try to get from cache/mapping in Firestore first
        const mappingRef = doc(db, "anilist_mappings", slug);
        const mappingSnap = await getDoc(mappingRef);
        if (mappingSnap.exists()) {
            return mappingSnap.data().mediaId;
        }

        try {
            const data = await fetchAniList(ANILIST_QUERIES.SEARCH_MANGA, { search: title });
            const media = data?.Page?.media?.[0];
            if (media) {
                // Save mapping for next time
                await setDoc(doc(db, "anilist_mappings", slug), {
                   mediaId: media.id,
                   title: media.title,
                   updatedAt: Date.now()
                }, { merge: true });
                return media.id;
            }
        } catch (err) {
            console.error("AniList search failed:", err);
        }
        return null;
    }, [aniListToken]);

    const scrobble = useCallback(async (slug: string, title: string, chapter: string | number) => {
        if (!aniListToken) return;

        let chapterNum: number;
        if (typeof chapter === "string") {
            chapterNum = parseInt(chapter.replace(/[^0-9]/g, ""));
        } else {
            chapterNum = chapter;
        }
        if (isNaN(chapterNum)) return;

        const mediaId = await findMediaId(title, slug);
        if (!mediaId) return;

        try {
            // Check local list first
            const existingEntry = userList.find(e => e.mediaId === mediaId);
            const currentProgress = existingEntry?.progress || 0;

            if (chapterNum > currentProgress) {
                await fetchAniList(ANILIST_MUTATIONS.SAVE_MEDIA_LIST_ENTRY, {
                    mediaId,
                    progress: chapterNum,
                    status: "CURRENT"
                }, aniListToken);
                console.log(`Scrobbled to AniList: ${title} Ch. ${chapterNum}`);
                // Hot update local list
                setUserList(prev => prev.map(e => e.mediaId === mediaId ? { ...e, progress: chapterNum } : e));
            }
        } catch (err) {
            console.error("AniList scrobble failed:", err);
        }
    }, [aniListToken, findMediaId, userList]);

    const getProgress = useCallback(async (slug: string, title: string) => {
        if (!aniListToken) return null;
        const mediaId = await findMediaId(title, slug);
        if (!mediaId) return null;

        const entry = userList.find(e => e.mediaId === mediaId);
        if (entry) return entry;

        try {
            const userRes = await fetchAniList(ANILIST_QUERIES.VIEWER, {}, aniListToken);
            const viewerId = userRes?.Viewer?.id;
            const progressRes = await fetchAniList(ANILIST_QUERIES.USER_PROGRESS, { 
                userId: viewerId, 
                mediaId 
            }, aniListToken);
            return progressRes?.MediaList;
        } catch (err) {
            return null;
        }
    }, [aniListToken, findMediaId, userList]);

    const login = useCallback(() => {
        if (!user) return;
        const authUrl = getAniListAuthUrl(`anilist:${user.uid}`);
        window.location.href = authUrl;
    }, [user]);

    const isConnected = status === "connected";

    return { status, isConnected, login, scrobble, getProgress, aniListToken, userList };
}
