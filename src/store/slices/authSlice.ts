import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, LoginRequest, SignUpRequest, JwtToken } from '../../types';
import { login, signUp, getUserInfo, updateUserInfo, deleteUser, logout, validateToken, getUserInfoFromToken } from '../../services/auth/authService';
import { getStoredToken, getStoredUserInfo, storeUserInfo } from '../../services/storage/tokenStorage';

// 초기 상태
interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: false,
  error: null,
};

// 비동기 액션들
export const loginAsync = createAsyncThunk(
  'auth/login',
  async (credentials: LoginRequest, { rejectWithValue }) => {
    try {
      const tokenData = await login(credentials);
      return tokenData;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '로그인에 실패했습니다.');
    }
  }
);

export const signUpAsync = createAsyncThunk(
  'auth/signUp',
  async (userData: SignUpRequest, { rejectWithValue }) => {
    try {
      const user = await signUp(userData);
      return user;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '회원가입에 실패했습니다.');
    }
  }
);

export const loadStoredAuth = createAsyncThunk(
  'auth/loadStoredAuth',
  async (_, { rejectWithValue }) => {
    try {
      const token = await getStoredToken();
      
      if (token) {
        // 토큰이 있으면 사용자 정보를 API로 조회
        try {
          const userInfo = await getUserInfoFromToken();
          await storeUserInfo(userInfo);
          return { token, user: userInfo };
        } catch (userError) {
          console.warn('저장된 토큰으로 사용자 정보 조회 실패:', userError);
          // 사용자 정보 조회 실패 시 저장된 정보 사용
          const storedUserInfo = await getStoredUserInfo();
          if (storedUserInfo) {
            return { token, user: storedUserInfo };
          }
        }
      }
      
      return null;
    } catch (error: any) {
      return rejectWithValue('저장된 인증 정보를 불러오는데 실패했습니다.');
    }
  }
);

export const fetchUserInfoAsync = createAsyncThunk(
  'auth/fetchUserInfo',
  async (_, { rejectWithValue }) => {
    try {
      const userInfo = await getUserInfoFromToken();
      await storeUserInfo(userInfo);
      return userInfo;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '사용자 정보 조회에 실패했습니다.');
    }
  }
);

export const updateUserAsync = createAsyncThunk(
  'auth/updateUser',
  async (userData: Partial<User>, { rejectWithValue }) => {
    try {
      const updatedUser = await updateUserInfo(userData);
      await storeUserInfo(updatedUser);
      return updatedUser;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || '사용자 정보 수정에 실패했습니다.');
    }
  }
);

export const logoutAsync = createAsyncThunk(
  'auth/logout',
  async (_, { rejectWithValue }) => {
    try {
      await logout();
    } catch (error: any) {
      return rejectWithValue('로그아웃에 실패했습니다.');
    }
  }
);

// 슬라이스 생성
const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
    demoLogin: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.token = 'demo-token';
      state.isAuthenticated = true;
      state.error = null;
      state.isLoading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // 로그인
      .addCase(loginAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.token = action.payload.accessToken;
        state.isAuthenticated = true;
        state.error = null;
        // 사용자 정보는 getUserInfo에서 별도로 설정됨
        // 로그인 성공 후 사용자 정보 조회를 위해 fetchUserInfoAsync 호출 필요
      })
      .addCase(loginAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
      })
      
      // 회원가입
      .addCase(signUpAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signUpAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(signUpAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 저장된 인증 정보 로드
      .addCase(loadStoredAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(loadStoredAuth.fulfilled, (state, action) => {
        state.isLoading = false;
        if (action.payload) {
          state.token = action.payload.token;
          state.user = action.payload.user;
          state.isAuthenticated = true;
        }
      })
      .addCase(loadStoredAuth.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        state.isAuthenticated = false;
        state.token = null;
        state.user = null;
      })
      
      // 사용자 정보 조회
      .addCase(fetchUserInfoAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserInfoAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
        console.log('✅ Redux에 사용자 정보 저장 완료:', {
          userId: action.payload.userId,
          name: action.payload.name,
          email: action.payload.email,
          role: action.payload.role
        });
      })
      .addCase(fetchUserInfoAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
        console.error('❌ Redux 사용자 정보 저장 실패:', action.payload);
      })
      
      // 사용자 정보 수정
      .addCase(updateUserAsync.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserAsync.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateUserAsync.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // 로그아웃
      .addCase(logoutAsync.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
        state.isLoading = false;
      });
  },
});

export const { clearError, setLoading, demoLogin } = authSlice.actions;
export default authSlice.reducer;

