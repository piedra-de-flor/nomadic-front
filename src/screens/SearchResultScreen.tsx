import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  FlatList,
  Alert,
  Animated,
  Easing,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingDots } from '../components/ui';
import { searchAccommodations, checkTypoCorrection } from '../services/accommodation/accommodationService';
import { AccommodationSearchRequest, AccommodationSearchResponse } from '../types';

// 숙소 데이터 타입 정의 (types/index.ts에서 import)
import { Accommodation } from '../types';

// 데모 숙소 데이터
const mockAccommodations: Accommodation[] = [
  {
    id: 1,
    image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400',
    name: '제주 신라호텔',
    category: '호텔',
    grade: '5성급',
    rating: 4.8,
    reviewCount: 1247,
    region: '제주시',
    address: '제주특별자치도 제주시 중문관광로 72번길 60',
    landmarkDistance: '중문관광단지에서 0.5km',
    intro: '제주도의 아름다운 자연과 함께하는 럭셔리 호텔',
    amenities: '수영장, 스파, 피트니스, 레스토랑',
    info: '체크인: 15:00, 체크아웃: 11:00',
    minStayPrice: 180000,
    rooms: [
      { id: 1, name: '디럭스 룸', stayPrice: 200000, capacity: 2, maxCapacity: 4 }
    ],
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
    name: '부산 해운대 그랜드호텔',
    category: '호텔',
    grade: '4성급',
    rating: 4.6,
    reviewCount: 892,
    region: '부산시',
    address: '부산광역시 해운대구 해운대해변로 264',
    landmarkDistance: '해운대해수욕장에서 0.2km',
    intro: '해운대 바다 전망을 감상할 수 있는 호텔',
    amenities: '수영장, 레스토랑, 바, 피트니스',
    info: '체크인: 15:00, 체크아웃: 11:00',
    minStayPrice: 130000,
    rooms: [
      { id: 1, name: '오션뷰 룸', stayPrice: 150000, capacity: 2, maxCapacity: 4 }
    ],
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
    name: '강릉 오션뷰 펜션',
    category: '펜션',
    rating: 4.7,
    reviewCount: 456,
    region: '강릉시',
    address: '강원도 강릉시 사천면 사천진리 123-45',
    landmarkDistance: '사천해수욕장에서 0.3km',
    intro: '동해 바다를 바라보는 아늑한 펜션',
    amenities: '바베큐장, 주차장, 와이파이',
    info: '체크인: 16:00, 체크아웃: 11:00',
    minStayPrice: 70000,
    rooms: [
      { id: 1, name: '오션뷰 펜션', stayPrice: 80000, capacity: 4, maxCapacity: 6 }
    ],
  },
  {
    id: 4,
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
    name: '전주 한옥 게스트하우스',
    category: '게스트하우스',
    rating: 4.5,
    reviewCount: 234,
    region: '전주시',
    address: '전라북도 전주시 완산구 기린대로 99',
    landmarkDistance: '전주한옥마을에서 0.1km',
    intro: '전통 한옥의 아름다움을 경험할 수 있는 게스트하우스',
    amenities: '공용주방, 와이파이, 세탁기',
    info: '체크인: 15:00, 체크아웃: 11:00',
    minStayPrice: 45000,
    rooms: [
      { id: 1, name: '한옥 객실', stayPrice: 50000, capacity: 2, maxCapacity: 3 }
    ],
  },
  {
    id: 5,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    name: '여수 바다뷰 리조트',
    category: '리조트',
    grade: '4성급',
    rating: 4.4,
    reviewCount: 678,
    region: '여수시',
    address: '전라남도 여수시 중앙로 123',
    landmarkDistance: '여수밤바다에서 0.8km',
    intro: '여수 밤바다의 환상적인 야경을 감상할 수 있는 리조트',
    amenities: '수영장, 스파, 레스토랑, 바',
    info: '체크인: 15:00, 체크아웃: 11:00',
    minStayPrice: 100000,
    rooms: [
      { id: 1, name: '바다뷰 스위트', stayPrice: 120000, capacity: 2, maxCapacity: 4 }
    ],
  },
];

const SearchResultScreen = ({ route, navigation }: any) => {
  const { searchQuery, fallbackQuery } = route.params || { searchQuery: '제주도' };
  const [searchText, setSearchText] = useState(searchQuery);
  const [selectedCategory, setSelectedCategory] = useState('숙소');
  const [lastSearchQuery, setLastSearchQuery] = useState(searchQuery);
  const [sortBy, setSortBy] = useState('ID_ASC');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [accommodations, setAccommodations] = useState<Accommodation[]>([]);
  const [isLoading, setIsLoading] = useState(true); // 초기 로딩 상태를 true로 설정
  const [searchResponse, setSearchResponse] = useState<AccommodationSearchResponse | null>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [originalSearchQuery, setOriginalSearchQuery] = useState(searchQuery);
  const [typoSuggestions, setTypoSuggestions] = useState<string[]>([]); // 오타 검증 제안 검색어
  const [showTypoSuggestions, setShowTypoSuggestions] = useState(false); // 제안 검색어 표시 여부
  
  // 부드러운 애니메이션을 위한 설정
  const headerHeight = 200; // 헤더 높이
  const scrollThreshold = 20; // 스크롤 임계값 (더 작게 설정)
  const animationDuration = 150; // 애니메이션 지속시간 (더 짧게)
  
  // 스크롤 기반 UI 숨김/표시 상태
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const contentPaddingTop = useRef(new Animated.Value(headerHeight)).current; // 헤더 높이만큼 초기 패딩

  // API 검색 함수
  const performSearch = async (query: string, page: number = 0, resetData: boolean = true) => {
    console.log('🚀 performSearch 함수 호출됨:', { query, page, resetData });
    
    try {
        setIsLoading(true);
      console.log('🔄 로딩 상태 true로 설정');
      
      const searchParams: AccommodationSearchRequest = {
        keyword: query,
        page: page,
        size: 20,
        sortBy: sortBy as any, // enum 값 그대로 사용 (sort 파라미터로 전달됨)
      };

      console.log('🔍 숙소 검색 시작:', searchParams);
      
      const response = await searchAccommodations(searchParams);
      
      console.log('✅ 숙소 검색 성공:', response);
      console.log('📊 전체 응답 구조:', JSON.stringify(response, null, 2));
      console.log('📊 검색 결과 개수:', response.content?.length || 0);
      
      // API 응답 구조 확인 (accommodationService에서 이미 정규화됨)
      let accommodationsData = [];
      if (response && response.content && Array.isArray(response.content)) {
        accommodationsData = response.content;
        console.log('✅ content 배열에서 데이터 추출:', accommodationsData.length);
      } else if (response && Array.isArray(response)) {
        accommodationsData = response;
        console.log('✅ 직접 배열에서 데이터 추출:', accommodationsData.length);
      } else {
        console.warn('⚠️ 예상하지 못한 API 응답 구조:', response);
        accommodationsData = [];
      }
      
      console.log('📋 처리할 숙소 데이터:', accommodationsData);
      
      // API 응답 데이터 처리
      const processedAccommodations = accommodationsData.map((item: any, index: number) => {
        // 가격이 0이거나 없으면 5만원~20만원 사이에서 1000원 단위로 랜덤 생성
        let finalMinStayPrice = item.minStayPrice;
        console.log(`💰 [${index}] 원본 minStayPrice:`, item.minStayPrice);
        
        if (!finalMinStayPrice || finalMinStayPrice === 0) {
          // 5만원(50000) ~ 20만원(200000) 사이에서 1000원 단위로
          const minPrice = 50000;
          const maxPrice = 200000;
          const randomPrice = Math.floor(Math.random() * ((maxPrice - minPrice) / 1000 + 1)) * 1000 + minPrice;
          finalMinStayPrice = randomPrice;
          console.log(`💰 [${index}] 랜덤 가격 생성:`, randomPrice);
        } else {
          console.log(`💰 [${index}] 기존 가격 사용:`, finalMinStayPrice);
        }
        
        return {
          ...item,
          // API 응답에 없는 필드들 기본값 설정
          image: item.image || null,
          category: item.category || '숙소',
          grade: item.grade || null,
          rating: item.rating || null,
          reviewCount: item.reviewCount || 0,
          rooms: item.rooms || [],
          amenities: item.amenities || '',
          intro: item.intro || '',
          info: item.info || '',
          landmarkDistance: item.landmarkDistance || null,
          minStayPrice: finalMinStayPrice,
        };
      });
      
      console.log('🎯 최종 처리된 숙소 데이터:', processedAccommodations);
      console.log('🎯 숙소 데이터 개수:', processedAccommodations.length);
      
      if (processedAccommodations.length > 0) {
        console.log('🎯 첫 번째 숙소 상세 정보:', processedAccommodations[0]);
        console.log('🎯 첫 번째 숙소 ID:', processedAccommodations[0].id);
        console.log('🎯 첫 번째 숙소 이름:', processedAccommodations[0].name);
        console.log('🎯 첫 번째 숙소 이름 타입:', typeof processedAccommodations[0].name);
        console.log('🎯 첫 번째 숙소 카테고리:', processedAccommodations[0].category);
        console.log('🎯 첫 번째 숙소 카테고리 타입:', typeof processedAccommodations[0].category);
        
        // 모든 필드의 타입 확인
        Object.keys(processedAccommodations[0]).forEach(key => {
          const value = processedAccommodations[0][key];
          console.log(`🎯 ${key}:`, value, `(타입: ${typeof value})`);
        });
        
        // 가격 관련 필드 특별 확인
        console.log('💰 가격 관련 필드 확인:');
        console.log('💰 minStayPrice:', processedAccommodations[0].minStayPrice);
        console.log('💰 rooms:', processedAccommodations[0].rooms);
        if (processedAccommodations[0].rooms && processedAccommodations[0].rooms.length > 0) {
          console.log('💰 첫 번째 room:', processedAccommodations[0].rooms[0]);
          console.log('💰 stayPrice:', processedAccommodations[0].rooms[0].stayPrice);
          console.log('💰 staySalePrice:', processedAccommodations[0].rooms[0].staySalePrice);
        }
      }
      
      if (resetData) {
        setAccommodations(processedAccommodations);
        setCurrentPage(0);
        console.log('🔄 accommodations 상태 업데이트 (리셋):', processedAccommodations.length);
      } else {
        setAccommodations(prev => {
          const newData = [...prev, ...processedAccommodations];
          console.log('🔄 accommodations 상태 업데이트 (추가):', newData.length);
          return newData;
        });
      }
      
      setSearchResponse(response);
      setHasMoreData(response.hasNext);
      setCurrentPage(page);
      
      // 검색 결과가 5개 이하일 때 오타 검증 실행
      if (processedAccommodations.length <= 5 && resetData) {
        console.log('🔍 검색 결과가 5개 이하, 오타 검증 실행:', processedAccommodations.length);
        try {
          const typoResult = await checkTypoCorrection({ query });
          console.log('✅ 오타 검증 결과:', typoResult);
          
          if (typoResult.hasTypo && typoResult.suggestions && typoResult.suggestions.length > 0) {
            setTypoSuggestions(typoResult.suggestions);
            setShowTypoSuggestions(true);
            console.log('💡 제안 검색어 설정:', typoResult.suggestions);
          } else {
            setTypoSuggestions([]);
            setShowTypoSuggestions(false);
          }
        } catch (error) {
          console.error('❌ 오타 검증 실패:', error);
          setTypoSuggestions([]);
          setShowTypoSuggestions(false);
        }
      } else {
        setTypoSuggestions([]);
        setShowTypoSuggestions(false);
      }
      
      // fallback 검색 로직 제거 - 단순화
      
    } catch (error) {
      console.error('❌ 숙소 검색 실패:', error);
      console.error('❌ 에러 상세 정보:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // fallback 검색 로직 제거 - 단순화
      
      // fallback도 실패하거나 없으면 데모 데이터 사용
      if (resetData) {
        console.log('🔄 에러로 인해 데모 데이터 사용');
        setAccommodations(mockAccommodations);
        setSearchResponse({
          content: mockAccommodations,
          totalElements: mockAccommodations.length,
          totalPages: 1,
          currentPage: 0,
          size: 20,
          hasNext: false,
          hasPrevious: false
        });
      }
      
      // 사용자에게는 간단한 메시지만 표시
      console.log('⚠️ API 검색 실패, 데모 데이터로 대체');
    } finally {
          setIsLoading(false);
    }
  };

  // 정렬 옵션은 enum 값 그대로 API에 전달됨

  // 정렬과 함께 검색하는 함수
  const performSearchWithSort = async (query: string, sortOption: string, page: number = 0, resetData: boolean = true) => {
    console.log('🚀 performSearchWithSort 함수 호출됨:', { query, sortOption, page, resetData });
    
    try {
      setIsLoading(true);
      console.log('🔄 로딩 상태 true로 설정');
      
      const searchParams: AccommodationSearchRequest = {
        keyword: query,
        page: page,
        size: 20,
        sortBy: sortOption as any, // 전달받은 정렬 옵션 사용
      };

      console.log('🔍 숙소 검색 시작 (정렬 포함):', searchParams);
      
      const response = await searchAccommodations(searchParams);
      
      console.log('✅ 숙소 검색 성공:', response);
      console.log('📊 전체 응답 구조:', JSON.stringify(response, null, 2));
      console.log('📊 검색 결과 개수:', response.content?.length || 0);
      
      // API 응답 구조 확인 (accommodationService에서 이미 정규화됨)
      let accommodationsData = [];
      if (response && response.content && Array.isArray(response.content)) {
        accommodationsData = response.content;
        console.log('✅ content 배열에서 데이터 추출:', accommodationsData.length);
      } else if (response && Array.isArray(response)) {
        accommodationsData = response;
        console.log('✅ 직접 배열에서 데이터 추출:', accommodationsData.length);
      } else {
        console.warn('⚠️ 예상하지 못한 API 응답 구조:', response);
        accommodationsData = [];
      }
      
      console.log('📋 처리할 숙소 데이터:', accommodationsData);
      
      // API 응답 데이터 처리
      const processedAccommodations = accommodationsData.map((item: any, index: number) => {
        // 가격이 0이거나 없으면 5만원~20만원 사이에서 1000원 단위로 랜덤 생성
        let finalMinStayPrice = item.minStayPrice;
        console.log(`💰 [${index}] 원본 minStayPrice:`, item.minStayPrice);
        
        if (!finalMinStayPrice || finalMinStayPrice === 0) {
          // 5만원(50000) ~ 20만원(200000) 사이에서 1000원 단위로
          const minPrice = 50000;
          const maxPrice = 200000;
          const randomPrice = Math.floor(Math.random() * ((maxPrice - minPrice) / 1000 + 1)) * 1000 + minPrice;
          finalMinStayPrice = randomPrice;
          console.log(`💰 [${index}] 랜덤 가격 생성:`, randomPrice);
        } else {
          console.log(`💰 [${index}] 기존 가격 사용:`, finalMinStayPrice);
        }
        
        return {
          ...item,
          // API 응답에 없는 필드들 기본값 설정
          image: item.image || null,
          category: item.category || '숙소',
          grade: item.grade || null,
          rating: item.rating || null,
          reviewCount: item.reviewCount || 0,
          rooms: item.rooms || [],
          amenities: item.amenities || '',
          intro: item.intro || '',
          info: item.info || '',
          landmarkDistance: item.landmarkDistance || null,
          minStayPrice: finalMinStayPrice,
        };
      });
      
      console.log('🎯 최종 처리된 숙소 데이터:', processedAccommodations);
      console.log('🎯 숙소 데이터 개수:', processedAccommodations.length);
      
      if (processedAccommodations.length > 0) {
        console.log('🎯 첫 번째 숙소 상세 정보:', processedAccommodations[0]);
        console.log('🎯 첫 번째 숙소 ID:', processedAccommodations[0].id);
        console.log('🎯 첫 번째 숙소 이름:', processedAccommodations[0].name);
        console.log('🎯 첫 번째 숙소 이름 타입:', typeof processedAccommodations[0].name);
        console.log('🎯 첫 번째 숙소 카테고리:', processedAccommodations[0].category);
        console.log('🎯 첫 번째 숙소 카테고리 타입:', typeof processedAccommodations[0].category);
        
        // 모든 필드의 타입 확인
        Object.keys(processedAccommodations[0]).forEach(key => {
          const value = processedAccommodations[0][key];
          console.log(`🎯 ${key}:`, value, `(타입: ${typeof value})`);
        });
        
        // 가격 관련 필드 특별 확인
        console.log('💰 가격 관련 필드 확인:');
        console.log('💰 minStayPrice:', processedAccommodations[0].minStayPrice);
        console.log('💰 rooms:', processedAccommodations[0].rooms);
        if (processedAccommodations[0].rooms && processedAccommodations[0].rooms.length > 0) {
          console.log('💰 첫 번째 room:', processedAccommodations[0].rooms[0]);
          console.log('💰 stayPrice:', processedAccommodations[0].rooms[0].stayPrice);
          console.log('💰 staySalePrice:', processedAccommodations[0].rooms[0].staySalePrice);
        }
      }
      
      if (resetData) {
        setAccommodations(processedAccommodations);
        setCurrentPage(0);
        console.log('🔄 accommodations 상태 업데이트 (리셋):', processedAccommodations.length);
      } else {
        setAccommodations(prev => {
          const newData = [...prev, ...processedAccommodations];
          console.log('🔄 accommodations 상태 업데이트 (추가):', newData.length);
          return newData;
        });
      }
      
      setSearchResponse(response);
      setHasMoreData(response.hasNext);
      setCurrentPage(page);
      
      // 검색 결과가 5개 이하일 때 오타 검증 실행
      if (processedAccommodations.length <= 5 && resetData) {
        console.log('🔍 검색 결과가 5개 이하, 오타 검증 실행:', processedAccommodations.length);
        try {
          const typoResult = await checkTypoCorrection({ query });
          console.log('✅ 오타 검증 결과:', typoResult);
          
          if (typoResult.hasTypo && typoResult.suggestions && typoResult.suggestions.length > 0) {
            setTypoSuggestions(typoResult.suggestions);
            setShowTypoSuggestions(true);
            console.log('💡 제안 검색어 설정:', typoResult.suggestions);
          } else {
            setTypoSuggestions([]);
            setShowTypoSuggestions(false);
          }
        } catch (error) {
          console.error('❌ 오타 검증 실패:', error);
          setTypoSuggestions([]);
          setShowTypoSuggestions(false);
        }
      } else {
        setTypoSuggestions([]);
        setShowTypoSuggestions(false);
      }
      
    } catch (error) {
      console.error('❌ 숙소 검색 실패:', error);
      console.error('❌ 에러 상세 정보:', {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data
      });
      
      // fallback도 실패하거나 없으면 데모 데이터 사용
      if (resetData) {
        console.log('🔄 에러로 인해 데모 데이터 사용');
        setAccommodations(mockAccommodations);
        setSearchResponse({
          content: mockAccommodations,
          totalElements: mockAccommodations.length,
          totalPages: 1,
          currentPage: 0,
          size: 20,
          hasNext: false,
          hasPrevious: false
        });
      }
      
      // 사용자에게는 간단한 메시지만 표시
      console.log('⚠️ API 검색 실패, 데모 데이터로 대체');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색어가 변경될 때마다 실행
  useEffect(() => {
    console.log('🎯 SearchResultScreen useEffect 실행');
    console.log('🎯 searchQuery:', searchQuery);
    console.log('🎯 lastSearchQuery:', lastSearchQuery);
    console.log('🎯 originalSearchQuery:', originalSearchQuery);
    
    // 항상 검색 실행 (단순화)
    console.log('🚀 검색 실행:', searchQuery);
    setSearchText(searchQuery);
    setLastSearchQuery(searchQuery);
    setOriginalSearchQuery(searchQuery);
    console.log('🔄 상태 업데이트 완료 - lastSearchQuery:', searchQuery);
    // API 검색 실행
    performSearch(searchQuery, 0, true);
  }, [searchQuery]);

  const categories = [
    { id: 'accommodation', name: '숙소', icon: 'bed' },
    { id: 'activity', name: '액티비티', icon: 'fitness' },
    { id: 'tour', name: '투어 & 관광', icon: 'camera' },
    { id: 'flight', name: '항공권', icon: 'airplane' },
  ];

  const sortOptions = [
    { id: 'ID_ASC', name: '기본순' },
    { id: 'STAY_PRICE_ASC', name: '숙박 가격 낮은순' },
    { id: 'STAY_PRICE_DESC', name: '숙박 가격 높은순' },
    { id: 'DAYUSE_PRICE_ASC', name: '데이유스 가격 낮은순' },
    { id: 'DAYUSE_PRICE_DESC', name: '데이유스 가격 높은순' },
    { id: 'ROOM_PRICE_ASC', name: '객실 가격 낮은순' },
    { id: 'ROOM_PRICE_DESC', name: '객실 가격 높은순' },
    { id: 'RATING_DESC', name: '평점 높은순' },
    { id: 'REVIEW_DESC', name: '리뷰 많은순' },
  ];

  const handleBackPress = () => {
    // 뒤로가기 시 검색어를 유지하기 위해 Search 탭으로 이동
    navigation.navigate('Search', { 
      preserveSearchQuery: searchText 
    });
  };

  const handleSearch = () => {
    if (searchText.trim()) {
      setLastSearchQuery(searchText.trim());
      performSearch(searchText.trim(), 0, true);
    }
  };

  const handleSort = (sortType: string) => {
    console.log('🔄 정렬 옵션 변경:', sortType);
    console.log('🔄 현재 검색어:', lastSearchQuery);
    setSortBy(sortType);
    setShowSortOptions(false);
    
    // 정렬 변경 시 API 재검색 (새로운 정렬 옵션을 직접 전달)
    console.log('🔍 정렬 변경으로 인한 재검색:', {
      query: lastSearchQuery,
      sort: sortType,
      page: 0,
      size: 20
    });
    performSearchWithSort(lastSearchQuery, sortType, 0, true);
  };

  const handleCategorySelect = (categoryName: string) => {
    setSelectedCategory(categoryName);
  };

  const handleAccommodationPress = (accommodation: Accommodation) => {
    console.log('🏨 숙소 상세 페이지로 이동:', {
      id: accommodation.id,
      name: accommodation.name,
      category: accommodation.category,
      region: accommodation.region,
      minStayPrice: accommodation.minStayPrice,
      fullData: accommodation
    });
    navigation.navigate('AccommodationDetail', { 
      accommodation: accommodation, // 전체 숙소 데이터 전달
      searchQuery: searchText // 검색어도 함께 전달
    });
  };

  // 제안 검색어 클릭 시 해당 검색어로 재검색
  const handleSuggestionPress = (suggestion: string) => {
    console.log('🔍 제안 검색어로 재검색:', suggestion);
    setSearchText(suggestion);
    setLastSearchQuery(suggestion);
    setOriginalSearchQuery(suggestion);
    setShowTypoSuggestions(false);
    setTypoSuggestions([]);
    performSearch(suggestion, 0, true);
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY;
    
    // 애니메이션 중이면 스크롤 이벤트 무시
    if (isAnimating) {
      return;
    }
    
    // 스크롤 임계값 설정 (더 작은 값으로 설정하여 더 민감하게 반응)
    if (Math.abs(scrollDelta) > scrollThreshold) {
      if (scrollDelta > 0 && currentScrollY > 50) {
        // 아래로 스크롤 - 헤더 숨김
        if (isHeaderVisible) {
          setIsHeaderVisible(false);
          setIsAnimating(true);
          
          // 헤더만 먼저 숨기고, 패딩은 즉시 제거
          Animated.timing(headerTranslateY, {
            toValue: -headerHeight,
            duration: animationDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start();
          
          // 패딩을 다음 프레임에서 0으로 설정하여 렉 방지
          requestAnimationFrame(() => {
            contentPaddingTop.setValue(0);
          });
          
          // 애니메이션 완료 후 상태 초기화
          setTimeout(() => {
            setIsAnimating(false);
          }, animationDuration);
        }
      } else if (scrollDelta < 0) {
        // 위로 스크롤 - 헤더 표시
        if (!isHeaderVisible) {
          setIsHeaderVisible(true);
          setIsAnimating(true);
          
          // 패딩을 먼저 설정하고 헤더를 표시
          requestAnimationFrame(() => {
            contentPaddingTop.setValue(headerHeight);
          });
          
          Animated.timing(headerTranslateY, {
            toValue: 0,
            duration: animationDuration,
            easing: Easing.out(Easing.cubic),
            useNativeDriver: true,
          }).start(() => {
            setIsAnimating(false);
          });
        }
      }
    }
    setLastScrollY(currentScrollY);
  };

  // 숙소별 기본 이미지 매핑
  const getAccommodationImage = (name: string, category?: string) => {
    const imageMap: { [key: string]: string } = {
      // 호텔
      '호텔': 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=200&fit=crop',
      '리조트': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
      '펜션': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=200&fit=crop',
      '게스트하우스': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=200&fit=crop',
      '모텔': 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=200&fit=crop',
      // 지역별
      '제주': 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=200&fit=crop',
      '부산': 'https://images.unsplash.com/photo-1539650116574-75c0c6d73c6e?w=400&h=200&fit=crop',
      '서울': 'https://images.unsplash.com/photo-1540959733332-eab4deabeeaf?w=400&h=200&fit=crop',
      '강릉': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
      '전주': 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=200&fit=crop',
      '여수': 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=200&fit=crop',
    };

    // 이름에서 지역 키워드 찾기
    for (const [key, imageUrl] of Object.entries(imageMap)) {
      if (name.includes(key)) {
        return imageUrl;
      }
    }

    // 카테고리별 기본 이미지
    if (category) {
      return imageMap[category] || imageMap['호텔'];
    }

    // 기본 이미지
    return imageMap['호텔'];
  };

  const renderAccommodationItem = ({ item }: { item: Accommodation }) => {
    console.log('🎨 renderAccommodationItem 호출됨:', {
      id: item.id,
      name: item.name,
      category: item.category,
      region: item.region
    });
    
    // 데이터 안전성 검사
    if (!item || typeof item !== 'object') {
      console.error('❌ 잘못된 item 데이터:', item);
      return null;
    }
    
    // 최저 가격 계산 (rooms 배열에서)
    const minPrice = item.rooms?.reduce((min, room) => {
      const stayPrice = room.stayPrice || room.staySalePrice || 0;
      return stayPrice > 0 && (min === 0 || stayPrice < min) ? stayPrice : min;
    }, 0) || 0;

    // 적절한 이미지 선택
    const imageUrl = item.image || getAccommodationImage(item.name, item.category);
    
    console.log('🎨 렌더링 정보:', {
      itemId: item.id,
      itemName: item.name,
      minPrice,
      imageUrl,
      hasRooms: item.rooms?.length || 0,
      roomsData: item.rooms,
      itemMinStayPrice: item.minStayPrice,
      finalPrice: item.minStayPrice || minPrice,
      shouldShowPrice: (minPrice > 0 || item.minStayPrice),
      priceDisplayLogic: {
        condition: item.minStayPrice && item.minStayPrice > 0,
        selectedPrice: item.minStayPrice && item.minStayPrice > 0 ? item.minStayPrice : minPrice,
        formattedPrice: (item.minStayPrice && item.minStayPrice > 0 ? item.minStayPrice : minPrice).toLocaleString()
      },
      fullItemData: item
    });

    return (
    <TouchableOpacity 
      style={styles.accommodationCard}
      onPress={() => handleAccommodationPress(item)}
    >
        <Image 
          source={{ uri: imageUrl }} 
          style={styles.accommodationImage} 
        />
      <View style={styles.accommodationInfo}>
        <View style={styles.accommodationHeader}>
            <Text style={styles.accommodationName}>{String(item.name || '').trim()}</Text>
            {item.grade && String(item.grade).trim() ? (
            <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>{String(item.grade || '').trim()}</Text>
            </View>
            ) : null}
        </View>
        
          <Text style={styles.accommodationCategory}>{String(item.category || '숙소').trim()}</Text>
        
          {item.rating && String(item.rating).trim() ? (
        <View style={styles.ratingContainer}>
          <Ionicons name="star" size={14} color="#FFD700" />
              <Text style={styles.ratingText}>{String(item.rating || '').trim()}</Text>
              {item.reviewCount && String(item.reviewCount).trim() ? (
                <Text style={styles.reviewCount}>({String(item.reviewCount || 0).trim()}개 리뷰)</Text>
              ) : null}
        </View>
          ) : null}
        
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={14} color="#7F8C8D" />
            <Text style={styles.locationText}>{String(item.region || '').trim()}</Text>
        </View>
        
          {item.address && String(item.address).trim() ? (
            <View style={styles.addressContainer}>
              <Ionicons name="home" size={12} color="#BDC3C7" />
              <Text style={styles.addressText} numberOfLines={1}>
                {String(item.address || '').trim()}
              </Text>
            </View>
          ) : null}
          
          <View style={styles.priceContainer}>
            <Text style={styles.priceLabel}>최저가</Text>
            <Text style={styles.priceText}>
              ₩{item.minStayPrice ? item.minStayPrice.toLocaleString() : minPrice.toLocaleString()}
            </Text>
            <Text style={styles.priceUnit}>/박</Text>
          </View>
      </View>
    </TouchableOpacity>
  );
  };

  const renderLoadingState = () => (
    <View style={styles.loadingState}>
      <LoadingDots size={12} color="#FF6B35" />
      <Text style={styles.loadingText}>검색 중...</Text>
    </View>
  );

  const renderEmptyState = () => {
    console.log('🎨 renderEmptyState 호출됨:', {
      isLoading,
      accommodationsLength: accommodations?.length || 0,
      originalSearchQuery
    });
    
    // 로딩 중일 때는 빈 상태를 표시하지 않음
    if (isLoading) {
      console.log('🎨 로딩 중이므로 빈 상태 표시 안함');
      return null;
    }
    
    console.log('🎨 빈 상태 UI 렌더링');
    return (
      <View style={styles.emptyState}>
        <Ionicons name="search" size={64} color="#BDC3C7" />
        <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
        <Text style={styles.emptySubtitle}>
          '{lastSearchQuery}'에 대한 검색 결과를 찾을 수 없습니다.{'\n'}
          다른 키워드로 검색해보세요.
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 상단 네비게이션 - 애니메이션 적용 */}
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
      >
        {/* 상단 네비게이션 */}
        <View style={styles.topNavigation}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={18} color="#7F8C8D" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
              placeholder="검색어를 입력하세요"
              placeholderTextColor="#7F8C8D"
              onSubmitEditing={handleSearch}
              returnKeyType="search"
            />
            <TouchableOpacity onPress={handleSearch} style={styles.searchButton}>
              <Ionicons name="search" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 카테고리 탭 */}
        <View style={styles.categoryContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {categories.map((category) => (
              <TouchableOpacity
                key={category.id}
                style={[
                  styles.categoryButton,
                  selectedCategory === category.name && styles.categoryButtonActive
                ]}
                onPress={() => handleCategorySelect(category.name)}
              >
                <Ionicons
                  name={category.icon as any}
                  size={16}
                  color={selectedCategory === category.name ? '#FFFFFF' : '#7F8C8D'}
                  style={styles.categoryIcon}
                />
                <Text
                  style={[
                    styles.categoryText,
                    selectedCategory === category.name && styles.categoryTextActive
                  ]}
                >
                  {String(category.name || '')}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* 정렬 옵션 */}
        <View style={styles.sortContainer}>
          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons name="funnel" size={16} color="#7F8C8D" />
            <Text style={styles.sortButtonText}>
              {String(sortOptions.find(option => option.id === sortBy)?.name || '정렬')}
            </Text>
            <Ionicons 
              name={showSortOptions ? "chevron-up" : "chevron-down"} 
              size={16} 
              color="#7F8C8D" 
            />
          </TouchableOpacity>
          
          {showSortOptions && (
            <View style={styles.sortDropdown}>
              {sortOptions.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.sortOption,
                    sortBy === option.id && styles.sortOptionActive
                  ]}
                  onPress={() => handleSort(option.id)}
                >
                  <Text
                    style={[
                      styles.sortOptionText,
                      sortBy === option.id && styles.sortOptionTextActive
                    ]}
                  >
                    {String(option.name || '')}
                  </Text>
                  {sortBy === option.id && (
                    <Ionicons name="checkmark" size={16} color="#FF6B35" />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>
      </Animated.View>

      {/* 검색 결과 헤더 */}
      {searchResponse && selectedCategory === '숙소' && (
        <View style={styles.resultsHeader}>
          <Text style={styles.resultsCount}>
            '{lastSearchQuery}' 검색 결과 {searchResponse.totalElements}개
          </Text>
          
          {/* 제안 검색어 표시 */}
          {showTypoSuggestions && typoSuggestions.length > 0 && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>다른 검색어를 시도해보세요:</Text>
              <View style={styles.suggestionsList}>
                {typoSuggestions.slice(0, 3).map((suggestion, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.suggestionChip}
                    onPress={() => handleSuggestionPress(suggestion)}
                  >
                    <Text style={styles.suggestionText}>{suggestion}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}
        </View>
      )}

      {/* 검색 결과 */}
      <Animated.View style={[styles.resultsContainer, { paddingTop: contentPaddingTop }]}>
        {selectedCategory === '숙소' ? (
          isLoading ? (
            (() => {
              console.log('🎨 로딩 상태 렌더링');
              return renderLoadingState();
            })()
          ) : (
            (() => {
              console.log('🎨 FlatList 렌더링 조건 확인:', {
                selectedCategory,
                isLoading,
                accommodationsLength: accommodations?.length || 0,
                accommodationsData: accommodations
              });
              console.log('🎨 FlatList 렌더링 - accommodations 데이터:', accommodations);
              console.log('🎨 FlatList 렌더링 - accommodations 길이:', accommodations?.length || 0);
              console.log('🎨 FlatList 렌더링 - isLoading:', isLoading);
              return (
            <FlatList
              data={accommodations}
              renderItem={renderAccommodationItem}
                  keyExtractor={(item, index) => {
                    console.log('🔑 keyExtractor 호출:', { id: item.id, index, name: item.name });
                    if (!item || typeof item !== 'object') {
                      console.error('❌ keyExtractor에서 잘못된 item:', item);
                      return `error-${index}`;
                    }
                    return String(item.id || `item-${index}`);
                  }}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.resultsList}
              ListEmptyComponent={renderEmptyState}
              onScroll={handleScroll}
              scrollEventThrottle={16}
            />
              );
            })()
          )
        ) : (
          <View style={styles.comingSoonContainer}>
            <Ionicons name="construct" size={64} color="#BDC3C7" />
            <Text style={styles.comingSoonTitle}>준비 중입니다</Text>
            <Text style={styles.comingSoonSubtitle}>
              {selectedCategory} 검색 기능은 곧 출시됩니다
            </Text>
          </View>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 0,
  },
  searchButton: {
    padding: 8,
    marginLeft: 8,
  },
  categoryContainer: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  categoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  categoryButtonActive: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  categoryIcon: {
    marginRight: 6,
  },
  categoryText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  categoryTextActive: {
    color: '#FFFFFF',
  },
  sortContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
    position: 'relative',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  sortButtonText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  sortDropdown: {
    position: 'absolute',
    top: '100%',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
    zIndex: 1000,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  sortOptionActive: {
    backgroundColor: '#FFF5F2',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#333333',
  },
  sortOptionTextActive: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  resultsHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  resultsCount: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  fallbackNotice: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
    fontStyle: 'italic',
  },
  resultsContainer: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  resultsList: {
    padding: 16,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 16,
    fontWeight: '500',
  },
  accommodationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  accommodationImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  accommodationInfo: {
    padding: 16,
  },
  accommodationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  accommodationName: {
    flex: 1,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
  },
  gradeBadge: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  gradeText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  accommodationCategory: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  ratingText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '500',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  addressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  addressText: {
    fontSize: 12,
    color: '#BDC3C7',
    marginLeft: 4,
    flex: 1,
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  priceLabel: {
    fontSize: 12,
    color: '#7F8C8D',
    marginRight: 4,
  },
  priceText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: 'bold',
  },
  priceUnit: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
  comingSoonContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  comingSoonTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  comingSoonSubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  // 제안 검색어 스타일
  suggestionsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  suggestionsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  suggestionsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  suggestionChip: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  suggestionText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '500',
  },
});

export default SearchResultScreen;
