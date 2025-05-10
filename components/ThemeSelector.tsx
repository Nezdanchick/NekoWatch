import React, { useState, useEffect, useRef } from 'react';
import { View, Text, Pressable, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '@/store/theme-store';
import { ThemeName, themeMap } from '@/constants/theme';

interface ThemeSelectorProps { }

const ThemeSelecor: React.FC<ThemeSelectorProps> = ({
}) => {
  const { colors, themeName, toggleTheme } = useThemeStore();
  const sliderPosition = useRef(new Animated.Value(0)).current;
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const position = themeMap[themeName];
    Animated.timing(sliderPosition, {
      toValue: position * (containerWidth / 3),
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [themeName, containerWidth]);

  const handleLayout = (event: any) => {
    const { width } = event.nativeEvent.layout;
    setContainerWidth(width);
  };

  return (
    <View
      style={[styles.themeSelector, { backgroundColor: colors.card }]}
      onLayout={handleLayout}
    >
      <Animated.View
        style={[
          styles.slider,
          {
            backgroundColor: colors.primary,
            transform: [{ translateX: sliderPosition }],
          },
        ]}
      />
      <Pressable
        style={[styles.themeOption, { width: '33.33%' }]}
        onPress={() => toggleTheme('dark')}
      >
        <Text style={[styles.themeOptionText, { color: colors.text }]}>
          Тёмная
        </Text>
      </Pressable>
      <Pressable
        style={[styles.themeOption, { width: '33.33%' }]}
        onPress={() => toggleTheme('light')}
      >
        <Text style={[styles.themeOptionText, { color: colors.text }]}>
          Светлая
        </Text>
      </Pressable>
      <Pressable
        style={[styles.themeOption, { width: '33.33%' }]}
        onPress={() => toggleTheme('amoled')}
      >
        <Text style={[styles.themeOptionText, { color: colors.text }]}>
          Amoled
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  themeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'relative',
    borderRadius: 8,
    marginHorizontal: 16,
    height: 50,
    overflow: 'hidden',
  },
  slider: {
    position: 'absolute',
    width: '33.33%', // Ширина слайдера равна 1/3 ширины контейнера
    height: '100%',
    borderRadius: 8,
  },
  themeOption: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  themeOptionText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ThemeSelecor;