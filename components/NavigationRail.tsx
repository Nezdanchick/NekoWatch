import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import Focusable from '@/components/Focusable';

interface NavItem {
  key: string;
  label: string;
  icon: keyof typeof MaterialCommunityIcons.glyphMap;
  activeIcon: keyof typeof MaterialCommunityIcons.glyphMap;
}

interface NavigationRailProps {
  items: NavItem[];
  activeKey: string;
  onSelect: (key: string) => void;
}

export default function NavigationRail({ items, activeKey, onSelect }: NavigationRailProps) {
  const { colors } = useThemeStore();

  return (
    <View style={[styles.rail, { backgroundColor: colors.surface, borderRightColor: colors.border }]}>
      {items.map((item) => {
        const isActive = activeKey === item.key;
        return (
          <Focusable
            key={item.key}
            style={styles.item}
            onPress={() => onSelect(item.key)}
            focusScale={1.08}
          >
            <View
              style={[
                styles.indicator,
                isActive && { backgroundColor: colors.secondaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name={isActive ? item.activeIcon : item.icon}
                size={24}
                color={isActive ? colors.onSecondaryContainer : colors.tabIcon}
              />
            </View>
            <Text
              style={[
                styles.label,
                { color: isActive ? colors.onSecondaryContainer : colors.tabIcon },
                isActive && styles.labelActive,
              ]}
              numberOfLines={1}
            >
              {item.label}
            </Text>
          </Focusable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  rail: {
    width: 80,
    paddingTop: 12,
    paddingBottom: 12,
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 4,
    borderRightWidth: 1,
  },
  item: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    width: 72,
  },
  indicator: {
    width: 56,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.5,
  },
  labelActive: {
    fontWeight: '700',
  },
});
