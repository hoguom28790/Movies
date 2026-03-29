import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc, addDoc } from "firebase/firestore";
import { WatchlistEntry, HistoryEntry, Playlist } from "@/types/database";

export async function deleteFromWatchlist(userId: string, movieSlug: string) {
  const docId = `${userId}_${movieSlug}`;
  await deleteDoc(doc(db, "watchlist", docId));
}

export async function deleteFromHistory(userId: string, movieSlug: string) {
  const isTopXX = movieSlug.startsWith('av-') || 
                  /^[A-Z]{2,6}-\d{2,6}$/i.test(movieSlug) || 
                  /^[a-zA-Z0-9]{10}$/.test(movieSlug);
  
  const docId = isTopXX ? `topxx_hist_${userId}_${movieSlug}` : `${userId}_${movieSlug}`;
  const collectionName = isTopXX ? "topxx_history" : "reading_history_phim";
  
  await deleteDoc(doc(db, collectionName, docId));
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
  const isTopXX = entry.source === 'topxx' || 
                  entry.source === 'avdb' || 
                  entry.movieSlug.startsWith('av-') || 
                  /^[A-Z]{2,6}-\d{2,6}$/i.test(entry.movieSlug) ||
                  /^[a-zA-Z0-9]{10}$/.test(entry.movieSlug); // TopXX hash format
  const collectionName = isTopXX ? "topxx_history" : "reading_history_phim";
  const docId = isTopXX ? `topxx_hist_${userId}_${entry.movieSlug}` : `${userId}_${entry.movieSlug}`;
  const docRef = doc(db, collectionName, docId);
  
  const progress = entry.durationSeconds && entry.durationSeconds > 0 
    ? Math.round((entry.progressSeconds / entry.durationSeconds) * 100) 
    : 0;

  console.log(`[DB] Saving history to ${collectionName}/${docId} - Progress: ${progress}% (${entry.progressSeconds}s)`);
  await setDoc(docRef, {
    ...entry,
    movieCode: entry.movieSlug, 
    userId,
    progress,
    updatedAt: Date.now()
  }, { merge: true });
  console.log(`[DB] History saved successfully for ${entry.movieSlug}`);
}

export async function getUserHistory(userId: string): Promise<HistoryEntry[]> {
  const q = query(collection(db, "reading_history_phim"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryEntry));
  return list.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getUserXXHistory(userId: string): Promise<HistoryEntry[]> {
  const q = query(collection(db, "topxx_history"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryEntry));
  return list.sort((a,b) => (b.updatedAt || 0) - (a.updatedAt || 0));
}

export async function getMovieHistory(userId: string, movieSlug: string, source?: string): Promise<HistoryEntry | null> {
  const isTopXX = source === 'topxx' || source === 'avdb' || movieSlug.startsWith('av-') || /^[A-Z]{2,6}-\d{2,6}$/i.test(movieSlug) || /^[a-zA-Z0-9]{10,32}$/.test(movieSlug);
  const collectionName = isTopXX ? "topxx_history" : "reading_history_phim";
  const docId = isTopXX ? `topxx_hist_${userId}_${movieSlug}` : `${userId}_${movieSlug}`;
  
  const snap = await getDoc(doc(db, collectionName, docId));
  if (snap.exists()) {
    const data = snap.data();
    return { ...data, movieSlug: data.movieSlug || data.movieCode } as HistoryEntry;
  }
  
  // If not found in primary collection, fallback to the other one just in case
  const fallbackCollection = isTopXX ? "reading_history_phim" : "topxx_history";
  const fallbackDocId = isTopXX ? `${userId}_${movieSlug}` : `topxx_hist_${userId}_${movieSlug}`;
  const fallbackSnap = await getDoc(doc(db, fallbackCollection, fallbackDocId));
  
  if (fallbackSnap.exists()) {
    const data = fallbackSnap.data();
    return { ...data, movieSlug: data.movieSlug || data.movieCode } as HistoryEntry;
  }
  if (!source) {
    const legacySnap = await getDoc(doc(db, "reading_history_phim", `${userId}_${movieSlug}`));
    if (legacySnap.exists()) return legacySnap.data() as HistoryEntry;
  }

  return null;
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
  if (!actor.id) {
    console.warn("[DB] Attempted to save actor with no ID:", actor);
    return false;
  }

  // 1. Determine the correct collection based on explicit type or ID structure
  // TopXX stars usually have alphanumeric string IDs (e.g. 'vQMGv'), while TMDB are numbers
  const isTopXX = actor.type === 'topxx' || (typeof actor.id === 'string' && isNaN(Number(actor.id)));
  const collectionName = isTopXX ? "XXfavorite_actors" : "favorite_actors";
  const docId = `${userId}_${actor.id}`;
  
  const docRef = doc(db, collectionName, docId);
  console.log(`[DB] Toggling favorited actor: ${actor.name} (${actor.id}) in ${collectionName}`);
  
  const snap = await getDoc(docRef);
  
  if (snap.exists()) {
    // REMOVE logic
    await deleteDoc(docRef);
    console.log(`[DB] Removed actor from ${collectionName}: ${docId}`);
    
    // Cleanup ghost entries in the opposite collection to prevent duplicates/ghosts
    const otherCollection = isTopXX ? "favorite_actors" : "XXfavorite_actors";
    await deleteDoc(doc(db, otherCollection, docId));
    return false;
  } else {
    // ADD logic
    // If it's a TopXX actor, ensure we remove it from the old 'movie' collection if it exists there (Migration)
    if (isTopXX) {
      await deleteDoc(doc(db, "favorite_actors", docId));
    }

    const dataToSave = {
      ...actor,
      id: String(actor.id), // Ensure ID is saved as string for consistency
      userId,
      addedAt: Date.now(),
      type: actor.type || (isTopXX ? 'topxx' : 'movie')
    };

    await setDoc(docRef, dataToSave);
    console.log(`[DB] Saved actor to ${collectionName}: ${docId}`);
    return true; 
  }
}

export async function getUserFavoriteActors(userId: string, type: 'movie' | 'topxx' = 'movie') {
  console.log(`[DB] Fetching favorite actors for user ${userId} (Type: ${type})`);
  
  if (type === 'topxx') {
    // TopXX Strategy: Fetch from new collection + filter legacy from old collection
    const [newSnap, oldSnap] = await Promise.all([
      getDocs(query(collection(db, "XXfavorite_actors"), where("userId", "==", userId))),
      getDocs(query(collection(db, "favorite_actors"), where("userId", "==", userId)))
    ]);

    const extractId = (dId: string) => dId.includes('_') ? dId.split('_').pop() || dId : dId;

    const newItems = newSnap.docs.map(d => ({ 
      ...d.data(), 
      id: extractId(d.id),
      addedAt: d.data().addedAt || Date.now()
    }) as FavoriteActor & { addedAt: number });

    const legacyItems = oldSnap.docs.map(d => ({ 
      ...d.data(), 
      id: extractId(d.id),
      addedAt: d.data().addedAt || Date.now()
    }) as FavoriteActor & { addedAt: number })
    .filter(a => a.type === 'topxx' || (typeof a.id === 'string' && isNaN(Number(a.id))));

    const merged = [...newItems];
    legacyItems.forEach(item => {
      if (!merged.some(m => String(m.id) === String(item.id))) {
        merged.push(item);
      }
    });

    console.log(`[DB] Found ${merged.length} TopXX favorite actors`);
    return merged.sort((a, b) => b.addedAt - a.addedAt);
  }

  // Hồ Phim Strategy: Fetch only from 'favorite_actors' and EXCLUDE TopXX legacy stars
  const snap = await getDocs(query(collection(db, "favorite_actors"), where("userId", "==", userId)));
  const list = snap.docs.map(d => {
    const data = d.data();
    return { 
      ...data, 
      id: d.id.includes('_') ? d.id.split('_').pop() || d.id : d.id,
      addedAt: data.addedAt || Date.now()
    } as FavoriteActor & { addedAt: number };
  })
  .filter(a => {
    if (a.type === 'topxx') return false;
    if (a.type === 'movie') return true;
    return !isNaN(Number(a.id));
  });

  console.log(`[DB] Found ${list.length} movie favorite actors`);
  return list.sort((a, b) => b.addedAt - a.addedAt);
}

export async function isFavoriteActor(userId: string, actorId: string | number, type: 'movie' | 'topxx' = 'movie'): Promise<boolean> {
  const collectionName = type === 'topxx' ? "XXfavorite_actors" : "favorite_actors";
  const docId = `${userId}_${actorId}`;
  
  const snap = await getDoc(doc(db, collectionName, docId));
  if (snap.exists()) return true;

  if (type === 'topxx') {
     const oldSnap = await getDoc(doc(db, "favorite_actors", docId));
     return oldSnap.exists();
  }
  
  return false;
}
