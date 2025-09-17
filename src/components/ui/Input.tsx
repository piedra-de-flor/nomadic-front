import React, { useState } from 'react';
import {
  View,
  TextInput,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInputProps,
} from 'react-native';
import { UI_CONFIG } from '../../constants';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  isPassword?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  containerStyle?: any;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  isPassword = false,
  leftIcon,
  rightIcon,
  containerStyle,
  style,
  ...props
}) => {
  const [isPasswordVisible, setIsPasswordVisible] = useState(!isPassword);

  const togglePasswordVisibility = () => {
    setIsPasswordVisible(!isPasswordVisible);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={styles.label}>{label}</Text>}
      
      <View style={[
        styles.inputContainer,
        error && styles.inputContainerError,
        props.editable === false && styles.inputContainerDisabled
      ]}>
        {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && styles.inputWithLeftIcon,
            rightIcon && styles.inputWithRightIcon,
            isPassword && styles.inputWithPassword,
            style
          ]}
          secureTextEntry={isPassword && !isPasswordVisible}
          placeholderTextColor={'#7F8C8D'}
          {...props}
        />
        
        {isPassword && (
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={togglePasswordVisibility}
          >
            <Text style={styles.passwordToggleText}>
              {isPasswordVisible ? '숨기기' : '보기'}
            </Text>
          </TouchableOpacity>
        )}
        
        {rightIcon && !isPassword && (
          <View style={styles.rightIcon}>{rightIcon}</View>
        )}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  inputContainerError: {
    borderColor: UI_CONFIG.COLORS.ERROR,
  },
  inputContainerDisabled: {
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    opacity: 0.6,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    paddingVertical: 8,
  },
  inputWithLeftIcon: {
    marginLeft: 8,
  },
  inputWithRightIcon: {
    marginRight: 8,
  },
  inputWithPassword: {
    marginRight: 8,
  },
  leftIcon: {
    marginRight: UI_CONFIG.SPACING.XS,
  },
  rightIcon: {
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  passwordToggle: {
    padding: UI_CONFIG.SPACING.XS,
  },
  passwordToggleText: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '500',
  },
  errorText: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.ERROR,
    marginTop: UI_CONFIG.SPACING.XS,
    marginLeft: UI_CONFIG.SPACING.XS,
  },
});

export default Input;

