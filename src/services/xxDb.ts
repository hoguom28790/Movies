"use client";

import { Movie } from "@/types/movie";

const HISTORY_KEY = "topxx-history";
const FAVORITES_KEY = "topxx-favorites";

export interface XXHistoryEntry {
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
  updatedAt: number;
  progressSeconds: number;
  durationSeconds: number;
}

export interface XXFavoriteEntry {
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
  addedAt: number;
}

export function saveXXHistory(entry: Omit<XXHistoryEntry, 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  
  const history = getXXHistory();
  const index = history.findIndex(h => h.movieCode === entry.movieCode);
  
  const newEntry: XXHistoryEntry = {
    ...entry,
    updatedAt: Date.now()
  };

  if (index >= 0) {
    history[index] = newEntry;
  } else {
    history.unshift(newEntry);
  }

  // Keep last 100 items
  const limitedHistory = history.sort((a,b) => b.updatedAt - a.updatedAt).slice(0, 100);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(limitedHistory));
}

export function getXXHistory(): XXHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HISTORY_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function getMovieXXHistory(movieCode: string): XXHistoryEntry | null {
  const history = getXXHistory();
  return history.find(h => h.movieCode === movieCode) || null;
}

export function toggleXXFavorite(movie: { movieCode: string; movieTitle: string; posterUrl: string }): boolean {
  if (typeof window === 'undefined') return false;
  
  const favorites = getXXFavorites();
  const index = favorites.findIndex(f => f.movieCode === movie.movieCode);
  
  if (index >= 0) {
    favorites.splice(index, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return false;
  } else {
    const newEntry: XXFavoriteEntry = {
      ...movie,
      addedAt: Date.now()
    };
    favorites.unshift(newEntry);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  }
}

export function getXXFavorites(): XXFavoriteEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function isXXFavorite(movieCode: string): boolean {
  const favorites = getXXFavorites();
  return favorites.some(f => f.movieCode === movieCode);
}

export function clearXXHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}
