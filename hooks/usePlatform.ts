import { useWindowDimensions, Platform } from 'react-native';

export function usePlatform() {
  const { width, height } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const isAndroid = Platform.OS === 'android';
  const isTV = Platform.isTV === true;
  const isBigScreen = width >= 768;

  const numColumns =
    width >= 1400 ? 7
    : width >= 1200 ? 6
    : width >= 1024 ? 5
    : width >= 768 ? 4
    : width >= 480 ? 3
    : 2;

  const gridCardWidth = Math.floor((width - (isBigScreen ? 112 : 32)) / numColumns) - 12;

  const maxContentWidth = 1200;

  return {
    isWeb,
    isAndroid,
    isTV,
    isBigScreen,
    numColumns,
    gridCardWidth,
    maxContentWidth,
    screenWidth: width,
    screenHeight: height,
  };
}
