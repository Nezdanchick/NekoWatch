import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FontAwesome } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import { ShikimoriInfo, KodikInfo, canShowSeries } from '@/types/anime';

interface AnimeInfoProps {
  shikimori: ShikimoriInfo;
  kodik: KodikInfo;
}

export default function AnimeInfo({ shikimori, kodik }: AnimeInfoProps) {
  const { colors } = useThemeStore();
  
  return (
    <View style={[styles.infoBadge, { backgroundColor: colors.card }]}>
        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="tag" size={16} color={colors.text} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {shikimori.kind.toUpperCase() || 'N/A'}
          </Text>
        </View>

        {canShowSeries(shikimori) && (
          <View style={styles.infoItem}>
            <FontAwesome name="video-camera" size={16} color={colors.text} />
            <Text style={[styles.infoText, { color: colors.text }]}>
              {`${kodik.material_data.episodes_aired || '?'}/${kodik.material_data.episodes_total || '?'}`}
            </Text>
          </View>
        )}

        <View style={styles.infoItem}>
          <MaterialCommunityIcons name="calendar" size={16} color={colors.text} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {shikimori?.airedOn?.date.toString() || 'N/A'}
          </Text>
        </View>
        <View style={styles.infoItem}>
          <FontAwesome name="star" size={16} color={colors.text} />
          <Text style={[styles.infoText, { color: colors.text }]}>
            {shikimori?.score || 'N/A'}
          </Text>
        </View>
      </View>
  );
}

const styles = StyleSheet.create({
  
  infoBadge: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingVertical: 8,
    marginHorizontal: 24,
    marginBottom: 4,
    borderRadius: 8,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: 'bold',
  },
});