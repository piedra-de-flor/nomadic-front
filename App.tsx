import 'react-native-gesture-handler';
import React, { useEffect } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { store, AppDispatch } from './src/store';
import AppNavigator from './src/navigation/AppNavigator';
import { loadStoredAuth } from './src/store/slices/authSlice';
import { Loading } from './src/components/ui';

// React Query 클라이언트 생성
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5분
    },
  },
});

// 앱 초기화 컴포넌트
const AppInitializer = () => {
  const dispatch = useDispatch<AppDispatch>();

  useEffect(() => {
    // 앱 시작시 저장된 인증 정보 로드 (자동 로그인 비활성화)
    // dispatch(loadStoredAuth());
  }, [dispatch]);

  return <AppNavigator />;
};

export default function App() {
  return (
    <Provider store={store}>
      <QueryClientProvider client={queryClient}>
        <AppInitializer />
        <StatusBar style="auto" />
      </QueryClientProvider>
    </Provider>
  );
}
