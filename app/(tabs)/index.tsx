import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, RefreshControl, Animated, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnimeStore } from '@/store/anime-store';
import { fetchAnimeList } from '@/services/shikimori-api';
import { ShikimoriInfo } from '@/types/anime';
import AnimeList from '@/components/AnimeList';
import SwipableHistoryItem from '@/components/history/SwipableHistoryItem';
import { useThemeStore } from '@/store/theme-store';
import * as ScreenOrientation from 'expo-screen-orientation';

const animeCount = 25;
const CACHE_KEYS = {
  popular: 'home_popularAnime',
  latest: 'home_latestAnime',
  ongoing: 'home_ongoingAnime',
  anons: 'home_anonsAnime',
};

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

export default function HomeScreen() {
  const { colors } = useThemeStore();
  const [popularAnime, setPopularAnime] = useState<ShikimoriInfo[]>([]);
  const [latestAnime, setLatestAnime] = useState<ShikimoriInfo[]>([]);
  const [ongoingAnime, setOngoingAnime] = useState<ShikimoriInfo[]>([]);
  const [anonsAnime, setAnonsAnime] = useState<ShikimoriInfo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { watchHistory } = useAnimeStore();

  const animationValue = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (Platform.OS !== 'web') {
      ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
    }
  }, []);

  const getCachedData = async <T,>(key: string): Promise<CacheEntry<T> | null> => {
    try {
      const cached = await AsyncStorage.getItem(key);
      if (cached) {
        return JSON.parse(cached);
      }
      return null;
    } catch (err) {
      console.error(`Error reading cache for ${key}:`, err);
      return null;
    }
  };

  const setCachedData = async <T,>(key: string, data: T): Promise<void> => {
    try {
      const cacheEntry: CacheEntry<T> = {
        data,
        timestamp: Date.now(),
      };
      await AsyncStorage.setItem(key, JSON.stringify(cacheEntry));
    } catch (err) {
      console.error(`Error writing cache for ${key}:`, err);
    }
  };

  const clearHomeCache = async () => {
    try {
      await Promise.all(
        Object.values(CACHE_KEYS).map((key) => AsyncStorage.removeItem(key))
      );
    } catch (err) {
      console.error('Error clearing home cache:', err);
    }
  };

  const loadAnimeData = useCallback(
    async (
      cacheKey: string,
      setData: (data: ShikimoriInfo[]) => void,
      fetchParams: Parameters<typeof fetchAnimeList>
    ) => {
      const cached = await getCachedData<ShikimoriInfo[]>(cacheKey);

      if (cached?.data) {
        setData(cached.data);
      }

      if (!cached) {
        try {
          const freshData = await fetchAnimeList(...fetchParams);
          if (freshData && freshData.length > 0) {
            setData(freshData);
            await setCachedData(cacheKey, freshData);
          }
        } catch (err) {
          if (!cached) {
            setError('Ошибка при загрузке данных');
          }
          console.error(`Error fetching ${cacheKey}:`, err);
        }
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    await Promise.all([
      loadAnimeData(CACHE_KEYS.popular, setPopularAnime, [1, animeCount, 'popularity']),
      loadAnimeData(
        CACHE_KEYS.latest,
        setLatestAnime,
        [1, animeCount, 'ranked_shiki', undefined, 'latest']
      ),
      loadAnimeData(
        CACHE_KEYS.ongoing,
        setOngoingAnime,
        [1, animeCount, 'ranked', undefined, 'ongoing']
      ),
      loadAnimeData(
        CACHE_KEYS.anons,
        setAnonsAnime,
        [1, animeCount, 'aired_on', undefined, 'anons']
      ),
    ]);
  }, [loadAnimeData]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await clearHomeCache();
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleScrollBeginDrag = () => {
    Animated.timing(animationValue, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleScrollEndDrag = () => {
    Animated.timing(animationValue, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const translateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0],
  });

  const opacity = animationValue;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['right', 'left']}>
      <Animated.ScrollView
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.errorText, { color: colors.secondary }]}>{error}</Text>
          </View>
        )}

        <View style={[styles.section, { marginTop: '4%' }]}>
          <AnimeList
            title="Популярное аниме"
            type='popular'
            data={popularAnime}
            loading={false}
            error={error}
            horizontal={true}
            cardSize="medium"
          />
        </View>

        <View style={styles.section}>
          <AnimeList
            title="Последние релизы"
            type='latest'
            data={latestAnime}
            loading={false}
            error={error}
            horizontal={true}
            cardSize="medium"
          />
        </View>

        <View style={styles.section}>
          <AnimeList
            title="Онгоинги"
            type='ongoing'
            data={ongoingAnime}
            loading={false}
            error={error}
            horizontal={true}
            cardSize="medium"
          />
        </View>

        <View style={styles.section}>
          <AnimeList
            title="Анонсы"
            type='anons'
            data={anonsAnime}
            loading={false}
            error={error}
            horizontal={true}
            cardSize="medium"
          />
        </View>

        <View style={styles.footer} />
      </Animated.ScrollView>

      {watchHistory.length > 0 && (
        <Animated.View
          style={[styles.watchHistoryContainer, { transform: [{ translateY }], opacity }]}
        >
          <SwipableHistoryItem key={`${watchHistory[0].animeId}`} item={watchHistory[0]} />
        </Animated.View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginBottom: 8,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: 'rgba(255, 0, 0, 0.1)',
    marginHorizontal: 16,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    textAlign: 'center',
  },
  footer: {
    height: 90,
  },
  watchHistoryContainer: {
    position: 'absolute',
    bottom: -32,
    left: 16,
    right: 16,
  },
});