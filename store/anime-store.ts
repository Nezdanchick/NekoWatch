import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ShikimoriInfo, WatchHistoryItem, AnimeStatus } from '@/types/anime';

interface AnimeState {
  watchHistory: WatchHistoryItem[];
  bookmarks: Record<number, AnimeStatus>;
  bookmarksData: Record<number, ShikimoriInfo>;
  
  favoritesData: ShikimoriInfo[]; 

  setAnimeStatus: (anime: ShikimoriInfo, status: AnimeStatus | null) => void;
  getAnimeStatus: (animeId: number) => AnimeStatus | null;
  getAnimesByStatus: (status: AnimeStatus) => ShikimoriInfo[];

  addToFavorites: (anime: ShikimoriInfo) => void;
  removeFromFavorites: (animeId: number) => void;
  isFavorite: (animeId: number) => boolean;

  addToWatchHistory: (animeId: number, title: string, image: string, link?: string) => void;
  clearWatchHistory: () => void;
}

export const useAnimeStore = create<AnimeState>()(
  persist(
    (set, get) => ({
      watchHistory: [],
      bookmarks: {},
      bookmarksData: {},
      favoritesData: [], 

      setAnimeStatus: (anime: ShikimoriInfo, status: AnimeStatus | null) =>
        set((state) => {
          const newBookmarks = { ...state.bookmarks };
          const newBookmarksData = { ...state.bookmarksData };

          if (status === null) {
            delete newBookmarks[anime.id];
            delete newBookmarksData[anime.id];
          } else {
            newBookmarks[anime.id] = status;
            newBookmarksData[anime.id] = anime;
          }
          
          const favoritesData = Object.values(newBookmarksData);

          return { bookmarks: newBookmarks, bookmarksData: newBookmarksData, favoritesData };
        }),

      getAnimeStatus: (animeId: number) => get().bookmarks[animeId] || null,

      getAnimesByStatus: (status: AnimeStatus) => {
        const { bookmarks, bookmarksData } = get();
        return Object.entries(bookmarks)
          .filter(([_, s]) => s === status)
          .map(([id, _]) => bookmarksData[parseInt(id)])
          .filter(Boolean);
      },

      addToFavorites: (anime) => get().setAnimeStatus(anime, 'planned'),
      removeFromFavorites: (animeId) => {
        const anime = get().bookmarksData[animeId];
        if (anime) get().setAnimeStatus(anime, null);
      },
      isFavorite: (animeId) => !!get().bookmarks[animeId],

      addToWatchHistory: (animeId: number, title: string, image: string, link?: string) =>
        set((state) => {
          const item: WatchHistoryItem = {
            animeId,
            title,
            image,
            link,
            lastWatched: Date.now()
          };
          const filteredHistory = state.watchHistory.filter(
            h => h.animeId !== item.animeId
          );

          return {
            watchHistory: [item, ...filteredHistory].slice(0, 100)
          };
        }),

      clearWatchHistory: () => set({ watchHistory: [] }),
    }),
    {
      name: 'anime-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
