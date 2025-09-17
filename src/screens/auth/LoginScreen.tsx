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
import { VALIDATION } from '../../constants';
import { UI_CONFIG } from '../../constants';

import { Input, Button, Loading, ErrorMessage } from '../../components/ui';
import { RootState, AppDispatch } from '../../store';
import { loginAsync, clearError, fetchUserInfoAsync } from '../../store/slices/authSlice';
import { LoginRequest } from '../../types';

const { width, height } = Dimensions.get('window');

// 유효성 검사 스키마
const loginSchema = yup.object({
  email: yup
    .string()
    .required('이메일을 입력해주세요')
    .email('올바른 이메일 형식이 아닙니다'),
  password: yup
    .string()
    .required('비밀번호를 입력해주세요')
    .min(VALIDATION.PASSWORD.MIN_LENGTH, `비밀번호는 최소 ${VALIDATION.PASSWORD.MIN_LENGTH}자 이상이어야 합니다`)
    .max(VALIDATION.PASSWORD.MAX_LENGTH, `비밀번호는 최대 ${VALIDATION.PASSWORD.MAX_LENGTH}자까지 가능합니다`),
});

const LoginScreen = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigation = useNavigation();
  const { isLoading, error } = useSelector((state: RootState) => state.auth);

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginRequest>({
    resolver: yupResolver(loginSchema),
    mode: 'onChange',
  });

  const onSubmit = async (data: LoginRequest) => {
    try {
      console.log('🔐 로그인 시작:', data.email);
      
      // 1. 로그인 API 호출
      const result = await dispatch(loginAsync(data)).unwrap();
      console.log('✅ 로그인 성공, 토큰 획득');
      
      // 2. 로그인 성공 후 사용자 정보 조회 (/user API 호출)
      try {
        console.log('👤 사용자 정보 조회 시작');
        const userInfo = await dispatch(fetchUserInfoAsync()).unwrap();
        console.log('✅ 사용자 정보 조회 성공:', userInfo);
      } catch (userError) {
        console.warn('❌ 사용자 정보 조회 실패:', userError);
        // 사용자 정보 조회 실패해도 로그인은 성공으로 처리
        Alert.alert('알림', '로그인은 성공했지만 사용자 정보를 불러오는데 실패했습니다.');
      }
      
      // 3. 메인 탭 화면으로 이동
      console.log('🏠 메인 화면으로 이동');
      navigation.navigate('MainTabs' as never);
    } catch (error: any) {
      console.error('❌ 로그인 실패:', error);
      Alert.alert('로그인 실패', error || '로그인 중 오류가 발생했습니다.');
    }
  };

  const navigateToSignUp = () => {
    navigation.navigate('SignUp' as never);
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
                <Text style={styles.appSubtitle}>여행의 모든 순간을 함께</Text>
              </View>

              {/* 로그인 폼 카드 */}
              <View style={styles.formCard}>
                <View style={styles.form}>
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, onBlur, value } }) => (
                      <Input
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

                  {error && (
                    <ErrorMessage
                      message={error}
                      onDismiss={handleClearError}
                    />
                  )}

                  <Button
                    title="로그인"
                    onPress={handleSubmit(onSubmit)}
                    loading={isLoading}
                    disabled={!isValid || isLoading}
                    fullWidth
                    style={styles.loginButton}
                  />
                </View>
              </View>

              {/* 회원가입 링크 */}
              <View style={styles.footer}>
                <Text style={styles.footerText}>아직 계정이 없으신가요? </Text>
                <TouchableOpacity onPress={navigateToSignUp}>
                  <Text style={styles.signUpLink}>회원가입하기</Text>
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
    paddingTop: UI_CONFIG.SPACING.XXL + UI_CONFIG.SPACING.XL,
  },
  logoSection: {
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.XXL + 20,
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
  loginButton: {
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
  signUpLink: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: '#333333',
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});

export default LoginScreen;
