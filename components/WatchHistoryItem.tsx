import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { WatchHistoryItem as WatchHistoryItemType } from '@/types/anime';
import { useThemeStore } from '@/store/theme-store';
import { searchKodikByShikimoriId } from '@/services/kodik-api';

export type WatchHistoryItemProps = {
  item: WatchHistoryItemType;
  continueWatchingShow?: boolean;
};

export default function WatchHistoryItem({ item, continueWatchingShow = false }: WatchHistoryItemProps) {
  const router = useRouter();
  const [link, setLink] = React.useState<string | null>(null);
  const { colors } = useThemeStore();

  React.useEffect(() => {
    const fetchLink = async () => {
      const result = await searchKodikByShikimoriId(item.animeId);
      setLink(result[0].link);
    };
    fetchLink();
  }, [item.animeId]);

  const handlePress = () => {
    router.push(`/anime/${item.animeId}`);
  };

  const handleContinueWatching = () => {
    router.push({
      pathname: '/player/[id]',
      params: {
        id: item.animeId.toString(),
        kodikUrl: link,
      },
    });
  };

  // Format date
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  // Handle missing image
  const imageUrl = item.image || 'https://via.placeholder.com/80x80/1E1E1E/FFFFFF?text=No+Image';

  return (
    <Pressable style={[styles.container, { backgroundColor: colors.card }]} onPress={handlePress}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
        <Text style={[styles.date, { color: colors.subtext }]}>{formatDate(item.lastWatched)}</Text>
      </View>

      {continueWatchingShow ? (
        <Pressable style={[styles.playButton, { backgroundColor: colors.primary }]} onPress={handleContinueWatching}>
          <FontAwesome name="play" size={20} color={colors.text} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
  },
  image: {
    width: 80,
    height: 80,
  },
  content: {
    flex: 1,
    padding: 12,
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  date: {
    fontSize: 11,
  },
  playButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
});