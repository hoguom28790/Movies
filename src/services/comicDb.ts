import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";

export interface ComicHistoryEntry {
  id?: string;
  comicSlug: string;
  comicTitle: string;
  coverUrl: string;
  chapterSlug: string;
  chapterName: string;
  percent: number;
  userId: string;
  updatedAt: number;
}

export interface ComicFavoriteEntry {
  id?: string;
  comicSlug: string;
  comicTitle: string;
  coverUrl: string;
  userId: string;
  addedAt: number;
}

// ================= COMIC HISTORY =================

export async function saveComicHistory(userId: string, entry: Omit<ComicHistoryEntry, 'userId' | 'updatedAt'>) {
  const docId = `${userId}_${entry.comicSlug}`;
  const docRef = doc(db, "comic_history", docId);
  await setDoc(docRef, {
    ...entry,
    userId,
    updatedAt: Date.now()
  }, { merge: true });
}

export async function getUserComicHistory(userId: string): Promise<ComicHistoryEntry[]> {
  const q = query(collection(db, "comic_history"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ComicHistoryEntry));
  return list.sort((a,b) => b.updatedAt - a.updatedAt);
}

export async function getComicHistory(userId: string, comicSlug: string): Promise<ComicHistoryEntry | null> {
  const docId = `${userId}_${comicSlug}`;
  const snap = await getDoc(doc(db, "comic_history", docId));
  return snap.exists() ? (snap.data() as ComicHistoryEntry) : null;
}

export async function clearComicHistory(userId: string) {
  const q = query(collection(db, "comic_history"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const batchRequests = snap.docs.map(d => deleteDoc(d.ref));
  await Promise.all(batchRequests);
}

export async function removeComicHistoryItem(userId: string, comicSlug: string) {
  const docId = `${userId}_${comicSlug}`;
  await deleteDoc(doc(db, "comic_history", docId));
}

// ================= COMIC FAVORITES =================

export async function toggleComicFavorite(userId: string, entry: Omit<ComicFavoriteEntry, 'userId' | 'addedAt'>) {
  const docId = `${userId}_${entry.comicSlug}`;
  const docRef = doc(db, "comic_favorites", docId);
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

export async function getUserComicFavorites(userId: string): Promise<ComicFavoriteEntry[]> {
  const q = query(collection(db, "comic_favorites"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as ComicFavoriteEntry));
  return list.sort((a,b) => b.addedAt - a.addedAt);
}

export async function isComicFavorite(userId: string, comicSlug: string): Promise<boolean> {
  const docId = `${userId}_${comicSlug}`;
  const snap = await getDoc(doc(db, "comic_favorites", docId));
  return snap.exists();
}

// ================= COMIC PLAYLISTS =================

export interface ComicPlaylist {
  id: string;
  name: string;
  userId: string;
  comics: {
    comicSlug: string;
    comicTitle: string;
    coverUrl: string;
    addedAt: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

export async function createComicPlaylist(userId: string, name: string): Promise<string> {
  const colRef = collection(db, "comic_playlists");
  const newDoc = doc(colRef);
  await setDoc(newDoc, {
    id: newDoc.id,
    name,
    userId,
    comics: [],
    createdAt: Date.now(),
    updatedAt: Date.now()
  });
  return newDoc.id;
}

export async function getUserComicPlaylists(userId: string): Promise<ComicPlaylist[]> {
  const q = query(collection(db, "comic_playlists"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => d.data() as ComicPlaylist);
  return list.sort((a, b) => b.createdAt - a.createdAt);
}

export async function addComicToPlaylist(playlistId: string, comic: { comicSlug: string; comicTitle: string; coverUrl: string }) {
  const docRef = doc(db, "comic_playlists", playlistId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const data = snap.data() as ComicPlaylist;
  const exists = data.comics.some(c => c.comicSlug === comic.comicSlug);
  if (exists) return;

  await setDoc(docRef, {
    ...data,
    comics: [...data.comics, { ...comic, addedAt: Date.now() }],
    updatedAt: Date.now()
  });
}

export async function removeComicFromPlaylist(playlistId: string, comicSlug: string) {
  const docRef = doc(db, "comic_playlists", playlistId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return;

  const data = snap.data() as ComicPlaylist;
  await setDoc(docRef, {
    ...data,
    comics: data.comics.filter(c => c.comicSlug !== comicSlug),
    updatedAt: Date.now()
  });
}

export async function deleteComicPlaylist(playlistId: string) {
  await deleteDoc(doc(db, "comic_playlists", playlistId));
}

export async function renameComicPlaylist(playlistId: string, newName: string) {
  const docRef = doc(db, "comic_playlists", playlistId);
  await setDoc(docRef, { name: newName, updatedAt: Date.now() }, { merge: true });
}

export async function ensureDefaultComicPlaylist(userId: string) {
  const playlists = await getUserComicPlaylists(userId);
  if (playlists.length === 0) {
    await createComicPlaylist(userId, "Truyện cần đọc");
  }
}
