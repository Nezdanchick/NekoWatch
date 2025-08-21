import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text, Platform, ActivityIndicator } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useTimeStore } from '@/store/time-store';

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

export default function PlayerScreen() {
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

  const lockOrientation = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
  };

  const unlockOrientation = async () => {
    await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
  };

  useEffect(() => {
    if (Platform.OS !== 'web') {
      lockOrientation();
      return () => { unlockOrientation(); };
    }
  }, []);

  useEffect(() => {
    if (error && attempts < MAX_RETRIES) {
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
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          src={kodikUrl}
          style={styles.iframe}
          allowFullScreen
          onLoad={handleLoad}
        />
      ) : (
        <>
          <WebView
            ref={webViewRef}
            source={{ uri: kodikUrl }}
            style={styles.webview}
            onLoad={handleLoad}
            onError={handleError}
            injectedJavaScript={`
              window.addEventListener('touchmove', function(e) { 
                e.preventDefault(); 
              }, { passive: false });
            `}
          />
          {(loading || error) && attempts < MAX_RETRIES && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color="#fff" />
            </View>
          )}
        </>
      )}
      {error && attempts >= MAX_RETRIES && (
        <View style={styles.overlay}>
          <Text style={styles.errorText}>Не удалось загрузить видео</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
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
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    color: '#fff',
    fontSize: 16,
  },
});