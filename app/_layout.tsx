import React, { useEffect } from 'react';
import { SplashScreen, Stack } from "expo-router";
import { ErrorBoundary } from "./error-boundary";
import { useThemeStore } from '@/store/theme-store';
import { FontAwesome } from "@expo/vector-icons";
import { useFonts } from "expo-font";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({ ...FontAwesome.font });

  useEffect(() => {
    if (fontError)
      throw fontError;
    if (fontsLoaded)
      SplashScreen.hideAsync();
  }, [fontError, fontsLoaded]);

  return (
    <ErrorBoundary>
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  const colors = useThemeStore(state => state.colors);

  const screenOptions = React.useMemo(() => ({
    headerStyle: { backgroundColor: colors.background },
    headerTintColor: colors.text,
    headerTitleStyle: { fontWeight: 'bold' as const },
    contentStyle: {
      backgroundColor: colors.background,
      elevation: 0,
      shadowOpacity: 0,
    },
    headerShown: false,

    statusBarStyle: colors.statusBar,
    statusBarBackgroundColor: colors.background,
    statusBarHidden: false,

    navigationBarTranslucent: false,
    navigationBarColor: colors.background,
  }), [colors]);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen
        name="(tabs)"
        options={{
          navigationBarColor: colors.tabBar,
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="anime/[id]"
        options={{
          title: "Информация об аниме",
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="screens/player"
        options={{
          statusBarHidden: true,
          navigationBarHidden: true,
          navigationBarTranslucent: true,
          animation: 'fade',
          presentation: 'fullScreenModal',
          orientation: "landscape",
        }}
      />
      <Stack.Screen
        name="screens/history"
        options={{
          title: 'История просмотров',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="screens/anime-list"
        options={{
          title: "Список аниме",
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}