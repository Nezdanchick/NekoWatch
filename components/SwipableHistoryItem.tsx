import React, { useState, useRef, useEffect } from 'react';
import { Animated, StyleSheet, View, Dimensions, PanResponder } from 'react-native';
import WatchHistoryItem, { WatchHistoryItemProps } from '@/components/WatchHistoryItem';

const { width: screenWidth } = Dimensions.get('window');

const SwipeableHistoryItem: React.FC<WatchHistoryItemProps> = ({ item }) => {
  const [isRemoved, setIsRemoved] = useState(false);
  const translateX = useRef(new Animated.Value(0)).current;
  const isSwiping = useRef(false);

  useEffect(() => {
    setIsRemoved(false);
    translateX.setValue(0);
  }, [item]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Начинаем обрабатывать свайп только при значительном смещении
        const isHorizontalSwipe = Math.abs(gestureState.dx) > 5 && Math.abs(gestureState.dy) < 10;
        if (isHorizontalSwipe) {
          isSwiping.current = true;
        }
        return isHorizontalSwipe;
      },
      onPanResponderMove: (_, gestureState) => {
        if (isSwiping.current) {
          translateX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (isSwiping.current) {
          if (gestureState.dx < -50) {
            triggerHideAnimation('left');
          } else if (gestureState.dx > 50) {
            triggerHideAnimation('right');
          } else {
            Animated.spring(translateX, {
              toValue: 0,
              useNativeDriver: true,
            }).start();
          }
          isSwiping.current = false;
        }
      },
      onPanResponderTerminationRequest: () => false,
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