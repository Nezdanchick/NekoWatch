import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimeStore } from '@/store/anime-store';
import { fetchAnimeDetails } from '@/services/shikimori-api';
import { AnimeShort } from '@/types/anime';
import AnimeCard from '@/components/AnimeCard';
import { useThemeStore } from '@/store/theme-store';

export default function FavoritesScreen() {
  const { colors } = useThemeStore();
  const { favorites } = useAnimeStore();
  const [favoriteAnimes, setFavoriteAnimes] = useState<AnimeShort[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const loadFavorites = async () => {
    if (favorites.length === 0) {
      setFavoriteAnimes([]);
      setLoading(false);
      return;
    }

    setError(null);

    try {
      // Загружаем данные последовательно, чтобы избежать rate limiting
      const animeResults: AnimeShort[] = [];

      for (const id of favorites) {
        try {
          const animeDetails = await fetchAnimeDetails(id);
          if (animeDetails) {
            animeResults.push(animeDetails);
          }
        } catch (err) {
          console.error(`Ошибка при загрузке аниме с ID ${id}:`, err);
          // Продолжаем загрузку других аниме
        }
      }

      setFavoriteAnimes(animeResults);
    } catch (err) {
      setError('Ошибка при загрузке избранного');
      console.error(err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    loadFavorites();
  }, [favorites]);

  const onRefresh = () => {
    setRefreshing(true);
    loadFavorites();
  };

  const renderItem = ({ item }: { item: AnimeShort }) => (
    <View style={styles.cardContainer}>
      <AnimeCard anime={item} />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['right', 'left']}>

      {loading && !refreshing ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
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
          data={favoriteAnimes}
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
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
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