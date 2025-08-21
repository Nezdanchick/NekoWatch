import React, { useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, View, ActivityIndicator } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import AnimeCard from '@/components/AnimeCard';
import { AnimeInfo, canShow } from '@/types/anime';
import { useThemeStore } from '@/store/theme-store';
import { fetchAnimeList } from '@/services/shikimori-api';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function FullAnimeList() {
  const { colors } = useThemeStore();
  const { type, title } = useLocalSearchParams();
  const [data, setData] = useState<AnimeInfo[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [page, setPage] = useState<number>(1);

  const loadAnimeData = useCallback(async () => {
    setLoading(true);

    try {
      const fetchParams = {
        popular: [page, 25, 'popularity'],
        latest: [page, 25, 'ranked_shiki', undefined, 'latest'],
        ongoing: [page, 25, 'ranked', undefined, 'ongoing'],
        anons: [page, 25, 'aired_on', undefined, 'anons'],
      }[type as string] as Parameters<typeof fetchAnimeList>;

      const freshData = await fetchAnimeList(...fetchParams);
      setData((prevData) => [...prevData, ...freshData]);
    } catch (err) {
      console.error(`Error fetching ${type} anime:`, err);
    } finally {
      setLoading(false);
    }
  }, [type, page]);

  useEffect(() => {
    loadAnimeData();
  }, [loadAnimeData]);

  const handleEndReached = () => {
    if (!loading) {
      setPage((prevPage) => prevPage + 1);
    }
  };
  const renderItem = ({ item }: { item: AnimeInfo }) => (
      <View style={styles.cardContainer}>
        <AnimeCard 
          anime={item} 
        />
      </View>
  );
  
  return (
   <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['right', 'left']}>
      <FlatList
        data={data.filter(anime => canShow(anime))}
        renderItem={renderItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.list]}
        numColumns={2}
        onEndReached={handleEndReached}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          loading ? (
            <View style={styles.footer}>
              <ActivityIndicator color={colors.primary} />
            </View>
          ) : null
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  list: {
    paddingHorizontal: 8,
    paddingBottom: 16,
  },
  footer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    width: '50%',
    padding: 4,
  },
});