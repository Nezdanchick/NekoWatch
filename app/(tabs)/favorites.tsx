import React, { useState, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAnimeStore } from '@/store/anime-store';
import { fetchAnimeDetails } from '@/services/shikimori-api';
import { AnimeInfo } from '@/types/anime';
import AnimeCard from '@/components/AnimeCard';
import { useThemeStore } from '@/store/theme-store';
import LoadingScreen from '@/components/LoadingScreen';

const FAVORITES_CACHE_KEY = 'favorites_anime_cache';

export default function FavoritesScreen() {
  const { colors } = useThemeStore();
  const { favorites } = useAnimeStore();
  const [favoriteAnimes, setFavoriteAnimes] = useState<AnimeInfo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const getCachedFavorites = async (): Promise<AnimeInfo[]> => {
    try {
      const cached = await AsyncStorage.getItem(FAVORITES_CACHE_KEY);
      return cached ? JSON.parse(cached) : [];
    } catch (err) {
      return [];
    }
  };

  const setCachedFavorites = async (data: AnimeInfo[]) => {
    try {
      await AsyncStorage.setItem(FAVORITES_CACHE_KEY, JSON.stringify(data));
    } catch (_error) { }
  };

  const loadFavorites = useCallback(async () => {
    setLoading(true);
    setError(null);

    const cached = await getCachedFavorites();
    if (cached.length > 0) {
      setFavoriteAnimes(cached);
      setLoading(false);
    }

    if (favorites.length === 0) {
      setFavoriteAnimes([]);
      setLoading(false);
      setRefreshing(false);
      await setCachedFavorites([]);
      return;
    }

    try {
      const animeResults = await Promise.all(
        favorites.map(async (id) => {
          try {
            return await fetchAnimeDetails(id);
          } catch (err) {
            console.error(`Ошибка при загрузке аниме с ID ${id}:`, err);
            return null;
          }
        })
      );
      const filtered = animeResults.filter(Boolean) as AnimeInfo[];
      setFavoriteAnimes(filtered);
      await setCachedFavorites(filtered);
    } catch (err) {
      setError('Ошибка при загрузке избранного');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [favorites]);

  useEffect(() => {
    loadFavorites();
  }, [loadFavorites]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadFavorites();
  };

  const renderItem = ({ item }: { item: AnimeInfo }) => (
    <View style={styles.cardContainer}>
      <AnimeCard anime={item} />
    </View>
  );

  console.log(favoriteAnimes);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['right', 'left']}>
      {loading && !refreshing ? (
        <LoadingScreen />
      ) : error ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.errorText, { color: colors.secondary }]}>{error}</Text>
        </View>
      ) : favoriteAnimes.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>У вас пока нет избранных аниме</Text>
        </View>
      ) : (
        <FlatList
          data={favoriteAnimes.filter((item, index) => item.id === favoriteAnimes[index].id)}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary]}
              tintColor={colors.primary}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  cardContainer: {
    width: '50%',
    padding: 4,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
});