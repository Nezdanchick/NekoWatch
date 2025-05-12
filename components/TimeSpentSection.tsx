import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';

export const TimeSpentSection = () => {
  const { colors } = useThemeStore();
  const [totalMinutes, setTotalMinutes] = useState(0);

  useEffect(() => {
    const loadTime = async () => {
      try {
        const savedTime = await AsyncStorage.getItem('app_usage_time');
        if (savedTime) setTotalMinutes(parseInt(savedTime));
      } catch (error) {
        console.error('Ошибка загрузки времени:', error);
      }
    };
    loadTime();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTotalMinutes(prev => {
        const newTime = prev + 1;
        AsyncStorage.setItem('app_usage_time', newTime.toString());
        return newTime;
      });
    }, 60000);

    return () => clearInterval(timer);
  }, []);

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
          Время в приложении
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