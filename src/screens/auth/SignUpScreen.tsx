import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigation } from '@react-navigation/native';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

import { Input, Button, Loading, ErrorMessage } from '../../components/ui';
import { UI_CONFIG, VALIDATION, ERROR_MESSAGES } from '../../constants';
import { RootState, AppDispatch } from '../../store';
import { signUpAsync, clearError } from '../../store/slices/authSlice';
import { SignUpRequest } from '../../types';

const { width, height } = Dimensions.get('window');

// 유효성 검사 스키마
const signUpSchema = yup.object({
  name: yup
    .string()
    .required('이름을 입력해주세요')
    .max(VALIDATION.NAME.MAX_LENGTH, `이름은 최대 ${VALIDATION.NAME.MAX_LENGTH}자까지 가능합니다`),
  email: yup
    .string()
    .required('이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: yup
    .string()
    .required('비밀번호를 입력해주세요')
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `비밀번호는 최소 ${VALIDATION.PASSWORD.MIN_LENGTH}자 이상이어야 합니다`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `비밀번호는 최대 ${VALIDATION.PASSWORD.MAX_LENGTH}자까지 가능합니다`),
  confirmPassword: yup
    .string()
    .required('비밀번호 확인을 입력해주세요')
    .oneOf([yup.ref('password')], '비밀번호가 일치하지 않습니다'),
});

const SignUpScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<SignUpRequest & { confirmPassword: string }>({
    resolver: yupResolver(signUpSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: SignUpRequest & { confirmPassword: string }) => {
    try {
      const { confirmPassword, ...signUpData } = data;
      const result = await dispatch(signUpAsync(signUpData)).unwrap();
      
      // 로그인 페이지로 바로 이동
      navigation.goBack();
    } catch (error: any) {
      Alert.alert('회원가입 실패', error || '회원가입에 실패했습니다.');
    }
  };

  const navigateToLogin = () => {
    navigation.goBack();
  };

  const handleClearError = () => {
    dispatch(clearError());
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
      
      {/* 하얀 배경 */}
      <View style={styles.backgroundWhite}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.content}>
              {/* 상단 로고 영역 */}
              <View style={styles.logoSection}>
                <Text style={styles.appTitle}>Nomadic</Text>
                <Text style={styles.appSubtitle}>새로운 여행의 시작</Text>
              </View>

              {/* 회원가입 폼 카드 */}
              <View style={styles.formCard}>
                <View style={styles.form}>
                  <Controller
                    control={control}
                    name="name"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="이름"
                        placeholder="이름을 입력해주세요"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.name?.message}
                        autoCapitalize="words"
                        autoCorrect={false}
                        style={styles.input}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="이메일"
                        placeholder="이메일을 입력해주세요"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.email?.message}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        style={styles.input}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="비밀번호"
                        placeholder="비밀번호를 입력해주세요"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.password?.message}
                        isPassword
                        secureTextEntry
                        style={styles.input}
                      />
                    )}
                  />

                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
                        label="비밀번호 확인"
                        placeholder="비밀번호를 다시 입력해주세요"
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        error={errors.confirmPassword?.message}
                        isPassword
                        secureTextEntry
                        style={styles.input}
                      />
                    )}
                  />

                  {error && (
                    <ErrorMessage
                      message={error}
                      onDismiss={handleClearError}
                    />
                  )}

                  <Button
                    title="회원가입"
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    disabled={!isValid || isLoading}
                    fullWidth
                    style={styles.signUpButton}
                  />
                </View>
              </View>

              {/* 로그인 링크 */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>이미 계정이 있으신가요? </Text>
                <TouchableOpacity onPress={navigateToLogin}>
                  <Text style={styles.loginLink}>로그인하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundWhite: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    paddingTop: 60, // StatusBar 높이 고려
  },
  content: {
    flex: 1,
    paddingHorizontal: UI_CONFIG.SPACING.LG,
    justifyContent: 'flex-start',
    paddingTop: UI_CONFIG.SPACING.LG,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.LG,
    marginTop: UI_CONFIG.SPACING.MD,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333333',
    marginBottom: UI_CONFIG.SPACING.SM,
    letterSpacing: 1,
  },
  appSubtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: '#666666',
    textAlign: 'center',
    fontWeight: '300',
  },
  formCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: UI_CONFIG.SPACING.XL + 8,
    marginBottom: UI_CONFIG.SPACING.XL,
  },
  form: {
    gap: UI_CONFIG.SPACING.MD,
  },
  input: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE_LIGHT,
  },
  signUpButton: {
    marginTop: UI_CONFIG.SPACING.MD,
    backgroundColor: '#333333',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: UI_CONFIG.SPACING.LG,
  },
  footerText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: '#666666',
  },
  loginLink: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: '#333333',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;
