import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimeStore } from '@/store/anime-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import * as Linking from 'expo-linking';
import GithubIcon from '@/components/GithubIcon';
import { useRouter } from 'expo-router';
import { TimeSpentSection } from '@/components/TimeSpentSection';
import ThemeSelector from '@/components/ThemeSelector';

export default function ProfileScreen() {
  const colors = useThemeStore(state => state.colors);
  const watchHistory = useAnimeStore(state => state.watchHistory);
  const router = useRouter();

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

  const handleProjectPress = () => {
    Linking.openURL('https://github.com/Nezdanchick/NekoWatch').catch(err =>
      console.error('Не удалось открыть ссылку:', err)
    );
  };

  const handleHistoryPress = () => {
    router.push({ pathname: '/history/history' });
  };

  const renderMenuItem = (icon: React.ReactNode, title: string, subtitle: string, onPress?: () => void, badge?: number) => (
    <Pressable
      style={[styles.menuItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={!onPress}
    >
      <View style={styles.menuIcon}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.subtext }]}>{subtitle}</Text>
      </View>
      {badge !== undefined && (
        <View style={[styles.badge, { backgroundColor: colors.primary }]}>
          <Text style={[styles.badgeText, { color: colors.text }]}>{badge}</Text>
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['right', 'left']}>
      <ScrollView>
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ваша активность</Text>

          <TimeSpentSection />

          {renderMenuItem(
            <MaterialCommunityIcons name="history" size={24} color={colors.primary} />,
            "История просмотров",
            "Просмотренные аниме и эпизоды",
            handleHistoryPress,
            watchHistory.length
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Тема</Text>

          <ThemeSelector />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>О нас</Text>

          {renderMenuItem(
            <GithubIcon size={24} color={colors.primary} />,
            "Nezdanchick",
            "Разработчик",
            handleNezdanchickPress
          )}
          {renderMenuItem(
            <GithubIcon size={24} color={colors.primary} />,
            "W1neus",
            "UI/UX дизайнер",
            handleWineusPress
          )}
          {renderMenuItem(
            <GithubIcon size={24} color={colors.primary} />,
            "Страница проекта",
            "Перейти на github.com",
            handleProjectPress
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingVertical: 20,
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
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    height: 60,
    marginBottom: 4,
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
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  menuSubtitle: {
    fontSize: 12,
  },
  badge: {
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 24,
    alignItems: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
});