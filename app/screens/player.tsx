import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator, useWindowDimensions } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTimeStore } from '@/store/time-store';
import { useThemeStore } from '@/store/theme-store';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import VirtualMouse from '@/components/VirtualMouse';

const MAX_RETRIES = 5;
const RETRY_DELAY = 3000;

export default function PlayerScreen() {
  const { colors } = useThemeStore();
  const insets = useSafeAreaInsets();
  const { kodikUrl } = useLocalSearchParams<{ kodikUrl: string }>();
  const { width: screenWidth, height: screenHeight } = useWindowDimensions();
  const isTV = Platform.isTV === true;

  const horizontalPadding = Math.max(insets.left, insets.right);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const webViewRef = useRef<WebView>(null);
  const { startTracking, stopTracking } = useTimeStore();

  useEffect(() => {
    startTracking();
    return () => { stopTracking(); };
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
    <View
      style={[
        styles.container,
        {
          backgroundColor: 'black',
          paddingLeft: horizontalPadding,
          paddingRight: horizontalPadding,
        }
      ]}
    >
      <StatusBar hidden translucent backgroundColor="transparent" />
      {Platform.OS === 'web' ? (
        <iframe
          src={kodikUrl}
          style={{ ...styles.iframe, backgroundColor: 'black' }}
          allowFullScreen
          onLoad={handleLoad}
        />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: kodikUrl }}
            style={[styles.webview, { backgroundColor: 'black' }]}
            onLoad={handleLoad}
            onError={handleError}
            injectedJavaScript={`
              window.addEventListener('touchmove', function(e) { 
                e.preventDefault(); 
              }, { passive: false });
            `}
          />
          {(error || attempts > MAX_RETRIES) && (
            <View style={[styles.overlay, { backgroundColor: 'black' }]}>
              <Text style={[styles.errorText, { color: colors.text }]}>Не удалось загрузить видео</Text>
            </View>
          )}
          {(loading || error) && attempts <= MAX_RETRIES && (
            <View style={[styles.overlay, { backgroundColor: 'black' }]}>
              <ActivityIndicator size="large" color={colors.primary} />
            </View>
          )}
          {isTV && <VirtualMouse webViewRef={webViewRef} width={screenWidth} height={screenHeight} />}
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