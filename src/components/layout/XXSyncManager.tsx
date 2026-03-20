"use client";

import { useEffect, useRef } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { getXXHistory, getXXFavorites, getXXPlaylists, saveXXHistory, XXFavoriteEntry } from "@/services/xxDb";
import { 
  syncXXLocalToFirestore, 
  getXXFirestoreFavorites, 
  getXXFirestoreHistory,
  syncXXPlaylistsToFirestore,
  getUserXXFirestorePlaylists 
} from "@/services/xxFirestore";

export function XXSyncManager() {
  const { user } = useAuth();
  const hasSynced = useRef(false);

  useEffect(() => {
    if (!user || hasSynced.current) return;

    const performSync = async () => {
      try {
        console.log("TopXX: Syncing with Firestore...");
        
        // 1. Get local data
        const localFavorites = getXXFavorites();
        const localHistory = getXXHistory();
        const localPlaylists = getXXPlaylists();

        // 2. Push local data to Firestore (Merge)
        await Promise.all([
          syncXXLocalToFirestore(user.uid, localFavorites, localHistory),
          syncXXPlaylistsToFirestore(user.uid, localPlaylists)
        ]);

        // 3. Pull from Firestore to Local (for other devices)
        const [cloudFavorites, cloudHistory, cloudPlaylists] = await Promise.all([
          getXXFirestoreFavorites(user.uid),
          getXXFirestoreHistory(user.uid),
          getUserXXFirestorePlaylists(user.uid)
        ]);

        // Sync Favorites to Local (Simple merge)
        const currentFavorites = getXXFavorites();
        cloudFavorites.forEach(cloudFav => {
          if (!currentFavorites.some(f => f.movieCode === cloudFav.movieCode)) {
            currentFavorites.unshift(cloudFav);
          }
        });
        localStorage.setItem("topxx-favorites", JSON.stringify(currentFavorites.slice(0, 100)));

        // Sync History to Local
        const currentHistory = getXXHistory();
        cloudHistory.forEach(cloudHist => {
          if (!currentHistory.some(h => h.movieCode === cloudHist.movieCode)) {
             currentHistory.unshift(cloudHist);
          }
        });
        localStorage.setItem("topxx-history", JSON.stringify(currentHistory.slice(0, 100)));
        
        // Sync Playlists to Local
        const currentPlaylists = getXXPlaylists();
        cloudPlaylists.forEach(cloudPl => {
          if (!currentPlaylists.some(p => p.id === cloudPl.id)) {
            currentPlaylists.unshift(cloudPl);
          }
        });
        localStorage.setItem("topxx-playlists", JSON.stringify(currentPlaylists.slice(0, 50)));

        hasSynced.current = true;
        console.log("TopXX: Sync complete.");
      } catch (err) {
        console.error("TopXX: Sync Error:", err);
      }
    };

    performSync();
  }, [user]);

  return null;
}
