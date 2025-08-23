import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import { ShikimoriInfo, KodikInfo, MISSING_POSTER_URL } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { useRouter } from 'expo-router';

interface AnimeButtonsProps {
  shikimori: ShikimoriInfo;
  kodik: KodikInfo[];
}

export default function AnimeButtons({ shikimori, kodik }: AnimeButtonsProps) {
  const { colors } = useThemeStore();
  const [favorite, setFavorite] = useState(false);
  const [isTranslationsVisible, setTranslationsVisible] = useState(false);
  const animationHeight = useRef(new Animated.Value(0)).current;
  const animationInProgress = useRef(false);
  const router = useRouter();

  const { isFavorite, addToFavorites, removeFromFavorites, addToWatchHistory } = useAnimeStore();

  const imageUrl = shikimori?.poster?.mainUrl || MISSING_POSTER_URL;

  useEffect(() => {
    if (shikimori) setFavorite(isFavorite(shikimori.id));
  }, [shikimori, isFavorite]);

  useEffect(() => {
    if (isTranslationsVisible) {
      Animated.timing(animationHeight, {
        toValue: getTargetHeight(),
        duration: calculateAnimationDuration(),
        useNativeDriver: false,
      }).start();
    }
  }, [kodik.length]);

  function handleFavorite() {
    if (!shikimori) return;
    if (favorite) {
      removeFromFavorites(shikimori.id);
    } else {
      addToFavorites(shikimori);
    }
    setFavorite(!favorite);
  }

  const handlePlay = () => {
    if (kodik.length > 0) handleWatchPress(kodik[0].link);
  };

  const handleWatchPress = (link: string) => {
    if (shikimori) addToWatchHistory(shikimori.id, shikimori.russian || shikimori.name, imageUrl, link);
    router.push({
      pathname: '/screens/player',
      params: { id: shikimori.id.toString(), kodikUrl: link },
    });
  };

  const getTargetHeight = () => Array.isArray(kodik) ? kodik.length * (styles.episodeButton.height + 8) : 0;

  const calculateAnimationDuration = () => {
    const itemsCount = kodik.length;
    const baseDuration = 100;
    const maxDuration = 750;
    const scaleFactor = 0.15;
    const duration = baseDuration + (maxDuration - baseDuration) * (1 - Math.exp(-scaleFactor * itemsCount));
    return Math.min(duration, maxDuration);
  };

  const toggleTranslationsVisibility = () => {
    if (animationInProgress.current) {
      animationHeight.stopAnimation(() => {
        setTranslationsVisible((prev) => {
          const nextState = !prev;
          animationInProgress.current = true;
          Animated.timing(animationHeight, {
            toValue: nextState ? getTargetHeight() : 0,
            duration: calculateAnimationDuration(),
            useNativeDriver: false,
          }).start(() => {
            setTranslationsVisible(nextState);
            animationInProgress.current = false;
          });
          return nextState;
        });
      });
    } else {
      setTranslationsVisible((prev) => {
        const nextState = !prev;
        animationInProgress.current = true;
        Animated.timing(animationHeight, {
          toValue: nextState ? getTargetHeight() : 0,
          duration: calculateAnimationDuration(),
          useNativeDriver: false,
        }).start(() => {
          setTranslationsVisible(nextState);
          animationInProgress.current = false;
        });
        return nextState;
      });
    }
  };

  return (
    <View style={styles.actions}>
      <View style={styles.folderButtonContainer}>
        <Pressable style={[styles.smallButton, { backgroundColor: colors.card }]} onPress={handleFavorite}>
          <FontAwesome
            name="heart"
            size={16}
            color={favorite ? colors.secondary : colors.text}
          />
        </Pressable>
        <Pressable
          style={[
            styles.folderButton,
            kodik.length !== 0
              ? { backgroundColor: colors.card }
              : { backgroundColor: colors.disabled },
          ]}
          onPress={toggleTranslationsVisibility}
          disabled={!kodik.length}
        >
          {kodik.length ? (
            <MaterialCommunityIcons
              name={isTranslationsVisible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text}
            />
          ) : null}
          <Text style={[styles.folderText, { color: colors.text }]}>
            {kodik.length ? 'Озвучки' : 'Нет доступных озвучек'}
          </Text>
        </Pressable>
        {kodik.length > 0 && (
          <Pressable
            style={({ pressed }) => [
              styles.smallButton,
              { backgroundColor: colors.primary },
              pressed && { opacity: 0.7 },
            ]}
            onPress={handlePlay}
          >
            <MaterialCommunityIcons
              name="play"
              size={20}
              color={colors.text}
            />
          </Pressable>
        )}
      </View>
      <Animated.View
        style={[
          styles.animatedContainer,
          {
            height: animationHeight,
            marginTop: 16,
            paddingHorizontal: 8,
          },
        ]}
      >
        {kodik.map((episode: any, index: number) => (
          <Pressable
            key={episode?.id || index}
            style={[styles.episodeButton, { backgroundColor: colors.card }]}
            onPress={() => handleWatchPress(episode?.link || '')}
          >
            <Text style={[styles.episodeText, { color: colors.text }]}>
              {episode?.translation?.title || 'Без названия'}
            </Text>
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: {
    flexDirection: 'column',
    padding: 16,
  },
  translationsContainer: {
    padding: 16,
  },
  folderButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  folderButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    height: 48,
  },
  folderText: {
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  smallButton: {
    width: 48,
    height: 48,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  animatedContainer: {
    overflow: 'hidden',
  },
  episodeButton: {
    padding: 12,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
    height: 50,
  },
  episodeText: {
    fontSize: 14,
    textAlign: 'center',
  },
});