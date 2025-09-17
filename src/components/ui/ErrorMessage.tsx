import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { UI_CONFIG } from '../../constants';

interface ErrorMessageProps {
  message: string;
  visible?: boolean;
  onDismiss?: () => void;
  type?: 'error' | 'warning' | 'info';
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  visible = true,
  onDismiss,
  type = 'error',
}) => {
  if (!visible || !message) return null;

  const getBackgroundColor = () => {
    switch (type) {
      case 'error':
        return UI_CONFIG.COLORS.ERROR;
      case 'warning':
        return UI_CONFIG.COLORS.WARNING;
      case 'info':
        return UI_CONFIG.COLORS.SUCCESS;
      default:
        return UI_CONFIG.COLORS.ERROR;
    }
  };

  const getTextColor = () => {
    return UI_CONFIG.COLORS.TEXT_WHITE;
  };

  return (
    <View style={[
      styles.container,
      { backgroundColor: getBackgroundColor() }
    ]}>
      <Text style={[styles.message, { color: getTextColor() }]}>
        {message}
      </Text>
      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={onDismiss}
        >
          <Text style={[styles.dismissText, { color: getTextColor() }]}>
            ✕
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  message: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
  },
  dismissButton: {
    marginLeft: 8,
    padding: 4,
  },
  dismissText: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default ErrorMessage;

