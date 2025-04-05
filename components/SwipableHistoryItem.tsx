import React, { useState, useRef } from 'react';
import { Animated, StyleSheet, View, Dimensions, PanResponder } from 'react-native';
import WatchHistoryItem, { WatchHistoryItemProps } from '@/components/WatchHistoryItem';

const { width: screenWidth } = Dimensions.get('window');

const SwipeableHistoryItem: React.FC<WatchHistoryItemProps> = ({ item }) => {
  const [isRemoved, setIsRemoved] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_, gestureState) => {
        // Обновляем значение translateX вручную
        translateX.setValue(gestureState.dx);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -50) {
          triggerHideAnimation('left');
        } else if (gestureState.dx > 50) {
          triggerHideAnimation('right');
        } else {
          // Возвращаем элемент в исходное положение
          Animated.spring(translateX, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const triggerHideAnimation = (direction: 'left' | 'right') => {
    Animated.timing(translateX, {
      toValue: direction === 'right' ? screenWidth : -screenWidth,
      duration: 275,
      useNativeDriver: true,
    }).start(() => {
      setIsRemoved(true);
    });
  };

  if (isRemoved) return null;

  return (
    <Animated.View
      {...panResponder.panHandlers}
      style={[
        styles.container,
        {
          transform: [{ translateX }],
        },
      ]}
    >
      <View style={styles.innerContainer}>
        <WatchHistoryItem
          item={item}
          continueWatchingShow={true}
        />
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    marginBottom: 16,
  },
  innerContainer: {
    padding: 16,
  },
});

export default SwipeableHistoryItem;