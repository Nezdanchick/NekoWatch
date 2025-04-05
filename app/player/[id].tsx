import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Platform } from 'react-native';
import { WebView } from 'react-native-webview';
import { useLocalSearchParams } from 'expo-router';
import * as ScreenOrientation from 'expo-screen-orientation';
import { StatusBar } from 'expo-status-bar';

export default function PlayerScreen() {
  const { kodikUrl } = useLocalSearchParams<{ kodikUrl: string }>();

  useEffect(() => {
    if (Platform.OS !== 'web') {
      // Устанавливаем ориентацию экрана в landscape при монтировании
      const lockOrientation = async () => {
        await ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.LANDSCAPE);
      };

      lockOrientation();

      return () => {
        // Возвращаем ориентацию в портретный режим при размонтировании
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
      <StatusBar hidden={true} />
      {Platform.OS === 'web' ? (
        <iframe
          src={kodikUrl}
          style={styles.iframe}
          allowFullScreen
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <WebView
          source={{
            html: `
      <html>
        <body style="margin:0;padding:0;">
          <iframe
            id="kodik-iframe"
            src="${kodikUrl}"
            width="100%"
            height="100%"
            frameborder="0"
            allowfullscreen
          ></iframe>
        </body>
      </html>
    `,
          }}
          style={styles.webview}
          onMessage={(event) => {
            console.log('Kodik iframe:', event.nativeEvent.data);
          }}
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
  backButton: {
    position: 'absolute',
    top: 48,
    left: 16,
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 8,
    zIndex: 1000,
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