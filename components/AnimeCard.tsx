import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { AnimeInfo } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { useThemeStore } from '@/store/theme-store';

const MISSING_POSTER_URL = 'https://shikimori.one/assets/globals/missing_preview.jpg';

interface AnimeCardProps {
  anime: AnimeInfo;
  size?: 'small' | 'medium' | 'large';
}

export default function AnimeCard({ anime, size = 'medium' }: AnimeCardProps) {
  const { colors } = useThemeStore();
  const router = useRouter();
  const { isFavorite, addToFavorites, removeFromFavorites } = useAnimeStore();
  const favorite = isFavorite(anime.id);

  const handlePress = () => {
    router.push(`/anime/${anime.id}`);
  };

  const toggleFavorite = (e: any) => {
    e.stopPropagation();
    if (favorite) {
      removeFromFavorites(anime.id);
    } else {
      addToFavorites(anime.id);
    }
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

  return (
    <Pressable
      style={[styles.container, sizeStyles.container, { backgroundColor: colors.background }]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: anime.poster ? anime.poster.mainUrl : MISSING_POSTER_URL }}
          style={[styles.image, sizeStyles.image]}
          resizeMode="cover"
        />
        <View style={[styles.metaContainer, { backgroundColor: colors.background }]}>
          {anime.kind && (
            <Text style={[styles.meta, { color: colors.subtext }]}>
              {anime.kind && anime.kind.toUpperCase()}
            </Text>
          )}
          {anime.airedOn.date && (
            <Text style={[styles.date, { color: colors.disabled }]}>
              {anime.airedOn.date.toString()}
            </Text>
          )}
          <Text style={[styles.score, { color: colors.primary }]}>{anime.score !== 0 ? anime.score.toString() : '-'}</Text>
        </View>
        <Pressable
          style={[styles.favoriteButton, { backgroundColor: colors.background }]}
          onPress={toggleFavorite}
          hitSlop={10}
        >
          <FontAwesome
            name="heart"
            size={20}
            color={favorite ? colors.secondary : colors.subtext}
          />
        </Pressable>
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.title, sizeStyles.title, { color: colors.text }]} numberOfLines={2} ellipsizeMode="tail">
          {anime.russian || anime.name || 'Без названия'}
        </Text>
      </View>
    </Pressable>
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
  },
  image: {
    width: '100%',
    height: 180,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
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
    justifyContent: 'space-between',
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
    fontSize: 11,
    flexShrink: 1,
  },
  date: {
    fontSize: 10,
    flexShrink: 1,
  },
  score: {
    fontSize: 12,
    fontWeight: '700',
  },
});