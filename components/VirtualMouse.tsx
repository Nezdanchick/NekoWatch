import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, Animated, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface VirtualMouseProps {
  webViewRef?: React.RefObject<any>;
  width: number;
  height: number;
}

const MOVE_STEP = 10;
const FAST_MOVE_STEP = 30;
const CURSOR_SIZE = 28;

export default function VirtualMouse({ webViewRef, width, height }: VirtualMouseProps) {
  const isTV = Platform.isTV === true;

  // Only render on Android TV
  if (!isTV) return null;

  return <VirtualMouseInner webViewRef={webViewRef} width={width} height={height} />;
}

function VirtualMouseInner({ webViewRef, width, height }: Omit<VirtualMouseProps, 'visible'>) {
  const [position, setPosition] = useState({ x: width / 2, y: height / 2 });
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    setPosition({ x: width / 2, y: height / 2 });
  }, [width, height]);

  const simulateClick = useCallback(() => {
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.5, duration: 100, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start();

    if (webViewRef?.current) {
      webViewRef.current.injectJavaScript(`
        (function() {
          var el = document.elementFromPoint(${position.x}, ${position.y});
          if (el) {
            ['mouseover', 'mousedown', 'mouseup', 'click'].forEach(function(type) {
              el.dispatchEvent(new MouseEvent(type, {
                bubbles: true, cancelable: true,
                clientX: ${position.x}, clientY: ${position.y}
              }));
            });
          }
        })();
        true;
      `);
    }
  }, [position, webViewRef, pulseAnim]);

  return (
    <View style={styles.overlay} pointerEvents="none">
      <Animated.View
        style={[
          styles.cursor,
          {
            left: position.x - CURSOR_SIZE / 2,
            top: position.y - CURSOR_SIZE / 2,
            transform: [{ scale: pulseAnim }],
          },
        ]}
      >
        <MaterialCommunityIcons name="cursor-default" size={CURSOR_SIZE} color="white" />
        <View style={styles.cursorDot} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
  cursor: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  cursorDot: {
    position: 'absolute',
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7B68EE',
    top: 2,
    left: 2,
  },
});
