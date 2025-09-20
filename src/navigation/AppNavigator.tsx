import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Animated, Dimensions, Text } from 'react-native';
import { useSelector } from 'react-redux';
import { Ionicons } from '@expo/vector-icons';
import { RootState } from '../store';
import { RootStackParamList, MainTabParamList } from '../types';
import CustomTabBar from '../components/CustomTabBar';

const { width } = Dimensions.get('window');

// 화면 컴포넌트들
import SplashScreen from '../screens/SplashScreen';
import LoginScreen from '../screens/auth/LoginScreen';
import SignUpScreen from '../screens/auth/SignUpScreen';
import HomeScreen from '../screens/HomeScreen';
import SearchScreen from '../screens/SearchScreen';
import SearchResultScreen from '../screens/SearchResultScreen';
import RecommendScreen from '../screens/RecommendScreen';
import PlanScreen from '../screens/PlanScreen';
import PlanDetailScreen from '../screens/plan/PlanDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';
import AccommodationDetailScreen from '../screens/accommodation/AccommodationDetailScreen';
import RecommendDetailScreen from '../screens/recommend/RecommendDetailScreen';
import RecommendSearchScreen from '../screens/recommend/RecommendSearchScreen';
import RecommendSearchResultScreen from '../screens/recommend/RecommendSearchResultScreen';
import ReportScreen from '../screens/report/ReportScreen';
import ReviewEditScreen from '../screens/review/ReviewEditScreen';
import ReviewDeleteScreen from '../screens/review/ReviewDeleteScreen';
import DetailPlanCreateScreen from '../screens/plan/DetailPlanCreateScreen';
import DetailPlanEditScreen from '../screens/plan/DetailPlanEditScreen';
import PlanCreateScreen from '../screens/plan/PlanCreateScreen';
import PlanEditScreen from '../screens/plan/PlanEditScreen';
import PlanShareViewScreen from '../screens/plan/PlanShareViewScreen';
import PlanShareRequestScreen from '../screens/plan/PlanShareRequestScreen';
import PlanHistoryScreen from '../screens/plan/PlanHistoryScreen';
import MyShareRequestScreen from '../screens/plan/MyShareRequestScreen';
import MapViewScreen from '../screens/plan/MapViewScreen';
import TravelDiaryWriteScreen from '../screens/recommend/TravelDiaryWriteScreen';
import TravelDiaryContentEditScreen from '../screens/recommend/TravelDiaryContentEditScreen';
import TravelDiaryEditScreen from '../screens/recommend/TravelDiaryEditScreen';

const Stack = createStackNavigator();
const Tab = createBottomTabNavigator();

// 메인 탭 네비게이터
const MainTabNavigator = () => {
  return (
    <Tab.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{}}
      />
      <Tab.Screen
        name="Recommend"
        component={RecommendScreen}
        options={{}}
      />
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{}}
      />
      <Tab.Screen
        name="Plan"
        component={PlanScreen}
        options={{}}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{}}
      />
      <Tab.Screen
        name="SearchResult"
        component={SearchResultScreen}
        options={{
          tabBarButton: () => null, // 탭바에서 숨김
        }}
      />
      <Tab.Screen
        name="AccommodationDetail"
        component={AccommodationDetailScreen}
        options={{
          tabBarButton: () => null, // 탭바에서 숨김
        }}
      />
      <Tab.Screen
        name="RecommendSearch"
        component={RecommendSearchScreen}
        options={{
          tabBarButton: () => null, // 탭바에서 숨김
        }}
      />
      <Tab.Screen
        name="RecommendSearchResult"
        component={RecommendSearchResultScreen}
        options={{
          tabBarButton: () => null, // 탭바에서 숨김
        }}
      />
    </Tab.Navigator>
  );
};

// 인증 스택 네비게이터
const AuthStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false,
      gestureEnabled: false // iOS 스와이프 제스처로 뒤로가기 비활성화
    }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="SignUp" component={SignUpScreen} />
    </Stack.Navigator>
  );
};

// 메인 스택 네비게이터 (탭 네비게이터 포함)
const MainStackNavigator = () => {
  return (
    <Stack.Navigator screenOptions={{ 
      headerShown: false,
      gestureEnabled: false // iOS 스와이프 제스처로 뒤로가기 비활성화
    }}>
      <Stack.Screen name="MainTabs" component={MainTabNavigator} />
      <Stack.Screen 
        name="Login" 
        component={LoginScreen} 
        options={{ gestureEnabled: false }} // 로그인 화면에서 스와이프 제스처 비활성화
      />
      <Stack.Screen 
        name="SignUp" 
        component={SignUpScreen} 
        options={{ gestureEnabled: false }} // 회원가입 화면에서 스와이프 제스처 비활성화
      />
      <Stack.Screen name="PlanDetail" component={PlanDetailScreen} />
      <Stack.Screen name="PlanCreate" component={PlanCreateScreen} />
      <Stack.Screen name="PlanEdit" component={PlanEditScreen} />
      <Stack.Screen name="PlanShareView" component={PlanShareViewScreen} />
      <Stack.Screen name="PlanShareRequest" component={PlanShareRequestScreen} />
      <Stack.Screen name="PlanHistory" component={PlanHistoryScreen} />
      <Stack.Screen name="MyShareRequest" component={MyShareRequestScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="ReviewEdit" component={ReviewEditScreen} />
      <Stack.Screen name="ReviewDelete" component={ReviewDeleteScreen} />
      <Stack.Screen name="DetailPlanCreate" component={DetailPlanCreateScreen} />
      <Stack.Screen name="DetailPlanEdit" component={DetailPlanEditScreen} />
      <Stack.Screen name="MapView" component={MapViewScreen} />
      <Stack.Screen name="TravelDiaryWrite" component={TravelDiaryWriteScreen} />
      <Stack.Screen name="TravelDiaryContentEdit" component={TravelDiaryContentEditScreen} />
      <Stack.Screen name="TravelDiaryEdit" component={TravelDiaryEditScreen} />
      <Stack.Screen name="RecommendDetail" component={RecommendDetailScreen} />
      {/* 추가 스크린 (예: 상세 페이지) */}
    </Stack.Navigator>
  );
};

// 메인 앱 네비게이터
const AppNavigator = () => {
  const [showSplash, setShowSplash] = useState(true);
  const splashAnim = useRef(new Animated.Value(0)).current;
  const mainScreenAnim = useRef(new Animated.Value(width)).current;

  const handleSplashFinish = () => {
    // 동시에 두 애니메이션 실행
    Animated.parallel([
      // 스플래시 화면 슬라이드 아웃
      Animated.timing(splashAnim, {
        toValue: -width,
        duration: 800,
        useNativeDriver: true,
      }),
      // 메인 화면 슬라이드 인
      Animated.timing(mainScreenAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      })
    ]).start(() => {
      // 애니메이션 완료 후 스플래시 화면 숨김
      setShowSplash(false);
    });
  };

  return (
    <View style={{ flex: 1 }}>
      {/* 스플래시 화면 */}
      {showSplash && (
        <Animated.View 
          style={[
            { 
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 2
            },
            {
              transform: [{ translateX: splashAnim }]
            }
          ]}
        >
          <SplashScreen onFinish={handleSplashFinish} />
        </Animated.View>
      )}

      {/* 메인 화면 */}
      <Animated.View 
        style={[
          { flex: 1 },
          {
            transform: [{ translateX: mainScreenAnim }]
          }
        ]}
      >
        <NavigationContainer>
          <MainStackNavigator />
          {/* 나중에 인증이 필요할 때 사용할 코드:
          {isAuthenticated ? <MainStackNavigator /> : <AuthStackNavigator />}
          */}
        </NavigationContainer>
      </Animated.View>
    </View>
  );
};

export default AppNavigator;
