import React from 'react';
import { Modal, View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '@/store/theme-store';
import Focusable from '@/components/Focusable';

interface ConfirmationModalProps {
  visible: boolean;
  title: string;
  message: string;
  onCancel: () => void;
  onConfirm: () => void;
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  visible,
  title,
  message,
  onCancel,
  onConfirm,
}) => {
  const { colors } = useThemeStore();

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onCancel}
      statusBarTranslucent={true}

    >
      <View style={[styles.modalOverlay, { backgroundColor: 'rgba(0,0,0,0.35)' }]}>
        <View style={[styles.modalContainer, { backgroundColor: colors.surface }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>{title}</Text>
          <Text style={[styles.modalMessage, { color: colors.subtext }]}>{message}</Text>
          <View style={styles.modalButtons}>
            <Focusable style={[styles.modalButtonCancel, { backgroundColor: colors.surfaceVariant }]} onPress={onCancel}>
              <Text style={[styles.modalButtonText, { color: colors.text }]}>Отмена</Text>
            </Focusable>
            <Focusable style={[styles.modalButtonConfirm, { backgroundColor: colors.primary }]} onPress={onConfirm}>
              <Text style={[styles.modalButtonText, { color: colors.background }]}>Очистить</Text>
            </Focusable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '80%',
    maxWidth: 400,
    borderRadius: 28,
    padding: 24,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: '400',
    marginBottom: 16,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
    letterSpacing: 0.25,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  modalButtonCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginRight: 8,
  },
  modalButtonConfirm: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalButtonText: {
    fontSize: 14,
    fontWeight: '500',
    letterSpacing: 0.1,
  },
});

export default ConfirmationModal;