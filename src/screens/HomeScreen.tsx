import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import NotificationSidebar from '../components/NotificationSidebar';
import { getTop10Recommendations } from '../services/recommendation/recommendationService';
import { Recommendation, PlanReadResponseDto, TravelPartner, TravelStyle, RecommendReadTop10Dto } from '../types';
import { getUnreadNotificationCount } from '../services/notification/notificationService';
import { getAllPlans } from '../services/plan/planService';

const { width } = Dimensions.get('window');

// 여행 계획 타입 정의 (API DTO 기반)
interface TravelPlan {
  id: number;
  place: string;
  partner: string; // Partner enum (ALONE, COUPLE, FAMILY, FRIEND, BUSINESS, CLUB)
  styles: string[]; // Style enum 배열 (HEALING, ACTIVITY, FAMILY, NATURE, CULTURE, FOOD)
  startDay: string; // Date를 string으로 변환
  endDay: string;   // Date를 string으로 변환
  status: 'upcoming' | 'past';
  image: string;
}

// 인기 여행기 타입 정의
interface TravelPost {
  id: number;
  title: string;
  author: string;
  location: string;
  date: string;
  views: number;
  likes: number;
  image: string;
  excerpt: string;
}

const HomeScreen = ({ navigation, route }: any) => {
  // 이벤트 슬라이드 상태 관리
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [isUserScrolling, setIsUserScrolling] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const autoSlideTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // 알림 사이드바 상태 관리
  const [isNotificationVisible, setIsNotificationVisible] = useState(false);
  const slideAnimation = useRef(new Animated.Value(0)).current;

  // 로그인 상태 확인
  const isLoggedIn = useSelector((state: any) => state.auth.isAuthenticated);
  const userEmail = useSelector((state: RootState) => state.auth.user?.email);

  // 알림 개수 상태 관리
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  // 여행 계획 상태 관리
  const [travelPlans, setTravelPlans] = useState<TravelPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  
  // Top 10 추천 장소 상태
  const [top10Recommendations, setTop10Recommendations] = useState<RecommendReadTop10Dto[]>([]);
  const [isLoadingTop10, setIsLoadingTop10] = useState(false);


  // 여행 계획 로드 함수
  const loadTravelPlans = useCallback(async () => {
    if (!isLoggedIn || !userEmail) return;
    
    try {
      setIsLoadingPlans(true);
      console.log('🔄 여행 계획 로드 시작:', { userEmail });
      
      const response = await getAllPlans(userEmail);
      console.log('✅ 여행 계획 로드 성공:', response);
      
      // API 응답을 TravelPlan 형태로 변환
      const transformedPlans: TravelPlan[] = response.plans.map((plan, index) => ({
        id: plan.planId, // 백엔드에서 받은 planId 사용
        place: plan.place,
        partner: plan.partner,
        styles: plan.styles,
        startDay: plan.startDay,
        endDay: plan.endDay,
        status: new Date(plan.startDay) > new Date() ? 'upcoming' : 'past',
        image: getPlaceImage(plan.place, index), // 여행지별 적절한 이미지
      }));
      
      setTravelPlans(transformedPlans);
    } catch (error) {
      console.error('❌ 여행 계획 로드 실패:', error);
      // 실패 시 빈 배열로 설정
      setTravelPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [isLoggedIn, userEmail]);

  // Top 10 추천 장소 로드 함수
  const loadTop10Recommendations = useCallback(async () => {
    setIsLoadingTop10(true);
    try {
      console.log('🔄 Top 10 추천 장소 로드 시작');
      
      const response = await getTop10Recommendations();
      console.log('✅ Top 10 추천 장소 로드 성공:', response);
      
      // 이미지 매핑 적용
      const recommendationsWithImages = response.map((recommendation, index) => ({
        ...recommendation,
        image: getPlaceImage(recommendation.title, index)
      }));
      
      setTop10Recommendations(recommendationsWithImages);
    } catch (error) {
      console.error('❌ Top 10 추천 장소 로드 실패:', error);
      // 실패 시 빈 배열로 설정
      setTop10Recommendations([]);
    } finally {
      setIsLoadingTop10(false);
    }
  }, []);

  // 읽지 않은 알림 개수 로드 (로그인한 사용자만)
  useEffect(() => {
    if (isLoggedIn) {
      loadUnreadCount();
      loadTravelPlans();
    } else {
      setUnreadNotificationCount(0);
      // 로그아웃 시에도 travelPlans는 초기화하지 않음 (더미 데이터 표시를 위해)
    }
  }, [isLoggedIn, userEmail, loadTravelPlans]);

  // 계획 생성 후 새로고침 처리
  useEffect(() => {
    if (route?.params?.refresh && isLoggedIn) {
      console.log('🔄 계획 생성 후 데이터 새로고침');
      loadTravelPlans();
      // 파라미터 초기화
      navigation.setParams({ refresh: undefined });
    }
  }, [route?.params?.refresh, isLoggedIn, loadTravelPlans, navigation]);

  // Top 10 추천 장소 로드 (로그인 상태와 관계없이)
  useEffect(() => {
    loadTop10Recommendations();
  }, [loadTop10Recommendations]);

  // 모두 읽음 처리
  const handleMarkAllRead = () => {
    setUnreadNotificationCount(0);
  };


  // 초기 스크롤 위치 설정 (첫 번째 원본 이벤트로)
  useEffect(() => {
    const cardWidth = width;
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ x: cardWidth, animated: false });
    }, 100);
  }, []);

  // 자동 슬라이드 함수
  const startAutoSlide = () => {
    if (autoSlideTimerRef.current) {
      clearInterval(autoSlideTimerRef.current);
    }
    
    autoSlideTimerRef.current = setInterval(() => {
      if (!isUserScrolling) {
        const cardWidth = width;
        const eventCount = 3; // 이벤트 개수 (하드코딩)
        const nextIndex = (currentEventIndex + 1) % eventCount;
        const targetX = cardWidth * (nextIndex + 1); // +1은 복사된 첫 번째 이벤트 때문
        
        scrollViewRef.current?.scrollTo({ x: targetX, animated: true });
      }
    }, 2000); // 2초마다 슬라이드
  };

  // 자동 슬라이드 시작/중지
  useEffect(() => {
    if (!isUserScrolling) {
      startAutoSlide();
    } else {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
        autoSlideTimerRef.current = null;
      }
    }

    return () => {
      if (autoSlideTimerRef.current) {
        clearInterval(autoSlideTimerRef.current);
      }
    };
  }, [currentEventIndex, isUserScrolling]);


  // 인기 여행기 데이터
  const popularTravelPosts: TravelPost[] = [
    {
      id: 1,
      title: '제주도 혼자 여행의 모든 것',
      author: '여행러김',
      location: '제주특별자치도',
      date: '2024-12-15',
      views: 15420,
      likes: 892,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      excerpt: '혼자서도 충분히 즐길 수 있는 제주도의 숨은 명소들을 소개합니다...'
    },
    {
      id: 2,
      title: '부산 해운대 맛집 완전정복',
      author: '맛집탐방러',
      location: '부산광역시',
      date: '2024-12-14',
      views: 12350,
      likes: 756,
        image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
      excerpt: '해운대에서 꼭 먹어야 할 맛집들을 현지인처럼 소개해드립니다...'
    },
    {
      id: 3,
      title: '강릉 커피거리 24시간',
      author: '커피러버',
      location: '강원도 강릉시',
      date: '2024-12-13',
      views: 9870,
      likes: 634,
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
      excerpt: '강릉 커피거리의 모든 카페를 하루만에 돌아보는 완벽한 코스...'
    },
    {
      id: 4,
      title: '전주 한옥마을에서의 하룻밤',
      author: '전통문화러',
      location: '전라북도 전주시',
      date: '2024-12-12',
      views: 8760,
      likes: 523,
      image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
      excerpt: '한옥마을에서 전통문화를 체험하며 보낸 특별한 하룻밤 이야기...'
    },
    {
      id: 5,
      title: '여수 밤바다의 로맨틱한 순간들',
      author: '커플여행러',
      location: '전라남도 여수시',
      date: '2024-12-11',
      views: 11200,
      likes: 789,
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
      excerpt: '연인과 함께한 여수 밤바다에서의 달콤한 추억들을 공유합니다...'
    }
  ];

  // 더미 여행 계획 데이터 (로그인 전 블러 처리용)
  const dummyTravelPlans: TravelPlan[] = [
    {
      id: 1,
      place: '제주특별자치도',
      partner: 'FAMILY',
      styles: ['FAMILY', 'HEALING'],
      startDay: '2024-12-25',
      endDay: '2024-12-28',
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    },
    {
      id: 2,
      place: '부산광역시',
      partner: 'COUPLE',
      styles: ['ACTIVITY', 'NATURE'],
      startDay: '2024-12-20',
      endDay: '2024-12-22',
      status: 'upcoming',
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
    },
    {
      id: 3,
      place: '강원도 강릉시',
      partner: 'FRIEND',
      styles: ['CULTURE', 'FOOD'],
      startDay: '2024-11-15',
      endDay: '2024-11-17',
      status: 'past',
      image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
    },
    {
      id: 4,
      place: '전라북도 전주시',
      partner: 'COUPLE',
      styles: ['CULTURE', 'FOOD'],
      startDay: '2024-10-20',
      endDay: '2024-10-22',
      status: 'past',
      image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
    },
  ];

  // 여행 계획 분류 (로그인 상태에 따라 더미 데이터 또는 실제 데이터 사용)
  const displayPlans = isLoggedIn ? travelPlans : dummyTravelPlans;
  const upcomingPlans = displayPlans.filter(plan => plan.status === 'upcoming');
  const pastPlans = displayPlans.filter(plan => plan.status === 'past');
  
  // 로그인 상태일 때만 로그 출력 (한 번만)
  useEffect(() => {
    if (isLoggedIn && !isLoadingPlans) {
      console.log('📊 여행 계획 상태:', {
        isLoggedIn,
        userEmail,
        isLoadingPlans,
        actualPlans: travelPlans.length,
        dummyPlans: dummyTravelPlans.length,
        displayPlans: displayPlans.length,
        upcomingPlans: upcomingPlans.length,
        pastPlans: pastPlans.length,
        dataSource: isLoggedIn ? 'API' : 'DUMMY'
      });
    }
  }, [isLoggedIn, isLoadingPlans, travelPlans.length, upcomingPlans.length, pastPlans.length]);

  // 로그인 핸들러
  const handleLogin = () => {
    navigation.navigate('Login');
  };

  // 추천 장소 클릭 핸들러
  const handleRecommendationPress = (id: number) => {
    navigation.navigate('RecommendDetail', { 
      recommendationId: id,
      fromPage: 'Home' // 홈 페이지에서 왔음을 표시
    });
  };

  // 여행 계획 클릭 핸들러
  const handlePlanPress = (plan: TravelPlan) => {
    console.log('🔍 HomeScreen - handlePlanPress:', { planId: plan.id, plan });
    navigation.navigate('PlanDetail', { 
      planId: plan.id,
      fromPage: 'Home' // 홈 페이지에서 왔음을 표시
    });
  };

  // 알림 사이드바 토글 핸들러
  const toggleNotificationSidebar = () => {
    // 로그인하지 않은 경우 로그인 화면으로 이동
    if (!isLoggedIn) {
      navigation.navigate('Login');
      return;
    }

    if (isNotificationVisible) {
      // 사이드바 닫기
      Animated.timing(slideAnimation, {
        toValue: 0,
        duration: 250, // 더 빠른 닫기 애니메이션
        useNativeDriver: true,
      }).start(() => {
        setIsNotificationVisible(false);
      });
    } else {
      // 사이드바 열기
      setIsNotificationVisible(true);
      Animated.timing(slideAnimation, {
        toValue: 1,
        duration: 300, // 부드러운 열기 애니메이션
        useNativeDriver: true,
      }).start();
    }
  };

  // 읽지 않은 알림 개수 로드 함수
  const loadUnreadCount = async () => {
    try {
      const count = await getUnreadNotificationCount();
      setUnreadNotificationCount(count);
      console.log('🔔 읽지 않은 알림 개수 업데이트:', count);
    } catch (error) {
      console.error('❌ 읽지 않은 알림 개수 로드 실패:', error);
      setUnreadNotificationCount(0);
    }
  };

  // 알림 사이드바 닫기 핸들러
  const closeNotificationSidebar = () => {
    Animated.timing(slideAnimation, {
      toValue: 0,
      duration: 250, // 더 빠른 닫기 애니메이션
      useNativeDriver: true,
    }).start(() => {
      setIsNotificationVisible(false);
      // 알림 개수 다시 로드
      loadUnreadCount();
    });
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    setIsScrolled(scrollY > 0);
  };

  // 날짜 포맷팅 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // 스타일 영어 → 한국어 매핑
  const getStyleKoreanName = (englishName: string): string => {
    const styleMap: { [key: string]: string } = {
      'BUDGET': '예산형',
      'LUXURY': '럭셔리',
      'ADVENTURE': '모험',
      'RELAXATION': '휴양',
      'CULTURE': '문화',
      'FOOD': '맛집',
      'NATURE': '자연',
      'URBAN': '도시',
      'HISTORY': '역사',
      'FAMILY': '가족여행',
      'COUPLE': '커플여행',
      'FRIENDS': '친구여행',
      'SOLO': '혼자여행',
      'BUSINESS': '비즈니스',
      'ACTIVITY': '액티비티',
      'HEALING': '힐링'
    };
    return styleMap[englishName] || englishName;
  };

  // 파트너 영어 → 한국어 매핑
  const getPartnerKoreanName = (englishName: string): string => {
    const partnerMap: { [key: string]: string } = {
      'FAMILY': '가족',
      'COUPLE': '커플',
      'FRIEND': '친구',
      'ALONE': '혼자',
      'BUSINESS': '비즈니스',
      'CLUB': '동아리'
    };
    return partnerMap[englishName] || englishName;
  };

  // 스타일 태그 생성 함수
  const getStyleTags = (styles: TravelStyle[] | string[]) => {
    if (!styles || styles.length === 0) return '';
    
    // TravelStyle 객체 배열인지 문자열 배열인지 확인
    const isTravelStyleArray = typeof styles[0] === 'object' && styles[0] && 'name' in styles[0];
    
    if (isTravelStyleArray) {
      return (styles as TravelStyle[]).slice(0, 2).map(style => getStyleKoreanName(style.name)).join(', ');
    } else {
      return (styles as string[]).slice(0, 2).map(style => getStyleKoreanName(style)).join(', ');
    }
  };

  // 여행지별 이미지 매핑 함수
  const getPlaceImage = (place: string, index: number = 0) => {
    const placeImageMap: { [key: string]: string[] } = {
      '제주': [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400'
      ],
      '부산': [
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400'
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
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400'
      ],
      '경주': [
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
      ],
      '여수': [
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400'
      ],
      '대구': [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400'
      ],
      '인천': [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'
      ],
      '대전': [
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400'
      ],
      // 호텔/리조트 관련 키워드
      '호텔': [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400'
      ],
      '리조트': [
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400',
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400'
      ],
      '해변': [
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400'
      ],
      '해운대': [
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400'
      ],
      '커피': [
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'
      ],
      '카페': [
        'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
        'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
        'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400'
      ],
      '한옥': [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
      ],
      '전통': [
        'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400'
      ],
      '밤바다': [
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
        'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400'
      ],
      '신라': [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400'
      ],
      '럭셔리': [
        'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
        'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
        'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400'
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
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400',
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
      'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
      'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400',
      'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
      'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400',
      'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=400',
      'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400',
      'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
      'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=400'
    ];
    
    // 랜덤 인덱스 생성 (여행지 이름과 인덱스를 조합하여 일관성 있는 랜덤)
    const randomSeed = place.length + index;
    const randomIndex = randomSeed % randomImages.length;
    
    return randomImages[randomIndex];
  };

  // 이벤트 데이터 (무한 스크롤을 위해 앞뒤로 복사)
  const originalEvents = [
    { 
      id: 1, 
      title: '제주도 특가 이벤트', 
      subtitle: '최대 50% 할인', 
      image: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
      backgroundColor: '#FF6B35'
    },
    { 
      id: 2, 
      title: '부산 해운대 페스티벌', 
      subtitle: '8월 한정 이벤트', 
      image: 'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&h=400&fit=crop',
      backgroundColor: '#4A90E2'
    },
    { 
      id: 3, 
      title: '강릉 커피 페스티벌', 
      subtitle: '커피 마니아 필수', 
      image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop',
      backgroundColor: '#50C878'
    },
  ];
  
  // 무한 스크롤을 위해 앞뒤로 이벤트 복사 (고유한 키를 위해 id 수정)
  const events = [
    { ...originalEvents[2], id: 'clone-last' }, // 마지막 이벤트를 앞에 추가
    ...originalEvents,
    { ...originalEvents[0], id: 'clone-first' }, // 첫 번째 이벤트를 뒤에 추가
  ];

  // 이벤트 슬라이드 스크롤 이벤트 핸들러
  const handleEventScroll = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = width; // pagingEnabled 사용 시 전체 화면 너비
    const index = Math.round(contentOffsetX / cardWidth);
    const eventCount = 3; // 이벤트 개수 (하드코딩)
    
    // 현재 인덱스 업데이트 (복사된 첫 번째 이벤트 인덱스 보정)
    if (index > 0 && index <= eventCount) {
      setCurrentEventIndex(index - 1);
    }
  };

  // 스크롤 시작 시 자동 슬라이드 중지
  const handleScrollBeginDrag = () => {
    setIsUserScrolling(true);
  };

  // 스크롤 끝 시 자동 슬라이드 재시작
  const handleScrollEndDrag = () => {
    setTimeout(() => {
      setIsUserScrolling(false);
    }, 1000); // 1초 후 자동 슬라이드 재시작
  };

  // 스크롤 완료 시 무한 스크롤 처리
  const handleScrollEnd = (event: any) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = width;
    const index = Math.round(contentOffsetX / cardWidth);
    const eventCount = 3; // 이벤트 개수 (하드코딩)
    
    if (index >= eventCount + 1) {
      // 마지막 복사된 이벤트에 도달하면 첫 번째 원본으로 이동
      setCurrentEventIndex(0);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: cardWidth, animated: false });
      }, 50);
    } else if (index <= 0) {
      // 첫 번째 복사된 이벤트에 도달하면 마지막 원본으로 이동
      setCurrentEventIndex(eventCount - 1);
      setTimeout(() => {
        scrollViewRef.current?.scrollTo({ x: cardWidth * eventCount, animated: false });
      }, 50);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: isScrolled ? '#FFFFFF' : '#FFF4F0' }]}>
      {/* 고정 헤더 */}
      <View style={[styles.stickyHeader, { backgroundColor: isScrolled ? '#FFFFFF' : '#FFF4F0' }]}>
        <View style={styles.logoContainer}>
          <View style={styles.logoIcon}>
            <Ionicons name="airplane" size={20} color="#FF6B35" />
          </View>
          <View style={styles.logoTextContainer}>
            <Text style={styles.logoMain}>Nomadic</Text>
            <Text style={styles.logoSub}>여행의 시작</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.notificationButton} onPress={toggleNotificationSidebar}>
          <Ionicons name="notifications-outline" size={24} color="#333333" />
          {/* 읽지 않은 알림 배지 (로그인한 사용자만) */}
          {isLoggedIn && unreadNotificationCount > 0 && (
            <View style={styles.notificationBadge}>
              <Text style={styles.notificationBadgeText}>
                {unreadNotificationCount > 99 ? '99+' : unreadNotificationCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* 스크롤 가능한 콘텐츠 */}
      <ScrollView 
        style={[styles.scrollContent, { backgroundColor: isScrolled ? '#FFFFFF' : '#FFF4F0' }]} 
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={16}
      >
        {/* 상단 영역 */}
        <View style={[styles.topSection, { backgroundColor: isScrolled ? '#FFFFFF' : '#FFF4F0' }]}>

        {/* 내 여행 계획 */}
        <View style={styles.travelPlansContainer}>
          <View style={styles.sectionTitleContainer}>
            <View style={styles.sectionTitleIcon}>
              <Ionicons name="map-outline" size={16} color="#FF6B35" />
            </View>
            <View style={styles.sectionTitleTextContainer}>
              <Text style={styles.sectionTitleMain}>내 여행 계획</Text>
              <Text style={styles.sectionTitleSub}>다가오는 여행을 확인해보세요</Text>
            </View>
          </View>
          
          {/* 다가오는 여행 */}
          <View style={styles.planSection}>
            <Text style={styles.planSectionTitle}>다가오는 여행</Text>
            {isLoggedIn && isLoadingPlans ? (
              <View style={styles.planLoadingContainer}>
                <Text style={styles.planLoadingText}>여행 계획을 불러오는 중...</Text>
              </View>
            ) : upcomingPlans.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planScrollView}>
                {upcomingPlans.map((plan, index) => {
                const cardStyle = index % 3 === 0 ? styles.upcomingCard1 : 
                                 index % 3 === 1 ? styles.upcomingCard2 : styles.upcomingCard3;
                return (
                  <TouchableOpacity 
                    key={plan.id} 
                    style={[styles.planCard, cardStyle, !isLoggedIn && styles.blurredCard]}
                    onPress={() => handlePlanPress(plan)}
                  >
                    <View style={styles.planCardContent}>
                      <View style={styles.planImageContainer}>
                        <Image source={{ uri: plan.image }} style={styles.planCircularImage} />
                      </View>
                      <View style={styles.planInfo}>
                        <Text style={styles.planTitle}>{plan.place}</Text>
                        <Text style={styles.planPartner}>with {getPartnerKoreanName(plan.partner)}</Text>
                        <View style={styles.planDateContainer}>
                          <Ionicons name="calendar" size={12} color="#7F8C8D" />
                          <Text style={styles.planDate}>
                            {formatDate(plan.startDay)} - {formatDate(plan.endDay)}
                          </Text>
                        </View>
                        <View style={styles.planStyles}>
                          <Ionicons name="pricetag" size={12} color="#7F8C8D" />
                          <Text style={styles.stylesText}>{getStyleTags(plan.styles)}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              </ScrollView>
            ) : isLoggedIn ? (
              <View style={styles.planEmptyContainer}>
                <Ionicons name="calendar-outline" size={32} color="#BDC3C7" />
                <Text style={styles.planEmptyText}>다가오는 여행이 없습니다</Text>
                <Text style={styles.planEmptySubtext}>새로운 여행 계획을 만들어보세요!</Text>
              </View>
            ) : null}
          </View>

          {/* 지난 여행 */}
          <View style={styles.planSection}>
            <Text style={styles.planSectionTitle}>지난 여행</Text>
            {isLoggedIn && isLoadingPlans ? (
              <View style={styles.planLoadingContainer}>
                <Text style={styles.planLoadingText}>여행 계획을 불러오는 중...</Text>
              </View>
            ) : pastPlans.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.planScrollView}>
                {pastPlans.map((plan, index) => {
                const cardStyle = index % 3 === 0 ? styles.pastCard1 : 
                                 index % 3 === 1 ? styles.pastCard2 : styles.pastCard3;
                return (
                  <TouchableOpacity 
                    key={plan.id} 
                    style={[styles.planCard, cardStyle, !isLoggedIn && styles.blurredCard]}
                    onPress={() => handlePlanPress(plan)}
                  >
                    <View style={styles.planCardContent}>
                      <View style={styles.planImageContainer}>
                        <Image source={{ uri: plan.image }} style={styles.planCircularImage} />
                      </View>
                      <View style={styles.planInfo}>
                        <Text style={styles.planTitle}>{plan.place}</Text>
                        <Text style={styles.planPartner}>with {getPartnerKoreanName(plan.partner)}</Text>
                        <View style={styles.planDateContainer}>
                          <Ionicons name="calendar" size={12} color="#7F8C8D" />
                          <Text style={styles.planDate}>
                            {formatDate(plan.startDay)} - {formatDate(plan.endDay)}
                          </Text>
                        </View>
                        <View style={styles.planStyles}>
                          <Ionicons name="pricetag" size={12} color="#7F8C8D" />
                          <Text style={styles.stylesText}>{getStyleTags(plan.styles)}</Text>
                        </View>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              })}
              </ScrollView>
            ) : isLoggedIn ? (
              <View style={styles.planEmptyContainer}>
                <Ionicons name="time-outline" size={32} color="#BDC3C7" />
                <Text style={styles.planEmptyText}>지난 여행이 없습니다</Text>
                <Text style={styles.planEmptySubtext}>아직 여행 기록이 없어요</Text>
              </View>
            ) : null}
          </View>

          {/* 로그인 안된 상태일 때 블러 오버레이 - 여행 계획 섹션 전체 */}
          {!isLoggedIn && (
            <View style={styles.loginOverlay}>
              <View style={styles.loginPrompt}>
                <Ionicons name="lock-closed" size={32} color="#7F8C8D" />
                <Text style={styles.loginPromptTitle}>로그인이 필요한 서비스입니다</Text>
                <Text style={styles.loginPromptSubtitle}>여행 계획을 확인하려면 로그인해주세요</Text>
                <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
                  <Text style={styles.loginButtonText}>로그인하기</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>

      {/* 중단 영역 */}
      <View style={styles.middleSection}>
        {/* 이벤트 바 */}
        <View style={styles.eventSection}>
          <ScrollView 
            ref={scrollViewRef}
            horizontal 
            showsHorizontalScrollIndicator={false} 
            style={styles.eventScroll}
            pagingEnabled={true}
            decelerationRate="fast"
            onScroll={handleEventScroll}
            onScrollBeginDrag={handleScrollBeginDrag}
            onScrollEndDrag={handleScrollEndDrag}
            onMomentumScrollEnd={handleScrollEnd}
            scrollEventThrottle={16}
          >
            {events.map((event) => (
              <View key={event.id} style={[styles.eventCard, { backgroundColor: event.backgroundColor }]}>
                <Image source={{ uri: event.image }} style={styles.eventImage} />
                <View style={styles.eventOverlay}>
                  <Text style={styles.eventTitle}>{event.title}</Text>
                  <Text style={styles.eventSubtitle}>{event.subtitle}</Text>
                </View>
              </View>
            ))}
          </ScrollView>
          {/* 이벤트 인디케이터 */}
          <View style={styles.eventIndicator}>
            {[0, 1, 2].map((index) => (
              <View key={index} style={[
                styles.indicatorDot,
                index === currentEventIndex && styles.indicatorDotActive
              ]} />
            ))}
          </View>
        </View>

        {/* 추천 장소 */}
        <View style={styles.recommendedSection}>
          <Text style={styles.sectionTitleWithPadding}>이런 장소는 어떠세요?</Text>
          <Text style={styles.sectionSubtitle}>추천 여행지 Top 10</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.recommendedScroll}>
            {isLoadingTop10 ? (
              // 로딩 상태
              Array.from({ length: 5 }).map((_, index) => (
                <View key={index} style={styles.placeCard}>
                  <View style={[styles.placeImage, styles.placeImageLoading]} />
                  <View style={styles.placeNameLoading} />
                  <View style={styles.placeLocationLoading} />
                  <View style={styles.placeFooter}>
                    <View style={styles.wishlistContainerLoading} />
                    <View style={styles.placePriceLoading} />
                  </View>
                </View>
              ))
            ) : (
              // API 데이터
              top10Recommendations.map((recommendation) => (
                <TouchableOpacity 
                  key={recommendation.id} 
                  style={styles.placeCard}
                  onPress={() => handleRecommendationPress(recommendation.id)}
                >
                  <View style={styles.placeImage}>
                    <Image 
                      source={{ uri: recommendation.image }} 
                      style={styles.placeImageContent}
                      resizeMode="cover"
                    />
                  </View>
                  <Text style={styles.placeName}>{recommendation.title}</Text>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>
        </View>

        {/* 이번주 인기 여행기 TOP 10 */}
        <View style={styles.popularPostsSection}>
          <Text style={styles.sectionTitleWithPadding}>이번주 인기 여행기 TOP 10</Text>
          <View style={styles.sectionHeader}>
            <TouchableOpacity>
              <Text style={styles.viewAllText}>전체보기</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.postsList}>
            {popularTravelPosts.map((post) => (
              <TouchableOpacity key={post.id} style={styles.postCard}>
                <Image source={{ uri: post.image }} style={styles.postImage} />
                <View style={styles.postContent}>
                  <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
                  <Text style={styles.postAuthor}>by {post.author}</Text>
                  <Text style={styles.postExcerpt} numberOfLines={2}>{post.excerpt}</Text>
                  <View style={styles.postMeta}>
                    <View style={styles.postLocation}>
                      <Ionicons name="location" size={12} color="#7F8C8D" />
                      <Text style={styles.postLocationText}>{post.location}</Text>
                    </View>
                    <View style={styles.postStats}>
                      <View style={styles.postStat}>
                        <Ionicons name="eye" size={12} color="#7F8C8D" />
                        <Text style={styles.postStatText}>{post.views.toLocaleString()}</Text>
                      </View>
                      <View style={styles.postStat}>
                        <Ionicons name="heart" size={12} color="#E74C3C" />
                        <Text style={styles.postStatText}>{post.likes}</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />
      </View>
      </ScrollView>

      {/* 알림 사이드바 */}
      <NotificationSidebar
        isVisible={isNotificationVisible}
        onClose={closeNotificationSidebar}
        slideAnimation={slideAnimation}
        onMarkAllRead={handleMarkAllRead}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  stickyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    zIndex: 1000,
  },
  scrollContent: {
    flex: 1,
  },
  // 상단 영역
  topSection: {
    paddingBottom: 20,
    borderTopLeftRadius: 50, // 상단 왼쪽 더 둥근 모서리
    borderTopRightRadius: 50, // 상단 오른쪽 더 둥근 모서리
    marginTop: -1, // 헤더와의 겹침 방지
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logoTextContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  logoMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    lineHeight: 20,
  },
  logoSub: {
    fontSize: 11,
    color: '#FF6B35',
    fontWeight: '500',
    marginTop: -2,
  },
  notificationButton: {
    padding: 8,
    position: 'relative', // 배지 위치를 위해 추가
  },
  notificationBadge: {
    position: 'absolute',
    top: 2,
    right: 2,
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  notificationBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  travelPlansContainer: {
    paddingTop: 30,
    paddingBottom: 8,
    paddingHorizontal: 16,
    position: 'relative',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginBottom: 12,
    paddingHorizontal: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  viewAllText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '500',
  },
  planSection: {
    marginBottom: 8,
  },
  planSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  planScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  planCard: {
    width: 200,
    marginRight: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  // 다가오는 여행 - 푸른 계열
  upcomingCard1: {
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2', // 파란색
  },
  upcomingCard2: {
    borderLeftWidth: 4,
    borderLeftColor: '#5DADE2', // 하늘색
  },
  upcomingCard3: {
    borderLeftWidth: 4,
    borderLeftColor: '#85C1E9', // 연한 하늘색
  },
  // 지난 여행 - 붉은 계열
  pastCard1: {
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C', // 빨간색
  },
  pastCard2: {
    borderLeftWidth: 4,
    borderLeftColor: '#EC7063', // 연한 빨간색
  },
  pastCard3: {
    borderLeftWidth: 4,
    borderLeftColor: '#F1948A', // 더 연한 빨간색
  },
  blurredCard: {
    opacity: 0.3,
  },
  planCardContent: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
  },
  planImageContainer: {
    marginRight: 12,
  },
  planCircularImage: {
    width: 50,
    height: 50,
    borderRadius: 25,
    resizeMode: 'cover',
  },
  planInfo: {
    flex: 1,
  },
  planTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2,
  },
  planPartner: {
    fontSize: 11,
    color: '#7F8C8D',
    marginBottom: 4,
  },
  planDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  planDate: {
    fontSize: 11,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  planStyles: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stylesText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  loginOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
    zIndex: 10,
  },
  loginPrompt: {
    alignItems: 'center',
    padding: 20,
  },
  loginPromptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 12,
    marginBottom: 8,
  },
  loginPromptSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    marginBottom: 20,
  },
  loginButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // 인기 여행기 섹션
  popularPostsSection: {
    paddingTop: 80,
    paddingBottom: 20,
    backgroundColor: '#F8F9FA',
  },
  postsList: {
    gap: 12,
  },
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    flexDirection: 'row',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  postImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginRight: 12,
  },
  postContent: {
    flex: 1,
    justifyContent: 'space-between',
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
    lineHeight: 18,
  },
  postAuthor: {
    fontSize: 12,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  postExcerpt: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
    marginBottom: 8,
  },
  postMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  postLocation: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postLocationText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  postStats: {
    flexDirection: 'row',
    gap: 12,
  },
  postStat: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postStatText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  bottomSpacing: {
    height: 200, // 하단 바 높이 더 많이 증가
  },
  // 중단 영역
  middleSection: {
    flex: 1,
    backgroundColor: '#FFFFFF', // 흰색 배경
    paddingTop: 20,
    paddingBottom: 40,
  },
  eventSection: {
    marginBottom: 50,
  },
  sectionTitleWithPadding: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 5,
    paddingHorizontal: 20,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 20,
  },
  sectionTitleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  sectionTitleTextContainer: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  sectionTitleMain: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    lineHeight: 20,
  },
  sectionTitleSub: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '400',
    marginTop: 1,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666666',
    marginBottom: 15,
    paddingHorizontal: 20,
  },
  eventScroll: {
    paddingLeft: 0, // 패딩 제거로 완전한 화면 정렬
  },
  eventCard: {
    width: width, // 전체 화면 너비로 확장
    height: 200,
    borderRadius: 12,
    marginRight: 0, // 마진 제거로 정확한 정렬
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    position: 'relative',
  },
  eventIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 15,
  },
  indicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
    marginHorizontal: 4,
  },
  indicatorDotActive: {
    backgroundColor: '#FF6B35',
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  eventImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
    top: 0,
    left: 0,
  },
  eventOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    padding: 20,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
  },
  eventTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 5,
  },
  eventSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    textAlign: 'center',
    opacity: 0.9,
  },
  recommendedSection: {
    flex: 1,
    paddingTop: 20,
  },
  recommendedScroll: {
    paddingLeft: 20,
  },
  placeCard: {
    width: 180, // 카드 너비 확대
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginRight: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  placeImage: {
    width: 156, // 이미지 너비 확대
    height: 120, // 이미지 높이 확대
    backgroundColor: '#F0F0F0',
    borderRadius: 8,
    marginBottom: 10,
    overflow: 'hidden',
  },
  placeImageContent: {
    width: '100%',
    height: '100%',
  },
  placeImageLoading: {
    backgroundColor: '#E0E0E0',
  },
  placeName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  placeLocation: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 8,
  },
  placeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  wishlistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistText: {
    fontSize: 12,
    color: '#666666',
    fontWeight: '500',
    marginLeft: 4,
  },
  wishlistContainerLoading: {
    width: 40,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
  placePrice: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  placePriceLoading: {
    width: 50,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
  },
  placeNameLoading: {
    width: 100,
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 7,
    marginBottom: 4,
  },
  placeLocationLoading: {
    width: 80,
    height: 12,
    backgroundColor: '#E0E0E0',
    borderRadius: 6,
    marginBottom: 8,
  },
  // 여행 계획 로딩 스타일
  planLoadingContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planLoadingText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  // 여행 계획 빈 상태 스타일
  planEmptyContainer: {
    padding: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  planEmptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 4,
    textAlign: 'center',
  },
  planEmptySubtext: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
  },
});

export default HomeScreen;
