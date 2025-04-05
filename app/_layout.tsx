import { FontAwesome } from "@expo/vector-icons";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";
import { StatusBar } from "react-native";
import { ErrorBoundary } from "./error-boundary";
import * as SystemUI from "expo-system-ui"
import Colors from "@/constants/colors";

export const unstable_settings = {
  initialRouteName: "(tabs)",
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    ...FontAwesome.font,
  });

  SystemUI.setBackgroundColorAsync(Colors.dark.background);

  useEffect(() => {
    if (error) {
      console.error(error);
      throw error;
    }
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return (
    <ErrorBoundary>
      <StatusBar barStyle="light-content" backgroundColor={Colors.dark.background} />
      <RootLayoutNav />
    </ErrorBoundary>
  );
}

function RootLayoutNav() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.dark.background,
        },
        headerTintColor: Colors.dark.text,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
        contentStyle: {
          backgroundColor: Colors.dark.background,
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen 
        name="anime/[id]" 
        options={{ 
          title: "Информация об аниме",
          animation: 'slide_from_right',
        }} 
      />
      <Stack.Screen 
        name="player/[id]" 
        options={{ 
          headerShown: false,
          animation: 'fade',
          presentation: 'fullScreenModal',
        }} 
      />
      <Stack.Screen 
        name="history/history" 
        options={{ 
          animation: 'slide_from_right',
        }} 
      />
    </Stack>
  );
}