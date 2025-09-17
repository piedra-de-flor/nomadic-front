import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector, useDispatch } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { UI_CONFIG } from '../constants';
import { RootState, AppDispatch } from '../store';
import { fetchUserInfoAsync } from '../store/slices/authSlice';
import { getAllPlans, deletePlan } from '../services/plan/planService';
import { PlanDto } from '../types';

const { width } = Dimensions.get('window');

// Plan 타입 정의
interface Plan {
  id: number;
  place: string;
  partner: string;
  styles: string[];
  startDay: string;
  endDay: string;
  status: 'upcoming' | 'past';
  image: string;
}

const PlanScreen = ({ navigation, route }: any) => {
  const [selectedTab, setSelectedTab] = useState<'upcoming' | 'past'>('upcoming');
  const [plans, setPlans] = useState<Plan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  
  // Redux에서 인증 상태 가져오기
  const { isAuthenticated, user, isLoading } = useSelector((state: RootState) => state.auth);

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
      console.log('🔍 사용자 정보가 없어서 다시 조회합니다');
      dispatch(fetchUserInfoAsync());
    }
  }, [isAuthenticated, user, dispatch]);

  // 계획 데이터 로드
  useEffect(() => {
    if (isAuthenticated && user?.email) {
      loadPlans();
    }
  }, [isAuthenticated, user?.email]);

  // 화면에 포커스될 때마다 계획 데이터 새로 로드
  useFocusEffect(
    useCallback(() => {
      if (isAuthenticated && user?.email) {
        console.log('🔄 계획 페이지 포커스 - 데이터 새로 로드');
        loadPlans();
      }
    }, [isAuthenticated, user?.email])
  );

  // 새로고침 파라미터 처리
  useEffect(() => {
    if (route?.params?.refresh && isAuthenticated && user?.email) {
      console.log('🔄 계획 목록 새로고침 요청');
      setIsRefreshing(true);
      loadPlans().finally(() => {
        setIsRefreshing(false);
      });
      // 새로 생성된 계획을 보여주기 위해 "예정된 여행" 탭으로 설정
      setSelectedTab('upcoming');
      // 파라미터 초기화하여 중복 새로고침 방지
      navigation.setParams({ refresh: undefined });
    }
  }, [route?.params?.refresh, isAuthenticated, user?.email, navigation]);

  const loadPlans = async () => {
    if (!user?.email) {
      console.warn('⚠️ 사용자 이메일이 없습니다.');
      setPlans([]);
      setIsLoadingPlans(false);
      return;
    }

    try {
      setIsLoadingPlans(true);
      console.log('📝 계획 데이터 로드 시작:', { email: user.email });
      
      const response = await getAllPlans(user.email);
      console.log('📝 계획 데이터 로드 완료:', response);
      
      // API 응답을 Plan 형태로 변환
      const transformedPlans: Plan[] = response.plans.map((plan, index) => ({
        id: plan.planId, // 백엔드에서 받은 planId 사용
        place: plan.place,
        partner: plan.partner, // 이미 string 형태로 온다 (ALONE, COUPLE 등)
        styles: plan.styles, // 이미 string 배열로 온다 (HEALING, ACTIVITY 등)
        startDay: plan.startDay,
        endDay: plan.endDay,
        status: new Date(plan.startDay) > new Date() ? 'upcoming' : 'past',
        image: getPlaceImage(plan.place, index), // 여행지별 적절한 이미지
      }));
      
      setPlans(transformedPlans);
    } catch (error) {
      console.error('❌ 계획 데이터 로드 실패:', error);
      setPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  };

  // 사용자 정보 디버깅
  useEffect(() => {
    console.log('👤 PlanScreen 사용자 정보:', { isAuthenticated, user });
  }, [isAuthenticated, user]);

  // API에서 가져온 계획 데이터를 상태별로 필터링
  const upcomingPlans = (plans || []).filter(plan => plan.status === 'upcoming');
  const pastPlans = (plans || []).filter(plan => plan.status === 'past');

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  const getPartnerText = (partner: string) => {
    const partnerMap: { [key: string]: string } = {
      'SOLO': '혼자',
      'ALONE': '혼자',  // API에서 ALONE으로 올 수도 있음
      'COUPLE': '커플',
      'FAMILY': '가족',
      'FRIENDS': '친구',
      'FRIEND': '친구',  // API에서 FRIEND로 올 수도 있음
      'BUSINESS': '비즈니스',
      'CLUB': '동아리'
    };
    return partnerMap[partner] || partner;
  };


  const getStyleText = (styles: string[]) => {
    const styleMap: { [key: string]: string } = {
      'HEALING': '힐링',
      'ACTIVITY': '액티비티',
      'FAMILY': '가족',
      'NATURE': '자연',
      'CULTURE': '문화',
      'FOOD': '맛집'
    };
    return styles.map(style => styleMap[style] || style).join(', ');
  };

  // 계획 삭제 함수
  const handleDeletePlan = async (planId: number) => {
    if (!isAuthenticated || !user?.email) return;

    Alert.alert(
      '계획 삭제',
      '이 여행 계획을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsDeleting(true);
              console.log('🔄 계획 삭제 시작:', { planId, email: user.email });
              
              const deleteDto: PlanDto = { planId };
              await deletePlan(deleteDto, user.email);
              
              console.log('✅ 계획 삭제 성공');
              
              // 로컬 상태에서도 제거
              setPlans(prev => prev.filter(plan => plan.id !== planId));
              
              Alert.alert('성공', '여행 계획이 삭제되었습니다.');
            } catch (error) {
              console.error('❌ 계획 삭제 실패:', error);
              Alert.alert('오류', '계획 삭제 중 오류가 발생했습니다.');
            } finally {
              setIsDeleting(false);
            }
          }
        }
      ]
    );
  };


  // 여행지별 이미지 매핑 함수
  const getPlaceImage = (place: string, index: number = 0) => {
    const placeImageMap: { [key: string]: string[] } = {
      '제주': [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400'
      ],
      '부산': [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'
      ],
      '강릉': [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
      ],
      '전주': [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
      ],
      '서울': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400'
      ],
      '경주': [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
      ],
      '여수': [
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400'
      ],
      '대구': [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400'
      ],
      '인천': [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'
      ],
      '대전': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
      ]
    };

    // 여행지 이름에서 키워드 추출
    const placeKeywords = Object.keys(placeImageMap);
    const matchedKeyword = placeKeywords.find(keyword => place.includes(keyword));
    
    if (matchedKeyword && placeImageMap[matchedKeyword]) {
      const images = placeImageMap[matchedKeyword];
      return images[index % images.length];
    }
    
    // 매칭되는 키워드가 없으면 랜덤 이미지들
    const randomImages = [
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
      'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'
    ];
    
    // 랜덤 인덱스 생성 (여행지 이름과 인덱스를 조합하여 일관성 있는 랜덤)
    const randomSeed = place.length + index;
    const randomIndex = randomSeed % randomImages.length;
    
    return randomImages[randomIndex];
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  const handleEditPlan = (plan: Plan) => {
    navigation.navigate('PlanEdit', { planId: plan.id });
  };

  const renderPlanCard = (plan: Plan) => (
    <TouchableOpacity 
      key={plan.id} 
      style={styles.planCard}
      onPress={() => navigation.navigate('PlanDetail', { planId: plan.id })}
    >
      <View style={styles.planImageContainer}>
        <Image 
          source={{ uri: plan.image || 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop' }} 
          style={styles.planImage} 
        />
      </View>
      <View style={styles.planInfo}>
        <Text style={styles.planTitle}>{plan.place}</Text>
        <Text style={styles.planDestination}>{getStyleText(plan.styles)}</Text>
        <View style={styles.planMeta}>
          <View style={styles.planDate}>
            <Ionicons name="calendar-outline" size={14} color={UI_CONFIG.COLORS.TEXT_SECONDARY} />
            <Text style={styles.planDateText}>
              {formatDate(plan.startDay)} - {formatDate(plan.endDay)}
            </Text>
          </View>
          <View style={styles.planPartner}>
            <Ionicons name="people-outline" size={14} color={UI_CONFIG.COLORS.TEXT_SECONDARY} />
            <Text style={styles.planPartnerText}>{getPartnerText(plan.partner || 'SOLO')}</Text>
          </View>
        </View>
      </View>
      <View style={styles.planActionButtons}>
        <TouchableOpacity 
          style={styles.planEditButton}
          onPress={() => handleEditPlan(plan)}
        >
          <Ionicons 
            name="create-outline" 
            size={20} 
            color={UI_CONFIG.COLORS.TEXT_SECONDARY} 
          />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.planDeleteButton}
          onPress={() => handleDeletePlan(plan.id)}
          disabled={isDeleting}
        >
          <Ionicons 
            name="trash-outline" 
            size={20} 
            color="#E74C3C" 
          />
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  // 로그인하지 않은 사용자를 위한 로그인 프롬프트 화면
  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        {/* 블러 처리된 배경 */}
        <View style={styles.blurredBackground}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.profileContainer}>
              <View style={styles.profileImageContainer}>
                <Image
                  source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face' }}
                  style={styles.profileImage}
                />
              </View>
              <View style={styles.profileInfo}>
                <Text style={styles.profileGreeting}>안녕하세요</Text>
                <Text style={styles.profileName}>사용자님</Text>
              </View>
            </View>
            
            {/* 탭 선택 */}
            <View style={styles.tabContainer}>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
                onPress={() => setSelectedTab('upcoming')}
              >
                <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
                  예정된 여행
                </Text>
                <View style={[styles.tabBadge, selectedTab === 'upcoming' && styles.activeTabBadge]}>
                  <Text style={[styles.tabBadgeText, selectedTab === 'upcoming' && styles.activeTabBadgeText]}>
                    {upcomingPlans.length}
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, selectedTab === 'past' && styles.activeTab]}
                onPress={() => setSelectedTab('past')}
              >
                <Text style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
                  지난 여행
                </Text>
                <View style={[styles.tabBadge, selectedTab === 'past' && styles.activeTabBadge]}>
                  <Text style={[styles.tabBadgeText, selectedTab === 'past' && styles.activeTabBadgeText]}>
                    {pastPlans.length}
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* 새 여행 만들기 */}
            <TouchableOpacity style={styles.createPlanCard}>
              <View style={styles.createPlanIcon}>
                <Ionicons name="add-circle" size={32} color={UI_CONFIG.COLORS.PRIMARY} />
              </View>
              <View style={styles.createPlanText}>
                <Text style={styles.createPlanTitle}>새 여행 만들기</Text>
                <Text style={styles.createPlanSubtitle}>새로운 여행 계획을 시작해보세요</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
            </TouchableOpacity>

            {/* 여행 계획 목록 */}
            <View style={styles.plansContainer}>
              {isLoadingPlans ? (
                <View style={styles.loadingState}>
                  <Text style={styles.loadingText}>계획을 불러오는 중...</Text>
                </View>
              ) : selectedTab === 'upcoming' ? (
                upcomingPlans.length > 0 ? (
                  upcomingPlans.map(renderPlanCard)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="calendar-outline" size={48} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
                    <Text style={styles.emptyStateTitle}>예정된 여행이 없습니다</Text>
                    <Text style={styles.emptyStateSubtitle}>새로운 여행 계획을 만들어보세요</Text>
                  </View>
                )
              ) : (
                pastPlans.length > 0 ? (
                  pastPlans.map(renderPlanCard)
                ) : (
                  <View style={styles.emptyState}>
                    <Ionicons name="time-outline" size={48} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
                    <Text style={styles.emptyStateTitle}>지난 여행이 없습니다</Text>
                    <Text style={styles.emptyStateSubtitle}>여행을 다녀오시면 여기에 표시됩니다</Text>
                  </View>
                )
              )}
            </View>
          </ScrollView>
        </View>

        {/* 로그인 프롬프트 오버레이 */}
        <View style={styles.loginOverlay}>
          <View style={styles.loginPrompt}>
            <Ionicons name="lock-closed" size={24} color={UI_CONFIG.COLORS.TEXT_SECONDARY} />
            <Text style={styles.loginPromptTitle}>로그인하고 여행을 계획해보세요</Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>로그인하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <View style={styles.profileContainer}>
          <View style={styles.profileImageContainer}>
            <Image
              source={{ uri: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&h=150&fit=crop&crop=face' }}
              style={styles.profileImage}
            />
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileGreeting}>안녕하세요</Text>
            <Text style={styles.profileName}>{user?.name || '여행자'}님</Text>
          </View>
        </View>
        
        {/* 탭 선택 */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'upcoming' && styles.activeTab]}
            onPress={() => setSelectedTab('upcoming')}
          >
            <Text style={[styles.tabText, selectedTab === 'upcoming' && styles.activeTabText]}>
              예정된 여행
            </Text>
            <View style={[styles.tabBadge, selectedTab === 'upcoming' && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'upcoming' && styles.activeTabBadgeText]}>
                {upcomingPlans.length}
              </Text>
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'past' && styles.activeTab]}
            onPress={() => setSelectedTab('past')}
          >
            <Text style={[styles.tabText, selectedTab === 'past' && styles.activeTabText]}>
              지난 여행
            </Text>
            <View style={[styles.tabBadge, selectedTab === 'past' && styles.activeTabBadge]}>
              <Text style={[styles.tabBadgeText, selectedTab === 'past' && styles.activeTabBadgeText]}>
                {pastPlans.length}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

        {/* 새 여행 만들기 */}
        <TouchableOpacity 
          style={styles.createPlanCard}
          onPress={() => navigation.navigate('PlanCreate')}
        >
          <View style={styles.createPlanIcon}>
            <Ionicons name="add-circle" size={32} color={UI_CONFIG.COLORS.PRIMARY} />
          </View>
          <View style={styles.createPlanText}>
            <Text style={styles.createPlanTitle}>새 여행 만들기</Text>
            <Text style={styles.createPlanSubtitle}>새로운 여행 계획을 시작해보세요</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
        </TouchableOpacity>

        {/* 여행 계획 목록 */}
        <View style={styles.plansContainer}>
          {isRefreshing ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>새 계획을 불러오는 중...</Text>
            </View>
          ) : selectedTab === 'upcoming' ? (
            upcomingPlans.length > 0 ? (
              upcomingPlans.map(renderPlanCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="calendar-outline" size={48} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
                <Text style={styles.emptyStateTitle}>예정된 여행이 없습니다</Text>
                <Text style={styles.emptyStateSubtitle}>새로운 여행 계획을 만들어보세요</Text>
              </View>
            )
          ) : (
            pastPlans.length > 0 ? (
              pastPlans.map(renderPlanCard)
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={48} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
                <Text style={styles.emptyStateTitle}>지난 여행이 없습니다</Text>
                <Text style={styles.emptyStateSubtitle}>여행을 다녀오시면 여기에 표시됩니다</Text>
              </View>
            )
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  header: {
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingTop: UI_CONFIG.SPACING.XXL + UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.LG,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profileImageContainer: {
    marginRight: UI_CONFIG.SPACING.MD,
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: UI_CONFIG.COLORS.PRIMARY,
  },
  profileInfo: {
    flex: 1,
  },
  profileGreeting: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  profileName: {
    fontSize: UI_CONFIG.FONT_SIZES.XXL,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  content: {
    flex: 1,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
  },
  createPlanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    padding: UI_CONFIG.SPACING.MD,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    marginVertical: UI_CONFIG.SPACING.MD,
    ...UI_CONFIG.SHADOWS.SM,
  },
  createPlanIcon: {
    marginRight: UI_CONFIG.SPACING.MD,
  },
  createPlanText: {
    flex: 1,
  },
  createPlanTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  createPlanSubtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    marginTop: UI_CONFIG.SPACING.MD,
    marginHorizontal: -UI_CONFIG.SPACING.MD,
    ...UI_CONFIG.SHADOWS.SM,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: UI_CONFIG.SPACING.MD,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: UI_CONFIG.COLORS.PRIMARY,
  },
  tabText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '500',
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginRight: UI_CONFIG.SPACING.XS,
  },
  activeTabText: {
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: UI_CONFIG.COLORS.TEXT_LIGHT,
    borderRadius: UI_CONFIG.BORDER_RADIUS.ROUND,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.XS,
  },
  activeTabBadge: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
  },
  tabBadgeText: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  activeTabBadgeText: {
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
  plansContainer: {
    paddingBottom: UI_CONFIG.SPACING.XXL,
  },
  planCard: {
    flexDirection: 'row',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    marginBottom: UI_CONFIG.SPACING.MD,
    overflow: 'hidden',
    ...UI_CONFIG.SHADOWS.SM,
  },
  planImageContainer: {
    margin: UI_CONFIG.SPACING.MD,
  },
  planImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  planInfo: {
    flex: 1,
    padding: UI_CONFIG.SPACING.MD,
  },
  planTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  planDestination: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  planMeta: {
    flexDirection: 'row',
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  planDate: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: UI_CONFIG.SPACING.MD,
  },
  planDateText: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  planPartner: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planPartnerText: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  planStyles: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.ACCENT,
    fontWeight: '500',
  },
  planActionButtons: {
    position: 'absolute',
    top: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  planEditButton: {
    padding: 8,
  },
  planDeleteButton: {
    padding: 8,
  },
  loadingState: {
    alignItems: 'center',
    paddingVertical: UI_CONFIG.SPACING.XXL,
  },
  loadingText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: UI_CONFIG.SPACING.XXL,
  },
  emptyStateTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginTop: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  emptyStateSubtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
  },
  // 로그인 프롬프트 스타일
  loginPromptContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.LG,
  },
  loginPrompt: {
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.MD,
  },
  loginPromptTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '500',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
    marginTop: UI_CONFIG.SPACING.SM,
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  loginButton: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    paddingHorizontal: UI_CONFIG.SPACING.XL,
    paddingVertical: UI_CONFIG.SPACING.MD,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    ...UI_CONFIG.SHADOWS.SM,
  },
  loginButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    fontWeight: '600',
  },
  // 블러 처리 스타일
  blurredBackground: {
    flex: 1,
    opacity: 0.5,
  },
  loginOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default PlanScreen;

