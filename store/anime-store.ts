import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AnimeDetailed, AnimeShort, WatchHistoryItem } from '@/types/anime';

interface AnimeState {
  favorites: number[];
  watchHistory: WatchHistoryItem[];
  
  // Actions
  addToFavorites: (animeId: number) => void;
  removeFromFavorites: (animeId: number) => void;
  isFavorite: (animeId: number) => boolean;
  
  addToWatchHistory: (animeId: number,  title: string, image: string) => void;
  
  clearWatchHistory: () => void;
}

export const useAnimeStore = create<AnimeState>()(
  persist(
    (set, get) => ({
      favorites: [],
      watchHistory: [],
      recentlyViewed: [],
      
      addToFavorites: (animeId: number) => 
        set((state) => ({
          favorites: [...state.favorites, animeId]
        })),
        
      removeFromFavorites: (animeId: number) => 
        set((state) => ({
          favorites: state.favorites.filter(id => id !== animeId)
        })),
        
      isFavorite: (animeId: number) => 
        get().favorites.includes(animeId),
        
      addToWatchHistory: (animeId: number,  title: string, image: string) => 
        set((state) => {
          const item: WatchHistoryItem = {
            animeId,
            title,
            image,
            lastWatched: Date.now()
          };
          // Remove existing entry if present
          const filteredHistory = state.watchHistory.filter(
            h => !(h.animeId === item.animeId)
          );
          
          return {
            watchHistory: [item, ...filteredHistory].slice(0, 100) // Limit history to 100 items
          };
        }),
        
      updateWatchProgress: (animeId: number) => 
        set((state) => {
          const existingItemIndex = state.watchHistory.findIndex(
            item => item.animeId === animeId
          );
          
          if (existingItemIndex >= 0) {
            const updatedHistory = [...state.watchHistory];
            updatedHistory[existingItemIndex] = {
              ...updatedHistory[existingItemIndex],
              lastWatched: Date.now()
            };
            return { watchHistory: updatedHistory };
          }
          
          return state;
        }),
        
      clearWatchHistory: () => set((state) => ({ ...state, watchHistory: [] })),
    }),
    {
      name: 'anime-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);