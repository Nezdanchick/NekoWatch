import React from "react";
import { Tabs } from "expo-router";
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';

export default function TabLayout() {
  const colors = useThemeStore(state => state.colors);

  const screenOptions = React.useMemo(() => ({
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.tabIcon,
    headerStyle: {
      backgroundColor: colors.background,
      borderBottomWidth: 0,
      height: 30,
      elevation: 0,
      shadowOpacity: 0,
    },
    tabBarStyle: {
      backgroundColor: colors.tabBar,
      borderTopColor: "transparent",
      borderTopWidth: 0,
      elevation: 0,
      shadowOpacity: 0,
      height: 60
    },
    tabBarLabelStyle: {
      fontSize: 12,
    },
    headerShown: false
  }), [colors]);

  return (
    <Tabs screenOptions={screenOptions}>
      <Tabs.Screen
        name="index"
        options={{
          title: "Главная",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: "Поиск",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="magnify" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Избранное",
          tabBarIcon: ({ color }) => (
            <FontAwesome name="heart" size={22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: "Профиль",
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="face-man" size={22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}