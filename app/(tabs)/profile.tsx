import React, { useState, useRef, useEffect } from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimeStore } from '@/store/anime-store';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import Colors from '@/constants/colors';
import * as Linking from 'expo-linking';
import GithubIcon from '@/components/GithubIcon';
import { useRouter } from 'expo-router'; // Импорт useRouter
import ConfirmationModal from '@/components/ConfirmationModal'; // Импортируем модуль подтверждения

export default function ProfileScreen() {
  const { clearWatchHistory, watchHistory, favorites } = useAnimeStore();
  const router = useRouter(); // Хук для маршрутизации
  const [isModalVisible, setModalVisible] = useState(false); // Состояние для модального окна
  const [theme, setTheme] = useState<'dark' | 'light' | 'amoled'>('dark'); // Состояние для темы
  const sliderPosition = useRef(new Animated.Value(0)).current; // Анимация для ползунка
  const [containerWidth, setContainerWidth] = useState(0); // Ширина контейнера

  useEffect(() => {
    // Обновляем позицию слайдера при изменении темы
    const position = theme === 'dark' ? 0 : theme === 'light' ? 1 : 2;
    Animated.timing(sliderPosition, {
      toValue: position * (containerWidth / 3), // Рассчитываем позицию слайдера (1/3 ширины контейнера)
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [theme, containerWidth]);

  const handleThemeChange = (newTheme: 'dark' | 'light' | 'amoled') => {
    setTheme(newTheme);
  };

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width); // Устанавливаем ширину контейнера
  };

  const currentColors = Colors[theme] || Colors.dark; // Используем 'dark' как значение по умолчанию

  const handleClearHistory = () => {
    setModalVisible(true); // Открываем модальное окно
  };

  const confirmClearHistory = () => {
    clearWatchHistory(); // Очищаем историю
    setModalVisible(false); // Закрываем модальное окно
  };

  const handleNezdanchickPress = () => {
    Linking.openURL('https://github.com/Nezdanchick').catch(err =>
      console.error('Не удалось открыть ссылку:', err)
    );
  };

  const handleWineusPress = () => {
    Linking.openURL('https://github.com/W1neus').catch(err =>
      console.error('Не удалось открыть ссылку:', err)
    );
  };

  const handleHistoryPress = () => {
    router.push({ pathname: '/history/history' }); // Переход на экран /history
  };

  const renderMenuItem = (icon: React.ReactNode, title: string, subtitle: string, onPress?: () => void, badge?: number) => (
    <Pressable
      style={styles.menuItem}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuIcon}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={styles.menuTitle}>{title}</Text>
        <Text style={styles.menuSubtitle}>{subtitle}</Text>
      </View>
      {badge !== undefined && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: currentColors.background }]} edges={['right', 'left']}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: currentColors.text }]}>Настройки</Text>

          {/* Кнопка с тремя элементами */}
          <View
            style={[styles.themeSelector, { backgroundColor: currentColors.card }]}
            onLayout={handleLayout} // Получаем ширину контейнера
          >
            <Animated.View
              style={[
                styles.slider,
                {
                  backgroundColor: currentColors.primary,
                  transform: [{ translateX: sliderPosition }],
                },
              ]}
            />
            <Pressable
              style={[styles.themeOption, { width: '33.33%' }]} // Устанавливаем ширину кнопки
              onPress={() => handleThemeChange('dark')}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  theme === 'dark'
                    ? { color: currentColors.background }
                    : { color: currentColors.text },
                ]}
              >
                Тёмная
              </Text>
            </Pressable>
            <Pressable
              style={[styles.themeOption, { width: '33.33%' }]} // Устанавливаем ширину кнопки
              onPress={() => handleThemeChange('light')}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  theme === 'light'
                    ? { color: currentColors.background }
                    : { color: currentColors.text },
                ]}
              >
                Светлая
              </Text>
            </Pressable>
            <Pressable
              style={[styles.themeOption, { width: '33.33%' }]} // Устанавливаем ширину кнопки
              onPress={() => handleThemeChange('amoled')}
            >
              <Text
                style={[
                  styles.themeOptionText,
                  theme === 'amoled'
                    ? { color: currentColors.background }
                    : { color: currentColors.text },
                ]}
              >
                AMOLED
              </Text>
            </Pressable>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ваша активность</Text>

          {renderMenuItem(
            <MaterialIcons name="history" size={24} color={Colors.dark.primary} />,
            "История просмотров",
            "Просмотренные аниме и эпизоды",
            handleHistoryPress, // Добавлен обработчик нажатия
            watchHistory.length
          )}

            {renderMenuItem(
            <MaterialIcons name="delete" size={24} color={Colors.dark.secondary} />,
            "Очистить историю",
            "Удалить всю историю просмотров",
            handleClearHistory
            )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>О нас</Text>

          {renderMenuItem(
            <GithubIcon size={24} color={Colors.dark.primary} />,
            "Nezdanchick",
            "Разработчик",
            handleNezdanchickPress
          )}
          {renderMenuItem(
            <GithubIcon size={24} color={Colors.dark.primary} />,
            "W1neus",
            "Менеджер",
            handleWineusPress
          )}
        </View>
      </ScrollView>

      {/* Модальное окно подтверждения */}
      <ConfirmationModal
        visible={isModalVisible}
        title="Очистить историю"
        message="Вы уверены, что хотите очистить всю историю просмотров?"
        onCancel={() => setModalVisible(false)}
        onConfirm={confirmClearHistory}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    marginVertical: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginHorizontal: 16,
    marginBottom: 12,
  },
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    borderRadius: 8,
    marginHorizontal: 16,
    height: 50, // Высота кнопки
    backgroundColor: Colors.dark.card,
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    width: '33.33%', // Ширина слайдера равна 1/3 ширины контейнера
    height: '100%',
    borderRadius: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.dark.text,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.dark.card,
    paddingVertical: 16,
    paddingHorizontal: 16,
    marginBottom: 1,
  },
  menuIcon: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    color: Colors.dark.text,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    color: Colors.dark.subtext,
    fontSize: 13,
  },
  badge: {
    backgroundColor: Colors.dark.primary,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    color: Colors.dark.text,
    fontSize: 12,
    fontWeight: 'bold',
  },
});