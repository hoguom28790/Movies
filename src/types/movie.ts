export interface Movie {
  id: string; // usually the slug
  title: string;
  originalTitle: string;
  slug: string;
  posterUrl: string;
  thumbUrl: string;
  year?: string;
  quality?: string;
  status?: string;
  overview?: string;
  genres?: string[];
  imdbRating?: number;
  source: 'nguonc' | 'kkphim' | 'ophim';
}

export interface Pagination {
  currentPage: number;
  totalPages: number;
  totalItems: number;
}

export interface MovieListResponse {
  items: Movie[];
  pagination: Pagination;
}
