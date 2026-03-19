import { db } from "@/lib/firebase";
import { collection, doc, setDoc, deleteDoc, getDocs, query, where, getDoc } from "firebase/firestore";
import { WatchlistEntry, HistoryEntry } from "@/types/database";

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
  });
}

export async function getUserHistory(userId: string): Promise<HistoryEntry[]> {
  const q = query(collection(db, "history"), where("userId", "==", userId));
  const snap = await getDocs(q);
  const list = snap.docs.map(d => ({ id: d.id, ...d.data() } as HistoryEntry));
  return list.sort((a,b) => b.updatedAt - a.updatedAt);
}
