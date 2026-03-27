import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";
import { TopXXHistoryEntry, TopXXFavoriteEntry, TopXXPlaylist } from "./topxxDb";

/**
 * Syncs Local Storage with Firestore for a specific user.
 * This should be called after login or periodically.
 */

export async function syncTopXXLocalToFirestore(userId: string, localFavorites: TopXXFavoriteEntry[], localHistory: TopXXHistoryEntry[]) {
  // Sync favorites
  for (const fav of localFavorites) {
    const docId = `topxx_fav_${userId}_${fav.movieCode}`;
    const docRef = doc(db, "topxx_favorites", docId);
    await setDoc(docRef, { ...fav, userId }, { merge: true });
  }

  // Sync history
  for (const hist of localHistory) {
    const docId = `topxx_hist_${userId}_${hist.movieCode}`;
    const docRef = doc(db, "topxx_history", docId);
    await setDoc(docRef, { ...hist, userId }, { merge: true });
  }
}

export async function toggleTopXXFirestoreFavorite(userId: string, movie: { movieCode: string; movieTitle: string; posterUrl: string }): Promise<boolean> {
  const docId = `topxx_fav_${userId}_${movie.movieCode}`;
  const docRef = doc(db, "topxx_favorites", docId);
  const snap = await getDoc(docRef);

  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    await setDoc(docRef, {
      ...movie,
      userId,
      addedAt: Date.now()
    });
    return true;
  }
}

export async function getTopXXFirestoreFavorites(userId: string): Promise<TopXXFavoriteEntry[]> {
  const q = query(collection(db, "topxx_favorites"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data() } as TopXXFavoriteEntry)).sort((a, b) => b.addedAt - a.addedAt);
}

export async function isTopXXFirestoreFavorite(userId: string, movieCode: string): Promise<boolean> {
  const docId = `topxx_fav_${userId}_${movieCode}`;
  const snap = await getDoc(doc(db, "topxx_favorites", docId));
  return snap.exists();
}

export async function saveTopXXFirestoreHistory(userId: string, entry: Omit<TopXXHistoryEntry, 'updatedAt'>) {
  const docId = `topxx_hist_${userId}_${entry.movieCode}`;
  const docRef = doc(db, "topxx_history", docId);
  await setDoc(docRef, {
    ...entry,
    userId,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function getTopXXFirestoreHistory(userId: string): Promise<TopXXHistoryEntry[]> {
  const q = query(collection(db, "topxx_history"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data() } as TopXXHistoryEntry)).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteTopXXFirestoreHistoryItem(userId: string, movieCode: string) {
  const docId = `topxx_hist_${userId}_${movieCode}`;
  await deleteDoc(doc(db, "topxx_history", docId));
}

// Playlists (Optional Sync)
export async function syncTopXXPlaylistsToFirestore(userId: string, playlists: TopXXPlaylist[]) {
  for (const pl of playlists) {
    const docId = `topxx_pl_${userId}_${pl.id}`;
    const docRef = doc(db, "topxx_playlists", docId);
    await setDoc(docRef, { ...pl, userId }, { merge: true });
  }
}

export async function getUserTopXXFirestorePlaylists(userId: string): Promise<TopXXPlaylist[]> {
  const q = query(collection(db, "topxx_playlists"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data() } as TopXXPlaylist)).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveTopXXFirestorePlaylist(userId: string, playlist: TopXXPlaylist) {
  const docId = `topxx_pl_${userId}_${playlist.id}`;
  await setDoc(doc(db, "topxx_playlists", docId), { ...playlist, userId }, { merge: true });
}

export async function deleteTopXXFirestorePlaylist(userId: string, playlistId: string) {
  const docId = `topxx_pl_${userId}_${playlistId}`;
  await deleteDoc(doc(db, "topxx_playlists", docId));
}

