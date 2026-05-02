import React, { useRef, useEffect, useState } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '@/store/theme-store';
import { themeMap, ThemeName } from '@/constants/theme';
import Focusable from '@/components/Focusable';

const themeNames: ThemeName[] = ['dark', 'light', 'amoled'];

const ThemeSelector: React.FC = () => {
  const { colors, themeName, toggleTheme } = useThemeStore();
  const sliderPosition = useRef(new Animated.Value(0)).current;
  const [width, setWidth] = useState(0);

  const optionWidth = width > 0 ? width / themeNames.length : 0;

  const handlePress = (name: ThemeName) => {
    if (name !== themeName) {
      toggleTheme(name);
    }
  };

  useEffect(() => {
    if (!optionWidth) return;
    Animated.timing(sliderPosition, {
      toValue: (themeMap[themeName] ?? 0) * optionWidth,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [themeName, optionWidth]);

  return (
    <View
      style={[styles.container, { backgroundColor: colors.surfaceVariant }]}
      onLayout={e => setWidth(e.nativeEvent.layout.width)}
    >
      {optionWidth > 0 && (
        <Animated.View
          style={[
            styles.slider,
            {
              backgroundColor: colors.secondaryContainer,
              width: optionWidth,
              transform: [{ translateX: sliderPosition }],
            },
          ]}
        />
      )}
      {themeNames.map(name => (
        <Focusable
          key={name}
          style={[styles.option, { width: optionWidth }]}
          onPress={() => handlePress(name)}
        >
          <Text style={[
            styles.text,
            { color: themeName === name ? colors.onSecondaryContainer : colors.subtext, fontWeight: themeName === name ? 'bold' : '500' }
          ]}>
            {name === 'dark' ? 'Тёмная' : name === 'light' ? 'Светлая' : 'Amoled'}
          </Text>
        </Focusable>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderRadius: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  slider: {
    position: 'absolute',
    left: 0,
    top: 4,
    height: 48,
    borderRadius: 12,
    zIndex: 0,
  },
  option: {
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    zIndex: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ThemeSelector;