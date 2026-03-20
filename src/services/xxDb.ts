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

export function removeXXHistoryItem(movieCode: string) {
  if (typeof window === 'undefined') return;
  const history = getXXHistory().filter(h => h.movieCode !== movieCode);
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearXXHistory() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORY_KEY);
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

const PLAYLISTS_KEY = "topxx-playlists";

export interface XXPlaylist {
  id: string;
  name: string;
  createdAt: number;
  movies: XXFavoriteEntry[];
}

export function createXXPlaylist(name: string): string {
  if (typeof window === 'undefined') return "";
  const playlists = getXXPlaylists();
  const id = Math.random().toString(36).substring(2, 11);
  const newPlaylist: XXPlaylist = {
    id,
    name,
    createdAt: Date.now(),
    movies: []
  };
  playlists.unshift(newPlaylist);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  return id;
}

export function getXXPlaylists(): XXPlaylist[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem(PLAYLISTS_KEY);
  return stored ? JSON.parse(stored) : [];
}

export function deleteXXPlaylist(id: string) {
  if (typeof window === 'undefined') return;
  const playlists = getXXPlaylists().filter(p => p.id !== id);
  localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
}

export function addMovieToXXPlaylist(playlistId: string, movie: Omit<XXFavoriteEntry, 'addedAt'>) {
  if (typeof window === 'undefined') return;
  const playlists = getXXPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist) {
    if (playlist.movies.some(m => m.movieCode === movie.movieCode)) return;
    playlist.movies.unshift({ ...movie, addedAt: Date.now() });
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
}

export function removeMovieFromXXPlaylist(playlistId: string, movieCode: string) {
  if (typeof window === 'undefined') return;
  const playlists = getXXPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  if (playlist) {
    playlist.movies = playlist.movies.filter(m => m.movieCode !== movieCode);
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
}

export function renameXXPlaylist(id: string, newName: string) {
  if (typeof window === 'undefined') return;
  const playlists = getXXPlaylists();
  const playlist = playlists.find(p => p.id === id);
  if (playlist) {
    playlist.name = newName;
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(playlists));
  }
}

export function isMovieInPlaylist(playlistId: string, movieCode: string): boolean {
  const playlists = getXXPlaylists();
  const playlist = playlists.find(p => p.id === playlistId);
  return playlist?.movies.some(m => m.movieCode === movieCode) || false;
}
