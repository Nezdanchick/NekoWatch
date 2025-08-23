import React, { useState } from 'react';
import { StyleSheet, FlatList, View, Text, Pressable } from 'react-native';
import { useAnimeStore } from '@/store/anime-store';
import WatchHistoryItem from '@/components/history/WatchHistoryItem';
import { useThemeStore } from '@/store/theme-store';
import { Stack } from 'expo-router';
import ConfirmationModal from '@/components/ConfirmationModal';

export default function HistoryScreen() {
  const { colors } = useThemeStore();
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
          title: watchHistory.length > 0 ? 'История просмотров' : 'История пуста',
        }}
      />
      <FlatList
        data={watchHistory}
        renderItem={renderItem}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 80 }}
      />
      {watchHistory.length > 0 ? (
        <Pressable style={[styles.clearButton, { backgroundColor: colors.primary }]} onPress={handleClearHistory}>
          <Text style={[styles.clearButtonText, { color: colors.text }]}>Очистить историю</Text>
        </Pressable>
      ) : null}

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
  clearButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
});