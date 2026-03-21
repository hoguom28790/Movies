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
