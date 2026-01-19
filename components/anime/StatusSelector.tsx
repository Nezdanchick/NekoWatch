import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableWithoutFeedback, Animated, PanResponder } from 'react-native';
import { AnimeStatus, STATUS_COLORS, STATUS_LABELS, ShikimoriInfo } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';

interface StatusSelectorProps {
  anime: ShikimoriInfo;
  visible?: boolean;
  onClose?: () => void;
}

export default function StatusSelector({ anime, visible: externalVisible, onClose }: StatusSelectorProps) {
  const { colors } = useThemeStore();
  const { setAnimeStatus, getAnimeStatus } = useAnimeStore();
  const currentStatus = getAnimeStatus(anime.id);
  const [internalVisible, setInternalVisible] = useState(false);

  const visible = externalVisible !== undefined ? externalVisible : internalVisible;

  const panY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible]);

  const handleModalClose = () => {
    if (onClose) {
      onClose();
    } else {
      setInternalVisible(false);
    }
  }

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dy) > 10;
      },
      onPanResponderMove: Animated.event(
        [null, { dy: panY }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 80) {
          handleModalClose();
        } else {
          Animated.spring(panY, {
            toValue: 0,
            useNativeDriver: false
          }).start();
        }
      }
    })
  ).current;

  const translateY = panY.interpolate({
    inputRange: [-200, 0],
    outputRange: [0, 0],
    extrapolateRight: 'identity'
  });

  const statuses: AnimeStatus[] = ['watching', 'planned', 'completed', 'on_hold', 'dropped'];

  const handleSelect = (status: AnimeStatus) => {
    if (currentStatus === status) {
      setAnimeStatus(anime, status);
    } else {
      setAnimeStatus(anime, status);
    }
    handleModalClose();
  };

  const handleRemove = () => {
    setAnimeStatus(anime, null);
    handleModalClose();
  }

  const handleOpen = () => {
    if (!onClose) {
      setInternalVisible(true);
    }
  }

  const activeColor = currentStatus ? STATUS_COLORS[currentStatus] : colors.text;
  const activeLabel = currentStatus ? STATUS_LABELS[currentStatus] : 'В закладки';

  return (
    <>
      {!onClose && (
        <Pressable
          style={[
            styles.button,
            {
              backgroundColor: currentStatus ? (colors.card) : colors.primary,
              borderWidth: currentStatus ? 2 : 0,
              borderColor: currentStatus ? activeColor : 'transparent'
            }
          ]}
          onPress={handleOpen}
        >
          <MaterialCommunityIcons
            name={currentStatus ? "bookmark-check" : "bookmark-plus-outline"}
            size={22}
            color={currentStatus ? activeColor : '#fff'}
          />
          <Text style={[styles.buttonText, { color: currentStatus ? activeColor : '#fff' }]}>
            {activeLabel}
          </Text>
        </Pressable>
      )}

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={handleModalClose}
      >
        <TouchableWithoutFeedback onPress={handleModalClose}>
          <View style={styles.modalOverlay}>
            <TouchableWithoutFeedback>
              <Animated.View style={[
                styles.modalContent,
                {
                  backgroundColor: colors.card,
                  transform: [{ translateY }]
                }
              ]}>
                <View {...panResponder.panHandlers} style={[styles.dragHandleContainer, { paddingVertical: 10 }]}>
                  <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                  <View style={styles.modalHeader}>
                    <Text
                      style={[styles.modalTitle, { color: colors.text }]}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {anime.russian || anime.name || 'Без названия'}
                    </Text>
                  </View>
                </View>

                {visible && statuses.map((status) => (
                  <Pressable
                    key={status}
                    style={[
                      styles.option,
                      currentStatus === status && { backgroundColor: STATUS_COLORS[status] + '15' }
                    ]}
                    onPress={() => handleSelect(status)}
                  >
                    <View style={[styles.statusIndicator, { borderColor: STATUS_COLORS[status], backgroundColor: currentStatus === status ? STATUS_COLORS[status] : 'transparent' }]}>
                      {currentStatus === status && <MaterialCommunityIcons name="check" size={14} color="#fff" />}
                    </View>
                    <Text style={[
                      styles.optionText,
                      { color: colors.text }
                    ]}>
                      {STATUS_LABELS[status]}
                    </Text>
                  </Pressable>
                ))}

                <Pressable style={styles.removeOption} onPress={handleRemove}>
                  <MaterialCommunityIcons name="delete-outline" size={24} color={colors.subtext} />
                  <Text style={[styles.optionText, { color: colors.subtext }]}>Убрать из списка</Text>
                </Pressable>
              </Animated.View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
    gap: 12,
    minWidth: 140,
    elevation: 2,
  },
  buttonText: {
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 0.1,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    padding: 24,
    paddingTop: 12,
    elevation: 24,
  },
  dragHandleContainer: {
    alignItems: 'center',
  },
  dragHandle: {
    width: 48,
    height: 4,
    borderRadius: 2,
  },
  modalHeader: {
    marginBottom: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '400',
    alignContent: 'center',
    marginTop: 8,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderRadius: 12,
    marginBottom: 4,
  },
  statusIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    fontWeight: '400',
    flex: 1,
  },
  removeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 8,
    marginTop: 12,
    gap: 16,
    opacity: 0.8
  }
});
