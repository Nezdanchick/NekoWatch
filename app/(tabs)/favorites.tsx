import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimeStore } from '@/store/anime-store';
import AnimeCard from '@/components/AnimeCard';
import { useThemeStore } from '@/store/theme-store';
import { AnimeInfo } from '@/types/anime';

export default function FavoritesScreen() {
  const { colors } = useThemeStore();
  const { favoritesData, removeFromFavorites } = useAnimeStore();
  const [refreshing, setRefreshing] = useState(false);

  const handleRemoveFavorite = (animeId: number) => {
    removeFromFavorites(animeId);
  };

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  const renderItem = ({ item }: { item: AnimeInfo }) => (
    <View style={styles.cardContainer}>
      <AnimeCard 
        anime={item} 
        onRemoveFavorite={handleRemoveFavorite}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['right', 'left']}>
      {favoritesData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>У вас пока нет избранных аниме</Text>
        </View>
      ) : (
        <FlatList
          data={favoritesData}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
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
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardContainer: {
    width: '50%',
    alignItems: 'center',
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
});