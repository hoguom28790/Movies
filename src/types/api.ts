// src/types/api.ts

export interface OPhimMovie {
  id: string;
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
}

export interface OPhimEpisode {
  server_name: string;
  server_data: {
    name: string;
    slug: string;
    filename: string;
    link_m3u8: string;
    link_embed: string;
  }[];
}

export interface OPhimResponse {
  status: boolean;
  msg: string;
  data: {
    item: OPhimMovie;
    seoOnPage: any;
    params: any;
    episodes: OPhimEpisode[];
  };
}

export interface KKPhimMovie extends OPhimMovie {}
export interface KKPhimResponse extends OPhimResponse {}

export interface NguonCMovie {
  id: string;
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
}

export interface NguonCResponse {
  status: boolean;
  movie: NguonCMovie;
  episodes: {
    server_name: string;
    items: {
      name: string;
      slug: string;
      embed: string;
      m3u8: string;
    }[];
  }[];
}

export interface VsmovMovie {
  id: string;
  title: string;
  slug: string;
  origin_title: string;
  poster: string;
  thumbnail: string;
  year: number;
  quality: string;
  language: string;
  epazines: string;
  total_episodes: string;
  genres: { name: string; slug: string }[];
  countries: { name: string; slug: string }[];
  description: string;
  type: string;
  duration: string;
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

export interface OPhimListResponse {
  status: boolean;
  items: {
    _id: string;
    name: string;
    slug: string;
    origin_name: string;
    poster_url: string;
    thumb_url: string;
    year: number;
    modified: { time: string };
  }[];
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
  items: {
    name: string;
    slug: string;
    origin_name: string;
    thumb_url: string;
    poster_url: string;
    year: number;
    status: string;
  }[];
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
  items: {
    name: string;
    slug: string;
    original_name: string;
    thumb_url: string;
    poster_url: string;
    modified: string;
    year: number;
    quality: string;
    language: string;
    episode_current: string;
    status: string;
  }[];
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

export interface TopXXMovie {
  id: number;
  code: string;
  title: string;
  thumbnail: string;
  quality: string;
  publish_at: string;
  trans?: { locale: string; title: string; description: string; slug: string }[];
  genres?: { name: string; slug: string; code: string }[];
  countries?: { name: string; slug: string; code: string }[];
  actors?: { trans: { locale: string; name: string; slug: string }[] }[];
  video_url?: string;
  play_url?: string;
  content?: string;
  description?: string;
  year?: string | number;
  status?: string;
  duration?: string;
  source?: string;
}

export interface TopXXResponse {
  status: string;
  data: TopXXMovie | TopXXMovie[];
  meta?: {
    current_page: number;
    last_page: number;
    total: number;
  };
}

export interface AVDBMovie {
  id: string | number;
  name: string;
  movie_code?: string;
  slug?: string;
  poster_url?: string;
  thumb_url?: string;
  year?: string | number;
  quality?: string;
  actor?: string | string[];
  description?: string;
  episodes?: {
    server_name: string;
    server_data: { [key: string]: string | { link_embed: string } };
  };
}

export interface AVDBResponse {
  code: number;
  msg: string;
  page: number;
  pagecount: number;
  limit: number | string;
  total: number;
  list: AVDBMovie[];
}
