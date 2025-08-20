import React, { useState, useEffect, useRef, useCallback } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, ActivityIndicator, Animated, FlatList, Dimensions } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAnimeDetails } from '@/services/shikimori-api';
import { searchKodikByShikimoriId } from '@/services/kodik-api';
import { AnimeInfo, MISSING_POSTER_URL } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { useThemeStore } from '@/store/theme-store';
import { theme } from '@/constants/theme';

const DESCRIPTION_PLACEHOLDER = "Кажется, здесь ничего нет (￣▽￣*)";

export default function AnimeDetailsScreen() {
  const { colors } = useThemeStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const animeId = parseInt(id as string);

  const [anime, setAnime] = useState<AnimeInfo | null>(null);
  const [kodikTranslations, setKodikTranslations] = useState<any[]>([]);
  const [kodikScreenshots, setKodikScreenshots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTranslationsVisible, setTranslationsVisible] = useState(false);
  const [animeDescription, setAnimeDescription] = useState<string | null>(null);
  const [currentScreenshotIndex, setCurrentScreenshotIndex] = useState(0);
  const [favorite, setFavorite] = useState(false);
  const [isTitleExpanded, setTitleExpanded] = useState(false); // Переместите сюда
  const animationHeight = useRef(new Animated.Value(0)).current;
  const animationInProgress = useRef(false);

  const { isFavorite, addToFavorites, removeFromFavorites, addToWatchHistory } = useAnimeStore();

  const screenWidth = Dimensions.get('window').width;

  useEffect(() => {
    if (anime) setFavorite(isFavorite(anime.id));
  }, [anime, isFavorite]);

  const loadAnimeDetails = useCallback(async () => {
    if (!animeId || isNaN(animeId)) {
      setError('Неверный ID аниме');
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [animeDetails, kodikResults] = await Promise.all([
        fetchAnimeDetails(animeId),
        searchKodikByShikimoriId(animeId, true),
      ]);
      if (!animeDetails) throw new Error('Не удалось загрузить информацию об аниме');
      let kodikDescription = "";
      let screenshots: string[] = [];
      if (kodikResults.length > 0 && kodikResults[0].material_data) {
        kodikDescription = kodikResults[0].material_data.description || DESCRIPTION_PLACEHOLDER;
        screenshots = kodikResults[0].material_data.screenshots || [];
      }
      setAnime(animeDetails);
      setAnimeDescription(kodikDescription);
      setKodikTranslations(kodikResults);
      setKodikScreenshots(screenshots);
    } catch {
      setError('Ошибка при загрузке информации об аниме');
    } finally {
      setLoading(false);
    }
  }, [animeId]);

  useEffect(() => {
    loadAnimeDetails();
  }, [loadAnimeDetails]);

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

  const getTargetHeight = () => kodikTranslations.length * (styles.episodeButton.height + 8);

  const toggleTranslationsVisibility = () => {
    if (animationInProgress.current) {
      animationHeight.stopAnimation(() => {
        doToggle();
      });
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

  if (loading) {
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
        <Text style={[styles.errorText, { color: colors.text }]}>{error || 'Аниме не найдено'}</Text>
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
            numberOfLines={isTitleExpanded ? undefined : 2} // Показывает одну строку или весь текст
            ellipsizeMode="tail" // Добавляет многоточие, если текст обрезан
          >
            {anime?.russian || anime?.name || 'Название отсутствует'}
          </Text>
        </Pressable>
        <Text style={[styles.originalTitle, { color: colors.subtext }]}>
          {anime?.name || 'Оригинальное название отсутствует'}
        </Text>
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
});