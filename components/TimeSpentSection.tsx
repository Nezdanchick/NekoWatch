import { StyleSheet, Text, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import { useTimeStore } from '@/store/time-store';

export const TimeSpentSection = () => {
  const { colors } = useThemeStore();
  const { totalMinutes } = useTimeStore();

  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  return (
    <View style={[styles.section, { backgroundColor: colors.card }]}>
      <View style={styles.iconContainer}>
        <MaterialCommunityIcons 
          name="clock" 
          size={24} 
          color={colors.primary} 
        />
      </View>
      <View style={styles.textContainer}>
        <Text style={[styles.title, { color: colors.text }]}>
          Время просмотра
        </Text>
        <Text style={[styles.time, { color: colors.primary }]}>
          {hours} ч {minutes} мин
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    marginVertical: 8,
    height: 60
  },
  iconContainer: {
    width: 40,
    alignItems: 'center',
    marginRight: 16,
  },
  textContainer: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  time: {
    fontSize: 20,
    fontWeight: 'bold',
  },
});
