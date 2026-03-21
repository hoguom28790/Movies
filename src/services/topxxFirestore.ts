import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";
import { XXHistoryEntry, XXFavoriteEntry, XXPlaylist } from "./topxxDb";

/**
 * Syncs Local Storage with Firestore for a specific user.
 * This should be called after login or periodically.
 */

export async function syncXXLocalToFirestore(userId: string, localFavorites: XXFavoriteEntry[], localHistory: XXHistoryEntry[]) {
  // Sync favorites
  for (const fav of localFavorites) {
    const docId = `xx_fav_${userId}_${fav.movieCode}`;
    const docRef = doc(db, "xx_favorites", docId);
    await setDoc(docRef, { ...fav, userId }, { merge: true });
  }

  // Sync history
  for (const hist of localHistory) {
    const docId = `xx_hist_${userId}_${hist.movieCode}`;
    const docRef = doc(db, "xx_history", docId);
    await setDoc(docRef, { ...hist, userId }, { merge: true });
  }
}

export async function toggleXXFirestoreFavorite(userId: string, movie: { movieCode: string; movieTitle: string; posterUrl: string }): Promise<boolean> {
  const docId = `xx_fav_${userId}_${movie.movieCode}`;
  const docRef = doc(db, "xx_favorites", docId);
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

export async function getXXFirestoreFavorites(userId: string): Promise<XXFavoriteEntry[]> {
  const q = query(collection(db, "xx_favorites"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data() } as XXFavoriteEntry)).sort((a, b) => b.addedAt - a.addedAt);
}

export async function isXXFirestoreFavorite(userId: string, movieCode: string): Promise<boolean> {
  const docId = `xx_fav_${userId}_${movieCode}`;
  const snap = await getDoc(doc(db, "xx_favorites", docId));
  return snap.exists();
}

export async function saveXXFirestoreHistory(userId: string, entry: Omit<XXHistoryEntry, 'updatedAt'>) {
  const docId = `xx_hist_${userId}_${entry.movieCode}`;
  const docRef = doc(db, "xx_history", docId);
  await setDoc(docRef, {
    ...entry,
    userId,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function getXXFirestoreHistory(userId: string): Promise<XXHistoryEntry[]> {
  const q = query(collection(db, "xx_history"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data() } as XXHistoryEntry)).sort((a, b) => b.updatedAt - a.updatedAt);
}

export async function deleteXXFirestoreHistoryItem(userId: string, movieCode: string) {
  const docId = `xx_hist_${userId}_${movieCode}`;
  await deleteDoc(doc(db, "xx_history", docId));
}

// Playlists (Optional Sync)
export async function syncXXPlaylistsToFirestore(userId: string, playlists: XXPlaylist[]) {
  for (const pl of playlists) {
    const docId = `xx_pl_${userId}_${pl.id}`;
    const docRef = doc(db, "xx_playlists", docId);
    await setDoc(docRef, { ...pl, userId }, { merge: true });
  }
}

export async function getUserXXFirestorePlaylists(userId: string): Promise<XXPlaylist[]> {
  const q = query(collection(db, "xx_playlists"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ ...doc.data() } as XXPlaylist)).sort((a, b) => b.createdAt - a.createdAt);
}

export async function saveXXFirestorePlaylist(userId: string, playlist: XXPlaylist) {
  const docId = `xx_pl_${userId}_${playlist.id}`;
  await setDoc(doc(db, "xx_playlists", docId), { ...playlist, userId }, { merge: true });
}

export async function deleteXXFirestorePlaylist(userId: string, playlistId: string) {
  const docId = `xx_pl_${userId}_${playlistId}`;
  await deleteDoc(doc(db, "xx_playlists", docId));
}
