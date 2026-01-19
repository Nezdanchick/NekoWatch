import React, { useRef, useState } from 'react';
import { StyleSheet, Text, View, Pressable, Image, Animated } from 'react-native';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ShikimoriInfo, MISSING_POSTER_URL, canOpen, STATUS_COLORS } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { useThemeStore } from '@/store/theme-store';
import StatusSelector from '@/components/anime/StatusSelector';

interface AnimeCardProps {
  anime: ShikimoriInfo;
  size?: 'small' | 'medium' | 'large';
  onRemoveFavorite?: (animeId: number) => void;
}

export default function AnimeCard({ anime, size = 'medium', onRemoveFavorite }: AnimeCardProps) {
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

  const getCardSize = () => {
    switch (size) {
      case 'small':
        return {
          container: { width: 140, height: 220 },
          image: { height: 160 },
          title: { fontSize: 12 },
        };
      case 'large':
        return {
          container: { width: 200, height: 300 },
          image: { height: 220 },
          title: { fontSize: 16 },
        };
      default:
        return {
          container: { width: 160, height: 260 },
          image: { height: 200 },
          title: { fontSize: 14 },
        };
    }
  };

  const sizeStyles = getCardSize();

  const bookmarkColor = currentStatus ? STATUS_COLORS[currentStatus] : colors.subtext;
  const bookmarkIcon = currentStatus ? 'bookmark' : 'bookmark-outline';
  
  return (
    <>
    <Pressable
      style={[styles.container, sizeStyles.container, { backgroundColor: colors.card }]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Animated.Image
          source={{ uri: anime.poster ? anime.poster.mainUrl : MISSING_POSTER_URL }}
          style={[
            styles.image,
            sizeStyles.image,
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
          <Text style={[styles.lockText, { color: colors.subtext }]}>¯\_(ツ)_/¯</Text>
          <Text style={[styles.lockTextSmall, { color: colors.text }]}>Тайтл еще не вышел</Text>
        </Animated.View>
        <View style={[styles.metaContainer, { backgroundColor: colors.card }]}>
          {anime.kind && (
            <Text style={[styles.meta, { color: colors.primary }]}>
              {anime.kind && anime.kind.replaceAll('_', ' ').toUpperCase()}
            </Text>
          )}
          {anime.airedOn.date && (
            <Text style={[styles.date, { color: colors.subtext }]}>
              {anime.airedOn.date}
            </Text>
          )}
          <Text style={[styles.score, { color: colors.primary }]}>
            {anime.score !== 0 ? anime.score.toFixed(1).toString() : '-'}
          </Text>
        </View>
        <Pressable
          style={[styles.favoriteButton, { backgroundColor: colors.background }]}
          onPress={toggleFavorite}
          hitSlop={10}
        >
          <MaterialCommunityIcons
            name={bookmarkIcon}
            size={22}
            color={bookmarkColor}
          />
        </Pressable>
      </View>
      <View style={styles.infoContainer}>
        <Text
          style={[
            styles.title,
            sizeStyles.title,
            { color: colors.text },
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {anime.russian || anime.name || 'Без названия'}
        </Text>
      </View>
    </Pressable>
    <StatusSelector anime={anime} visible={statusModalVisible} onClose={() => setStatusModalVisible(false)} />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
    margin: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  imageContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: 180,
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
    bottom: 8,
    right: 8,
    borderRadius: 20,
    padding: 6,
    zIndex: 10,
  },
  infoContainer: {
    padding: 8,
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontWeight: '600',
    marginBottom: 4,
    textAlign: 'center',
    fontSize: 14,
    lineHeight: 20,
  },
  metaContainer: {
    position: 'absolute',
    top: 8,
    left: 8,
    right: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  meta: {
    fontSize: 9,
    flexShrink: 1,
  },
  date: {
    fontSize: 9,
    flexShrink: 1,
  },
  score: {
    fontSize: 12,
    flexShrink: 1,
    fontWeight: '700',
  },
});