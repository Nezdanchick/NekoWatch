import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, FlatList, ActivityIndicator, TextInput, Platform, KeyboardAvoidingView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native'; // Импортируем useFocusEffect
import { searchAnime } from '@/services/shikimori-api';
import { AnimeShort } from '@/types/anime';
import SearchBar from '@/components/SearchBar';
import AnimeCard from '@/components/AnimeCard';
import Colors from '@/constants/colors';

export default function SearchScreen() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<AnimeShort[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const searchBarRef = useRef<TextInput>(null); // Создаем реф для SearchBar

  // Фокусируем SearchBar при каждом фокусе экрана
  useFocusEffect(
    React.useCallback(() => {
      const timeout = setTimeout(() => {
        searchBarRef.current?.focus();
      }, 100); // Задержка для корректной работы на Android

      return () => clearTimeout(timeout); // Очищаем таймер при размонтировании
    }, [])
  );

  // Debounce search query
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [searchQuery]);

  // Perform search when debounced query changes
  useEffect(() => {
    if (debouncedQuery) {
      handleSearch(1);
    } else {
      setSearchResults([]);
      setPage(1);
      setHasMore(true);
    }
  }, [debouncedQuery]);

  const handleSearch = async (pageNum: number) => {
    if (!debouncedQuery) return;

    try {
      setLoading(true);
      setError(null);

      if (pageNum === 1) {
        setSearchResults([]);
      }

      const results = await searchAnime(debouncedQuery, pageNum);

      if (results.length === 0) {
        setHasMore(false);
      } else {
        setSearchResults(prev => pageNum === 1 ? results : [...prev, ...results]);
        setPage(pageNum);
      }
    } catch (err) {
      setError('Ошибка при поиске');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    if (!loading && hasMore && debouncedQuery) {
      handleSearch(page + 1);
    }
  };

  const renderItem = ({ item }: { item: AnimeShort }) => (
    <View style={styles.cardContainer}>
      <AnimeCard anime={item} />
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <SafeAreaView style={styles.container} edges={['right', 'left']}>
        <SearchBar
          ref={searchBarRef} // Привязываем реф к SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Введите название аниме"
        />

        {error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : searchResults.length === 0 && !loading ? (
          <View style={styles.centerContainer}>
            <Text style={styles.emptyText}>
              {debouncedQuery ? 'Ничего не найдено' : '^///^'}
            </Text>
          </View>
        ) : (
          <FlatList
            data={searchResults}
            renderItem={renderItem}
            keyExtractor={(item) => item.id.toString()}
            numColumns={2}
            contentContainerStyle={styles.listContent}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.5}
            ListFooterComponent={
              loading ? (
                <View style={styles.footer}>
                  <ActivityIndicator size="large" color={Colors.dark.primary} />
                </View>
              ) : null
            }
          />
        )}
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.dark.text,
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
    color: Colors.dark.subtext,
    fontSize: 16,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.dark.secondary,
    fontSize: 16,
    textAlign: 'center',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
});