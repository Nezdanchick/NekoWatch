import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { WatchHistoryItem as WatchHistoryItemType } from '@/types/anime';
import Colors from '@/constants/colors';
import { searchKodikByShikimoriId } from '@/services/kodik-api';

export type WatchHistoryItemProps = {
  item: WatchHistoryItemType;
  continueWatchingShow?: boolean;
};

export default function WatchHistoryItem({ item, continueWatchingShow = false }: WatchHistoryItemProps) {
  const router = useRouter();
  const [link, setLink] = React.useState<string | null>(null);

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
    <Pressable style={styles.container} onPress={handlePress}>
      <Image
        source={{ uri: imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title} numberOfLines={1}>{item.title}</Text>
        <Text style={styles.date}>{formatDate(item.lastWatched)}</Text>
      </View>

      {continueWatchingShow ? (
        <Pressable style={styles.playButton} onPress={handleContinueWatching}>
          <FontAwesome name="play" size={20} color={Colors.dark.text} />
        </Pressable>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: Colors.dark.card,
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
    color: Colors.dark.text,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  episode: {
    color: Colors.dark.primary,
    fontSize: 12,
    marginBottom: 4,
  },
  date: {
    color: Colors.dark.subtext,
    fontSize: 11,
  },
  playButton: {
    width: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.primary,
  },
});