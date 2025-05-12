import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';

export default function PlayerScreen() {
  const { kodikUrl } = useLocalSearchParams<{ kodikUrl: string }>();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      const lockOrientation = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      };

      lockOrientation();

      return () => {
        const unlockOrientation = async () => {
          await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
        };

        unlockOrientation();
      };
    }
  }, []);

  if (!kodikUrl) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Видео недоступно</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {Platform.OS === 'web' ? (
        <iframe
          src={kodikUrl}
          style={styles.iframe}
          allowFullScreen
        />
      ) : (
      <WebView
        source={{ uri: kodikUrl }}
        style={styles.webview}
        // deny double-click, zoom, scroll
        injectedJavaScript={`
    window.addEventListener('touchmove', function(e) { e.preventDefault(); }, { passive: false });
  `}
      />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
  },
  iframe: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
  },
  webview: {
    flex: 1,
  },
  errorText: {
    color: '#ff0000',
    fontSize: 16,
    textAlign: 'center',
  },
});