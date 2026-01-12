import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTimeStore } from '@/store/time-store';
import { useThemeStore } from '@/store/theme-store';

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

export default function PlayerScreen() {
  const { colors } = useThemeStore();
  const { kodikUrl } = useLocalSearchParams<{ kodikUrl: string }>();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const { startTracking, stopTracking } = useTimeStore();

  useEffect(() => {
    startTracking();

    return () => {
      stopTracking();
    };
  }, [startTracking, stopTracking]);

  useEffect(() => {
    if (error && attempts <= MAX_RETRIES) {
      setLoading(true);
      const timer = setTimeout(() => {
        webViewRef.current?.reload();
        setAttempts(attempts + 1);
        setError(false);
      }, RETRY_DELAY);
      return () => clearTimeout(timer);
    }
  }, [error, attempts]);

  if (!kodikUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Видео недоступно</Text>
      </View>
    );
  }

  const handleLoad = () => setLoading(false);
  const handleError = () => setError(true);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {Platform.OS === 'web' ? (
        <iframe
          src={kodikUrl}
          style={{ ...styles.iframe, backgroundColor: colors.background }} // добавлено
          allowFullScreen
          onLoad={handleLoad}
        />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: kodikUrl }}
            style={[styles.webview, { backgroundColor: colors.background }]}
            onLoad={handleLoad}
            onError={handleError}
            injectedJavaScript={`
              window.addEventListener('touchmove', function(e) { 
                e.preventDefault(); 
              }, { passive: false });
            `}
          />
          {(error || attempts > MAX_RETRIES) && (
            <View style={[styles.overlay, { backgroundColor: colors.background }]}>
              <Text style={[styles.errorText, { color: colors.text }]}>Не удалось загрузить видео</Text>
            </View>
          )}
          {(loading || error) && attempts <= MAX_RETRIES && (
            <View style={[styles.overlay, { backgroundColor: colors.background }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  webview: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
  },
});