import AsyncStorage from '@react-native-async-storage/async-storage';
import { APP_CONFIG } from '../../constants';

// 토큰 저장
export const storeTokens = async (accessToken: string, refreshToken: string): Promise<void> => {
  try {
    await AsyncStorage.multiSet([
      [APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN, accessToken],
      [APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN, refreshToken],
    ]);
  } catch (error) {
    console.error('토큰 저장 실패:', error);
    throw error;
  }
};

// 액세스 토큰 가져오기
export const getStoredToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN);
    return token;
  } catch (error) {
    console.error('토큰 조회 실패:', error);
    return null;
  }
};

// 리프레시 토큰 가져오기
export const getRefreshToken = async (): Promise<string | null> => {
  try {
    const token = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN);
    return token;
  } catch (error) {
    console.error('리프레시 토큰 조회 실패:', error);
    return null;
  }
};

// 토큰들 제거
export const removeStoredTokens = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
    ]);
  } catch (error) {
    console.error('토큰 제거 실패:', error);
    throw error;
  }
};

// 사용자 정보 저장
export const storeUserInfo = async (userInfo: any): Promise<void> => {
  try {
    await AsyncStorage.setItem(APP_CONFIG.STORAGE_KEYS.USER_INFO, JSON.stringify(userInfo));
  } catch (error) {
    console.error('사용자 정보 저장 실패:', error);
    throw error;
  }
};

// 사용자 정보 가져오기
export const getStoredUserInfo = async (): Promise<any | null> => {
  try {
    const userInfo = await AsyncStorage.getItem(APP_CONFIG.STORAGE_KEYS.USER_INFO);
    return userInfo ? JSON.parse(userInfo) : null;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    return null;
  }
};

// 사용자 정보 제거
export const removeStoredUserInfo = async (): Promise<void> => {
  try {
    await AsyncStorage.removeItem(APP_CONFIG.STORAGE_KEYS.USER_INFO);
  } catch (error) {
    console.error('사용자 정보 제거 실패:', error);
    throw error;
  }
};

// 모든 저장된 데이터 제거 (로그아웃시)
export const clearAllStoredData = async (): Promise<void> => {
  try {
    await AsyncStorage.multiRemove([
      APP_CONFIG.STORAGE_KEYS.ACCESS_TOKEN,
      APP_CONFIG.STORAGE_KEYS.REFRESH_TOKEN,
      APP_CONFIG.STORAGE_KEYS.USER_INFO,
    ]);
  } catch (error) {
    console.error('저장된 데이터 제거 실패:', error);
    throw error;
  }
};






