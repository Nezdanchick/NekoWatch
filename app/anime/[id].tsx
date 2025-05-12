import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, ActivityIndicator, Animated, StatusBar } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { fetchAnimeDetails } from '@/services/shikimori-api';
import { searchKodikByShikimoriId } from '@/services/kodik-api';
import { AnimeDetailed } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { useThemeStore } from '@/store/theme-store';
import { theme } from '@/constants/theme';

export default function AnimeDetailsScreen() {
  const { colors } = useThemeStore();
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const animeId = parseInt(id as string);

  const [anime, setAnime] = useState<AnimeDetailed | null>(null);
  const [kodikTranslations, setKodikTranslations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isTranslationsVisible, setTranslationsVisible] = useState(false);
  const animationHeight = useRef(new Animated.Value(0)).current;

  const { isFavorite, addToFavorites, removeFromFavorites, addToWatchHistory } = useAnimeStore();
  const favorite = isFavorite(animeId);

  useEffect(() => {
    const loadAnimeDetails = async () => {
      if (!animeId || isNaN(animeId)) {
        setError('Неверный ID аниме');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const animeDetails = await fetchAnimeDetails(animeId);
        if (!animeDetails) {
          throw new Error('Не удалось загрузить информацию об аниме');
        }
        setAnime(animeDetails);

        const kodikResults = await searchKodikByShikimoriId(animeDetails.id);
        setKodikTranslations(kodikResults);
      } catch (err) {
        console.error('Ошибка при загрузке информации об аниме:', err);
        setError('Ошибка при загрузке информации об аниме');
      } finally {
        setLoading(false);
      }
    };

    loadAnimeDetails();
  }, [animeId]);

  const imageUrl = anime && anime.image && anime.image.original
    ? `https://shikimori.one${anime.image.original}`
    : 'https://via.placeholder.com/300x450/1E1E1E/FFFFFF?text=No+Image';

  const handleWatchPress = (link: string) => {
    if (anime) {
      addToWatchHistory(animeId, anime.russian || anime.name, imageUrl);
    }
    router.push({
      pathname: '/player/[id]',
      params: {
        id: animeId.toString(),
        kodikUrl: link,
      },
    });
  };

  const handlePlayWithoutSelection = () => {
    if (kodikTranslations.length > 0) {
      const firstEpisode = kodikTranslations[0];
      handleWatchPress(firstEpisode.link);
    } else {
      console.warn('Нет доступных эпизодов для воспроизведения');
    }
  };

  let translationAnimation: Animated.CompositeAnimation;

  const toggleTranslationsVisibility = () => {
    if (isTranslationsVisible) {
      translationAnimation?.reset();
      setTranslationsVisible(true);
      translationAnimation = Animated.timing(animationHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      });
      translationAnimation.start(() => {
        setTranslationsVisible(false);
      });
    } else {
      translationAnimation?.reset();
      setTranslationsVisible(true);
      translationAnimation = Animated.timing(animationHeight, {
        toValue: kodikTranslations.length * (styles.episodeButton.height + styles.episodeButton.padding),
        duration: 300,
        useNativeDriver: false,
      });
      translationAnimation.start();
    }
  };

  const cleanDescription = (description: string): string => {
    return description
      .replace(/\[\[(.*?)\]\]/g, '$1')
      .replace(/\[(.*?)\]/g, '$1')
      .replace(/anime=\d+([^/]+)\/anime/gi, '$1')
      .replace(/character=\d+([^/]+)\/character/gi, '$1')
      .replace(/url=https?:\/\/ru\.wikipedia\.org\/wiki\/([^/]+)\/url/gi, '$1')
      .replace(/<\/?[^>]+(>|$)/g, '')
      .replace(/\s{2,}/g, ' ')
      .trim();
  };

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

  function toggleFavorite(): void {
    if (favorite) {
      removeFromFavorites(animeId);
    } else {
      addToFavorites(animeId);
    }
  }

  return (
    <>
      <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { backgroundColor: colors.card }]}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
        </View>

        <View style={styles.titleContainer}>
          <Text style={styles.title}>{anime?.russian || anime?.name || 'Название отсутствует'}</Text>
          <Text style={styles.originalTitle}>{anime?.name || 'Оригинальное название отсутствует'}</Text>
        </View>

        <View style={[styles.actions, { borderBottomColor: colors.border }]}>
          <View style={styles.folderButtonContainer}>
            {/* Кнопка "Избранное" */}
            <Pressable style={[styles.smallButton, { backgroundColor: colors.card }]} onPress={toggleFavorite}>
              <FontAwesome
                name="heart"
                size={16}
                color={favorite ? colors.secondary : colors.text || '#FFFFFF'}
              />
            </Pressable>

            {/* Кнопка "Озвучки" */}
            <Pressable
              style={[
                styles.folderButton,
                kodikTranslations.length !== 0 ?
                  { backgroundColor: colors.card } :  // Активная кнопка
                  { backgroundColor: colors.disabled },   // Неактивная кнопка
              ]}
              onPress={toggleTranslationsVisibility}
              disabled={!kodikTranslations.length} // Делаем кнопку неактивной, если нет озвучек
            >
              {!kodikTranslations.length ? null : ( // Убираем стрелку, если нет озвучек
                <MaterialCommunityIcons
                  name={isTranslationsVisible ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={colors.text || '#FFFFFF'}
                />
              )}
              <Text style={[styles.folderText, { color: colors.text }]}>
                {kodikTranslations.length ? 'Озвучки' : 'Нет доступных озвучек'}
              </Text>
            </Pressable>

            {/* Кнопка "Смотреть без озвучки" */}
            {kodikTranslations.length > 0 && ( // Условный рендеринг для скрытия кнопки
              <Pressable
                style={({ pressed }) => [
                  styles.smallButton, { backgroundColor: colors.primary },
                  pressed && { opacity: 0.7 }, // Добавляем эффект нажатия
                ]}
                onPress={handlePlayWithoutSelection}
              >
                <MaterialCommunityIcons
                  name="play"
                  size={20}
                  color={colors.text || '#FFFFFF'}
                />
              </Pressable>
            )}
          </View>
          <Animated.View
            style={[
              styles.animatedContainer,
              {
                height: animationHeight,
                marginTop: 16, // Отступ сверху
                paddingHorizontal: 8, // Горизонтальные отступы для выравнивания с кнопками
              },
            ]}
          >
            {isTranslationsVisible &&
              kodikTranslations?.length > 0 &&
              kodikTranslations.map((episode: any, index: number) => (
                <Pressable
                  key={episode?.id || index} // Используем index как резервный ключ
                  style={[styles.episodeButton, { backgroundColor: colors.card }]}
                  onPress={() => handleWatchPress(episode?.link || '')} // Проверяем наличие ссылки
                >
                  <Text style={[styles.episodeText, { color: colors.text }]}>
                    {episode?.translation?.title || 'Без названия'}
                  </Text>
                </Pressable>
              ))}
          </Animated.View>
        </View>

        {anime.description && (
          <View style={styles.descriptionContainer}>
            <Text style={[styles.descriptionTitle, { color: colors.text }]}>Описание:</Text>
            <Text style={[styles.descriptionText, { color: colors.subtext }]}>{cleanDescription(anime.description)}</Text>
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
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 4,
    color: theme.default.text,
  },
  originalTitle: {
    fontSize: 14,
    color: theme.default.primary,
  },
  actions: {
    flexDirection: 'column',
    padding: 16,
    borderBottomWidth: 1,
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
    marginTop: 16,
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
});