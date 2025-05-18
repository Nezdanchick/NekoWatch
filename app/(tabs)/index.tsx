import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnimeStore } from '@/store/anime-store';
import { fetchAnimeList } from '@/services/shikimori-api';
import { AnimeInfo } from '@/types/anime';
import AnimeList from '@/components/AnimeList';
import SwipableHistoryItem from '@/components/SwipableHistoryItem';
import { useThemeStore } from '@/store/theme-store';

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
  const [popularAnime, setPopularAnime] = useState<AnimeInfo[]>([]);
  const [latestAnime, setLatestAnime] = useState<AnimeInfo[]>([]);
  const [ongoingAnime, setOngoingAnime] = useState<AnimeInfo[]>([]);
  const [anonsAnime, setAnonsAnime] = useState<AnimeInfo[]>([]);
  const [loading, setLoading] = useState({
    popular: true,
    new: true,
    updates: true,
  });
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const { watchHistory } = useAnimeStore();
  const recentHistory = watchHistory
    .sort((a, b) => b.lastWatched - a.lastWatched)
    .slice(0, 5);

  const animationValue = useRef(new Animated.Value(1)).current;

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
      setData: (data: AnimeInfo[]) => void,
      fetchParams: Parameters<typeof fetchAnimeList>,
      loadingKey: keyof typeof loading
    ) => {
      const cached = await getCachedData<AnimeInfo[]>(cacheKey);

      if (cached?.data) {
        setData(cached.data);
        setLoading((prev) => ({ ...prev, [loadingKey]: false }));
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
        } finally {
          if (!cached) {
            setLoading((prev) => ({ ...prev, [loadingKey]: false }));
          }
        }
      }
    },
    []
  );

  const loadData = useCallback(async () => {
    await Promise.all([
      loadAnimeData(CACHE_KEYS.popular, setPopularAnime, [1, animeCount, 'popularity'], 'popular'),
      loadAnimeData(
        CACHE_KEYS.latest,
        setLatestAnime,
        [1, animeCount, 'ranked_shiki', undefined, 'latest'],
        'new'
      ),
      loadAnimeData(
        CACHE_KEYS.ongoing,
        setOngoingAnime,
        [1, animeCount, 'ranked', undefined, 'ongoing'],
        'new'
      ),
      loadAnimeData(
        CACHE_KEYS.anons,
        setAnonsAnime,
        [1, animeCount, 'aired_on', undefined, 'anons'],
        'new'
      ),
    ]);

    setLoading((prev) => ({ ...prev, updates: false }));
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

        <View style={styles.section}>
          <AnimeList
            title="Популярное аниме"
            data={popularAnime}
            loading={loading.popular}
            error={error}
            horizontal={true}
            cardSize="medium"
          />
        </View>

        <View style={styles.section}>
          <AnimeList
            title="Последние релизы"
            data={latestAnime}
            loading={loading.new}
            error={error}
            horizontal={true}
            cardSize="medium"
          />
        </View>

        <View style={styles.section}>
          <AnimeList
            title="Онгоинги"
            data={ongoingAnime}
            loading={loading.new}
            error={error}
            horizontal={true}
            cardSize="medium"
          />
        </View>

        <View style={styles.section}>
          <AnimeList
            title="Анонсы"
            data={anonsAnime}
            loading={loading.new}
            error={error}
            horizontal={true}
            cardSize="medium"
          />
        </View>

        <View style={styles.footer} />
      </Animated.ScrollView>

      {recentHistory.length > 0 && (
        <Animated.View
          style={[styles.watchHistoryContainer, { transform: [{ translateY }], opacity }]}
        >
          <SwipableHistoryItem key={`${recentHistory[0].animeId}`} item={recentHistory[0]} />
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