import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimeStore } from '@/store/anime-store';
import AnimeCard from '@/components/AnimeCard';
import { useThemeStore } from '@/store/theme-store';
import { ShikimoriInfo, AnimeStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/anime';

type FilterType = AnimeStatus | 'all';

export default function BookmarksScreen() {
  const { colors } = useThemeStore();
  const { bookmarks, bookmarksData, setAnimeStatus } = useAnimeStore();
  const [activeFilter, setActiveFilter] = useState<FilterType>('all');

  const filteredData = useMemo(() => {
    const allData = Object.values(bookmarksData);
    if (activeFilter === 'all') {
      return allData.reverse();
    }
    return allData.filter(anime => bookmarks[anime.id] === activeFilter).reverse();
  }, [bookmarks, bookmarksData, activeFilter]);

  const renderItem = ({ item }: { item: ShikimoriInfo }) => (
    <View style={styles.cardContainer}>
      <AnimeCard 
        anime={item}
      />
    </View>
  );

  const filters: FilterType[] = ['all', 'watching', 'planned', 'completed', 'on_hold', 'dropped'];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Закладки</Text>
      
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterContent}>
            {filters.map(filter => (
                <Pressable
                    key={filter}
                    style={[
                        styles.filterChip, 
                        { 
                            borderColor: filter === 'all' ? colors.border : STATUS_COLORS[filter as AnimeStatus],
                            backgroundColor: activeFilter === filter 
                                ? (filter === 'all' ? colors.primary : STATUS_COLORS[filter as AnimeStatus]) 
                                : 'transparent',
                            borderWidth: 1
                        }
                    ]}
                    onPress={() => setActiveFilter(filter)}
                >
                    <Text style={[
                        styles.filterText, 
                        { 
                            color: activeFilter === filter ? '#fff' : colors.text 
                        }
                    ]}>
                        {filter === 'all' ? 'Все' : STATUS_LABELS[filter as AnimeStatus]}
                    </Text>
                </Pressable>
            ))}
        </ScrollView>
      </View>

      {filteredData.length === 0 ? (
        <View style={styles.centerContainer}>
          <Text style={[styles.emptyText, { color: colors.subtext }]}>
            {activeFilter === 'all' ? 'У вас пока нет закладок' : 'В этой категории пусто'}
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredData}
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
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginVertical: 16,
    marginHorizontal: 16,
  },
  filterContainer: {
     height: 50,
     marginBottom: 8,
  },
  filterContent: {
      paddingHorizontal: 16,
      columnGap: 8,
      alignItems: 'center',
  },
  filterChip: {
      paddingHorizontal: 16,
      paddingVertical: 8,
      borderRadius: 20,
      marginRight: 8,
  },
  filterText: {
      fontSize: 14,
      fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  cardContainer: {
    width: '50%',
    alignItems: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});