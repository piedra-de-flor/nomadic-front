import apiClient from '../api/client';
import { API_CONFIG } from '../../constants';
import { storeTokens, storeUserInfo, clearAllStoredData, getStoredToken } from '../storage/tokenStorage';
import { LoginRequest, SignUpRequest, JwtToken, User } from '../../types';

// 로그인
export const login = async (credentials: LoginRequest): Promise<JwtToken> => {
  try {
    const response = await apiClient.post<JwtToken>(API_CONFIG.ENDPOINTS.SIGN_IN, credentials);
    const { accessToken, refreshToken } = response.data;
    
    // 토큰 저장
    await storeTokens(accessToken, refreshToken);
    
    // 사용자 정보 조회 및 저장 (토큰이 있으므로 API 호출 가능)
    try {
      // 토큰에서 사용자 정보를 추출하거나 별도 API 호출
      const userInfo = await getUserInfoFromToken(); // 토큰 기반 사용자 정보 조회
      await storeUserInfo(userInfo);
      console.log('✅ 사용자 정보 조회 성공:', userInfo);
    } catch (userError) {
      console.warn('사용자 정보 조회 실패:', userError);
      // 사용자 정보 조회 실패해도 로그인은 성공으로 처리
      // 임시로 기본 사용자 정보 저장 (이메일에서 이름 추출)
      const emailName = credentials.email.split('@')[0];
      const tempUserInfo = {
        userId: 1,
        name: emailName,
        email: credentials.email,
        role: 'ROLE_USER'
      };
      await storeUserInfo(tempUserInfo);
      console.log('✅ 임시 사용자 정보 저장:', tempUserInfo);
    }
    
    return response.data;
  } catch (error) {
    console.error('로그인 실패:', error);
    throw error;
  }
};

// 회원가입
export const signUp = async (userData: SignUpRequest): Promise<User> => {
  try {
    const response = await apiClient.post<User>(API_CONFIG.ENDPOINTS.SIGN_UP, userData);
    return response.data;
  } catch (error) {
    console.error('회원가입 실패:', error);
    throw error;
  }
};

// 토큰 기반 사용자 정보 조회
export const getUserInfoFromToken = async (): Promise<User> => {
  try {
    console.log('🔍 사용자 정보 조회 API 호출 시작 - GET /user');
    // JWT 토큰이 Authorization 헤더에 자동으로 포함되어 전송됨
    const response = await apiClient.get<User>(API_CONFIG.ENDPOINTS.USER);
    console.log('✅ 사용자 정보 조회 API 응답:', {
      userId: response.data.userId,
      name: response.data.name,
      email: response.data.email,
      role: response.data.role
    });
    return response.data;
  } catch (error) {
    console.error('❌ 토큰 기반 사용자 정보 조회 실패:', error);
    console.error('❌ 에러 상세:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data
    });
    throw error;
  }
};

// 사용자 정보 조회 (userId 기반)
export const getUserInfo = async (userId: number): Promise<User> => {
  try {
    const response = await apiClient.get<User>(`${API_CONFIG.ENDPOINTS.USER}?userId=${userId}`);
    return response.data;
  } catch (error) {
    console.error('사용자 정보 조회 실패:', error);
    throw error;
  }
};

// 사용자 정보 수정
export const updateUserInfo = async (userData: Partial<User>): Promise<User> => {
  try {
    const response = await apiClient.patch<User>(API_CONFIG.ENDPOINTS.USER, userData);
    return response.data;
  } catch (error) {
    console.error('사용자 정보 수정 실패:', error);
    throw error;
  }
};

// 사용자 삭제
export const deleteUser = async (): Promise<number> => {
  try {
    const response = await apiClient.delete<number>(API_CONFIG.ENDPOINTS.USER);
    return response.data;
  } catch (error) {
    console.error('사용자 삭제 실패:', error);
    throw error;
  }
};

// 로그아웃
export const logout = async (): Promise<void> => {
  try {
    // 저장된 모든 데이터 제거
    await clearAllStoredData();
  } catch (error) {
    console.error('로그아웃 실패:', error);
    throw error;
  }
};

// 토큰 유효성 검사
export const validateToken = async (): Promise<boolean> => {
  try {
    // 토큰이 존재하는지만 확인 (API 호출 없이)
    const token = await getStoredToken();
    return token !== null;
  } catch (error) {
    return false;
  }
};
