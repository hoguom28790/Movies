import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc, addDoc } from "firebase/firestore";
import { WatchlistEntry, HistoryEntry, Playlist } from "@/types/database";

export async function deleteFromWatchlist(userId: string, movieSlug: string) {
  const docId = `${userId}_${movieSlug}`;
  await deleteDoc(doc(db, "watchlist", docId));
}

export async function deleteFromHistory(userId: string, movieSlug: string) {
  const docId = `${userId}_${movieSlug}`;
  await deleteDoc(doc(db, "history", docId));
}

export async function toggleWatchlist(userId: string, entry: Omit<WatchlistEntry, 'userId' | 'addedAt'>) {
  const docId = `${userId}_${entry.movieSlug}`;
  const docRef = doc(db, "watchlist", docId);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    await setDoc(docRef, {
      ...entry,
      userId,
      addedAt: Date.now()
    });
    return true; 
  }
}

export async function getUserWatchlist(userId: string): Promise<WatchlistEntry[]> {
  const q = query(collection(db, "watchlist"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as WatchlistEntry));
  return list.sort((a,b) => b.addedAt - a.addedAt);
}

export async function isInWatchlist(userId: string, movieSlug: string): Promise<boolean> {
  const docId = `${userId}_${movieSlug}`;
  const snap = await getDoc(doc(db, "watchlist", docId));
  return snap.exists();
}

export async function saveHistory(userId: string, entry: Omit<HistoryEntry, 'userId' | 'updatedAt'>) {
  const docId = `${userId}_${entry.movieSlug}`;
  const docRef = doc(db, "history", docId);
  await setDoc(docRef, {
    ...entry,
    userId,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function getUserHistory(userId: string): Promise<HistoryEntry[]> {
  const q = query(collection(db, "history"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryEntry));
  return list.sort((a,b) => b.updatedAt - a.updatedAt);
}

export async function getMovieHistory(userId: string, movieSlug: string): Promise<HistoryEntry | null> {
  const docId = `${userId}_${movieSlug}`;
  const snap = await getDoc(doc(db, "history", docId));
  return snap.exists() ? (snap.data() as HistoryEntry) : null;
}

export async function createPlaylist(userId: string, name: string) {
  const playlistsRef = collection(db, "playlists");
  const docRef = await addDoc(playlistsRef, {
    userId,
    name,
    createdAt: Date.now(),
    movies: []
  });
  return docRef.id;
}

export async function getUserPlaylists(userId: string): Promise<Playlist[]> {
  const q = query(collection(db, "playlists"), where("userId", "==", userId));
  const snap = await getDocs(q);
  return snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Playlist)).sort((a,b) => b.createdAt - a.createdAt);
}

export async function deletePlaylist(playlistId: string) {
  await deleteDoc(doc(db, "playlists", playlistId));
}

export async function updatePlaylistName(playlistId: string, newName: string) {
  await setDoc(doc(db, "playlists", playlistId), { name: newName }, { merge: true });
}

export async function addMovieToPlaylist(playlistId: string, movie: { movieSlug: string; movieTitle: string; posterUrl: string }) {
  const ref = doc(db, "playlists", playlistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Playlist;
  // avoid duplicates
  if (data.movies.some(m => m.movieSlug === movie.movieSlug)) return;
  const newMovies = [...data.movies, { ...movie, addedAt: Date.now() }];
  await setDoc(ref, { movies: newMovies }, { merge: true });
}

export async function removeMovieFromPlaylist(playlistId: string, movieSlug: string) {
  const ref = doc(db, "playlists", playlistId);
  const snap = await getDoc(ref);
  if (!snap.exists()) return;
  const data = snap.data() as Playlist;
  const newMovies = data.movies.filter(m => m.movieSlug !== movieSlug);
  await setDoc(ref, { movies: newMovies }, { merge: true });
}

export async function isMovieInAnyPlaylist(userId: string, movieSlug: string): Promise<boolean> {
  const playlists = await getUserPlaylists(userId);
  return playlists.some(p => p.movies.some(m => m.movieSlug === movieSlug));
}


export async function ensureDefaultPlaylist(userId: string): Promise<void> {
  const playlists = await getUserPlaylists(userId);
  if (playlists.length === 0) {
    const newId = await createPlaylist(userId, "Yêu Thích");
    const q = query(collection(db, "watchlist"), where("userId", "==", userId));
    const snap = await getDocs(q);
    const oldWatchlist = snap.docs.map(d => ({ id: d.id, ...d.data() } as WatchlistEntry));
    
    if (oldWatchlist.length > 0) {
      const ref = doc(db, "playlists", newId);
      const mappedMovies = oldWatchlist.map(w => ({
        movieSlug: w.movieSlug,
        movieTitle: w.movieTitle,
        posterUrl: w.posterUrl,
        addedAt: w.addedAt
      }));
      await setDoc(ref, { movies: mappedMovies }, { merge: true });
    }
  }
}

// ================= TRAKT.TV INTEGRATION =================
export async function saveTraktTokens(userId: string, tokens: any) {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, { trakt: tokens }, { merge: true });
}

export async function getTraktTokens(userId: string) {
  const docRef = doc(db, "users", userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data()?.trakt || null;
  }
  return null;
}

export async function disconnectTrakt(userId: string) {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, { trakt: null }, { merge: true });
}

// ================= USER SETTINGS =================
export interface UserSettings {
  autoSkipIntro?: boolean;
  theme?: "phim" | "truyen" | "topxx"; // Style preset
  appTheme?: "light" | "dark" | "system"; // UI Theme
}

export async function saveUserSettings(userId: string, settings: Partial<UserSettings>) {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, { settings }, { merge: true });
}

export async function getUserSettings(userId: string): Promise<UserSettings | null> {
  const docRef = doc(db, "users", userId);
  const snap = await getDoc(docRef);
  if (snap.exists()) {
    return snap.data()?.settings || null;
  }
  return null;
}

export async function saveAppTheme(userId: string, appTheme: "light" | "dark" | "system") {
  const docRef = doc(db, "users", userId);
  await setDoc(docRef, { settings: { appTheme } }, { merge: true });
}

// ================= FAVORITE ACTORS =================
export interface FavoriteActor {
  id: string | number;
  name: string;
  profilePath: string | null;
  type?: 'movie' | 'topxx';
}

export async function toggleFavoriteActor(userId: string, actor: FavoriteActor) {
  // Determine correct collection
  const collectionName = actor.type === 'topxx' || (typeof actor.id === 'string' && isNaN(Number(actor.id))) 
    ? "XXfavorite_actors" 
    : "favorite_actors";
    
  const docId = `${userId}_${actor.id}`;
  const docRef = doc(db, collectionName, docId);
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    await deleteDoc(docRef);
    return false;
  } else {
    // Also delete from opposite collection if it exists (Cleanup)
    const oppositeCollection = collectionName === "XXfavorite_actors" ? "favorite_actors" : "XXfavorite_actors";
    await deleteDoc(doc(db, oppositeCollection, docId));

    await setDoc(docRef, {
      ...actor,
      userId,
      addedAt: Date.now(),
      type: actor.type || (collectionName === "XXfavorite_actors" ? 'topxx' : 'movie')
    });
    return true; 
  }
}

export async function getUserFavoriteActors(userId: string, type: 'movie' | 'topxx' = 'movie') {
  if (type === 'topxx') {
    // 1. Fetch from specific collection
    const snap = await getDocs(query(collection(db, "XXfavorite_actors"), where("userId", "==", userId)));
    const items = snap.docs.map(d => ({ ...d.data(), id: d.id.split('_').pop() || d.id }) as FavoriteActor & { addedAt: number });

    // 2. Fallback to main collection for legacy entries (ID is string)
    const oldSnap = await getDocs(query(collection(db, "favorite_actors"), where("userId", "==", userId)));
    const oldTopXX = oldSnap.docs.map(d => ({ ...d.data(), id: d.id.split('_').pop() || d.id }) as FavoriteActor & { addedAt: number })
                      .filter(a => a.type === 'topxx' || (typeof a.id === 'string' && isNaN(Number(a.id))));

    const merged = [...items];
    oldTopXX.forEach(oa => { if (!merged.some(ma => ma.id === oa.id)) merged.push(oa); });
    return merged.sort((a, b) => b.addedAt - a.addedAt);
  }

  // Movie logic
  const snap = await getDocs(query(collection(db, "favorite_actors"), where("userId", "==", userId)));
  return snap.docs.map(d => ({ ...d.data(), id: d.id.split('_').pop() || d.id }) as FavoriteActor & { addedAt: number })
            .filter(a => {
              const isLegacyTopXX = typeof a.id === 'string' && isNaN(Number(a.id));
              return (a.type === 'movie') || (!a.type && !isLegacyTopXX);
            })
            .sort((a, b) => b.addedAt - a.addedAt);
}

export async function isFavoriteActor(userId: string, actorId: string | number, type: 'movie' | 'topxx' = 'movie'): Promise<boolean> {
  const collectionName = type === 'topxx' ? "XXfavorite_actors" : "favorite_actors";
  const docId = `${userId}_${actorId}`;
  
  const snap = await getDoc(doc(db, collectionName, docId));
  if (snap.exists()) return true;

  // Search in opposite as fallback for legacy
  if (type === 'topxx') {
     const isStringId = typeof actorId === 'string' && isNaN(Number(actorId));
     if (isStringId) {
       const oldSnap = await getDoc(doc(db, "favorite_actors", docId));
       return oldSnap.exists();
     }
  }
  return false;
}
