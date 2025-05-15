export interface AnimeInfo {
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