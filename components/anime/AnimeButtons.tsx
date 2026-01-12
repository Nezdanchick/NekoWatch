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
  const [availablePlayers, setAvailablePlayers] = useState<{ key: 'kodik' | 'collaps' | 'flix'; title: string; link: string }[]>([]);
  const [flixUrl, setFlixUrl] = useState<string | null>(null);
  const [collapsUrl, setCollapsUrl] = useState<string | null>(null);
  const animationHeight = useRef(new Animated.Value(0)).current;
  const animationInProgress = useRef(false);
  const router = useRouter();

  const { isFavorite, addToFavorites, removeFromFavorites, addToWatchHistory } = useAnimeStore();

  const imageUrl = shikimori?.poster?.mainUrl || MISSING_POSTER_URL;

  useEffect(() => {
    if (shikimori) setFavorite(isFavorite(shikimori.id));
  }, [shikimori, isFavorite]);

  useEffect(() => {
    const kinopoiskId = getKinopoiskId();

    const nextPlayers: { key: 'kodik' | 'collaps' | 'flix'; title: string; link: string }[] = [];

    if (kodik && kodik.length > 0 && kodik[0]?.link) {
      nextPlayers.push({ key: 'kodik', title: 'Kodik', link: kodik[0].link });
    }

    async function checkCollaps() {
      if (!kinopoiskId) {
        setCollapsUrl(null);
        return;
      }
      const url = `https://neko-collaps.deno.dev/?kinopoisk_id=${kinopoiskId}`;
      try {
        const resp = await fetch(url, { method: 'GET' });
        if (resp.ok) {
          setCollapsUrl(url);
        } else {
          setCollapsUrl(null);
        }
      } catch {
        setCollapsUrl(null);
      }
    }

    async function checkFlix() {
      if (!kinopoiskId) {
        setFlixUrl(null);
        return;
      }
      const url = `https://neko-flixcdn.deno.dev/api/search?kinopoisk_id=${kinopoiskId}`;
      try {
        const resp = await fetch(url);
        if (!resp.ok) {
          setFlixUrl(null);
          return;
        }
        const data = await resp.json();
        const result = Array.isArray(data?.result) ? data.result : [];
        const iframe = result?.[0]?.iframe_url;
        if (iframe) {
          setFlixUrl(iframe);
        } else {
          setFlixUrl(null);
        }
      } catch {
        setFlixUrl(null);
      }
    }

    checkCollaps();
    checkFlix();

    setAvailablePlayers(nextPlayers);
  }, [shikimori?.id, kodik && kodik.length]);

  useEffect(() => {
    const nextPlayers: { key: 'kodik' | 'collaps' | 'flix'; title: string; link: string }[] = [];
    if (kodik && kodik.length > 0 && kodik[0]?.link) {
      nextPlayers.push({ key: 'kodik', title: 'Kodik', link: kodik[0].link });
    }
    if (collapsUrl) {
      nextPlayers.push({ key: 'collaps', title: 'Collaps', link: collapsUrl });
    }
    // if (flixUrl) { // not work
    //   nextPlayers.push({ key: 'flix', title: 'Flix', link: flixUrl });
    // }
    setAvailablePlayers(nextPlayers);
  }, [collapsUrl, flixUrl, kodik && kodik.length]);

  useEffect(() => {
    if (isTranslationsVisible) {
      Animated.timing(animationHeight, {
        toValue: getTargetHeight(),
        duration: calculateAnimationDuration(),
        useNativeDriver: false,
      }).start();
    }
  }, [isTranslationsVisible, availablePlayers.length]);

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

  const getTargetHeight = () => Array.isArray(availablePlayers) ? availablePlayers.length * (styles.episodeButton.height + 8) : 0;

  const calculateAnimationDuration = () => {
    const itemsCount = availablePlayers.length;
    const baseDuration = 100;
    const maxDuration = 750;
    const scaleFactor = 0.15;
    const duration = baseDuration + (maxDuration - baseDuration) * (1 - Math.exp(-scaleFactor * itemsCount));
    return Math.min(duration, maxDuration);
  };

  const getKinopoiskId = () => {
    const kp = Array.isArray(kodik) && kodik.length > 0 ? kodik[0]?.kinopoisk_id : null;
    return kp || null;
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
            availablePlayers.length !== 0
              ? { backgroundColor: colors.card }
              : { backgroundColor: colors.disabled },
          ]}
          onPress={toggleTranslationsVisibility}
          disabled={!availablePlayers.length}
        >
          {availablePlayers.length ? (
            <MaterialCommunityIcons
              name={isTranslationsVisible ? 'chevron-up' : 'chevron-down'}
              size={20}
              color={colors.text}
            />
          ) : null}
          <Text style={[styles.folderText, { color: colors.text }]}>
            {availablePlayers.length ? 'Плееры' : 'Нет доступных плееров'}
          </Text>
        </Pressable>
        {availablePlayers.some(p => p.key === 'kodik') && (
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
        {availablePlayers.map((player, index) => (
          <Pressable
            key={`${player.key}-${index}`}
            style={[styles.episodeButton, { backgroundColor: colors.card }]}
            onPress={() => handleWatchPress(player.link)}
          >
            <Text style={[styles.episodeText, { color: colors.text }]}>
              {player.title}
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