import React from 'react';
import {
  View,
  ActivityIndicator,
  Text,
  StyleSheet,
  Modal,
} from 'react-native';
import { UI_CONFIG } from '../../constants';

interface LoadingProps {
  visible: boolean;
  message?: string;
  overlay?: boolean;
  size?: 'small' | 'large';
}

const Loading: React.FC<LoadingProps> = ({
  visible,
  message = '로딩 중...',
  overlay = false,
  size = 'large',
}) => {
  if (!visible) return null;

  if (overlay) {
    return (
      <Modal
        transparent
        visible={visible}
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <ActivityIndicator
              size={size}
              color={UI_CONFIG.COLORS.PRIMARY}
            />
            {message && <Text style={styles.overlayMessage}>{message}</Text>}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <View style={styles.container}>
      <ActivityIndicator
        size={size}
        color={UI_CONFIG.COLORS.PRIMARY}
      />
      {message && <Text style={styles.message}>{message}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONFIG.SPACING.LG,
  },
  message: {
    marginTop: 16,
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlayContent: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    padding: UI_CONFIG.SPACING.XL,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 120,
    ...UI_CONFIG.SHADOWS.LG,
  },
  overlayMessage: {
    marginTop: 16,
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
});

export default Loading;

