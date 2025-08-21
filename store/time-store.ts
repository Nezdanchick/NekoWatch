import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface TimeState {
  totalMinutes: number;
  isTracking: boolean;
  intervalId: NodeJS.Timeout | null;
  
  startTracking: () => void;
  stopTracking: () => void;
  incrementTime: () => void;
  resetTime: () => void;
}

export const useTimeStore = create<TimeState>()(
  persist(
    (set, get) => ({
      totalMinutes: 0,
      isTracking: false,
      intervalId: null,

      startTracking: () => {
        if (get().isTracking) return;

        const intervalId = setInterval(() => {
          get().incrementTime();
        }, 60000);

        set({ isTracking: true, intervalId });
      },

      stopTracking: () => {
        const { intervalId } = get();
        if (intervalId) {
          clearInterval(intervalId);
        }
        set({ isTracking: false, intervalId: null });
      },

      incrementTime: () => {
        set((state) => ({ totalMinutes: state.totalMinutes + 1 }));
      },

      resetTime: () => {
        set({ totalMinutes: 0 });
      },
    }),
    {
      name: 'time-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
