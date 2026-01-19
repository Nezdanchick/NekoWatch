import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ScrollView, useWindowDimensions, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimeStore } from '@/store/anime-store';
import AnimeCard from '@/components/AnimeCard';
import { useThemeStore } from '@/store/theme-store';
import { ShikimoriInfo, AnimeStatus, STATUS_LABELS, STATUS_COLORS } from '@/types/anime';

type FilterType = AnimeStatus | 'all';

const filters: FilterType[] = ['all', 'watching', 'planned', 'completed', 'on_hold', 'dropped'];

export default function BookmarksScreen() {
  const { width } = useWindowDimensions();
  const { colors } = useThemeStore();
  const { bookmarks, bookmarksData } = useAnimeStore();
  
  const [activeIndex, setActiveIndex] = useState(0);
  const pagerRef = useRef<FlatList>(null);
  const filterScrollRef = useRef<ScrollView>(null);
  const filterRefs = useRef<View[]>([]);
  const isProgrammaticScroll = useRef(false);

  const getFilteredData = (filter: FilterType) => {
    const allData = Object.values(bookmarksData);
    if (filter === 'all') {
      return allData.reverse();
    }
    return allData.filter(anime => bookmarks[anime.id] === filter).reverse();
  };

  const scrollToFilter = (index: number) => {
    if (filterRefs.current[index] && filterScrollRef.current) {
      filterRefs.current[index].measureLayout(
        filterScrollRef.current as any,
        (x) => {
          filterScrollRef.current?.scrollTo({
            x: x - 20,
            animated: true,
          });
        },
        () => {}
      );
    }
  };

  const onScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isProgrammaticScroll.current) return;
    
    const offsetX = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(offsetX / width);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < filters.length) {
      setActiveIndex(newIndex);
      scrollToFilter(newIndex);
    }
  }, [activeIndex, width]);

  const onMomentumScrollEnd = useCallback(() => {
    isProgrammaticScroll.current = false;
  }, []);

  const scrollToPage = (index: number) => {
    isProgrammaticScroll.current = true;
    setActiveIndex(index);
    scrollToFilter(index);
    pagerRef.current?.scrollToIndex({ index, animated: true });
  };

  const renderAnimeList = ({ item: filter }: { item: FilterType }) => {
    const filteredData = getFilteredData(filter);
    
    const renderAnimeItem = ({ item }: { item: ShikimoriInfo }) => (
      <View style={styles.cardContainer}>
        <AnimeCard anime={item} />
      </View>
    );

    if (filteredData.length === 0) {
      return (
        <View style={[styles.pageContainer, { width }]}>
          <View style={styles.centerContainer}>
            <Text style={[styles.emptyText, { color: colors.subtext }]}>
              {filter === 'all' ? 'У вас пока нет закладок' : 'В этой категории пусто'}
            </Text>
          </View>
        </View>
      );
    }

    return (
      <View style={[styles.pageContainer, { width }]}>
        <FlatList
          data={filteredData}
          renderItem={renderAnimeItem}
          keyExtractor={(item) => item.id.toString()}
          numColumns={2}
          contentContainerStyle={styles.listContent}
        />
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>Закладки</Text>
      
      <View style={styles.filterContainer}>
        <ScrollView 
          ref={filterScrollRef}
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterContent}
        >
          {filters.map((filter, index) => {
            const isActive = index === activeIndex;
            return (
              <View
                key={filter}
                ref={(ref) => {
                  if (ref) filterRefs.current[index] = ref;
                }}
              >
                <Pressable
                  style={[
                    styles.filterChip,
                    {
                      borderColor: filter === 'all' ? colors.border : STATUS_COLORS[filter as AnimeStatus],
                      backgroundColor: isActive
                        ? (filter === 'all' ? colors.primary : STATUS_COLORS[filter as AnimeStatus])
                        : 'transparent',
                      borderWidth: 1,
                    },
                  ]}
                  onPress={() => scrollToPage(index)}
                >
                  <Text
                    style={[
                      styles.filterText,
                      { color: isActive ? '#fff' : colors.text },
                    ]}
                  >
                    {filter === 'all' ? 'Все' : STATUS_LABELS[filter as AnimeStatus]}
                  </Text>
                </Pressable>
              </View>
            );
          })}
        </ScrollView>
      </View>

      <FlatList
        ref={pagerRef}
        onMomentumScrollEnd={onMomentumScrollEnd}
        data={filters}
        renderItem={renderAnimeList}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onScroll={onScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
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
    alignItems: 'center',
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  pageContainer: {
    flex: 1,
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