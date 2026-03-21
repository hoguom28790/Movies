export interface UserProfile {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  createdAt: number;
}

export interface WatchlistEntry {
  id?: string;
  userId: string;
  movieSlug: string;
  movieTitle: string;
  posterUrl: string;
  addedAt: number;
}

export interface HistoryEntry {
  id?: string;
  userId: string;
  movieSlug: string;
  movieTitle: string;
  episodeName: string;
  episodeSlug: string;
  posterUrl: string;
  progressSeconds: number;
  durationSeconds?: number;
  updatedAt: number;
}

export interface Playlist {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  movies: {
    movieSlug: string;
    movieTitle: string;
    posterUrl: string;
    addedAt: number;
  }[];
}
