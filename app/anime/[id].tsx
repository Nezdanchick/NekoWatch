import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, ActivityIndicator, Animated, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAnimeDetails } from '@/services/shikimori-api';
import { searchKodikByShikimoriId } from '@/services/kodik-api';
import { canShowSeries, ShikimoriInfo as ShikimoriInfo, MISSING_POSTER_URL } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { useThemeStore } from '@/store/theme-store';
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DESCRIPTION_PLACEHOLDER = "Кажется, здесь ничего нет (￣▽￣*)";
const ANIME_CACHE_KEY = 'kodikCache';

async function getFromCache(animeId: number) {
  const cacheStr = await AsyncStorage.getItem(ANIME_CACHE_KEY);
  if (!cacheStr) return null;
  const cache: [number, { kodik?: any; shikimori?: ShikimoriInfo }][] = JSON.parse(cacheStr);
  const found = cache.find(([id]) => id === animeId);
  if (found) {
    const filtered = cache.filter(([id]) => id !== animeId);
    const updated = [...filtered, found];
    await AsyncStorage.setItem(ANIME_CACHE_KEY, JSON.stringify(updated));
    return found[1];
  }
  return null;
}

async function setToCache(animeId: number, kodik?: any, shikimori?: ShikimoriInfo) {
  const cacheStr = await AsyncStorage.getItem(ANIME_CACHE_KEY);
  let cache: [number, { kodik?: any; shikimori?: ShikimoriInfo }][] = cacheStr ? JSON.parse(cacheStr) : [];
  let cached = cache.find(([id]) => id === animeId)?.[1] || {};
  if (kodik) cached.kodik = kodik;
  if (shikimori) cached.shikimori = shikimori;
  cache = cache.filter(([id]) => id !== animeId);
  cache.push([animeId, cached]);
  if (cache.length > 25) cache = cache.slice(-25);
  await AsyncStorage.setItem(ANIME_CACHE_KEY, JSON.stringify(cache));
}

export default function AnimeDetailsScreen() {
  const { colors } = useThemeStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const animeId = parseInt(id as string);

  const [anime, setAnime] = useState<ShikimoriInfo | null>(null);
  const [kodik, setKodik] = useState<any[]>([]);
  const [kodikTranslations, setKodikTranslations] = useState<any[]>([]);
  const [kodikScreenshots, setKodikScreenshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTranslationsVisible, setTranslationsVisible] = useState(false);
  const [animeDescription, setAnimeDescription] = useState<string | null>(null);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [isTitleExpanded, setTitleExpanded] = useState(false);
  const [showCached, setShowCached] = useState(false);
  const animationHeight = useRef(new Animated.Value(0)).current;
  const animationInProgress = useRef(false);

  const { isFavorite, addToFavorites, removeFromFavorites, addToWatchHistory } = useAnimeStore();
  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (anime) setFavorite(isFavorite(anime.id));
  }, [anime, isFavorite]);

  const loadFromCache = useCallback(async () => {
    const cached = await getFromCache(animeId);
    if (cached) {
      if (cached.shikimori) setAnime(cached.shikimori);
      if (Array.isArray(cached.kodik)) {
        setKodik(cached.kodik);
        setKodikTranslations(cached.kodik);
        let kodikDescription = "";
        let screenshots: string[] = [];
        if (cached.kodik.length > 0 && cached.kodik[0].material_data) {
          kodikDescription = cached.kodik[0].material_data.description || DESCRIPTION_PLACEHOLDER;
          screenshots = cached.kodik[0].material_data.screenshots || [];
        }
        setKodikScreenshots(screenshots);
        setAnimeDescription(kodikDescription);
      }
      setShowCached(true);
      setLoading(false);
      return cached;
    }
    return {};
  }, [animeId]);

  // Функция с повторными попытками
  async function fetchWithRetry(fetchFn: () => Promise<any>, maxAttempts = 10, delayMs = 2000) {
    let attempt = 0;
    while (attempt < maxAttempts) {
      try {
        const result = await fetchFn();
        return result;
      } catch {
        attempt++;
        await new Promise(res => setTimeout(res, delayMs));
      }
    }
    return null;
  }

  const loadFromNetwork = useCallback(async (cached: { kodik?: any; shikimori?: ShikimoriInfo }) => {
    setLoading(true);
    setError(null);

    let animeDetails = cached?.shikimori || null;
    let kodikResults = Array.isArray(cached?.kodik) ? cached.kodik : null;

    if (!animeDetails) {
      animeDetails = await fetchWithRetry(() => fetchAnimeDetails(animeId));
      if (animeDetails) {
        setAnime(animeDetails);
        await setToCache(animeId, undefined, animeDetails);
      }
    } else {
      setAnime(animeDetails);
    }

    if (!kodikResults) {
      kodikResults = await fetchWithRetry(() => searchKodikByShikimoriId(animeId, true));
      if (kodikResults) {
        setKodik(kodikResults);
        setKodikTranslations(kodikResults);
        let kodikDescription = "";
        let screenshots: string[] = [];
        if (kodikResults.length > 0 && kodikResults[0].material_data) {
          kodikDescription = kodikResults[0].material_data.description || DESCRIPTION_PLACEHOLDER;
          screenshots = kodikResults[0].material_data.screenshots || [];
        }
        setKodikScreenshots(screenshots);
        setAnimeDescription(kodikDescription);
        await setToCache(animeId, kodikResults, undefined);
      }
    } else {
      setKodik(kodikResults);
      setKodikTranslations(kodikResults);
      let kodikDescription = "";
      let screenshots: string[] = [];
      if (kodikResults.length > 0 && kodikResults[0].material_data) {
        kodikDescription = kodikResults[0].material_data.description || DESCRIPTION_PLACEHOLDER;
        screenshots = kodikResults[0].material_data.screenshots || [];
      }
      setKodikScreenshots(screenshots);
      setAnimeDescription(kodikDescription);
    }

    if (!animeDetails && !kodikResults) {
      setError('Ошибка при загрузке информации об аниме');
    }
    setLoading(false);
  }, [animeId]);

  useEffect(() => {
    if (!animeId || isNaN(animeId)) {
      setError('Неверный ID аниме');
      setLoading(false);
      return;
    }
    loadFromCache().then((cached) => {
      loadFromNetwork(cached);
    });
  }, [animeId]);

  const imageUrl = anime?.poster?.mainUrl || MISSING_POSTER_URL;

  const handleWatchPress = (link: string) => {
    if (anime) addToWatchHistory(animeId, anime.russian || anime.name, imageUrl);
    router.push({
      pathname: '/player/[id]',
      params: { id: animeId.toString(), kodikUrl: link },
    });
  };

  const handlePlayWithoutSelection = () => {
    if (kodikTranslations.length > 0) handleWatchPress(kodikTranslations[0].link);
  };

  const getTargetHeight = () => Array.isArray(kodikTranslations) ? kodikTranslations.length * (styles.episodeButton.height + 8) : 0;

  const toggleTranslationsVisibility = () => {
    if (animationInProgress.current) {
      animationHeight.stopAnimation(() => doToggle());
    } else {
      doToggle();
    }
  };

  const calculateAnimationDuration = () => {
    const itemsCount = kodikTranslations.length;
    const baseDuration = 100;
    const maxDuration = 750;
    const scaleFactor = 0.15;
    const duration = baseDuration + (maxDuration - baseDuration) * (1 - Math.exp(-scaleFactor * itemsCount));
    return Math.min(duration, maxDuration);
  };

  const doToggle = () => {
    animationInProgress.current = true;
    if (isTranslationsVisible) {
      Animated.timing(animationHeight, {
        toValue: 0,
        duration: calculateAnimationDuration(),
        useNativeDriver: false,
      }).start(() => {
        setTranslationsVisible(false);
        animationInProgress.current = false;
      });
    } else {
      setTranslationsVisible(true);
      Animated.timing(animationHeight, {
        toValue: getTargetHeight(),
        duration: calculateAnimationDuration(),
        useNativeDriver: false,
      }).start(() => {
        animationInProgress.current = false;
      });
    }
  };

  useEffect(() => {
    if (isTranslationsVisible) {
      Animated.timing(animationHeight, {
        toValue: getTargetHeight(),
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [kodikTranslations.length]);

  if (loading && !showCached) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Загрузка информации...</Text>
      </View>
    );
  }

  if (error || !anime) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={styles.errorText}>{error || 'Ошибка загрузки'}</Text>
      </View>
    );
  }

  function toggleFavorite() {
    if (!anime) return;
    if (favorite) {
      removeFromFavorites(anime.id);
    } else {
      addToFavorites(anime);
    }
    setFavorite(!favorite);
  }

  const toggleTitleExpansion = () => {
    setTitleExpanded(!isTitleExpanded);
  };

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.card }]}>
        {kodikScreenshots.length > 0 ? (
          <>
            <FlatList
              data={kodikScreenshots}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${item}-${index}`}
              onScroll={event => {
                const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                setCurrentScreenshotIndex(index);
              }}
              renderItem={({ item }) => (
                <Image
                  source={{ uri: item }}
                  style={[styles.screenshot, { width: screenWidth }]}
                  resizeMode="cover"
                />
              )}
            />
            <View style={styles.overlayIndicatorContainer}>
              {kodikScreenshots.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    currentScreenshotIndex === index
                      ? styles.activeIndicator
                      : styles.inactiveIndicator,
                  ]}
                />
              ))}
            </View>
          </>
        ) : (
          <Image
            source={{ uri: imageUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
        )}
      </View>

      <View style={styles.titleContainer}>
        <Pressable onPress={toggleTitleExpansion}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={isTitleExpanded ? undefined : 2}
            ellipsizeMode="tail"
          >
            {anime?.russian || anime?.name || 'Название отсутствует'}
          </Text>
        </Pressable>
        <Text style={[styles.originalTitle, { color: colors.subtext }]}>
          {anime?.name || 'Оригинальное название отсутствует'}
        </Text>
      </View>

      {/* Плашка с информацией */}
      <View style={[styles.infoBadge, { backgroundColor: colors.card }]}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="tag" size={16} color={colors.text} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {anime.kind.toUpperCase() || 'N/A'}
          </Text>
        </View>

        {canShowSeries(anime) && (
          <View style={styles.infoItem}>
            <FontAwesome name="video-camera" size={16} color={colors.text} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {`${kodik[0].material_data.episodes_aired || '?'}/${kodik[0].material_data.episodes_total || '?'}`}
            </Text>
          </View>
        )}

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.text} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {anime?.airedOn?.date.toString() || 'N/A'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome name="star" size={16} color={colors.text} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {anime?.score || 'N/A'}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <View style={styles.folderButtonContainer}>
          <Pressable style={[styles.smallButton, { backgroundColor: colors.card }]} onPress={toggleFavorite}>
            <FontAwesome
              name="heart"
              size={16}
              color={favorite ? colors.secondary : colors.text}
            />
          </Pressable>
          <Pressable
            style={[
              styles.folderButton,
              kodikTranslations.length !== 0
                ? { backgroundColor: colors.card }
                : { backgroundColor: colors.disabled },
            ]}
            onPress={toggleTranslationsVisibility}
            disabled={!kodikTranslations.length}
          >
            {kodikTranslations.length ? (
              <MaterialCommunityIcons
                name={isTranslationsVisible ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.text}
              />
            ) : null}
            <Text style={[styles.folderText, { color: colors.text }]}>
              {kodikTranslations.length ? 'Озвучки' : 'Нет доступных озвучек'}
            </Text>
          </Pressable>
          {kodikTranslations.length > 0 && (
            <Pressable
              style={({ pressed }) => [
                styles.smallButton,
                { backgroundColor: colors.primary },
                pressed && { opacity: 0.7 },
              ]}
              onPress={handlePlayWithoutSelection}
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
          {kodikTranslations.map((episode: any, index: number) => (
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

      {animeDescription && (
        <View style={styles.descriptionContainer}>
          <Text style={[styles.descriptionTitle, { color: colors.text }]}>Описание:</Text>
          <Text style={[styles.descriptionText, { color: colors.subtext }]}>{animeDescription}</Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    position: 'relative',
    height: 300,
  },
  poster: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  screenshot: {
    height: 300,
  },
  screenshotContainer: {
    position: 'relative',
  },
  overlayIndicatorContainer: {
    position: 'absolute',
    bottom: 16,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    zIndex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  titleContainer: {
    flexDirection: 'column',
    padding: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  originalTitle: {
    fontSize: 14,
  },
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
  descriptionContainer: {
    paddingHorizontal: 16,
    marginBottom: 35,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
  },
  indicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeIndicator: {
    backgroundColor: theme.default.primary,
  },
  inactiveIndicator: {
    backgroundColor: theme.default.subtext,
  },
  expandButton: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 4,
  },
  infoBadge: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 24, // Совпадает с боковыми отступами кнопок
    marginBottom: 4, // Уменьшен для равенства с верхним отступом
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
});