"use client";

import { Movie } from "@/types/movie";

const HISTORY_KEY = "topxx-history";
const FAVORITES_KEY = "topxx-favorites";

export interface TopXXHistoryEntry {
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
  updatedAt: number;
  progressSeconds: number;
  durationSeconds: number;
}

export interface TopXXFavoriteEntry {
  movieCode: string;
  movieTitle: string;
  posterUrl: string;
  addedAt: number;
}

export function saveTopXXHistory(entry: Omit<TopXXHistoryEntry, 'updatedAt'>) {
  if (typeof window === 'undefined') return;
  
  const history = getTopXXHistory();
  const index = history.findIndex(h => h.movieCode === entry.movieCode);
  
  const newEntry: TopXXHistoryEntry = {
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

export function getTopXXHistory(): TopXXHistoryEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(HISTORY_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("TopXX History Parse Error:", e);
    return [];
  }
}

export function getMovieTopXXHistory(movieCode: string): TopXXHistoryEntry | null {
  const history = getTopXXHistory();
  return history.find(h => h.movieCode === movieCode) || null;
}

export function removeTopXXHistoryItem(movieCode: string) {
  if (typeof window === 'undefined') return;
  const history = getTopXXHistory().filter(h => h.movieCode !== movieCode);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearTopXXHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
}

export function toggleTopXXFavorite(movie: { movieCode: string; movieTitle: string; posterUrl: string }): boolean {
  if (typeof window === 'undefined') return false;
  
  const favorites = getTopXXFavorites();
  const index = favorites.findIndex(f => f.movieCode === movie.movieCode);
  
  if (index >= 0) {
    favorites.splice(index, 1);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return false;
  } else {
    const newEntry: TopXXFavoriteEntry = {
      ...movie,
      addedAt: Date.now()
    };
    favorites.unshift(newEntry);
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
    return true;
  }
}

export function getTopXXFavorites(): TopXXFavoriteEntry[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(FAVORITES_KEY);
  if (!stored) return [];
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("TopXX Favorites Parse Error:", e);
    return [];
  }
}

export function isTopXXFavorite(movieCode: string): boolean {
  const favorites = getTopXXFavorites();
  return favorites.some(f => f.movieCode === movieCode);
}

const PLAYLISTS_KEY = "topxx-playlists";

export interface TopXXPlaylist {
  id: string;
  name: string;
  createdAt: number;
  movies: TopXXFavoriteEntry[];
}

export function createTopXXPlaylist(name: string): string {
  if (typeof window === 'undefined') return "";
  const playlists = getTopXXPlaylists();
  const id = Math.random().toString(36).substring(2, 11);
  const newPlaylist: TopXXPlaylist = {
    id,
    name,
    createdAt: Date.now(),
    movies: []
  };
  playlists.unshift(newPlaylist);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  return id;
}

export function getTopXXPlaylists(): TopXXPlaylist[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PLAYLISTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function deleteTopXXPlaylist(id: string) {
  if (typeof window === 'undefined') return;
  const playlists = getTopXXPlaylists().filter(p => p.id !== id);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export function addMovieToTopXXPlaylist(playlistId: string, movie: Omit<TopXXFavoriteEntry, 'addedAt'>) {
  if (typeof window === 'undefined') return;
  const playlists = getTopXXPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist) {
    if (playlist.movies.some(m => m.movieCode === movie.movieCode)) return;
    playlist.movies.unshift({ ...movie, addedAt: Date.now() });
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
}

export function removeMovieFromTopXXPlaylist(playlistId: string, movieCode: string) {
  if (typeof window === 'undefined') return;
  const playlists = getTopXXPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist) {
    playlist.movies = playlist.movies.filter(m => m.movieCode !== movieCode);
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
}

export function renameTopXXPlaylist(id: string, newName: string) {
  if (typeof window === 'undefined') return;
  const playlists = getTopXXPlaylists();
  const playlist = playlists.find(p => p.id === id);
  if (playlist) {
    playlist.name = newName;
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
}

export function isMovieInTopXXPlaylist(playlistId: string, movieCode: string): boolean {
  const playlists = getTopXXPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  return playlist?.movies.some(m => m.movieCode === movieCode) || false;
}

export function isMovieInAnyTopXXPlaylist(movieCode: string): boolean {
  if (!movieCode) return false;
  const playlists = getTopXXPlaylists();
  return playlists.some(p => p.movies.some(m => m.movieCode === movieCode));
}

export function saveTopXXPlaylists(playlists: TopXXPlaylist[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

