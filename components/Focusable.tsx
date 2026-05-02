import React, { useRef, useCallback, useState } from 'react';
import { Pressable, PressableProps, Animated, ViewStyle, StyleProp, Platform, View } from 'react-native';
import { useThemeStore } from '@/store/theme-store';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface FocusableProps extends Omit<PressableProps, 'style'> {
  children: React.ReactNode;
  focusScale?: number;
  style?: StyleProp<ViewStyle>;
  showFocusRing?: boolean;
}

export default function Focusable({
  children,
  style,
  focusScale = 1.04,
  showFocusRing = true,
  onFocus,
  onBlur,
  disabled,
  ...props
}: FocusableProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const [isFocused, setIsFocused] = useState(false);
  const { colors } = useThemeStore();

  const animate = useCallback((toValue: number) => {
    Animated.spring(scaleAnim, {
      toValue,
      useNativeDriver: true,
      friction: 8,
      tension: 100,
    }).start();
  }, [scaleAnim]);

  const handleActivate = useCallback(() => {
    if (!disabled) animate(focusScale);
  }, [disabled, focusScale, animate]);

  const handleDeactivate = useCallback(() => {
    animate(1);
  }, [animate]);

  const handleFocus = useCallback((e: any) => {
    setIsFocused(true);
    handleActivate();
    onFocus?.(e);
  }, [handleActivate, onFocus]);

  const handleBlur = useCallback((e: any) => {
    setIsFocused(false);
    handleDeactivate();
    onBlur?.(e);
  }, [handleDeactivate, onBlur]);

  const focusRingStyle = (isFocused && showFocusRing && !disabled) ? {
    borderWidth: 2,
    borderColor: colors.primary,
    borderRadius: 16,
  } : undefined;

  return (
    <AnimatedPressable
      {...props}
      disabled={disabled}
      // @ts-ignore
      style={[style as any, focusRingStyle, { transform: [{ scale: scaleAnim }] }]}
      onFocus={handleFocus}
      onBlur={handleBlur}
      // @ts-ignore
      onHoverIn={handleActivate}
      onHoverOut={handleDeactivate}
    >
      {children}
    </AnimatedPressable>
  );
}
