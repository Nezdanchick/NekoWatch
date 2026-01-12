import React, { useState, useEffect, useCallback, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, ActivityIndicator, FlatList, useWindowDimensions } from 'react-native';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { fetchAnimeDetails, fetchRelatedAnime } from '@/services/shikimori-api';
import { searchKodikByShikimoriId } from '@/services/kodik-api';
import { canShow, ShikimoriInfo, KodikInfo, MISSING_POSTER_URL, KIND_PRIORITY } from '@/types/anime';
import { useThemeStore } from '@/store/theme-store';
import { theme } from '@/constants/theme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimeInfo from '@/components/anime/AnimeInfo';
import AnimeButtons from '@/components/anime/AnimeButtons';
import AnimeCard from '@/components/AnimeCard';

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

async function setToCache(animeId: number, kodik?: KodikInfo[], shikimori?: ShikimoriInfo) {
  const cacheStr = await AsyncStorage.getItem(ANIME_CACHE_KEY);
  let cache: [number, { kodik?: KodikInfo[]; shikimori?: ShikimoriInfo }][] = cacheStr ? JSON.parse(cacheStr) : [];
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
  const animeId = parseInt(id as string);

  const [shikimori, setShikimori] = useState<ShikimoriInfo | null>(null);
  const [kodik, setKodik] = useState<KodikInfo[]>([]);
  const [relatedAnime, setRelatedAnime] = useState<ShikimoriInfo[]>([]);
  const [kodikScreenshots, setKodikScreenshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [animeDescription, setAnimeDescription] = useState<string | null>(null);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const [isTitleExpanded, setTitleExpanded] = useState(false);
  const [showCached, setShowCached] = useState(false);

  const { width: screenWidth } = useWindowDimensions();
  const screenshotsRef = useRef<FlatList>(null);

  useFocusEffect(
    useCallback(() => {
      setCurrentScreenshotIndex(0);

      const timeout = setTimeout(() => {
        if (screenshotsRef.current && kodikScreenshots.length > 0) {
          screenshotsRef.current.scrollToOffset({ offset: 0, animated: false });
        }
      }, 100);

      return () => clearTimeout(timeout);
    }, [kodikScreenshots.length, screenWidth])
  );

  const loadFromCache = useCallback(async () => {
    const cached = await getFromCache(animeId);
    if (cached) {
      if (cached.shikimori) setShikimori(cached.shikimori);
      if (Array.isArray(cached.kodik)) {
        setKodik(cached.kodik);
        let kodikDescription = "";
        let screenshots: string[] = [];
        if (cached.kodik.length > 0 && cached.kodik[0].material_data) {
          kodikDescription = cached.kodik[0].material_data?.description || DESCRIPTION_PLACEHOLDER;
          screenshots = cached.kodik[0].material_data?.screenshots || [];
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

  const loadFromNetwork = useCallback(async (cached: { kodik?: KodikInfo[]; shikimori?: ShikimoriInfo }) => {
    setLoading(true);
    setError(null);
    setRelatedAnime([]);

    let shikimoriResults = cached?.shikimori || null;
    let kodikResults = cached?.kodik || null;

    if (!shikimoriResults) {
      shikimoriResults = await fetchWithRetry(() => fetchAnimeDetails(animeId));
      if (shikimoriResults) {
        setShikimori(shikimoriResults);
        await setToCache(animeId, undefined, shikimoriResults);
      }
    } else {
      setShikimori(shikimoriResults);
    }

    fetchRelatedAnime(animeId)
      .then(setRelatedAnime)
      .catch(err => console.error("Error fetching related anime:", err));

    if (!kodikResults) {
      kodikResults = await fetchWithRetry(() => searchKodikByShikimoriId(animeId, true));
      if (kodikResults) {
        setKodik(kodikResults);
        let kodikDescription = "";
        let screenshots: string[] = [];
        if (kodikResults.length > 0 && kodikResults[0].material_data) {
          kodikDescription = kodikResults[0].material_data?.description || DESCRIPTION_PLACEHOLDER;
          screenshots = kodikResults[0].material_data?.screenshots || [];
        }
        setKodikScreenshots(screenshots);
        setAnimeDescription(kodikDescription);
        await setToCache(animeId, kodikResults, undefined);
      }
    } else {
      setKodik(kodikResults);
      let kodikDescription = "";
      let screenshots: string[] = [];
      if (kodikResults.length > 0 && kodikResults[0].material_data) {
        kodikDescription = kodikResults[0].material_data?.description || DESCRIPTION_PLACEHOLDER;
        screenshots = kodikResults[0].material_data?.screenshots || [];
      }
      setKodikScreenshots(screenshots);
      setAnimeDescription(kodikDescription);
    }

    if (!shikimoriResults && !kodikResults) {
      setError('Ошибка при загрузке информации об аниме');
      setLoading(false);
      return;
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

  const imageUrl = shikimori?.poster?.mainUrl || MISSING_POSTER_URL;

  if (loading && !showCached) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.text }]}>Загрузка информации...</Text>
      </View>
    );
  }

  if (error || !shikimori) {
    return (
      <View style={[styles.errorContainer, { backgroundColor: colors.background }]}>
        <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Ошибка загрузки'}</Text>
      </View>
    );
  }

  const toggleTitleExpansion = () => {
    setTitleExpanded(!isTitleExpanded);
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Информация об аниме',
        }}
      />
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          {kodikScreenshots.length > 0 ? (
            <>
              <FlatList
                ref={screenshotsRef}
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
                initialScrollIndex={0}
                getItemLayout={(data, index) => ({
                  length: screenWidth,
                  offset: screenWidth * index,
                  index,
                })}
                extraData={screenWidth}
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
              {shikimori?.russian || shikimori?.name || 'Название отсутствует'}
            </Text>
          </Pressable>
          <Text style={[styles.originalTitle, { color: colors.subtext }]}>
            {shikimori?.name || 'Оригинальное название отсутствует'}
          </Text>
        </View>

        <AnimeInfo shikimori={shikimori} kodik={kodik[0]} />

        <AnimeButtons shikimori={shikimori} kodik={kodik} />

        {animeDescription && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: colors.text }]}>Описание:</Text>
            <Text style={[styles.descriptionText, { color: colors.subtext }]}>{animeDescription}</Text>
          </View>
        )}

        {relatedAnime.length > 0 && (
          <View style={styles.relatedContainer}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Связанное</Text>
            <FlatList
              data={relatedAnime.filter(anime => canShow(anime))
                .sort((a: ShikimoriInfo, b: ShikimoriInfo) => a.airedOn.date?.localeCompare(b.airedOn.date))
                .sort((a: ShikimoriInfo, b: ShikimoriInfo) => {
                  const priorityA = KIND_PRIORITY[a.kind] ?? Number.MAX_SAFE_INTEGER;
                  const priorityB = KIND_PRIORITY[b.kind] ?? Number.MAX_SAFE_INTEGER;
                  return priorityA - priorityB;
                })}
              renderItem={({ item }) => <AnimeCard anime={item} size="medium" />}
              keyExtractor={(item) => item.id.toString()}
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.relatedList}
            />
          </View>
        )}
      </ScrollView>
    </>
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
  descriptionContainer: {
    paddingHorizontal: 16,
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
  relatedContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    padding: 16,
  },
  relatedList: {
    paddingLeft: 16,
    paddingRight: 16,
  },
});