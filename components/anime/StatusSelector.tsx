import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Modal, TouchableWithoutFeedback } from 'react-native';
import { AnimeStatus, STATUS_COLORS, STATUS_LABELS, ShikimoriInfo } from '@/types/anime';
import { useAnimeStore } from '@/store/anime-store';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useThemeStore } from '@/store/theme-store';

interface StatusSelectorProps {
  anime: ShikimoriInfo;
}

export default function StatusSelector({ anime }: StatusSelectorProps) {
  const { colors } = useThemeStore();
  const { setAnimeStatus, getAnimeStatus } = useAnimeStore();
  const currentStatus = getAnimeStatus(anime.id);
  const [visible, setVisible] = useState(false);

  const statuses: AnimeStatus[] = ['watching', 'planned', 'completed', 'on_hold', 'dropped'];

  const handleSelect = (status: AnimeStatus) => {
    if (currentStatus === status) {
        setAnimeStatus(anime, status);
    } else {
        setAnimeStatus(anime, status);
    }
    setVisible(false);
  };

  const handleRemove = () => {
      setAnimeStatus(anime, null);
      setVisible(false);
  }

  const activeColor = currentStatus ? STATUS_COLORS[currentStatus] : colors.text;
  const activeLabel = currentStatus ? STATUS_LABELS[currentStatus] : 'В закладки';
  
  return (
    <>
      <Pressable 
        style={[
            styles.button, 
            { 
                backgroundColor: currentStatus ? (colors.card) : colors.primary,
                borderWidth: currentStatus ? 2 : 0,
                borderColor: currentStatus ? activeColor : 'transparent'
            }
        ]} 
        onPress={() => setVisible(true)}
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

      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={() => setVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setVisible(false)}>
            <View style={styles.modalOverlay}>
                <TouchableWithoutFeedback>
                    <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
                        <View style={styles.dragHandleContainer}>
                            <View style={[styles.dragHandle, { backgroundColor: colors.border }]} />
                        </View>
                        <View style={styles.modalHeader}>
                             <Text style={[styles.modalTitle, { color: colors.text }]}>Статус просмотра</Text>
                        </View>
                        
                        {statuses.map((status) => (
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
                    </View>
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
      borderRadius: 24, 
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
      backgroundColor: 'rgba(0,0,0,0.6)',
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
      marginBottom: 16,
  },
  dragHandle: {
      width: 32,
      height: 4,
      borderRadius: 2,
      opacity: 0.4,
  },
  modalHeader: {
      marginBottom: 16,
  },
  modalTitle: {
      fontSize: 22,
      fontWeight: '400', 
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
