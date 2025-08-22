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
    date: Date;
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
  lastWatched: number;
}

export const MISSING_POSTER_URL = 'https://shikimori.one/assets/globals/missing_preview.jpg';

// tv movie ova ona special music tv_special web
const HIDE_KINDS = ['music', 'tv_special'];
const SINGLE_KINDS = ['movie', 'special']

export function canShow(anime: ShikimoriInfo) {
  return !HIDE_KINDS.includes(anime.kind);
}

export function canShowSeries(anime: ShikimoriInfo) {
  return !SINGLE_KINDS.includes(anime.kind);
}

export function canOpen(anime: ShikimoriInfo) {
  return anime.score !== 0;
}