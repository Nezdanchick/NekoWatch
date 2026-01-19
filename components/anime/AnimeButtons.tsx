import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, Pressable, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';
import { ShikimoriInfo, KodikInfo, MISSING_POSTER_URL } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { useRouter } from 'expo-router';
import StatusSelector from './StatusSelector';

interface AnimeButtonsProps {
  shikimori: ShikimoriInfo;
  kodik?: KodikInfo[];
}

export default function AnimeButtons({ shikimori, kodik }: AnimeButtonsProps) {
  const { colors } = useThemeStore();
  const [isTranslationsVisible, setTranslationsVisible] = useState(false);
  const [availablePlayers, setAvailablePlayers] = useState<{ key: 'kodik' | 'collaps' | 'flix'; title: string; link: string }[]>([]);
  const [collapsUrl, setCollapsUrl] = useState<string | null>(null);
  const animationHeight = useRef(new Animated.Value(0)).current;
  const animationInProgress = useRef(false);
  const router = useRouter();

  const { addToWatchHistory } = useAnimeStore();

  const imageUrl = shikimori?.poster?.mainUrl || MISSING_POSTER_URL;


  useEffect(() => {
    const kpId = (kodik && kodik.length > 0) ? kodik[0].kinopoisk_id : null;
    const nextPlayers: { key: 'kodik' | 'collaps' | 'flix'; title: string; link: string }[] = [];

    if (kodik && kodik.length > 0 && kodik[0]?.link) {
      nextPlayers.push({ key: 'kodik', title: 'Kodik', link: kodik[0].link });
    }

    async function checkCollaps() {
      if (!kpId) return;
      const url = `https://neko-collaps.deno.dev/?kinopoisk_id=${kpId}`;
      try {
        const resp = await fetch(url);
        if (resp.ok) setCollapsUrl(url);
      } catch {}
    }

    checkCollaps();
    setAvailablePlayers(nextPlayers);
  }, [shikimori?.id, kodik]);

  useEffect(() => {
    const nextPlayers: { key: 'kodik' | 'collaps' | 'flix'; title: string; link: string }[] = [];
    if (kodik && kodik.length > 0 && kodik[0]?.link) {
      nextPlayers.push({ key: 'kodik', title: 'Kodik', link: kodik[0].link });
    }
    if (collapsUrl) {
      nextPlayers.push({ key: 'collaps', title: 'Collaps', link: collapsUrl });
    }
    setAvailablePlayers(nextPlayers);
  }, [collapsUrl, kodik]);

  useEffect(() => {
    if (isTranslationsVisible) {
      Animated.timing(animationHeight, {
        toValue: getTargetHeight(),
        duration: 300,
        useNativeDriver: false,
      }).start();
    }
  }, [isTranslationsVisible, availablePlayers.length]);

  const handlePlay = () => {
    if (kodik && kodik.length > 0) handleWatchPress(kodik[0].link);
  };

  const handleWatchPress = (link: string) => {
    if (shikimori) addToWatchHistory(shikimori.id, shikimori.russian || shikimori.name, imageUrl, link);
    router.push({
      pathname: '/screens/player',
      params: { id: shikimori.id.toString(), kodikUrl: link },
    });
  };

  const getTargetHeight = () => availablePlayers.length * 56; 

  const toggleTranslationsVisibility = () => {
    if (animationInProgress.current) return;
    
    setTranslationsVisible((prev) => {
      const nextState = !prev;
      animationInProgress.current = true;
      Animated.timing(animationHeight, {
        toValue: nextState ? getTargetHeight() : 0,
        duration: 300,
        useNativeDriver: false,
      }).start(() => {
        setTranslationsVisible(nextState);
        animationInProgress.current = false;
      });
      return nextState;
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.primaryActions}>
          <View style={{ flex: 1, marginRight: 8 }}>
            <StatusSelector anime={shikimori} />
          </View>
          
          {availablePlayers.some(p => p.key === 'kodik') && (
            <Pressable
                style={[
                styles.fab,
                { backgroundColor: colors.primary },
                ]}
                onPress={handlePlay}
            >
                <MaterialCommunityIcons
                name="play"
                size={24}
                color={'#fff'}
                />
            </Pressable>
          )}
      </View>

      <Pressable
          style={[
            styles.dropdownButton,
            { backgroundColor: colors.card },
            !availablePlayers.length && { opacity: 0.5 }
          ]}
          onPress={toggleTranslationsVisibility}
          disabled={!availablePlayers.length}
        >
           <Text style={[styles.dropdownText, { color: colors.text }]}>
            {availablePlayers.length ? `Плееры` : 'Нет доступных плееров'}
          </Text>
          {availablePlayers.length > 0 && (
            <MaterialCommunityIcons
              name={isTranslationsVisible ? 'chevron-up' : 'chevron-down'}
              size={24}
              color={colors.text}
            />
          )}
      </Pressable>

      <Animated.View
        style={[
          styles.animatedList,
          {
            height: animationHeight,
          },
        ]}
      >
        {availablePlayers.map((player, index) => (
          <Pressable
            key={`${player.key}-${index}`}
            style={[
              styles.playerOption,
              { backgroundColor: colors.card },
              index > 0 && { borderTopWidth: 1, borderTopColor: colors.background}
            ]}
            onPress={() => handleWatchPress(player.link)}
          >
            <Text style={[styles.playerText, { color: colors.text }]}>
              {player.title}
            </Text>
             <MaterialCommunityIcons name="arrow-right" size={20} color={colors.subtext} />
          </Pressable>
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
  },
  primaryActions: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 16,
  },
  fab: {
      width: 56,
      height: 56,
      borderRadius: 16, 
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginBottom: 8,
  },
  dropdownText: {
    fontSize: 16,
    fontWeight: '500',
  },
  animatedList: {
    overflow: 'hidden',
    borderRadius: 16,
  },
  playerOption: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    paddingHorizontal: 16,
  },
  playerText: {
    fontSize: 16,
    flex: 1,
  },
});
