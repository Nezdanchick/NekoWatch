import React from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import AnimeCard from './AnimeCard';
import { ShikimoriInfo, canShow } from '@/types/anime';
import { useThemeStore } from '@/store/theme-store';
import { fetchAnimeList } from '@/services/shikimori-api';

interface AnimeListProps {
  type: 'popular' | 'latest' | 'ongoing' | 'anons';
  title?: string;
  data: ShikimoriInfo[];
  loading: boolean;
  error: string | null;
  onEndReached?: () => void;
  horizontal?: boolean;
  cardSize?: 'small' | 'medium' | 'large';
}

export default function AnimeList({
  type,
  title,
  data,
  loading,
  error,
  onEndReached,
  horizontal = false,
  cardSize = 'medium',
}: AnimeListProps) {
  const { colors } = useThemeStore();
  const router = useRouter();
  const handleViewAll = () => {
    router.push({
      pathname: '/screens/anime-list',
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

  if (loading && data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
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