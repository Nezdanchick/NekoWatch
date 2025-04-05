import React from 'react';
import { FlatList, StyleSheet, Text, View, ActivityIndicator } from 'react-native';
import AnimeCard from './AnimeCard';
import { AnimeShort } from '@/types/anime';
import Colors from '@/constants/colors';

interface AnimeListProps {
  data: AnimeShort[];
  loading: boolean;
  error: string | null;
  onEndReached?: () => void;
  horizontal?: boolean;
  title?: string;
  cardSize?: 'small' | 'medium' | 'large';
  emptyMessage?: string;
}

export default function AnimeList({
  data,
  loading,
  error,
  onEndReached,
  horizontal = false,
  title,
  cardSize = 'medium',
  emptyMessage = 'Нет данных для отображения'
}: AnimeListProps) {
  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Ошибка: {error}</Text>
      </View>
    );
  }

  if (loading && data.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
      </View>
    );
  }

  if (data.length === 0 && !loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {title && (
        <Text style={styles.sectionTitle}>{title}</Text>
      )}
      <FlatList
        data={data}
        renderItem={({ item }) => <AnimeCard anime={item} size={cardSize} />}
        keyExtractor={(item) => item.id.toString()}
        horizontal={horizontal}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.5}
        contentContainerStyle={horizontal ? styles.horizontalList : styles.gridList}
        numColumns={horizontal ? 1 : 2}
        key={horizontal ? 'horizontal' : 'grid'}
        ListFooterComponent={
          loading && data.length > 0 ? (
            <View style={styles.footer}>
              <ActivityIndicator color={Colors.dark.primary} />
            </View>
          ) : null
        }
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.dark.text,
    marginHorizontal: 16,
    marginVertical: 12,
  },
  footer: {
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: Colors.dark.secondary,
    textAlign: 'center',
    fontSize: 16,
  },
  emptyText: {
    color: Colors.dark.subtext,
    textAlign: 'center',
    fontSize: 16,
  },
});