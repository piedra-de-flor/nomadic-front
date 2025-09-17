import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  FlatList,
  Alert,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants';
import { Accommodation } from '../../types';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getAllPlans } from '../../services/plan/planService';
import { createDetailPlan } from '../../services/plan/detailPlanService';
import { searchPlaces } from '../../services/place/placeSearchService';

const { width } = Dimensions.get('window');

// 숙소 상세 정보 타입 정의
interface AccommodationDetail {
  id: number;
  image: string;
  name: string;
  category: string;
  grade?: string;
  rating?: number;
  reviewCount?: number;
  region: string;
  address: string;
  landmarkDistance?: string;
  intro?: string;
  amenities?: string;
  info?: string;
  rooms: Room[];
}

interface Room {
  id: number;
  name: string;
  dayusePrice?: number;
  dayuseSalePrice?: number;
  hasDayuseDiscount?: boolean;
  dayuseSoldout?: boolean;
  dayuseTime?: string;
  stayPrice?: number;
  staySalePrice?: number;
  hasStayDiscount?: boolean;
  staySoldout?: boolean;
  stayCheckinTime?: string;
  stayCheckoutTime?: string;
  capacity?: number;
  maxCapacity?: number;
}

// 데모 숙소 상세 데이터
const mockAccommodationDetail: AccommodationDetail = {
  id: 1,
  image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
  name: '제주 신라호텔',
  category: '호텔',
  grade: '5성급',
  rating: 4.8,
  reviewCount: 1247,
  region: '제주시',
  address: '제주특별자치도 제주시 중문관광로 72번길 60',
  landmarkDistance: '중문관광단지에서 0.5km',
  intro: '제주도의 아름다운 자연과 함께하는 럭셔리 호텔입니다. 한라산과 바다를 동시에 감상할 수 있는 최고의 위치에 자리잡고 있으며, 세계적인 서비스와 편의시설을 제공합니다.',
  amenities: '수영장, 스파, 피트니스, 레스토랑, 바, 비즈니스 센터, 와이파이, 주차장, 애완동물 동반 가능',
  info: '체크인: 15:00, 체크아웃: 11:00, 24시간 프론트 데스크, 룸서비스',
  rooms: [
    {
      id: 1,
      name: '디럭스 룸',
      dayusePrice: 150000,
      dayuseSalePrice: 120000,
      hasDayuseDiscount: true,
      dayuseSoldout: false,
      dayuseTime: '10:00-18:00',
      stayPrice: 300000,
      staySalePrice: 250000,
      hasStayDiscount: true,
      staySoldout: false,
      stayCheckinTime: '15:00',
      stayCheckoutTime: '11:00',
      capacity: 2,
      maxCapacity: 4,
    },
    {
      id: 2,
      name: '스위트 룸',
      dayusePrice: 250000,
      dayuseSalePrice: 200000,
      hasDayuseDiscount: true,
      dayuseSoldout: false,
      dayuseTime: '10:00-18:00',
      stayPrice: 500000,
      staySalePrice: 450000,
      hasStayDiscount: true,
      staySoldout: false,
      stayCheckinTime: '15:00',
      stayCheckoutTime: '11:00',
      capacity: 2,
      maxCapacity: 6,
    },
    {
      id: 3,
      name: '프리미엄 스위트',
      dayusePrice: 400000,
      dayuseSalePrice: 350000,
      hasDayuseDiscount: true,
      dayuseSoldout: true,
      dayuseTime: '10:00-18:00',
      stayPrice: 800000,
      staySalePrice: 700000,
      hasStayDiscount: true,
      staySoldout: false,
      stayCheckinTime: '15:00',
      stayCheckoutTime: '11:00',
      capacity: 2,
      maxCapacity: 8,
    },
  ],
};

const AccommodationDetailScreen = ({ navigation, route }: any) => {
  const { accommodation, searchQuery } = route.params || {};
  console.log('🏨 AccommodationDetailScreen - route.params:', route.params);
  console.log('🏨 AccommodationDetailScreen - accommodation:', accommodation);
  
  const [accommodationData, setAccommodationData] = useState<AccommodationDetail | null>(mockAccommodationDetail);
  const [selectedRoomType, setSelectedRoomType] = useState<'dayuse' | 'stay'>('stay');
  const [selectedRoom, setSelectedRoom] = useState<Room | null>(null);
  const [isIntroExpanded, setIsIntroExpanded] = useState(false);
  const [isAmenitiesExpanded, setIsAmenitiesExpanded] = useState(false);
  const [isInfoExpanded, setIsInfoExpanded] = useState(false);
  
  // 내 계획에 추가 관련 상태
  const [showAddToPlanModal, setShowAddToPlanModal] = useState(false);
  const [userPlans, setUserPlans] = useState<any[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<any>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableDates, setAvailableDates] = useState<string[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  
  // Redux 상태
  const { isAuthenticated, user } = useSelector((state: RootState) => state.auth);

  // 전달받은 accommodation 데이터를 AccommodationDetail 형태로 변환
  React.useEffect(() => {
    if (accommodation) {
      console.log('🏨 전달받은 숙소 데이터:', accommodation);
      
      // Accommodation을 AccommodationDetail로 변환
      const convertedData: AccommodationDetail = {
        id: accommodation.id,
        image: accommodation.image || 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=800',
        name: accommodation.name,
        category: accommodation.category || '숙소',
        grade: accommodation.grade,
        rating: accommodation.rating,
        reviewCount: accommodation.reviewCount,
        region: accommodation.region,
        address: accommodation.address,
        landmarkDistance: accommodation.landmarkDistance,
        intro: accommodation.intro || `${accommodation.name}에서 편안한 휴식을 즐기세요. 최고의 서비스와 편의시설을 제공합니다.`,
        amenities: accommodation.amenities || '와이파이, 주차장, 24시간 프론트 데스크',
        info: accommodation.info || '체크인: 15:00, 체크아웃: 11:00',
        rooms: accommodation.rooms || [
          {
            id: 1,
            name: '스탠다드 룸',
            dayusePrice: 100000,
            dayuseSalePrice: 80000,
            hasDayuseDiscount: true,
            dayuseSoldout: false,
            dayuseTime: '10:00-18:00',
            stayPrice: accommodation.minStayPrice || 200000,
            staySalePrice: (accommodation.minStayPrice || 200000) * 0.9,
            hasStayDiscount: true,
            staySoldout: false,
            stayCheckinTime: '15:00',
            stayCheckoutTime: '11:00',
            capacity: 2,
            maxCapacity: 4,
          }
        ],
      };
      
      setAccommodationData(convertedData);
      console.log('🏨 변환된 숙소 데이터:', convertedData);
    } else {
      // accommodation이 없으면 데모 데이터 사용 (이미 초기값으로 설정됨)
      console.log('🏨 accommodation 데이터 없음, 데모 데이터 사용');
      // setAccommodationData(mockAccommodationDetail); // 이미 초기값으로 설정됨
    }
  }, [accommodation]);

  const handleBackPress = () => {
    // 검색어가 있으면 SearchResult로, 없으면 goBack
    if (searchQuery) {
      navigation.navigate('SearchResult', { searchQuery });
    } else {
      navigation.goBack();
    }
  };

  // accommodationData가 없으면 로딩 표시
  if (!accommodationData) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </View>
    );
  }

  const handleShare = () => {
    Alert.alert('공유', '숙소 정보를 공유합니다.');
  };

  const handleFavorite = () => {
    Alert.alert('찜하기', '찜 목록에 추가되었습니다.');
  };

  const handleRoomSelect = (room: Room) => {
    setSelectedRoom(room);
    Alert.alert('객실 선택', `${room.name}을 선택하셨습니다.`);
  };

  // 내 계획에 추가 관련 함수들
  const loadUserPlans = async () => {
    if (!isAuthenticated || !user?.email) return;
    
    try {
      setIsLoadingPlans(true);
      const response = await getAllPlans(user.email);
      console.log('🔍 로드된 계획들:', response.plans);
      // API 응답에 id가 없으므로 인덱스를 id로 사용
      const plansWithId = (response.plans || []).map((plan, index) => ({
        ...plan,
        id: plan.id || index + 1 // API에서 id가 없으면 인덱스 사용
      }));
      console.log('🔍 id 추가된 계획들:', plansWithId);
      setUserPlans(plansWithId);
    } catch (error) {
      console.error('❌ 계획 로드 실패:', error);
      Alert.alert('오류', '계획을 불러오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoadingPlans(false);
    }
  };

  const generateAvailableDates = (startDate: string, endDate: string) => {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }
    
    return dates;
  };

  const handlePlanSelect = (plan: any) => {
    console.log('🔍 계획 선택:', plan.id, plan.place);
    setSelectedPlan(plan);
    const dates = generateAvailableDates(plan.startDay, plan.endDay);
    setAvailableDates(dates);
    setSelectedDate('');
  };

  const handleAddToPlan = async () => {
    if (!selectedPlan || !selectedDate || !selectedTime || !accommodationData) {
      Alert.alert('알림', '계획, 날짜, 시간을 모두 선택해주세요.');
      return;
    }

    if (!isAuthenticated || !user?.email) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    try {
      setIsCreating(true);
      
      // 숙소 주소로 Google Places API 검색
      console.log('🔍 검색할 숙소 주소:', accommodationData.address);
      console.log('🔍 숙소 전체 정보:', accommodationData);
      
      // Google Places API로 주소 검색하여 위치 정보 획득
      const searchResults = await searchPlaces(accommodationData.address);
      
      console.log('🔍 Google Places API 검색 결과 개수:', searchResults.length);
      console.log('🔍 Google Places API 전체 검색 결과:', JSON.stringify(searchResults, null, 2));
      
      if (searchResults.length === 0) {
        Alert.alert('오류', '숙소 주소 검색 결과를 찾을 수 없습니다.');
        return;
      }

      const place = searchResults[0];
      console.log('🔍 선택된 장소 정보 (첫 번째 결과):', JSON.stringify(place, null, 2));
      console.log('🔍 장소 이름:', place.name);
      console.log('🔍 장소 주소:', place.address);
      console.log('🔍 위도:', place.latitude);
      console.log('🔍 경도:', place.longitude);
      console.log('🔍 Place ID:', place.placeId);
      
      if (!place || place.latitude === 0 || place.longitude === 0) {
        Alert.alert('오류', '주소 검색 결과에서 위치 정보를 찾을 수 없습니다.');
        return;
      }
      
      // 세부 계획 생성 (Location 타입에 맞게 수정)
      const detailPlanData = {
        planId: selectedPlan.id || 1, // 임시로 1 사용 (실제로는 API에서 받은 id 사용해야 함)
        location: {
          name: accommodationData.name,
          latitude: place.latitude,
          longitude: place.longitude,
        },
        date: new Date(selectedDate).toISOString(),
        time: selectedTime,
        version: 0,
      };

      await createDetailPlan(detailPlanData, user.email);
      
      Alert.alert('성공', '계획에 숙소가 추가되었습니다.');
      setShowAddToPlanModal(false);
      
      // 상태 초기화
      setSelectedPlan(null);
      setSelectedDate('');
      setSelectedTime('');
      setAvailableDates([]);
      
    } catch (error) {
      console.error('❌ 계획 추가 실패:', error);
      Alert.alert('오류', '계획 추가 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  const openAddToPlanModal = () => {
    if (!isAuthenticated) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }
    
    setShowAddToPlanModal(true);
    // 상태 초기화
    console.log('🔍 모달 열기 - selectedPlan 초기화 전:', selectedPlan);
    setSelectedPlan(null);
    setSelectedDate('');
    setSelectedTime('');
    setAvailableDates([]);
    console.log('🔍 모달 열기 - selectedPlan 초기화 후:', null);
    loadUserPlans();
  };

  const renderRoomItem = ({ item }: { item: Room }) => (
    <TouchableOpacity
      style={[
        styles.roomCard,
        selectedRoom?.id === item.id && styles.roomCardSelected
      ]}
      onPress={() => handleRoomSelect(item)}
    >
      <View style={styles.roomHeader}>
        <Text style={styles.roomName}>{item.name}</Text>
        <View style={styles.roomCapacity}>
          <Ionicons name="people" size={16} color="#7F8C8D" />
          <Text style={styles.capacityText}>
            {item.capacity}명 (최대 {item.maxCapacity}명)
          </Text>
        </View>
      </View>

      {selectedRoomType === 'dayuse' ? (
        <View style={styles.roomPricing}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>데이유스</Text>
            <Text style={styles.timeText}>{item.dayuseTime}</Text>
          </View>
          <View style={styles.priceContainer}>
            {item.hasDayuseDiscount && (
              <Text style={styles.originalPrice}>
                ₩{item.dayusePrice?.toLocaleString()}
              </Text>
            )}
            <Text style={styles.salePrice}>
              ₩{item.dayuseSalePrice?.toLocaleString()}
            </Text>
            {item.hasDayuseDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>할인</Text>
              </View>
            )}
          </View>
          {item.dayuseSoldout && (
            <View style={styles.soldoutBadge}>
              <Text style={styles.soldoutText}>매진</Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.roomPricing}>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>숙박</Text>
            <Text style={styles.timeText}>
              체크인 {item.stayCheckinTime} / 체크아웃 {item.stayCheckoutTime}
            </Text>
          </View>
          <View style={styles.priceContainer}>
            {item.hasStayDiscount && (
              <Text style={styles.originalPrice}>
                ₩{item.stayPrice?.toLocaleString()}
              </Text>
            )}
            <Text style={styles.salePrice}>
              ₩{item.staySalePrice?.toLocaleString()}
            </Text>
            {item.hasStayDiscount && (
              <View style={styles.discountBadge}>
                <Text style={styles.discountText}>할인</Text>
              </View>
            )}
          </View>
          {item.staySoldout && (
            <View style={styles.soldoutBadge}>
              <Text style={styles.soldoutText}>매진</Text>
            </View>
          )}
        </View>
      )}
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* 상단 네비게이션 */}
      <View style={styles.topNavigation}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <View style={styles.navigationActions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleFavorite} style={styles.actionButton}>
            <Ionicons name="heart-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 숙소 이미지 */}
        <View style={styles.imageContainer}>
          <Image source={{ uri: accommodationData.image }} style={styles.accommodationImage} />
          <View style={styles.imageOverlay}>
            <View style={styles.ratingContainer}>
              <Ionicons name="star" size={16} color="#FFD700" />
              <Text style={styles.ratingText}>{accommodationData.rating}</Text>
              <Text style={styles.reviewCount}>({accommodationData.reviewCount}개 리뷰)</Text>
            </View>
          </View>
        </View>

        {/* 숙소 기본 정보 */}
        <View style={styles.infoSection}>
          <View style={styles.titleContainer}>
            <Text style={styles.accommodationName}>{accommodationData?.name || '숙소'}</Text>
            {accommodationData?.grade && (
              <View style={styles.gradeBadge}>
                <Text style={styles.gradeText}>{accommodationData.grade}</Text>
              </View>
            )}
          </View>
          
          <Text style={styles.category}>{accommodationData?.category || '숙소'}</Text>
          
          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#7F8C8D" />
            <Text style={styles.locationText}>{accommodationData?.region || ''}</Text>
          </View>
          
          <Text style={styles.address}>{accommodationData?.address || ''}</Text>
          
          {accommodationData?.landmarkDistance && (
            <View style={styles.landmarkContainer}>
              <Ionicons name="walk" size={16} color="#7F8C8D" />
              <Text style={styles.landmarkText}>{accommodationData.landmarkDistance}</Text>
            </View>
          )}
        </View>

        {/* 숙소 소개 */}
        {accommodationData.intro && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>숙소 소개</Text>
            <Text 
              style={styles.sectionContent}
              numberOfLines={isIntroExpanded ? undefined : 3}
            >
              {accommodationData.intro}
            </Text>
            {accommodationData.intro.length > 100 && (
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setIsIntroExpanded(!isIntroExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {isIntroExpanded ? '접기' : '더보기'}
                </Text>
                <Ionicons 
                  name={isIntroExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#FF6B35" 
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 편의시설 */}
        {accommodationData.amenities && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>편의시설</Text>
            <View style={styles.amenitiesContainer}>
              {accommodationData.amenities.split(', ').map((amenity, index) => {
                // 처음 6개만 표시하고 나머지는 접힌 상태에서 숨김
                if (!isAmenitiesExpanded && index >= 6) return null;
                return (
                  <View key={index} style={styles.amenityItem}>
                    <Ionicons name="checkmark-circle" size={16} color="#50C878" />
                    <Text style={styles.amenityText}>{amenity}</Text>
                  </View>
                );
              })}
            </View>
            {accommodationData.amenities.split(', ').length > 6 && (
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setIsAmenitiesExpanded(!isAmenitiesExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {isAmenitiesExpanded ? '접기' : '더보기'}
                </Text>
                <Ionicons 
                  name={isAmenitiesExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#FF6B35" 
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 숙소 정보 */}
        {accommodationData.info && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>숙소 정보</Text>
            <Text 
              style={styles.sectionContent}
              numberOfLines={isInfoExpanded ? undefined : 2}
            >
              {accommodationData.info}
            </Text>
            {accommodationData.info.length > 80 && (
              <TouchableOpacity 
                style={styles.expandButton}
                onPress={() => setIsInfoExpanded(!isInfoExpanded)}
              >
                <Text style={styles.expandButtonText}>
                  {isInfoExpanded ? '접기' : '더보기'}
                </Text>
                <Ionicons 
                  name={isInfoExpanded ? 'chevron-up' : 'chevron-down'} 
                  size={16} 
                  color="#FF6B35" 
                />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* 객실 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>객실 선택</Text>
          
          {/* 데이유스/숙박 탭 */}
          <View style={styles.roomTypeTabs}>
            <TouchableOpacity
              style={[
                styles.roomTypeTab,
                selectedRoomType === 'dayuse' && styles.roomTypeTabActive
              ]}
              onPress={() => setSelectedRoomType('dayuse')}
            >
              <Text style={[
                styles.roomTypeTabText,
                selectedRoomType === 'dayuse' && styles.roomTypeTabTextActive
              ]}>
                데이유스
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.roomTypeTab,
                selectedRoomType === 'stay' && styles.roomTypeTabActive
              ]}
              onPress={() => setSelectedRoomType('stay')}
            >
              <Text style={[
                styles.roomTypeTabText,
                selectedRoomType === 'stay' && styles.roomTypeTabTextActive
              ]}>
                숙박
              </Text>
            </TouchableOpacity>
          </View>

          {/* 객실 목록 */}
          <FlatList
            data={accommodationData.rooms}
            renderItem={renderRoomItem}
            keyExtractor={(item) => item.id.toString()}
            scrollEnabled={false}
            showsVerticalScrollIndicator={false}
          />
        </View>

        {/* 하단 여백 */}
        <View style={styles.bottomSpacing} />

      </ScrollView>

      {/* 내 계획에 추가 버튼 */}
      <View style={styles.addToPlanButton}>
        <TouchableOpacity 
          style={styles.addToPlanButtonInner}
          onPress={openAddToPlanModal}
        >
          <Ionicons name="add-circle" size={20} color="#FFFFFF" />
          <Text style={styles.addToPlanButtonText}>내 계획에 추가</Text>
        </TouchableOpacity>
      </View>

      {/* 내 계획에 추가 모달 */}
      <Modal
        visible={showAddToPlanModal}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>내 계획에 추가</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => {
                setShowAddToPlanModal(false);
                // 상태 초기화
                setSelectedPlan(null);
                setSelectedDate('');
                setSelectedTime('');
                setAvailableDates([]);
              }}
            >
              <Ionicons name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalContent}>
            {/* 계획 선택 */}
            <View style={styles.modalSection}>
              <Text style={styles.modalSectionTitle}>여행 계획 선택</Text>
              {isLoadingPlans ? (
                <Text style={styles.modalLoadingText}>계획을 불러오는 중...</Text>
              ) : userPlans.length === 0 ? (
                <Text style={styles.emptyText}>등록된 계획이 없습니다.</Text>
              ) : (
                <View style={styles.planList}>
                  {userPlans.map((plan) => {
                    const isSelected = selectedPlan && 
                                      selectedPlan !== null && 
                                      selectedPlan.id !== null && 
                                      selectedPlan.id !== undefined && 
                                      plan.id !== null && 
                                      plan.id !== undefined && 
                                      selectedPlan.id === plan.id;
                    console.log('🔍 계획 렌더링:', {
                      planId: plan.id,
                      planPlace: plan.place,
                      selectedPlanId: selectedPlan?.id,
                      selectedPlan: selectedPlan,
                      isSelected: isSelected
                    });
                    return (
                    <TouchableOpacity
                      key={plan.id}
                      style={[
                        styles.planItem,
                        isSelected && styles.planItemSelected
                      ]}
                      onPress={() => handlePlanSelect(plan)}
                    >
                      <View style={styles.planItemContent}>
                        <View style={styles.planItemText}>
                          <Text style={styles.planName}>{plan.place}</Text>
                          <Text style={styles.planDate}>
                            {new Date(plan.startDay).toLocaleDateString()} - {new Date(plan.endDay).toLocaleDateString()}
                          </Text>
                        </View>
                        {isSelected && (
                          <View style={styles.planItemCheck}>
                            <Ionicons name="checkmark-circle" size={24} color={UI_CONFIG.COLORS.PRIMARY} />
                          </View>
                        )}
                      </View>
                    </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>

            {/* 날짜 선택 */}
            {selectedPlan && availableDates.length > 0 && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>날짜 선택</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.dateScrollView}>
                  {availableDates.map((date) => (
                    <TouchableOpacity
                      key={date}
                      style={[
                        styles.dateItem,
                        selectedDate === date && styles.dateItemSelected
                      ]}
                      onPress={() => setSelectedDate(date)}
                    >
                      <Text style={[
                        styles.dateText,
                        selectedDate === date && styles.dateTextSelected
                      ]}>
                        {new Date(date).toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' })}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* 시간 선택 */}
            {selectedDate && (
              <View style={styles.modalSection}>
                <Text style={styles.modalSectionTitle}>시간 선택</Text>
                <View style={styles.timeContainer}>
                  {Array.from({ length: 24 }, (_, i) => {
                    const hour = i.toString().padStart(2, '0');
                    return (
                      <TouchableOpacity
                        key={hour}
                        style={[
                          styles.timeItem,
                          selectedTime === `${hour}:00` && styles.timeItemSelected
                        ]}
                        onPress={() => setSelectedTime(`${hour}:00`)}
                      >
                        <Text style={[
                          styles.modalTimeText,
                          selectedTime === `${hour}:00` && styles.modalTimeTextSelected
                        ]}>
                          {hour}:00
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            )}
          </ScrollView>

          {/* 추가 버튼 */}
          <View style={styles.modalFooter}>
            <TouchableOpacity
              style={[
                styles.addButton,
                (!selectedPlan || !selectedDate || !selectedTime || isCreating) && styles.addButtonDisabled
              ]}
              onPress={handleAddToPlan}
              disabled={!selectedPlan || !selectedDate || !selectedTime || isCreating}
            >
              <Text style={styles.addButtonText}>
                {isCreating ? '추가 중...' : '계획에 추가'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  topNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  imageContainer: {
    position: 'relative',
  },
  accommodationImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  ratingText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: 'bold',
    marginLeft: 4,
  },
  reviewCount: {
    fontSize: 12,
    color: '#FFFFFF',
    marginLeft: 4,
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  accommodationName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    marginRight: 12,
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
  category: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  address: {
    fontSize: 14,
    color: '#7F8C8D',
    marginBottom: 8,
  },
  landmarkContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  landmarkText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  section: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: '#666666',
    lineHeight: 20,
  },
  amenitiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    marginBottom: 8,
  },
  amenityText: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  roomTypeTabs: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 4,
    marginBottom: 16,
  },
  roomTypeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 6,
  },
  roomTypeTabActive: {
    backgroundColor: '#FF6B35',
  },
  roomTypeTabText: {
    fontSize: 14,
    color: '#7F8C8D',
    fontWeight: '500',
  },
  roomTypeTabTextActive: {
    color: '#FFFFFF',
  },
  roomCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  roomCardSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  roomHeader: {
    marginBottom: 12,
  },
  roomName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 4,
  },
  roomCapacity: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  capacityText: {
    fontSize: 12,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  roomPricing: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceRow: {
    flex: 1,
  },
  priceLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 2,
  },
  timeText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  originalPrice: {
    fontSize: 14,
    color: '#7F8C8D',
    textDecorationLine: 'line-through',
    marginRight: 8,
  },
  salePrice: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FF6B35',
    marginRight: 8,
  },
  discountBadge: {
    backgroundColor: '#E74C3C',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  discountText: {
    fontSize: 10,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  soldoutBadge: {
    backgroundColor: '#7F8C8D',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  soldoutText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  addToPlanButton: {
    position: 'absolute',
    bottom: 80, // 하단바 위에 위치 (하단바 높이 + 여백)
    right: 20,
    zIndex: 10,
  },
  addToPlanButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  addToPlanButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 6,
  },
  bottomSpacing: {
    height: 120, // 하단바 + 버튼 + 여백을 위한 충분한 공간
    backgroundColor: '#F8F9FA',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  expandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
    paddingVertical: 8,
  },
  expandButtonText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginRight: 4,
  },
  // 모달 스타일
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  modalCloseButton: {
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  modalFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  modalSection: {
    marginBottom: 24,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  modalLoadingText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    padding: 20,
  },
  planList: {
    gap: 8,
  },
  planItem: {
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
    backgroundColor: '#F8F9FA',
  },
  planItemSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  planItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  planItemText: {
    flex: 1,
  },
  planItemCheck: {
    marginLeft: 12,
  },
  planName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  planDate: {
    fontSize: 14,
    color: '#666',
  },
  dateScrollView: {
    marginHorizontal: -16,
    paddingHorizontal: 16,
  },
  dateItem: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 20,
    backgroundColor: '#F8F9FA',
  },
  dateItemSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  dateText: {
    fontSize: 14,
    color: '#666',
  },
  dateTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  timeItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 16,
    backgroundColor: '#F8F9FA',
  },
  timeItemSelected: {
    borderColor: '#FF6B35',
    backgroundColor: '#FF6B35',
  },
  modalTimeText: {
    fontSize: 12,
    color: '#666',
  },
  modalTimeTextSelected: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 16,
    borderRadius: 8,
    alignItems: 'center',
  },
  addButtonDisabled: {
    backgroundColor: '#CCCCCC',
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AccommodationDetailScreen;
