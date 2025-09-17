import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { UI_CONFIG } from '../constants';
import { RootState, AppDispatch } from '../store';
import { fetchUserInfoAsync } from '../store/slices/authSlice';

// 사용자 정보 타입 정의
interface UserInfo {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
  joinDate: string;
  isLoggedIn: boolean;
}

// 메뉴 아이템 타입 정의
interface MenuItem {
  id: string;
  title: string;
  icon: string;
  onPress: () => void;
}

const ProfileScreen = ({ navigation }: any) => {
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux에서 인증 상태 가져오기
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // 데모 사용자 정보 (로그인 안된 상태용)
  const [userInfo, setUserInfo] = useState<UserInfo>({
    id: 1,
    name: '김여행러',
    email: 'traveler@example.com',
    profileImage: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
    joinDate: '2024-01-15',
    isLoggedIn: isAuthenticated, // Redux 상태 사용
  });

  // Redux 상태 변경 시 userInfo 업데이트
  useEffect(() => {
    if (isAuthenticated && user) {
      setUserInfo({
        id: user.userId || user.id || 1,
        name: user.name || '여행자',
        email: user.email || 'user@example.com',
        profileImage: user.profileImage || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face',
        joinDate: user.joinDate || '2024-01-01',
        isLoggedIn: true,
      });
    } else {
      setUserInfo(prev => ({
        ...prev,
        isLoggedIn: false,
      }));
    }
  }, [isAuthenticated, user]);

  // 컴포넌트 마운트 시 사용자 정보 조회
  useEffect(() => {
    if (isAuthenticated) {
      // 사용자 정보 조회
      dispatch(fetchUserInfoAsync());
    }
  }, [isAuthenticated, dispatch]);

  // 사용자 정보가 없으면 다시 조회
  useEffect(() => {
    if (isAuthenticated && !user?.name) {
      console.log('🔍 ProfileScreen 사용자 정보가 없어서 다시 조회합니다');
      dispatch(fetchUserInfoAsync());
    }
  }, [isAuthenticated, user, dispatch]);

  // 사용자 정보 디버깅
  useEffect(() => {
    console.log('👤 ProfileScreen 사용자 정보:', { isAuthenticated, user, userInfo });
  }, [isAuthenticated, user, userInfo]);

  // 메뉴 아이템들
  const menuItems: MenuItem[] = [
    {
      id: 'travel_posts',
      title: '내 여행기',
      icon: 'book-outline',
      onPress: () => {
        if (!userInfo.isLoggedIn) {
          Alert.alert('로그인 필요', '여행기를 확인하려면 로그인해주세요.', [
            { text: '취소', style: 'cancel' },
            { text: '로그인', onPress: handleLogin }
          ]);
        } else {
          Alert.alert('내 여행기', '내 여행기 페이지로 이동합니다.');
        }
      },
    },
    {
      id: 'reviews',
      title: '내 리뷰',
      icon: 'star-outline',
      onPress: () => {
        if (!userInfo.isLoggedIn) {
          Alert.alert('로그인 필요', '리뷰를 확인하려면 로그인해주세요.', [
            { text: '취소', style: 'cancel' },
            { text: '로그인', onPress: handleLogin }
          ]);
        } else {
          Alert.alert('내 리뷰', '내 리뷰 페이지로 이동합니다.');
        }
      },
    },
    {
      id: 'reservations',
      title: '내 예약',
      icon: 'card-outline',
      onPress: () => {
        if (!userInfo.isLoggedIn) {
          Alert.alert('로그인 필요', '예약을 확인하려면 로그인해주세요.', [
            { text: '취소', style: 'cancel' },
            { text: '로그인', onPress: handleLogin }
          ]);
        } else {
          Alert.alert('내 예약', '내 예약 페이지로 이동합니다.');
        }
      },
    },
    {
      id: 'share_requests',
      title: '내 공유 요청',
      icon: 'people-outline',
      onPress: () => {
        if (!userInfo.isLoggedIn) {
          Alert.alert('로그인 필요', '공유 요청을 확인하려면 로그인해주세요.', [
            { text: '취소', style: 'cancel' },
            { text: '로그인', onPress: handleLogin }
          ]);
        } else {
          navigation.navigate('MyShareRequest');
        }
      },
    },
    {
      id: 'notices',
      title: '공지사항',
      icon: 'megaphone-outline',
      onPress: () => Alert.alert('공지사항', '공지사항 페이지로 이동합니다.'),
    },
  ];

  const handleProfileEdit = () => {
    Alert.alert('프로필 편집', '프로필 편집 페이지로 이동합니다.');
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const formatJoinDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getFullYear()}년 ${date.getMonth() + 1}월 가입`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* 사용자 정보 섹션 */}
        <View style={styles.userSection}>
          {userInfo.isLoggedIn ? (
            <>
              <View style={styles.profileContainer}>
                <View style={styles.profileImageContainer}>
                  <Image
                    source={{ uri: userInfo.profileImage }}
                    style={styles.profileImage}
                  />
                </View>
                <View style={styles.userInfoContainer}>
                  <Text style={styles.userName}>{userInfo.name}</Text>
                  <Text style={styles.userEmail}>{userInfo.email}</Text>
                  <Text style={styles.joinDate}>{formatJoinDate(userInfo.joinDate)}</Text>
                </View>
                <TouchableOpacity style={styles.editButton} onPress={handleProfileEdit}>
                  <Ionicons name="create-outline" size={20} color="#FF6B35" />
                </TouchableOpacity>
              </View>

            </>
          ) : (
            <View style={styles.loginPrompt}>
              <Ionicons name="person-circle-outline" size={80} color="#BDC3C7" />
              <Text style={styles.loginTitle}>로그인이 필요합니다</Text>
              <Text style={styles.loginSubtitle}>여행 계획을 관리하고 리뷰를 작성해보세요</Text>
              <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                <Text style={styles.loginButtonText}>로그인하기</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 메뉴 섹션 */}
        <View style={styles.menuSection}>
          {/* 로그인 필요한 서비스들 */}
          {userInfo.isLoggedIn ? (
            // 로그인된 상태: 모든 메뉴 표시
            menuItems.map((item, index) => (
              <TouchableOpacity
                key={item.id}
                style={[
                  styles.menuItem,
                  index === menuItems.length - 1 && styles.lastMenuItem
                ]}
                onPress={item.onPress}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name={item.icon as any} size={24} color="#7F8C8D" />
                  </View>
                  <Text style={styles.menuTitle}>{item.title}</Text>
                </View>
                <View style={styles.menuItemRight}>
                  <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
                </View>
              </TouchableOpacity>
            ))
          ) : (
            // 로그인 안된 상태: 로그인 필요 서비스 하나로 합치기
            <>
              <TouchableOpacity
                style={[styles.menuItem, styles.loginRequiredMenuItem]}
                onPress={handleLogin}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="lock-closed" size={24} color="#7F8C8D" />
                  </View>
                  <Text style={styles.menuTitle}>내 여행 관리</Text>
                </View>
                <View style={styles.menuItemRight}>
                  <Text style={styles.loginRequiredText}>로그인 필요</Text>
                  <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
                </View>
              </TouchableOpacity>
              
              {/* 공지사항 */}
              <TouchableOpacity
                style={styles.menuItem}
                onPress={() => Alert.alert('공지사항', '공지사항 페이지로 이동합니다.')}
              >
                <View style={styles.menuItemLeft}>
                  <View style={styles.menuIconContainer}>
                    <Ionicons name="megaphone-outline" size={24} color="#7F8C8D" />
                  </View>
                  <Text style={styles.menuTitle}>공지사항</Text>
                </View>
                <View style={styles.menuItemRight}>
                  <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
                </View>
              </TouchableOpacity>
            </>
          )}
          
          {/* 설정과 고객센터는 항상 표시 */}
          <TouchableOpacity
            style={styles.menuItem}
            onPress={() => Alert.alert('설정', '설정 페이지로 이동합니다.')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="settings-outline" size={24} color="#7F8C8D" />
              </View>
              <Text style={styles.menuTitle}>설정</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.menuItem, styles.lastMenuItem]}
            onPress={() => Alert.alert('고객센터', '고객센터 페이지로 이동합니다.')}
          >
            <View style={styles.menuItemLeft}>
              <View style={styles.menuIconContainer}>
                <Ionicons name="headset-outline" size={24} color="#7F8C8D" />
              </View>
              <Text style={styles.menuTitle}>고객센터</Text>
            </View>
            <View style={styles.menuItemRight}>
              <Ionicons name="chevron-forward" size={20} color="#BDC3C7" />
            </View>
          </TouchableOpacity>
        </View>

        {/* 앱 정보 섹션 */}
        <View style={styles.appInfoSection}>
          <Text style={styles.appInfoText}>Nomadic v1.0.0</Text>
          <Text style={styles.appInfoText}>© 2024 Nomadic. All rights reserved.</Text>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  scrollView: {
    flex: 1,
  },
  // 사용자 정보 섹션
  userSection: {
    backgroundColor: '#FFFFFF',
    paddingTop: 100,
    paddingBottom: 30,
    paddingHorizontal: 20,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  profileImageContainer: {
    marginRight: 16,
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  userInfoContainer: {
    flex: 1,
  },
  userName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  joinDate: {
    fontSize: 14,
    color: '#BDC3C7',
  },
  editButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#FFF5F2',
  },
  // 로그인 프롬프트
  loginPrompt: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loginTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  loginSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  // 메뉴 섹션
  menuSection: {
    backgroundColor: '#FFFFFF',
    marginTop: 8,
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  lastMenuItem: {
    borderBottomWidth: 0,
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  menuIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  menuTitle: {
    fontSize: 16,
    color: '#333333',
    fontWeight: '500',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // 앱 정보 섹션
  appInfoSection: {
    alignItems: 'center',
    paddingVertical: 20,
    marginTop: 20,
  },
  appInfoText: {
    fontSize: 12,
    color: '#BDC3C7',
    marginBottom: 4,
  },
  bottomSpacing: {
    height: 100,
  },
  // 로그인 필요 메뉴 아이템
  loginRequiredMenuItem: {
    backgroundColor: '#FFF5F2',
  },
  loginRequiredText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
    marginRight: 8,
  },
});

export default ProfileScreen;