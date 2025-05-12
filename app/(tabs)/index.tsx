import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, RefreshControl, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimeStore } from '@/store/anime-store';
import { fetchAnimeList } from '@/services/shikimori-api';
import { AnimeShort } from '@/types/anime';
import AnimeList from '@/components/AnimeList';
import SwipableHistoryItem from '@/components/SwipableHistoryItem';
import { useThemeStore } from '@/store/theme-store';

const animeCount = 15;

export default function HomeScreen() {
  const { colors } = useThemeStore();
  const [popularAnime, setPopularAnime] = useState<AnimeShort[]>([]);
  const [latestAnime, setLatestAnime] = useState<AnimeShort[]>([]);
  const [ongoingAnime, setOngoingAnime] = useState<AnimeShort[]>([]);
  const [anonsAnime, setAnonsAnime] = useState<AnimeShort[]>([]);
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

  const loadData = useCallback(async () => {
    try {
      setLoading(prev => ({ ...prev, popular: true }));
      const popular = await fetchAnimeList(1, animeCount, 'popularity');
      if (popular && popular.length > 0) {
        setPopularAnime(popular);
      }
      setLoading(prev => ({ ...prev, popular: false }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      setLoading(prev => ({ ...prev, new: true }));
      const latest = await fetchAnimeList(1, animeCount, 'ranked_shiki', undefined, 'latest');
      if (latest && latest.length > 0) {
        setLatestAnime(latest);
      }
      setLoading(prev => ({ ...prev, new: false }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      setLoading(prev => ({ ...prev, new: true }));
      const ongoing = await fetchAnimeList(1, animeCount, 'ranked', undefined, 'ongoing');
      if (ongoing && ongoing.length > 0) {
        setOngoingAnime(ongoing);
      }
      setLoading(prev => ({ ...prev, new: false }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      setLoading(prev => ({ ...prev, new: true }));
      const anons = await fetchAnimeList(1, animeCount, 'aired_on', undefined, 'anons');
      if (anons && anons.length > 0) {
        setAnonsAnime(anons);
      }
      setLoading(prev => ({ ...prev, new: false }));

      setLoading(prev => ({ ...prev, updates: true }));
      setLoading(prev => ({ ...prev, updates: false }));
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(err);
    } finally {
      setLoading({
        popular: false,
        new: false,
        updates: false,
      });
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    setError(null);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleScrollBeginDrag = () => {
    Animated.timing(animationValue, {
      toValue: 0, // Скрыть
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleScrollEndDrag = () => {
    Animated.timing(animationValue, {
      toValue: 1, // Показать
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const translateY = animationValue.interpolate({
    inputRange: [0, 1],
    outputRange: [100, 0], // Скрыть вниз, вернуть на место
  });

  const opacity = animationValue;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['right', 'left']}>
      <Animated.ScrollView
        onScrollBeginDrag={handleScrollBeginDrag}
        onScrollEndDrag={handleScrollEndDrag}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {error && (
          <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
            <Text style={[styles.container, { color: colors.secondary }]}>{error}</Text>
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
          style={[
            styles.watchHistoryContainer,
            { transform: [{ translateY }], opacity },
          ]}
        >
          <SwipableHistoryItem
            key={`${recentHistory[0].animeId}`}
            item={recentHistory[0]}
          />
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
    marginVertical: 8,
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