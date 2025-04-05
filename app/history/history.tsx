import React, { useState } from 'react';
import { StyleSheet, FlatList, View, Text, Pressable } from 'react-native';
import { useAnimeStore } from '@/store/anime-store';
import WatchHistoryItem from '@/components/WatchHistoryItem';
import Colors from '@/constants/colors';
import { Stack } from 'expo-router';
import ConfirmationModal from '@/components/ConfirmationModal'; // Импортируем компонент

export default function HistoryScreen() {
  const { watchHistory, clearWatchHistory } = useAnimeStore();
  const [isModalVisible, setModalVisible] = useState(false);

  const renderItem = ({ item }: { item: any }) => (
    <WatchHistoryItem item={item} />
  );

  const handleClearHistory = () => {
    setModalVisible(true);
  };

  const confirmClearHistory = () => {
    clearWatchHistory();
    setModalVisible(false);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'История просмотров',
        }}
      />
      {watchHistory.length > 0 ? (
        <>
          <FlatList
            data={watchHistory}
            renderItem={renderItem}
            keyExtractor={(item, index) => index.toString()}
            contentContainerStyle={{ paddingTop: 16, paddingBottom: 80 }}
          />
          <Pressable style={styles.clearButton} onPress={handleClearHistory}>
            <Text style={styles.clearButtonText}>Очистить историю</Text>
          </Pressable>
        </>
      ) : (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>История пуста</Text>
        </View>
      )}

      <ConfirmationModal
        visible={isModalVisible}
        title="Подтверждение"
        message="Вы уверены, что хотите очистить историю?"
        onCancel={() => setModalVisible(false)}
        onConfirm={confirmClearHistory}
      />
    </>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
  },
  emptyText: {
    fontSize: 18,
    color: Colors.dark.subtext,
  },
  clearButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(123, 104, 238, 0.95)',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
  },
});