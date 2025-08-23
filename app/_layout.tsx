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
    statusBarStyle: colors.statusBar,
    statusBarBackgroundColor: colors.background,
    statusBarHidden: false,

    navigationBarHidden: true,
    navigationBarTranslucent: true,
  }), [colors]);

  return (
    <Stack screenOptions={screenOptions}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
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
          headerShown: false,
          statusBarHidden: true,
          animation: 'fade',
          presentation: 'fullScreenModal',
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
        options={({ route }) => ({
          title: "Список аниме",
          animation: 'slide_from_right',
        })}
      />
    </Stack>
  );
}