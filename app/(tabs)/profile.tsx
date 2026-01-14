import React from 'react';
import { StyleSheet, Text, View, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAnimeStore } from '@/store/anime-store';
import { MaterialCommunityIcons, FontAwesome} from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import * as Linking from 'expo-linking';
import GithubIcon from '@/components/GithubIcon';
import { useRouter } from 'expo-router';
import { TimeSpentSection } from '@/components/TimeSpentSection';
import ThemeSelector from '@/components/ThemeSelector';
import appJson from '../../app.json';

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

  const handleTelegramPress = () => {
    Linking.openURL('https://t.me/NekoWatch_App').catch(err =>
      console.error('Не удалось открыть ссылку:', err)
    );
  };

  const handleHistoryPress = () => {
    router.push({ pathname: '/screens/history' });
  };

  const renderMenuItem = (icon: React.ReactNode, title: string, subtitle: string, onPress?: () => void, badge?: number) => (
    <Pressable
      style={[styles.menuItem, { backgroundColor: colors.card }]}
      onPress={onPress}
      disabled={!onPress}
      android_ripple={{ color: colors.primary + '30' }}
    >
      <View style={styles.menuIcon}>
        {icon}
      </View>
      <View style={styles.menuContent}>
        <Text style={[styles.menuTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.menuSubtitle, { color: colors.subtext }]}>{subtitle}</Text>
      </View>
      <View style={styles.menuEndContent}>
        {badge !== undefined && (
          <View style={[styles.badge, { backgroundColor: colors.primary }]}>
            <Text style={[styles.badgeText, { color: '#FFFFFF' }]}>{badge}</Text>
          </View>
        )}
        {onPress && (
          <MaterialCommunityIcons name="chevron-right" size={24} color={colors.subtext} />
        )}
      </View>
    </Pressable>
  );

  const renderDeveloperCard = (icon: React.ReactNode, name: string, role: string, onPress: () => void) => (
    <Pressable
      style={[styles.developerCard, { backgroundColor: colors.card }]}
      onPress={onPress}
      android_ripple={{ color: colors.primary + '30' }}
    >
      <View style={styles.developerIcon}>
        {icon}
      </View>
      <Text style={[styles.developerName, { color: colors.text }]}>{name}</Text>
      <Text style={[styles.developerRole, { color: colors.subtext }]}>{role}</Text>
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Профиль</Text>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Ваша активность</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <TimeSpentSection />
          </View>

          {renderMenuItem(
            <MaterialCommunityIcons name="history" size={24} color={colors.primary} />,
            watchHistory.length > 0 ? "История просмотров" : "История пуста",
            watchHistory.length > 0 ? "Просмотренные аниме" : "Вы ещё не смотрели аниме",
            watchHistory.length > 0 ? handleHistoryPress : undefined,
            watchHistory.length > 0 ? watchHistory.length : undefined
          )}
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Тема</Text>

          <View style={[styles.card, { backgroundColor: colors.card }]}>
            <ThemeSelector />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>О нас</Text>

          <Text style={[styles.sectionSubtitle, { color: colors.subtext }]}>Разработчики</Text>
          <View style={styles.developersRow}>
            {renderDeveloperCard(
              <GithubIcon size={32} color={colors.primary} />,
              "Nezdanchick",
              "Разработчик",
              handleNezdanchickPress
            )}
            {renderDeveloperCard(
              <GithubIcon size={32} color={colors.primary} />,
              "W1neus",
              "UI/UX дизайнер",
              handleWineusPress
            )}
          </View>

          <Text style={[styles.sectionSubtitle, { color: colors.subtext, marginTop: 16 }]}>Связь</Text>
          {renderMenuItem(
            <FontAwesome name="telegram" size={24} color={colors.primary} />,
            "Telegram канал",
            "Подписывайтесь на обновления",
            handleTelegramPress
          )}
          {renderMenuItem(
            <GithubIcon size={24} color={colors.primary} />,
            "Страница проекта",
            "Открыть на GitHub",
            handleProjectPress
          )}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: colors.subtext }]}>NekoWatch v{appJson.expo.version}</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: 0.25,
  },
  section: {
    marginTop: 16,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: '600',
    marginBottom: 12,
    marginHorizontal: 16,
    letterSpacing: 0.15,
  },
  sectionSubtitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    marginHorizontal: 16,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  card: {
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    minHeight: 72,
    marginHorizontal: 16,
    marginBottom: 8,
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  menuIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
    letterSpacing: 0.15,
  },
  menuSubtitle: {
    fontSize: 14,
    letterSpacing: 0.25,
    lineHeight: 20,
  },
  menuEndContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
    minWidth: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  developersRow: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  developerCard: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },
  developerIcon: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  developerName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
    letterSpacing: 0.1,
    textAlign: 'center',
  },
  developerRole: {
    fontSize: 12,
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  footer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    letterSpacing: 0.4,
  },
});