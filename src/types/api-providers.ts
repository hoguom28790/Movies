// src/types/api-providers.ts

export interface OPhimMovie {
  id: string | number;
  name: string;
  slug: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  quality: string;
  lang: string;
  chuyen_muc?: {
    category: { name: string; slug: string }[];
    country: { name: string; slug: string }[];
  };
  category?: { name: string; slug: string }[];
  country?: { name: string; slug: string }[];
  content?: string;
  status: string;
  is_copyright: boolean;
  sub_docquyen: boolean;
  type: string;
  time: string;
  episode_current: string;
  episode_total: string;
  server: string;
  thumbUrl?: string;
  posterUrl?: string;
  originalTitle?: string;
  source?: string;
  duration?: string;
  episodes?: any;
  servers?: any;
}

export interface KKPhimMovie extends OPhimMovie {
  status: string;
}

export interface NguonCMovie {
  id: string | number;
  name: string;
  slug: string;
  origin_name: string;
  poster_url: string;
  thumb_url: string;
  year: number;
  quality: string;
  language: string;
  current_episode: string;
  total_episodes: string;
  category: { [key: string]: { name: string; slug: string } };
  country: { [key: string]: { name: string; slug: string } };
  description: string;
  status: string;
  type: string;
  time: string;
  modified: string;
  original_name?: string;
  episode_current?: string;
  episodes?: any;
  servers?: any;
}

export interface VsmovMovie {
  id: string | number;
  title: string;
  name?: string;
  slug: string;
  origin_title?: string;
  origin_name?: string;
  poster?: string;
  poster_url?: string;
  thumbnail?: string;
  thumb_url?: string;
  year: number;
  quality: string;
  language?: string;
  epazines?: string;
  total_episodes?: string;
  genres?: { name: string; slug: string }[];
  countries?: { name: string; slug: string }[];
  description?: string;
  type?: string;
  duration?: string;
  status?: string;
  episode_current?: string;
  episodes?: any;
  servers?: any;
}

export interface TopXXMovie {
  id: number | string;
  code?: string;
  title: string;
  name?: string;
  thumbnail?: string;
  quality?: string;
  publish_at?: string;
  trans?: { locale: string; title: string; description?: string; slug: string }[];
  genres?: { name: string; slug: string; code?: string }[];
  countries?: { name: string; slug: string; code?: string }[];
  actors?: any;
  video_url?: string;
  play_url?: string;
  content?: string;
  description?: string;
  year?: string | number;
  status?: string;
  duration?: string;
  source?: string;
  posterUrl?: string;
  thumbUrl?: string;
  poster_url?: string;
  thumb_url?: string;
  sources?: any[];
  episodes?: any;
  servers?: any;
}

export type ProviderMovie = OPhimMovie | KKPhimMovie | NguonCMovie | VsmovMovie | TopXXMovie;

export interface OPhimListResponse {
  status: boolean;
  items: any[];
  pathImage: string;
  pagination: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface KKPhimListResponse {
  status: string;
  items: any[];
  pathImage: string;
  pagination: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    pageRanges: number;
  };
}

export interface NguonCListResponse {
  status: boolean;
  items: any[];
  paginate: {
    current_page: number;
    total_page: number;
    total_items: number;
    per_page: number;
  };
}

export interface VsmovListResponse {
  status: string;
  items: VsmovMovie[];
  pagination: {
    totalItems: number;
    totalItemsPerPage: number;
    currentPage: number;
    totalPages: number;
  };
}

export interface VsmovResponse {
  status: string;
  movie_info: VsmovMovie;
  sources: {
    name: string;
    episodes: {
      name: string;
      slug: string;
      link: string;
    }[];
  }[];
}

export interface KKPhimSearchResponse {
  status: string;
  msg: string;
  data: {
    items: any[];
    pathImage: string;
    APP_DOMAIN_CDN_IMAGE: string;
    params: {
      pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
      };
    };
  };
}

export interface OPhimSearchResponse {
  status: string;
  msg: string;
  pathImage?: string;
  data: {
    items: any[];
    APP_DOMAIN_CDN_IMAGE: string;
    pathImage?: string;
    params: {
      pagination: {
        totalItems: number;
        totalItemsPerPage: number;
        currentPage: number;
      };
    };
  };
}

export interface TopXXResponse {
  status: string;
  data: any;
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
}

export interface AVDBMovie {
  id: number | string;
  name: string;
  movie_code?: string;
  slug?: string;
  poster_url?: string;
  thumb_url?: string;
  year?: string;
  quality?: string;
  actor?: string | string[];
  description?: string;
  episodes?: {
    server_name?: string;
    server_data?: Record<string, string | { link_embed?: string }>;
  };
  sources?: { name: string; link: string }[];
  servers?: any;
}

export interface AVDBResponse {
  list: AVDBMovie[];
  total: number;
  page: number;
  pagecount: number;
}
