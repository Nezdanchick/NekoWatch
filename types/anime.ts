export interface KodikTranslation {
  title: string,
}

export interface KodikMaterialData {
  description: string,
  poster_url: string,
  anime_poster_url: string,
  screenshots: string[],
  episodes_total: number | null,
  episodes_aired: number | null,
}

export interface KodikInfo {
  id: string,
  title: string,
  link: string,
  kinopoisk_id: string | null,
  translation: KodikTranslation,
  screenshots: string[],
  material_data?: KodikMaterialData,
}

export interface ShikimoriInfo {
  id: number;
  name: string;
  russian: string;
  poster: {
    mainUrl: string;
  };
  kind: string;
  score: number;
  airedOn: {
    date: string;
  };
  franchise: string;
}

export interface Genre {
  id: number;
  name: string;
  russian: string;
  kind: string;
}

export interface Studio {
  id: number;
  name: string;
  filtered_name: string;
  real: boolean;
  image: string;
}

export interface Video {
  id: number;
  url: string;
  image_url: string;
  player_url: string;
  name: string;
  kind: string;
  hosting: string;
}

export interface Screenshot {
  original: string;
  preview: string;
}

export interface WatchHistoryItem {
  animeId: number;
  title: string;
  image: string;
  link?: string;
  lastWatched: number;
}

export const MISSING_POSTER_URL = 'https://shikimori.one/assets/globals/missing_preview.jpg';

export const KIND_PRIORITY: Record<string, number> = {
  'tv': 0,
  'movie': 1,
  'ova': 2,
  'ona': 3,
  'special': 4,
  'tv_special': 5,
  'web': 6,
  'pv': 7,
};

const HIDE_KINDS = ['music', 'cm'];
const SINGLE_KINDS = ['movie', 'special']

export function canShow(anime: ShikimoriInfo) {
  return !HIDE_KINDS.includes(anime.kind) && anime.kind !== null;
}

export function canShowSeries(anime: ShikimoriInfo) {
  return !SINGLE_KINDS.includes(anime.kind);
}

export function canOpen(anime: ShikimoriInfo) {
  return anime.score !== 0;
}

export type AnimeStatus = 'watching' | 'planned' | 'completed' | 'on_hold' | 'dropped';

export const STATUS_COLORS: Record<AnimeStatus, string> = {
  watching: '#4CAF50', 
  planned: '#2196F3', 
  completed: '#9C27B0', 
  on_hold: '#FF9800', 
  dropped: '#F44336', 
};

export const STATUS_LABELS: Record<AnimeStatus, string> = {
  watching: 'Смотрю',
  planned: 'В планах',
  completed: 'Просмотрено',
  on_hold: 'Отложено',
  dropped: 'Брошено',
};
