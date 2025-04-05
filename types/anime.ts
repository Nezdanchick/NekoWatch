export interface AnimeShort {
  id: number;
  name: string;
  russian: string;
  image: {
    original: string;
    preview: string;
    x96: string;
    x48: string;
  };
  url: string;
  kind: string;
  score: string;
  status: string;
  episodes: number;
  episodes_aired: number;
  aired_on: string;
  released_on: string;
}

export interface AnimeDetailed extends AnimeShort {
  rating: string;
  english: string[];
  japanese: string[];
  synonyms: string[];
  license_name_ru: string;
  duration: number;
  description: string;
  description_html: string;
  franchise: string;
  favoured: boolean;
  anons: boolean;
  ongoing: boolean;
  thread_id: number;
  topic_id: number;
  myanimelist_id: number;
  genres: Genre[];
  studios: Studio[];
  videos: Video[];
  screenshots: Screenshot[];
  user_rate: any;
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

// Обновленная структура для API v3 Anilibria
export interface AnilibriaTitle {
  id: number;
  code: string;
  names: {
    ru: string;
    en: string;
  };
  description: string;
  status: {
    code: string;
    string: string;
  };
  type: {
    code: string;
    full_string: string;
    string: string;
    series: number;
    length: number;
  };
  genres: string[];
  season: {
    year: number;
    code: string;
    string: string;
  };
  posters: {
    small: {
      url: string;
    };
    medium: {
      url: string;
    };
    original: {
      url: string;
    };
  };
  player: {
    alternative_player: string;
    host: string;
    episodes: {
      first: number;
      last: number;
      string: string;
    };
    list: {
      [key: string]: {
        episode: number;
        name: string;
        uuid: string;
        created_timestamp: number;
        preview: {
          url: string;
        };
        skips: {
          opening: number[];
          ending: number[];
        };
        hls: {
          fhd: string;
          hd: string;
          sd: string;
        };
      };
    };
  };
}

export interface WatchHistoryItem {
  animeId: number;
  title: string;
  image: string;
  lastWatched: number;
}