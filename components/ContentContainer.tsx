import React from 'react';
import { View, ViewStyle, StyleProp, StyleSheet } from 'react-native';

interface ContentContainerProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  maxWidth?: number;
}

export default function ContentContainer({ children, style, maxWidth = 1200 }: ContentContainerProps) {
  return (
    <View style={[styles.outer, style]}>
      <View style={[styles.inner, { maxWidth }]}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: {
    flex: 1,
    alignItems: 'center',
  },
  inner: {
    width: '100%',
    flexGrow: 1,
    flexShrink: 1,
  },
});
