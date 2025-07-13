import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimeInfo, WatchHistoryItem } from '@/types/anime';

interface AnimeState {
  favorites: number[];
  favoritesData: AnimeInfo[]; // Добавляем кеш данных
  watchHistory: WatchHistoryItem[];

  addToFavorites: (anime: AnimeInfo) => void; // Теперь принимаем объект аниме
  removeFromFavorites: (animeId: number) => void;
  isFavorite: (animeId: number) => boolean;

  addToWatchHistory: (animeId: number, title: string, image: string) => void;
  clearWatchHistory: () => void;
}

export const useAnimeStore = create<AnimeState>()(
  persist(
    (set, get) => ({
      favorites: [],
      favoritesData: [],
      watchHistory: [],

      addToFavorites: (anime: AnimeInfo) =>
        set((state) => ({
          favorites: [...new Set([...state.favorites, anime.id])],
          favoritesData: [...state.favoritesData, anime].filter(
            (item, index, self) =>
              index === self.findIndex((t) => t.id === item.id)
          )
        })),

      removeFromFavorites: (animeId: number) =>
        set((state) => ({
          favorites: state.favorites.filter(id => id !== animeId),
          favoritesData: state.favoritesData.filter(item => item.id !== animeId)
        })),

      isFavorite: (animeId: number) =>
        get().favorites.includes(animeId),

      addToWatchHistory: (animeId: number, title: string, image: string) =>
        set((state) => {
          const item: WatchHistoryItem = {
            animeId,
            title,
            image,
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