import React from 'react';
import { StyleSheet, Text, View, Image, Platform, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
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
      try {
        const result = await searchKodikByShikimoriId(item.animeId);
        setLink(result[0]?.link || null);
      } catch (error) {
        console.error('Error fetching link:', error);
      }
    };
    fetchLink();
  }, [item.animeId]);

  const handleAnimeInfo = () => {
    router.push(`/anime/${item.animeId}`);
  };

  const handleContinueWatching = () => {
    if (!link) return;
    
    router.push({
      pathname: '/player/[id]',
      params: {
        id: item.animeId.toString(),
        kodikUrl: link,
      },
    });
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.card }]}>
      <TouchableOpacity 
        style={styles.mainPressable}
        onPress={handleAnimeInfo}
        activeOpacity={0.7}
      >
        <Image
          source={{ uri: item.image }}
          style={styles.image}
          resizeMode="cover"
        />
        <View style={styles.content}>
          <Text style={[styles.title, { color: colors.text }]} numberOfLines={1}>{item.title}</Text>
          <Text style={[styles.date, { color: colors.subtext }]}>{formatDate(item.lastWatched)}</Text>
        </View>
      </TouchableOpacity>

      {continueWatchingShow && (
        <TouchableOpacity 
          style={[styles.playButton, { backgroundColor: colors.primary }]} 
          onPress={handleContinueWatching}
          activeOpacity={0.7}
          disabled={!link}
        >
          <FontAwesome name="play" size={20} color={colors.text} />
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    marginHorizontal: 16,
    marginBottom: 12,
    overflow: 'hidden',
    elevation: 2,
    minHeight: 80,
  },
  mainPressable: {
    flex: 1,
    flexDirection: 'row',
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
    ...Platform.select({
      android: {
        elevation: 3,
      },
      ios: {
        zIndex: 1,
      },
    }),
  },
});