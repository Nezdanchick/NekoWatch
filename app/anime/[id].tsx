import React, { useState, useEffect, useCallback, useRef} from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, ActivityIndicator, FlatList, useWindowDimensions, StatusBar, Animated} from 'react-native';
import { Stack, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { fetchAnimeDetails, fetchRelatedAnime } from '@/services/shikimori-api';
import { searchKodikByShikimoriId } from '@/services/kodik-api';
import { canShow, ShikimoriInfo, KodikInfo, MISSING_POSTER_URL, KIND_PRIORITY, canShowSeries} from '@/types/anime';
import { useThemeStore } from '@/store/theme-store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AnimeButtons from '@/components/anime/AnimeButtons';
import AnimeCard from '@/components/AnimeCard';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';

const DESCRIPTION_PLACEHOLDER = "Описание отсутствует.";
const ANIME_CACHE_KEY = 'kodikCache';

function normalizeScreenshotUrl(url: string): string {
  return url.replace(/https?:\/\/(nyaa|dere)\.shikimori\.one/g, 'https://shikimori.one');
}

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
  const [isScrolling, setIsScrolling] = useState(false);

  const { width: screenWidth } = useWindowDimensions();
  const screenshotsRef = useRef<FlatList>(null);
  const mainScrollRef = useRef<ScrollView>(null);
  const scrollX = useRef(new Animated.Value(0)).current;

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
          screenshots = (cached.kodik[0].material_data?.screenshots || []).map(normalizeScreenshotUrl);
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
          screenshots = (kodikResults[0].material_data?.screenshots || []).map(normalizeScreenshotUrl);
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
        screenshots = (kodikResults[0].material_data?.screenshots || []).map(normalizeScreenshotUrl);
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
        <Text style={[styles.loadingText, { color: colors.text }]}>Загрузка...</Text>
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

  return (
    <>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />
      <ScrollView
        ref={mainScrollRef}
        style={[styles.container, { backgroundColor: colors.background }]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!isScrolling}
      >
        <View style={styles.headerContainer}>
          {kodikScreenshots.length > 0 ? (
            <FlatList
              ref={screenshotsRef}
              data={kodikScreenshots}
              horizontal
              pagingEnabled
              snapToInterval={screenWidth}
              snapToAlignment="start"
              decelerationRate="fast"
              disableIntervalMomentum={true}
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => `${item}-${index}`}
              onScrollBeginDrag={() => setIsScrolling(true)}
              onMomentumScrollBegin={() => setIsScrolling(true)}
              onMomentumScrollEnd={(event) => {
                const offsetX = event.nativeEvent.contentOffset.x;
                const index = Math.round(offsetX / screenWidth);
                const targetOffset = index * screenWidth;
                
                if (Math.abs(offsetX - targetOffset) > 1) {
                  screenshotsRef.current?.scrollToOffset({
                    offset: targetOffset,
                    animated: true,
                  });
                }
                setCurrentScreenshotIndex(index);
                setTimeout(() => setIsScrolling(false), 300);
              }}
              onScrollEndDrag={() => {
                setTimeout(() => setIsScrolling(false), 300);
              }}
              onScroll={Animated.event(
                [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                {
                  useNativeDriver: false,
                  listener: (event: any) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / screenWidth);
                    setCurrentScreenshotIndex(index);
                  },
                }
              )}
              renderItem={({ item }) => (
                <View style={{ width: screenWidth, height: 400 }}>
                  <Image
                    source={{ uri: item }}
                    style={{ width: '100%', height: '100%' }}
                    resizeMode="cover"
                  />
                  <LinearGradient
                    colors={['transparent', colors.background]}
                    style={StyleSheet.absoluteFillObject}
                    start={{ x: 0, y: 0.5 }}
                    end={{ x: 0, y: 1 }}
                  />
                </View>
              )}
              initialScrollIndex={0}
              getItemLayout={(data, index) => ({
                length: screenWidth,
                offset: screenWidth * index,
                index,
              })}
            />
          ) : (
            <View style={{ width: screenWidth, height: 400 }}>
              <Image
                source={{ uri: imageUrl }}
                style={{ width: '100%', height: '100%' }}
                resizeMode="cover"
              />
              <LinearGradient
                colors={['transparent', colors.background]}
                style={StyleSheet.absoluteFillObject}
                start={{ x: 0, y: 0.5 }}
                end={{ x: 0, y: 1 }}
              />
            </View>
          )}

          {kodikScreenshots.length > 1 && (
            <View style={styles.indicatorContainer}>
              {kodikScreenshots.map((_, index) => {
                const inputRange = [
                  (index - 1) * screenWidth,
                  index * screenWidth,
                  (index + 1) * screenWidth,
                ];

                const width = scrollX.interpolate({
                  inputRange,
                  outputRange: [8, 24, 8],
                  extrapolate: 'clamp',
                });

                const opacity = scrollX.interpolate({
                  inputRange,
                  outputRange: [0.5, 1, 0.5],
                  extrapolate: 'clamp',
                });

                return (
                  <Animated.View
                    key={index}
                    style={[
                      styles.indicator,
                      {
                        width,
                        opacity,
                        backgroundColor: currentScreenshotIndex === index
                          ? colors.primary
                          : 'rgba(255,255,255,0.5)',
                      },
                    ]}
                  />
                );
              })}
            </View>
          )}

          <Pressable style={styles.backButton} onPress={() => router.back()}>
            <View style={styles.iconBackdrop}>
              <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
            </View>
          </Pressable>
        </View>

        <View style={styles.contentContainer}>
          <View style={styles.titleSection}>
            <Pressable onPress={() => setTitleExpanded(!isTitleExpanded)}>
              <Text
                style={[styles.title, { color: colors.text }]}
                numberOfLines={isTitleExpanded ? undefined : 2}
              >
                {shikimori?.russian || shikimori?.name || 'Название отсутствует'}
              </Text>
            </Pressable>
            <Text style={[styles.originalTitle, { color: colors.subtext }]}>
              {shikimori?.name || ''}
            </Text>

            <View style={styles.metaInfo}>
              <View style={[styles.badget, { backgroundColor: colors.card }]}>
                <MaterialCommunityIcons name="star" size={14} color="#FFD700" style={{ marginRight: 4 }} />
                <Text style={[styles.badgetText, { color: colors.text }]}>{shikimori.score.toFixed(1).toString()}</Text>
              </View>
              <View style={[styles.badget, { backgroundColor: colors.card }]}>
                <Text style={[styles.badgetText, { color: colors.text }]}>{shikimori.kind.toUpperCase()}</Text>
              </View>
              <View style={[styles.badget, { backgroundColor: colors.card }]}>
                <Text style={[styles.badgetText, { color: colors.text }]}>{shikimori.airedOn?.date || ''}</Text>
              </View>
              {canShowSeries(shikimori) && kodik[0]?.material_data && (
                <View style={[styles.badget, { backgroundColor: colors.card }]}>
                  <Text style={[styles.badgetText, { color: colors.text }]}>
                    {`${kodik[0].material_data.episodes_aired || '?'}/${kodik[0].material_data.episodes_total || '?'}`}
                  </Text>
                </View>
              )}
            </View>
          </View>

          <AnimeButtons shikimori={shikimori} kodik={kodik} />

          {animeDescription && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionHeader, { color: colors.text }]}>Описание</Text>
              <Text style={[styles.descriptionText, { color: colors.subtext }]}>
                {animeDescription}
              </Text>
            </View>
          )}

          {relatedAnime.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.card }]}>
              <Text style={[styles.sectionHeader, { color: colors.text, marginBottom: 16, marginLeft: 4 }]}>Связанное</Text>
              <FlatList
                data={relatedAnime.filter(anime => canShow(anime))
                  .sort((a, b) => (KIND_PRIORITY[a.kind] ?? 99) - (KIND_PRIORITY[b.kind] ?? 99))}
                renderItem={({ item }) => <AnimeCard anime={item} size="medium" />}
                keyExtractor={(item) => item.id.toString()}
                horizontal
                showsHorizontalScrollIndicator={false}
              />
            </View>
          )}

          <View style={{ height: 80 }} />
        </View>
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
  },
  headerContainer: {
    height: 400,
    width: '100%',
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    zIndex: 10,
  },
  iconBackdrop: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 20,
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicatorContainer: {
    position: 'absolute',
    bottom: 24,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    height: 6,
    borderRadius: 3,
    marginHorizontal: 3,
  },
  contentContainer: {
    flex: 1,
    marginTop: -40,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 24,
  },
  titleSection: {
    paddingHorizontal: 20,
    marginBottom: 0,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    lineHeight: 34,
  },
  originalTitle: {
    fontSize: 16,
    marginBottom: 16,
    opacity: 0.7,
  },
  metaInfo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 20,
  },
  badget: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgetText: {
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginTop: 16,
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 16,
  },
  sectionHeader: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 24,
    letterSpacing: 0.2,
  },
});