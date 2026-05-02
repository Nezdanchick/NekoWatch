import React from "react";
import { View, StyleSheet } from "react-native";
import { Tabs } from "expo-router";
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import { usePlatform } from '@/hooks/usePlatform';
import NavigationRail from '@/components/NavigationRail';
import { usePathname, useRouter } from 'expo-router';

const NAV_ITEMS = [
  { key: 'index', label: 'Главная', icon: 'home-outline' as const, activeIcon: 'home' as const },
  { key: 'search', label: 'Поиск', icon: 'magnify' as const, activeIcon: 'magnify' as const },
  { key: 'favorites', label: 'Закладки', icon: 'bookmark-multiple-outline' as const, activeIcon: 'bookmark-multiple' as const },
  { key: 'profile', label: 'Профиль', icon: 'account-outline' as const, activeIcon: 'account' as const },
];

export default function TabLayout() {
  const colors = useThemeStore(state => state.colors);
  const { isBigScreen } = usePlatform();
  const pathname = usePathname();
  const router = useRouter();

  const activeKey = NAV_ITEMS.find(item =>
    pathname === '/' ? item.key === 'index' : pathname === `/${item.key}`
  )?.key || 'index';

  const handleNavSelect = (key: string) => {
    router.push(key === 'index' ? '/' : `/${key}` as any);
  };

  const iconSize = isBigScreen ? 24 : 22;

  const screenOptions = React.useMemo(() => ({
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.tabIcon,
    tabBarStyle: isBigScreen ? { display: 'none' as const } : {
      backgroundColor: colors.surface,
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
      height: 80,
      paddingBottom: 12,
      paddingTop: 12,
    },
    tabBarLabelStyle: {
      fontSize: 12,
      fontWeight: '500' as const,
      letterSpacing: 0.5,
    },
    tabBarItemStyle: {
      gap: 4,
    },
    headerShown: false,
  }), [colors, isBigScreen]);

  const tabContent = (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIndicator, focused && { backgroundColor: colors.secondaryContainer }]}>
              <MaterialCommunityIcons name={focused ? "home" : "home-outline"} size={iconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Поиск",
          tabBarIcon: ({ color }) => (
            <View style={styles.tabIndicator}>
              <MaterialCommunityIcons name="magnify" size={iconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Закладки",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIndicator, focused && { backgroundColor: colors.secondaryContainer }]}>
              <MaterialCommunityIcons name={focused ? "bookmark-multiple" : "bookmark-multiple-outline"} size={iconSize} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color, focused }) => (
            <View style={[styles.tabIndicator, focused && { backgroundColor: colors.secondaryContainer }]}>
              <MaterialCommunityIcons name={focused ? "account" : "account-outline"} size={iconSize} color={color} />
            </View>
          ),
        }}
      />
    </Tabs>
  );

  if (isBigScreen) {
    return (
      <View style={[styles.bigScreenContainer, { backgroundColor: colors.background }]}>
        <NavigationRail
          items={NAV_ITEMS}
          activeKey={activeKey}
          onSelect={handleNavSelect}
        />
        <View style={styles.content}>
          {tabContent}
        </View>
      </View>
    );
  }

  return tabContent;
}

const styles = StyleSheet.create({
  bigScreenContainer: {
    flex: 1,
    flexDirection: 'row',
  },
  content: {
    flex: 1,
  },
  tabIndicator: {
    width: 64,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});