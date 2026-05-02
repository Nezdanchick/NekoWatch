import React, { useState } from 'react';
import { StyleSheet, FlatList, View, Text } from 'react-native';
import { useAnimeStore } from '@/store/anime-store';
import WatchHistoryItem from '@/components/history/WatchHistoryItem';
import { useThemeStore } from '@/store/theme-store';
import { Stack } from 'expo-router';
import ConfirmationModal from '@/components/ConfirmationModal';
import { SafeAreaView } from 'react-native-safe-area-context';
import Focusable from '@/components/Focusable';

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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
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
        <Focusable style={[styles.clearButton, { backgroundColor: colors.secondary }]} onPress={handleClearHistory}>
          <Text style={[styles.clearButtonText, { color: colors.onSecondaryContainer }]}>Очистить историю</Text>
        </Focusable>
      ) : null}

      <ConfirmationModal
        visible={isModalVisible}
        title="Подтверждение"
        message="Вы уверены, что хотите очистить историю?"
        onCancel={() => setModalVisible(false)}
        onConfirm={confirmClearHistory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'space-between'
  },
  clearButton: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    paddingVertical: 16,
    borderRadius: 20,
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});