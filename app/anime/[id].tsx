import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, ScrollView, Image, Pressable, ActivityIndicator, Animated } from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { fetchAnimeDetails } from '@/services/shikimori-api';
import { searchKodikByShikimoriId } from '@/services/kodik-api';
import { AnimeDetailed } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import Colors from '@/constants/colors';

export default function AnimeDetailsScreen() {
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

  const toggleTranslationsVisibility = () => {
    if (isTranslationsVisible) {
      Animated.timing(animationHeight, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => setTranslationsVisible(false));
    } else {
      setTranslationsVisible(true);
      Animated.timing(animationHeight, {
        toValue: kodikTranslations.length * (styles.episodeButton.height + styles.episodeButton.padding),
        duration: 300,
        useNativeDriver: false,
      }).start();
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
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={Colors.dark.primary} />
        <Text style={styles.loadingText}>Загрузка информации...</Text>
      </View>
    );
  }

  if (error || !anime) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>{error || 'Аниме не найдено'}</Text>
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
      <Stack.Screen
        options={{
          title: anime.russian || anime.name || 'Информация об аниме',
        }}
      />
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <Image
            source={{ uri: imageUrl }}
            style={styles.poster}
            resizeMode="cover"
          />
          <View style={styles.overlay} />
          <View style={styles.titleContainer}>
            <Text style={styles.title}>{anime?.russian || anime?.name || 'Название отсутствует'}</Text>
            <Text style={styles.originalTitle}>{anime?.name || 'Оригинальное название отсутствует'}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <View style={styles.folderButtonContainer}>
            {/* Кнопка "Избранное" */}
            <Pressable style={styles.smallButton} onPress={toggleFavorite}>
              <FontAwesome
                name="heart"
                size={16}
                color={favorite ? Colors?.dark?.secondary : Colors?.dark?.text || '#FFFFFF'}
              />
            </Pressable>

            {/* Кнопка "Озвучки" */}
            <Pressable
              style={[
                styles.folderButton,
                !kodikTranslations.length && styles.disabledButton, // Добавляем стиль для неактивной кнопки
              ]}
              onPress={toggleTranslationsVisibility}
              disabled={!kodikTranslations.length} // Делаем кнопку неактивной, если нет озвучек
            >
              {!kodikTranslations.length ? null : ( // Убираем стрелку, если нет озвучек
                <MaterialIcons
                  name={isTranslationsVisible ? 'expand-less' : 'expand-more'}
                  size={20}
                  color={Colors?.dark?.text || '#FFFFFF'}
                />
              )}
              <Text style={styles.folderText}>
                {kodikTranslations.length ? 'Озвучки' : 'Нет доступных озвучек'}
              </Text>
            </Pressable>

            {/* Кнопка "Смотреть без озвучки" */}
            {kodikTranslations.length > 0 && ( // Условный рендеринг для скрытия кнопки
              <Pressable
                style={({ pressed }) => [
                  styles.purpleButton,
                  pressed && { opacity: 0.7 }, // Добавляем эффект нажатия
                ]}
                onPress={handlePlayWithoutSelection}
              >
                <MaterialIcons
                  name="play-arrow"
                  size={20}
                  color={Colors?.dark?.text || '#FFFFFF'}
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
                  style={styles.episodeButton}
                  onPress={() => handleWatchPress(episode?.link || '')} // Проверяем наличие ссылки
                >
                  <Text style={styles.episodeText}>
                    {episode?.translation?.title || 'Без названия'}
                  </Text>
                </Pressable>
              ))}
          </Animated.View>
        </View>

        {anime.description && (
          <View style={styles.descriptionContainer}>
            <Text style={styles.descriptionTitle}>Описание:</Text>
            <Text style={styles.descriptionText}>{cleanDescription(anime.description)}</Text>
          </View>
        )}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.background,
  },

  header: {
    position: 'relative',
    height: 300,
    backgroundColor: Colors.dark.card,
    borderBottomWidth: 0, // Убираем белую линию
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
    backgroundColor: Colors.dark.background,
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // Semi-transparent overlay
  },
  loadingText: {
    color: Colors.dark.text,
    fontSize: 16,
    marginTop: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.dark.background,
    padding: 16,
  },
  errorText: {
    color: Colors.dark.text,
    fontSize: 16,
    textAlign: 'center',
  },
  titleContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 16,
  },
  title: {
    color: Colors.dark.text,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  originalTitle: {
    color: Colors.dark.subtext,
    fontSize: 14,
  },
  actions: {
    flexDirection: 'column',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: Colors.dark.card,
    marginHorizontal: 4,
  },
  actionText: {
    color: Colors.dark.text,
    marginLeft: 8,
    fontWeight: '600',
  },
  TranslationsContainer: {
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
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 8,
    height: 48, // Высота кнопки "Смотреть"
  },
  folderText: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  smallButton: {
    width: 48, // Ширина маленькой кнопки
    height: 48, // Высота совпадает с кнопкой "Смотреть"
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8,
  },
  smallFavoriteButton: {
    width: 40,
    height: 40,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  purpleButton: {
    width: 48, // Ширина кнопки
    height: 48, // Высота совпадает с кнопкой "Смотреть"
    backgroundColor: Colors.dark.primary, // Фиолетовый цвет
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 8, // Отступы для симметрии
  },
  animatedContainer: {
    overflow: 'hidden',
  },
  episodeButton: {
    padding: 12,
    backgroundColor: Colors.dark.card,
    borderRadius: 8,
    marginVertical: 4,
    alignItems: 'center',
    height: 50,
  },
  episodeText: {
    color: Colors.dark.text,
    fontSize: 14,
    textAlign: 'center',
  },
  descriptionContainer: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  descriptionTitle: {
    color: Colors.dark.text,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  descriptionText: {
    color: Colors.dark.subtext,
    fontSize: 14,
    lineHeight: 20,
  },
  disabledButton: {
    backgroundColor: Colors.dark.disabled, // Цвет для неактивной кнопки "Озвучки"
  },
  disabledPurpleButton: {
    backgroundColor: Colors.dark.disabled, // Цвет для неактивной кнопки "Смотреть без озвучки"
  },
});