import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShikimoriInfo, MISSING_POSTER_URL, canOpen, STATUS_COLORS } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { useThemeStore } from '@/store/theme-store';
import StatusSelector from '@/components/anime/StatusSelector';
import { Dimensions } from 'react-native';

interface AnimeCardProps {
  anime: ShikimoriInfo;
  size?: 'small' | 'medium' | 'large';
  onRemoveFavorite?: (animeId: number) => void;
}

export default function AnimeCard({ anime }: AnimeCardProps) {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { getAnimeStatus } = useAnimeStore();
  const currentStatus = getAnimeStatus(anime.id);
  const [canAnim, setCanAnim] = useState(true);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const overlayAnim = useRef(new Animated.Value(0)).current;

  const showOverlay = () => {
    setCanAnim(false);
    Animated.timing(overlayAnim, {
      toValue: 1,
      duration: 250,
      useNativeDriver: true,
    }).start();
  };

  const hideOverlay = () => {
    Animated.timing(overlayAnim, {
      toValue: 0,
      duration: 250,
      useNativeDriver: true,
    }).start(() => setCanAnim(true));
  };

  const handlePress = () => {
    if (canOpen(anime)) {
      router.push(`/anime/${anime.id}`);
    } else if (canAnim) {
      showOverlay();
      setTimeout(hideOverlay, 1200);
      return;
    }
  };

  const toggleFavorite = (e: any) => {
    e.stopPropagation();
    setStatusModalVisible(true);
  };

  const scale = 1;
  const s = (val: number) => val * scale;

  const dynamicStyles = {
    container: {
      width: s(180),
      height: s(270),
      borderRadius: s(16),
    },
    title: {
      fontSize: s(14),
      padding: s(4)
    },
    meta: {
      fontSize: s(10)
    },
    date: {
      fontSize: s(10)
    },
    score: {
      fontSize: s(12)
    },
    lockText: {
      fontSize: s(24)
    },
    lockTextSmall: {
      fontSize: s(12),
      marginTop: s(4),
    },
    favoriteButton: {
      bottom: s(8),
      right: s(8),
      borderRadius: s(12),
      padding: s(8),
    },
    metaContainer: {
      left: s(12),
      right: s(12),
      borderBottomLeftRadius: s(16),
      borderBottomRightRadius: s(16),
      paddingHorizontal: s(8),
      paddingVertical: s(4),
    },
    infoContainer: {
      height: s(52),
      paddingRight: s(44),
    },
  };

  const bookmarkColor = currentStatus ? STATUS_COLORS[currentStatus] : colors.subtext;
  const bookmarkIcon = currentStatus ? 'bookmark' : 'bookmark-outline';

  return (
    <>
      <Pressable
        style={[styles.container, dynamicStyles.container, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handlePress}
      >
        <Animated.Image
          source={{ uri: anime.poster ? anime.poster.mainUrl : MISSING_POSTER_URL }}
          style={[
            styles.image,
            { opacity: overlayAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 0] }) },
          ]}
          resizeMode="cover"
        />
        <Animated.View
          pointerEvents="none"
          style={[
            styles.lockOverlay,
            { opacity: overlayAnim, backgroundColor: colors.card },
          ]}
        >
          <Text style={[styles.lockText, dynamicStyles.lockText, { color: colors.subtext }]}>¯\_(ツ)_/¯</Text>
          <Text style={[styles.lockTextSmall, dynamicStyles.lockTextSmall, { color: colors.text }]}>Тайтл еще не вышел</Text>
        </Animated.View>
        <View style={[styles.metaContainer, dynamicStyles.metaContainer, { backgroundColor: colors.card }]}>
          {anime.kind && (
            <Text style={[styles.meta, dynamicStyles.meta, { color: colors.primary }]}>
              {anime.kind && anime.kind.replaceAll('_', ' ').toUpperCase()}
            </Text>
          )}
          {anime.airedOn.date && (
            <Text style={[styles.date, dynamicStyles.date, { color: colors.subtext }]}>
              {anime.airedOn.date}
            </Text>
          )}
          <Text style={[styles.score, dynamicStyles.score, { color: colors.primary }]}>
            {anime.score !== 0 ? anime.score.toFixed(1).toString() : '-'}
          </Text>
        </View>
        <View style={[styles.infoContainer, dynamicStyles.infoContainer, { backgroundColor: colors.card, opacity: 0.9 }]}>
          <Text
            style={[styles.title, dynamicStyles.title, { color: colors.text }]}
            numberOfLines={2}
            ellipsizeMode='tail'
          >
            {anime.russian || anime.name || 'Без названия'}
          </Text>
        </View>
        <Pressable
          style={[styles.favoriteButton, dynamicStyles.favoriteButton, { backgroundColor: colors.background }]}
          onPress={toggleFavorite}
          hitSlop={10}
        >
          <MaterialCommunityIcons
            name={bookmarkIcon}
            size={s(20)}
            color={bookmarkColor}
          />
        </Pressable>
      </Pressable>
      <StatusSelector anime={anime} visible={statusModalVisible} onClose={() => setStatusModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    margin: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 20,
    width: '100%',
    height: '100%',
  },
  lockText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  lockTextSmall: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 4,
  },
  favoriteButton: {
    position: 'absolute',
    zIndex: 10,
    opacity: 0.8,
  },
  infoContainer: {
    padding: 4,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    textAlign: 'center',
  },
  metaContainer: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomLeftRadius: 8,
    borderBottomRightRadius: 8,
    paddingHorizontal: 8,
    opacity: 0.9,
  },
  meta: {
    fontSize: 9,
    flexShrink: 1,
    fontWeight: '500',
  },
  date: {
    fontSize: 9,
    flexShrink: 1,
    fontWeight: '500',
  },
  score: {
    fontSize: 12,
    flexShrink: 1,
    fontWeight: '600',
  },
});