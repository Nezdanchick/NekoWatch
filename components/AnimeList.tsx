import React, { useEffect, useState, useCallback } from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AnimeCard from './AnimeCard';
import { AnimeInfo, canShow } from '@/types/anime';
import { useThemeStore } from '@/store/theme-store';
import { fetchAnimeList } from '@/services/shikimori-api';

interface AnimeListProps {
  type: 'popular' | 'latest' | 'ongoing' | 'anons'; // Тип аниме
  title?: string;
  horizontal?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
  limit?: number; // Лимит отображаемых аниме
}

export default function AnimeList({
  type,
  title,
  horizontal = false,
  cardSize = 'medium',
  limit = 25, // По умолчанию 25
}: AnimeListProps) {
  const { colors } = useThemeStore();
  const router = useRouter();

  const [data, setData] = useState<AnimeInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadAnimeData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const fetchParams = {
        popular: [1, limit, 'popularity'],
        latest: [1, limit, 'ranked_shiki', undefined, 'latest'],
        ongoing: [1, limit, 'ranked', undefined, 'ongoing'],
        anons: [1, limit, 'aired_on', undefined, 'anons'],
      }[type] as Parameters<typeof fetchAnimeList>;

      const freshData = await fetchAnimeList(...fetchParams);
      setData(freshData || []);
    } catch (err) {
      setError('Ошибка при загрузке данных');
      console.error(`Error fetching ${type} anime:`, err);
    } finally {
      setLoading(false);
    }
  }, [type, limit]);

  useEffect(() => {
    loadAnimeData();
  }, [loadAnimeData]);

  const handleViewAll = () => {
    router.push({
      pathname: '/full-anime-list',
      params: { title, type },
    });
  };

  if (error) {
    return (
      <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.secondary }]}>Ошибка: {error}</Text>
      </View>
    );
  }

  if (data.length === 0 && !loading) {
    return null;
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {title && (
        <View style={styles.titleContainer}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>{title}</Text>
          <TouchableOpacity onPress={handleViewAll} style={styles.viewAllContainer}>
            <Text style={[styles.viewAllText, { color: colors.primary }]}>Все</Text>
            <Text style={[styles.arrowText, { color: colors.primary }]}>→</Text>
          </TouchableOpacity>
        </View>
      )}
      <FlatList
        data={data.filter(anime => canShow(anime))}
        renderItem={({ item }) => <AnimeCard anime={item} size={cardSize} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={horizontal ? styles.horizontalList : styles.gridList}
        numColumns={horizontal ? 1 : 2}
        key={horizontal ? 'horizontal' : 'grid'}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  horizontalList: {
    paddingHorizontal: 8,
  },
  gridList: {
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  viewAllContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  arrowText: {
    fontSize: 14,
    marginLeft: 4,
  },
  errorText: {
    textAlign: 'center',
    fontSize: 16,
  },
});