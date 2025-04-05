import React from 'react';
import { StyleSheet, Text, View, Pressable, Image } from 'react-native';
import { useRouter } from 'expo-router';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { AnimeShort } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import Colors from '@/constants/colors';

interface AnimeCardProps {
  anime: AnimeShort;
  size?: 'small' | 'medium' | 'large';
}

export default function AnimeCard({ anime, size = 'medium' }: AnimeCardProps) {
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

  let imageUrl = 'https://via.placeholder.com/150x200/1E1E1E/FFFFFF?text=No+Image';
  try {
    if (anime.image && anime.image.preview) {
      imageUrl = `https://shikimori.one${anime.image.preview}`;
    }
  } catch (error) {
    console.warn('Error with anime image:', error);
  }

  return (
    <Pressable
      style={[styles.container, sizeStyles.container]}
      onPress={handlePress}
    >
      <View style={styles.imageContainer}>
        <Image
          source={{ uri: imageUrl }}
          style={[styles.image, sizeStyles.image]}
          resizeMode="cover"
        />
        <View style={styles.metaContainer}>
          <Text style={styles.meta}>
            {anime.kind && anime.kind.toUpperCase()}
          </Text>
          {anime.score && (
            <Text style={styles.score}>{anime.score}</Text>
          )}
        </View>
        <Pressable
          style={styles.favoriteButton}
          onPress={toggleFavorite}
          hitSlop={10}
        >
          <FontAwesome
            name="heart"
            size={20}
            color={favorite ? Colors.dark.secondary : Colors.dark.subtext}
          />
        </Pressable>
      </View>
      <View style={styles.infoContainer}>
        <Text style={[styles.title, sizeStyles.title]} numberOfLines={2} ellipsizeMode="tail">
          {anime.russian || anime.name || 'Без названия'}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.dark.card,
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
    backgroundColor: 'rgba(0,0,0,0.5)',
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
    color: Colors.dark.text,
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
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  meta: {
    color: Colors.dark.subtext,
    fontSize: 11,
    flexShrink: 1,
  },
  score: {
    color: Colors.dark.primary,
    fontSize: 12,
    fontWeight: '700',
  },
});