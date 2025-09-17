import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Animated,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { WebView } from 'react-native-webview';
import { UI_CONFIG } from '../../constants';
import { getPlanMapData, getPlanMapHTML, MapLocation } from '../../services/map/mapService';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getAllDetailPlans, updateDetailPlan, deleteDetailPlan } from '../../services/plan/detailPlanService';
import { getPlan } from '../../services/plan/planService';
import { getPlanHistory } from '../../services/plan/planHistoryService';
import { DetailPlanDto, DetailPlanUpdateDto } from '../../types';
import DetailPlanAddModal from '../../components/DetailPlanAddModal';
import DetailPlanEditModal from '../../components/DetailPlanEditModal';

const { width, height } = Dimensions.get('window');

// 세부 계획 타입 정의
interface DetailPlan {
  id: number;
  detailPlanId: number;
  time: string;
  title: string;
  location: string;
  description?: string;
  latitude: number;
  longitude: number;
  date: string;
}

// 날짜별 계획 타입
interface DayPlan {
  date: string;
  plans: DetailPlan[];
}

// 공유자 타입
interface SharedMember {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
}

const PlanDetailScreen = ({ route, navigation }: any) => {
  const { planId, fromPage } = route.params;
  console.log('🔍 PlanDetailScreen - planId:', planId, 'fromPage:', fromPage);
  
  // Redux에서 사용자 정보 가져오기
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // 상태 관리
  const [selectedDate, setSelectedDate] = useState(0);
  const [isMapVisible, setIsMapVisible] = useState(true);
  const [detailPlans, setDetailPlans] = useState<DetailPlan[]>([]);
  const [isLoadingPlans, setIsLoadingPlans] = useState(true);
  const [draggedPlan, setDraggedPlan] = useState<DetailPlan | null>(null);
  const [planStartDate, setPlanStartDate] = useState<string>('');
  const [planEndDate, setPlanEndDate] = useState<string>('');
  const [planTitle, setPlanTitle] = useState<string>('여행 계획');
  

  // 계획 정보 로드 함수
  const loadPlanInfo = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      console.log('⚠️ 로그인이 필요합니다.');
      return;
    }

    try {
      console.log('🔄 계획 정보 로드 시작:', { planId, email: user.email });
      
      const planInfo = await getPlan(planId, user.email);
      console.log('✅ 계획 정보 로드 성공:', planInfo);
      
      // 계획 제목 설정
      if (planInfo.place) {
        setPlanTitle(planInfo.place);
      }
      
      // 시작일과 종료일 설정
      if (planInfo.startDay && planInfo.endDay) {
        setPlanStartDate(planInfo.startDay);
        setPlanEndDate(planInfo.endDay);
      }
    } catch (error) {
      console.error('❌ 계획 정보 로드 실패:', error);
    }
  }, [planId, isAuthenticated, user?.email]);

  // 세부 계획 데이터 로드 함수
  const loadDetailPlans = useCallback(async () => {
    if (!isAuthenticated || !user?.email) {
      console.log('⚠️ 로그인이 필요합니다.');
      setIsLoadingPlans(false);
      return;
    }

    try {
      setIsLoadingPlans(true);
      console.log('🔄 세부 계획 로드 시작:', { planId, email: user.email });
      
      const response = await getAllDetailPlans(planId, user.email);
      console.log('✅ 세부 계획 로드 성공:', response);
      
      // API 응답을 DetailPlan[]로 변환
      const convertedPlans: DetailPlan[] = response.map((item, index) => ({
        id: index + 1, // 임시 ID (UI 표시용)
        detailPlanId: item.detailPlanId, // 실제 API detailPlanId
        time: item.time ? item.time.substring(0, 5) : '09:00',
        title: item.location.name || '장소',
        location: item.location.name || '장소',
        description: item.location.name || '장소',
        latitude: item.location.latitude,
        longitude: item.location.longitude,
        date: item.date.toString().split('T')[0],
      }));
      
      setDetailPlans(convertedPlans);
    } catch (error) {
      console.error('❌ 세부 계획 로드 실패:', error);
      setDetailPlans([]);
    } finally {
      setIsLoadingPlans(false);
    }
  }, [planId, isAuthenticated, user?.email]);

  // 계획 정보 및 세부 계획 데이터 로드
  useEffect(() => {
    loadPlanInfo();
    loadDetailPlans();
  }, [loadPlanInfo, loadDetailPlans]);

  // 전체 기간의 날짜 리스트 생성
  const generateAllDates = useCallback((startDate: string, endDate: string): string[] => {
    if (!startDate || !endDate) return [];
    
    const dates: string[] = [];
    
    // ISO 날짜 문자열에서 YYYY-MM-DD 부분만 추출
    const startDateOnly = startDate.split('T')[0];
    const endDateOnly = endDate.split('T')[0];
    
    console.log('🔍 날짜 생성 디버깅:', {
      startDate,
      endDate,
      startDateOnly,
      endDateOnly
    });
    
    const start = new Date(startDateOnly + 'T00:00:00.000Z'); // UTC로 명시적 설정
    const end = new Date(endDateOnly + 'T00:00:00.000Z'); // UTC로 명시적 설정
    
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const dateString = d.toISOString().split('T')[0];
      dates.push(dateString);
      console.log('📅 생성된 날짜:', dateString);
    }
    
    return dates;
  }, []);

  // API 데이터를 UI 구조로 변환 (useCallback으로 최적화)
  const convertApiDataToUI = useCallback((apiData: DetailPlan[]): DayPlan[] => {
    if (!planStartDate || !planEndDate) return [];
    
    // 전체 기간의 날짜 리스트 생성
    const allDates = generateAllDates(planStartDate, planEndDate);
    console.log('📅 생성된 전체 날짜 리스트:', allDates);
    console.log('📅 계획 시작일/종료일:', { planStartDate, planEndDate });
    
    // 날짜별로 그룹화
    const groupedByDate: { [key: string]: DetailPlan[] } = {};
    
    // 모든 날짜를 초기화 (빈 배열로)
    allDates.forEach(date => {
      groupedByDate[date] = [];
    });
    
    // 실제 세부 계획 데이터 추가
    apiData.forEach((item) => {
      // 날짜 키 추출
      const dateKey = item.date;
      console.log('🔍 날짜 데이터:', { 
        originalDate: item.date, 
        convertedDate: dateKey 
      });
      
      if (groupedByDate[dateKey]) {
        groupedByDate[dateKey].push(item);
      }
    });
    
    // 날짜별로 정렬하여 DayPlan 배열로 변환
    const result = allDates.map(date => ({
      date,
      plans: groupedByDate[date] ? groupedByDate[date].sort((a, b) => a.time.localeCompare(b.time)) : []
    }));
    
    console.log('📊 최종 변환 결과:', result);
    return result;
  }, [planStartDate, planEndDate, generateAllDates]);

  // 변환된 데이터 (useMemo로 최적화)
  const dayPlans = useMemo(() => {
    const result = convertApiDataToUI(detailPlans);
    console.log('📊 변환된 dayPlans:', {
      totalDays: result.length,
      days: result.map(day => ({
        date: day.date,
        plansCount: day.plans.length,
        plans: day.plans.map(plan => ({ time: plan.time, title: plan.title }))
      })),
      selectedDate: selectedDate
    });
    return result;
  }, [detailPlans, convertApiDataToUI, selectedDate]);

  // currentPlans를 API 데이터 기반으로 업데이트
  useEffect(() => {
    console.log('🔄 currentPlans 업데이트 시도:', {
      dayPlansLength: dayPlans.length,
      selectedDate: selectedDate,
      isValidIndex: selectedDate >= 0 && selectedDate < dayPlans.length,
      hasSelectedDay: dayPlans[selectedDate] ? true : false,
      hasPlans: dayPlans[selectedDate]?.plans ? true : false
    });
    
    if (dayPlans.length > 0 && selectedDate >= 0 && selectedDate < dayPlans.length && dayPlans[selectedDate] && dayPlans[selectedDate].plans) {
      const plans = [...dayPlans[selectedDate].plans];
      console.log('✅ currentPlans 설정:', {
        selectedDate: selectedDate,
        plansCount: plans.length,
        plans: plans.map(plan => ({ time: plan.time, title: plan.title }))
      });
      setCurrentPlans(plans);
    } else {
      console.log('❌ currentPlans 빈 배열로 설정');
      setCurrentPlans([]);
    }
  }, [dayPlans, selectedDate]);

  // 뒤로가기 핸들러
  const handleBackPress = () => {
    if (fromPage === 'Home') {
      // 홈 페이지에서 온 경우, MainTabs로 돌아가서 Home 탭으로 이동
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else {
      // 기본 뒤로가기
      navigation.goBack();
    }
  };
  const [plans, setPlans] = useState<DetailPlan[]>([]);
  const [currentPlans, setCurrentPlans] = useState<DetailPlan[]>([]);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [currentPanY, setCurrentPanY] = useState(0);
  
  
  // 지도 관련 상태
  const [mapLocations, setMapLocations] = useState<MapLocation[]>([]);
  const [isLoadingMap, setIsLoadingMap] = useState(true);
  const [mapHTML, setMapHTML] = useState<string>('');
  
  // 세부 계획 추가 모달 상태
  const [isAddModalVisible, setIsAddModalVisible] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);
  const [editingPlan, setEditingPlan] = useState<DetailPlan | null>(null);
  const [modalSelectedDate, setModalSelectedDate] = useState<string>('');
  
  // 애니메이션 값
  const mapHeight = useRef(new Animated.Value(200)).current;
  const planListHeight = useRef(new Animated.Value(height - 400)).current;
  const panY = useRef(new Animated.Value(0)).current;
  
  // PanResponder 설정 - 단순한 드래그 (높이 조정만)
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        // 세로 드래그만 감지
        return Math.abs(gestureState.dy) > Math.abs(gestureState.dx) && Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        // 드래그 시작 시 현재 위치를 저장
        setCurrentPanY((panY as any)._value);
      },
      onPanResponderMove: (evt, gestureState) => {
        // 드래그 범위 제한
        const maxUp = 300; // 세부계획이 지도를 완전히 가림 (위로 드래그)
        const maxDown = 0; // 세부계획이 최소 높이까지 내려감 (아래로 드래그)
        const newValue = Math.max(maxDown, Math.min(maxUp, currentPanY + gestureState.dy));
        panY.setValue(newValue);
        
        // 지도와 계획 리스트 높이 조정
        const mapHeightValue = Math.max(0, 200 - newValue);
        const planListHeightValue = Math.max(200, height - 400 + newValue);
        
        mapHeight.setValue(mapHeightValue);
        planListHeight.setValue(planListHeightValue);
      },
      onPanResponderRelease: (evt, gestureState) => {
        // 드래그 종료 시 현재 위치를 업데이트
        setCurrentPanY((panY as any)._value);
      },
    })
  ).current;
  

  // 지도 데이터 로드
  useEffect(() => {
    console.log('🗺️ PlanDetailScreen useEffect 실행, planId:', planId);
    if (planId) {
      console.log('🗺️ planId가 있으므로 지도 데이터 로딩 시작');
      loadMapData();
    } else {
      console.log('🗺️ planId가 없어서 지도 데이터 로딩 안함');
    }
  }, [planId]);


  const loadMapData = async () => {
    try {
      setIsLoadingMap(true);
      console.log('🗺️ 계획 상세 - 지도 HTML 로드 시작:', planId);
      
      // HTML만 로드 (파싱하지 않음)
      const html = await getPlanMapHTML(planId);
      
      setMapHTML(html);
      
      console.log('🗺️ 계획 상세 - 지도 HTML 로드 완료');
      console.log('🗺️ HTML 길이:', html.length);
    } catch (error) {
      console.error('❌ 계획 상세 - 지도 HTML 로드 실패:', error);
      setMapHTML('');
    } finally {
      setIsLoadingMap(false);
    }
  };

  // Google Maps Static API URL 생성 (안정적인 버전)
  const generateGoogleMapsStaticURL = (locations: MapLocation[]): string => {
    try {
      console.log('🗺️ Google Maps Static URL 생성 시작');
      console.log('🗺️ 입력된 위치 데이터:', locations);
      
      if (!locations || locations.length === 0) {
        console.log('🗺️ 위치 데이터가 없어서 기본 서울 지도 URL 반환');
        return 'https://maps.googleapis.com/maps/api/staticmap?center=37.5665,126.9780&zoom=12&size=400x300&key=AIzaSyDDlrPUgoxyo4-R5t9FF_wmmr1gNBoyYQM';
      }

      const API_KEY = 'AIzaSyDDlrPUgoxyo4-R5t9FF_wmmr1gNBoyYQM';
      const centerLat = locations[0]?.latitude || 37.5665;
      const centerLng = locations[0]?.longitude || 126.9780;
      
      console.log('🗺️ 중심 좌표:', { centerLat, centerLng });
      console.log('🗺️ 위치 개수:', locations.length);
      
      // 모든 위치에 마커 표시
      const markers = locations.map((location, index) => {
        const color = index === 0 ? 'red' : 'blue';
        return `markers=color:${color}|label:${index + 1}|${location.latitude},${location.longitude}`;
      }).join('&');

      // URL 구성
      const url = `https://maps.googleapis.com/maps/api/staticmap?center=${centerLat},${centerLng}&zoom=12&size=400x300&${markers}&key=${API_KEY}`;
      
      console.log('🗺️ 생성된 Google Maps Static API URL:', url);
      console.log('🗺️ URL 길이:', url.length);
      
      return url;
    } catch (error) {
      console.error('❌ Google Maps Static URL 생성 에러:', error);
      // 에러 시 기본 서울 지도 반환
      return 'https://maps.googleapis.com/maps/api/staticmap?center=37.5665,126.9780&zoom=12&size=400x300&key=AIzaSyDDlrPUgoxyo4-R5t9FF_wmmr1gNBoyYQM';
    }
  };

  // 데모 데이터
  // 계획 기본 정보 (임시로 하드코딩, 나중에 API로 교체)
  const planData = {
    id: planId,
    title: planTitle,
    creator: user?.email || '사용자',
    sharedMembers: [
      { id: 1, name: user?.email || '사용자', email: user?.email || 'user@example.com', profileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150' },
    ],
    centerLocation: {
      latitude: 33.4996,
      longitude: 126.5312,
    },
    dayPlans: dayPlans, // API 데이터 사용
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}/${day} (${dayOfWeek})`;
  };

  // 세부 계획 드래그 핸들러 (간단한 버전)
  const onPlanDrag = () => {
    // TODO: 실제 드래그 기능 구현
    console.log('Plan dragged');
  };



  // 세부 계획 삭제
  const deletePlan = async (detailPlanId: number) => {
    try {
      if (!user?.email) {
        console.log('⚠️ 로그인이 필요합니다.');
        return;
      }

      console.log('🗑️ 세부 계획 삭제 요청:', { planId, detailPlanId, email: user.email });

      // 삭제 확인
      Alert.alert(
        '세부 계획 삭제',
        '정말로 이 세부 계획을 삭제하시겠습니까?',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ 세부 계획 삭제 API 호출:', { planId, detailPlanId });
                await deleteDetailPlan(planId, detailPlanId, user?.email || '');
                console.log('✅ 세부 계획 삭제 성공');
                
                // 삭제 성공 시 데이터 재로드
                loadDetailPlans();
                loadMapData();
              } catch (error) {
                console.error('❌ 세부 계획 삭제 실패:', error);
                Alert.alert('오류', '세부 계획 삭제에 실패했습니다.');
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ 세부 계획 삭제 실패:', error);
      Alert.alert('오류', '세부 계획 삭제에 실패했습니다.');
    }
  };

  // 새 세부 계획 추가
  const addPlan = () => {
    // 세부 계획 추가 모달 열기
    setIsAddModalVisible(true);
  };

  // 세부 계획 추가 성공 시 호출
  const handleAddSuccess = () => {
    // 세부 계획 목록 다시 로드
    loadDetailPlans();
    // 맵도 다시 로드
    loadMapData();
  };

  // 세부 계획 수정 성공 시 호출
  const handleEditSuccess = () => {
    // 세부 계획 목록 다시 로드
    loadDetailPlans();
    // 맵도 다시 로드
    loadMapData();
    // 수정 모달 닫기
    setIsEditModalVisible(false);
    setEditingPlan(null);
  };

  // 세부 계획 수정
  const editPlan = (plan: DetailPlan) => {
    console.log('📝 세부 계획 수정 모달 열기:', { planId, detailPlanId: plan.detailPlanId, plan });
    setEditingPlan(plan);
    setIsEditModalVisible(true);
  };

  // 세부 계획 순서 변경
  const movePlan = (fromIndex: number, toIndex: number) => {
    const newPlans = [...currentPlans];
    const [movedPlan] = newPlans.splice(fromIndex, 1);
    newPlans.splice(toIndex, 0, movedPlan);
    setCurrentPlans(newPlans);
    console.log('Plan moved from', fromIndex, 'to', toIndex);
  };

  // 드래그 시작
  const startDrag = (index: number) => {
    setDraggedIndex(index);
    setDraggedPlan(currentPlans[index]);
    setIsDragging(true);
  };

  // 드래그 종료
  const endDrag = () => {
    setDraggedIndex(null);
    setDraggedPlan(null);
    setIsDragging(false);
  };

  // 드래그 앤 드롭을 위한 PanResponder
  const createPlanPanResponder = (index: number) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => draggedIndex === index,
      onMoveShouldSetPanResponder: (evt, gestureState) => {
        return draggedIndex === index && Math.abs(gestureState.dy) > 10;
      },
      onPanResponderGrant: () => {
        // 드래그 시작은 LongPress에서 처리됨
      },
      onPanResponderMove: (evt, gestureState) => {
        if (draggedIndex === index) {
          // 드래그 중인 항목의 위치 업데이트
          setDragY(gestureState.dy);
          
          // 실시간으로 순서 변경 (자리 내주기 방식)
          const itemHeight = 80;
          const newIndex = Math.round((gestureState.dy + draggedIndex * itemHeight) / itemHeight);
          
          if (newIndex >= 0 && newIndex < currentPlans.length && newIndex !== draggedIndex) {
            // 실시간으로 순서 변경
            const newPlans = [...currentPlans];
            const [movedPlan] = newPlans.splice(draggedIndex, 1);
            newPlans.splice(newIndex, 0, movedPlan);
            setCurrentPlans(newPlans);
            setDraggedIndex(newIndex);
          }
        }
      },
      onPanResponderRelease: (evt, gestureState) => {
        if (draggedIndex === index) {
          endDrag();
        }
      },
    });
  };


  // 세부 계획 렌더링 (기존 함수)
  const renderDetailPlan = (plan: DetailPlan, index: number) => {
    const panResponder = createPlanPanResponder(index);
    
    return (
      <Animated.View
        key={plan.id}
        style={[
          styles.planItem, 
          draggedIndex === index && styles.planItemDragging
        ]}
        {...panResponder.panHandlers}
      >
        <View style={styles.planItemContent}>
          {/* 드래그 핸들 - LongPress로 드래그 시작 */}
          <TouchableOpacity
            style={styles.planDragHandle}
            onLongPress={() => startDrag(index)}
            delayLongPress={800} // 0.8초 후 드래그 시작
            activeOpacity={0.7}
          >
            <Ionicons 
              name="reorder-three-outline" 
              size={20} 
              color={UI_CONFIG.COLORS.TEXT_LIGHT} 
            />
          </TouchableOpacity>
          
          <View style={styles.planTime}>
            <Text style={styles.planTimeText}>{plan.time}</Text>
          </View>
          <TouchableOpacity 
            style={styles.planContent}
            onPress={() => editPlan(plan)}
            activeOpacity={0.7}
          >
            <Text style={styles.planTitle}>{plan.title}</Text>
            {plan.description && (
              <Text style={styles.planDescription}>{plan.description}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.planActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => editPlan(plan)}
            >
              <Ionicons name="create-outline" size={20} color={UI_CONFIG.COLORS.TEXT_SECONDARY} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deletePlan(plan.detailPlanId)}
            >
              <Ionicons name="trash-outline" size={20} color={UI_CONFIG.COLORS.ERROR} />
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    );
  };


  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={handleBackPress}
        >
          <Ionicons name="arrow-back" size={24} color={UI_CONFIG.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <View style={styles.headerContent}>
          <Text style={styles.planTitle}>{planData.title}</Text>
          <View style={styles.creatorContainer}>
            <Ionicons name="person-outline" size={16} color={UI_CONFIG.COLORS.TEXT_SECONDARY} />
            <Text style={styles.creatorText}>생성자: {planData.creator}</Text>
          </View>
        </View>
        <View style={styles.headerButtons}>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('PlanHistory', { planId: planId })}
          >
            <Ionicons name="time-outline" size={24} color={UI_CONFIG.COLORS.PRIMARY} />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={() => navigation.navigate('PlanShareView', { planId: planId })}
          >
          <Ionicons name="share-outline" size={24} color={UI_CONFIG.COLORS.PRIMARY} />
        </TouchableOpacity>
        </View>
      </View>

      {/* 지도 영역 */}
      <Animated.View
        style={[
          styles.mapContainer,
          { flex: 1 }, // 헤더와 하단 탭을 제외한 전체 공간 사용
        ]}
      >
        {isLoadingMap ? (
          <View style={styles.mapPlaceholder}>
            <Ionicons name="map-outline" size={48} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
            <Text style={styles.mapPlaceholderText}>지도 로딩 중...</Text>
            <Text style={styles.mapPlaceholderSubtext}>위치 정보를 불러오는 중</Text>
            <Text style={styles.mapPlaceholderSubtext}>Plan ID: {planId}</Text>
          </View>
        ) : mapHTML ? (
          <WebView
            source={{ html: mapHTML }}
            style={{ 
              flex: 1,
              width: '100%',
              height: '100%',
              backgroundColor: '#FFFFFF'
            }}
              javaScriptEnabled={true}
              domStorageEnabled={true}
              startInLoadingState={false}
              scalesPageToFit={true}
              allowsInlineMediaPlayback={true}
              mediaPlaybackRequiresUserAction={false}
              mixedContentMode="compatibility"
              originWhitelist={['*']}
              onLoadStart={() => console.log('🗺️ PlanDetail WebView 로딩 시작')}
              onLoadEnd={() => console.log('🗺️ PlanDetail WebView 로딩 완료')}
              onError={(e) => console.error('❌ PlanDetail WebView 에러:', e.nativeEvent)}
              onMessage={(e) => console.log('🗺️ PlanDetail WebView 메시지:', e.nativeEvent.data)}
            />
        ) : (
        <View style={styles.mapPlaceholder}>
          <Ionicons name="map-outline" size={48} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
          <Text style={styles.mapPlaceholderText}>지도 영역</Text>
          <Text style={styles.mapPlaceholderSubtext}>
              {dayPlans.length > 0 && selectedDate >= 0 && selectedDate < dayPlans.length && dayPlans[selectedDate] ? dayPlans[selectedDate].plans.length : 0}개 장소 표시
            </Text>
            <Text style={styles.mapDebugText}>
              API 데이터 없음 (로딩: {isLoadingMap ? '예' : '아니오'})
          </Text>
        </View>
        )}
      </Animated.View>

      {/* 하단 오버레이 영역 */}
      <Animated.View style={[
        styles.bottomOverlay,
        { height: planListHeight }
      ]}>
        {/* 전체 기간 세부 계획 리스트 */}
        <ScrollView 
          style={styles.planListScroll}
          showsVerticalScrollIndicator={false}
        >
          {dayPlans.map((dayPlan, index) => (
            <View key={index} style={styles.daySection}>
              {/* 날짜 헤더 */}
              <View style={styles.dayHeader}>
                <Text style={styles.dayHeaderText}>
              {formatDate(dayPlan.date)}
            </Text>
                <Text style={styles.dayHeaderSubtext}>
                  {dayPlan.plans.length}개 장소
                </Text>
              </View>
              
              {/* 해당 날짜의 세부 계획들 */}
              {dayPlan.plans.length > 0 ? (
                <>
                  {dayPlan.plans.map((plan, planIndex) => renderDetailPlan(plan, planIndex))}
                  {/* 세부 계획이 있는 날짜에도 추가 버튼 */}
                  <TouchableOpacity
                    style={styles.addPlanButton}
                    onPress={() => {
                      // 해당 날짜로 세부 계획 추가 모달 열기
                      console.log('🔄 날짜별 장소 추가 버튼 클릭:', dayPlan.date);
                      setModalSelectedDate(dayPlan.date);
                      setIsAddModalVisible(true);
                    }}
                  >
                    <Ionicons name="add" size={16} color={UI_CONFIG.COLORS.PRIMARY} />
                    <Text style={styles.addPlanButtonText}>장소 추가</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <View style={styles.emptyDayContainer}>
                  <Text style={styles.emptyDayText}>
                    이 날에는 계획된 장소가 없습니다
                  </Text>
                  <TouchableOpacity
                    style={styles.addPlanButton}
                    onPress={() => {
                      // 해당 날짜로 세부 계획 추가 모달 열기
                      console.log('🔄 빈 날짜 장소 추가 버튼 클릭:', dayPlan.date);
                      setModalSelectedDate(dayPlan.date);
                      setIsAddModalVisible(true);
                    }}
                  >
                    <Ionicons name="add" size={16} color={UI_CONFIG.COLORS.PRIMARY} />
                    <Text style={styles.addPlanButtonText}>장소 추가</Text>
                  </TouchableOpacity>
                </View>
              )}
            </View>
          ))}
        </ScrollView>

        {/* 드래그 핸들 */}
        <View style={styles.dragHandle} {...panResponder.panHandlers}>
          <View style={styles.dragHandleBar} />
          <Text style={styles.dragHandleText}>드래그하여 조정</Text>
        </View>
      </Animated.View>

      {/* 세부 계획 추가 모달 */}
      <DetailPlanAddModal
        visible={isAddModalVisible}
        onClose={() => {
          setIsAddModalVisible(false);
          setModalSelectedDate('');
        }}
        planId={planId}
        selectedDate={modalSelectedDate}
        userEmail={user?.email || ''}
        onSuccess={handleAddSuccess}
        availableDates={dayPlans.map(dayPlan => dayPlan.date)}
      />

      {/* 세부 계획 수정 모달 */}
      {editingPlan && (
        <DetailPlanEditModal
          visible={isEditModalVisible}
          onClose={() => {
            setIsEditModalVisible(false);
            setEditingPlan(null);
          }}
          planId={planId}
          detailPlanId={editingPlan.detailPlanId}
          currentDate={dayPlans.length > 0 && selectedDate >= 0 && selectedDate < dayPlans.length && dayPlans[selectedDate] ? 
            dayPlans[selectedDate].date : 
            new Date().toISOString().split('T')[0]}
          userEmail={user?.email || ''}
          onSuccess={handleEditSuccess}
          initialData={{
            location: {
              latitude: editingPlan.latitude,
              longitude: editingPlan.longitude,
              name: editingPlan.title,
            },
            time: editingPlan.time,
            date: editingPlan.date,
          }}
          availableDates={dayPlans.map(dayPlan => dayPlan.date)}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingTop: UI_CONFIG.SPACING.XXL + UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  backButton: {
    marginRight: UI_CONFIG.SPACING.MD,
  },
  headerContent: {
    flex: 1,
  },
  planTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  creatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: UI_CONFIG.SPACING.XS,
  },
  creatorText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerButton: {
    padding: UI_CONFIG.SPACING.XS,
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  mapContainer: {
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    position: 'relative',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    minHeight: 0,
  },
  mapWrapper: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  map: {
    width: '100%',
    height: '100%',
  },
  mapDebugInfo: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 8,
    borderRadius: 4,
  },
  mapDebugText: {
    color: 'white',
    fontSize: 12,
    textAlign: 'center',
  },
  mapOverlay: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 200,
    maxHeight: '60%',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    ...UI_CONFIG.SHADOWS.MD,
  },
  mapOverlayHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  mapOverlayTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginLeft: UI_CONFIG.SPACING.XS,
    flex: 1,
  },
  mapOverlaySubtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  locationsOverlay: {
    maxHeight: 200,
  },
  locationOverlayItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  locationOverlayMarker: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.SPACING.SM,
  },
  locationOverlayNumber: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationOverlayInfo: {
    flex: 1,
  },
  locationOverlayName: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: 2,
  },
  locationOverlayDescription: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  locationsList: {
    flex: 1,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
    ...UI_CONFIG.SHADOWS.SM,
  },
  locationMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.SPACING.MD,
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  locationDescription: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  locationCoordinates: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
    fontFamily: 'monospace',
  },
  simpleMapArea: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    overflow: 'hidden',
  },
  mapHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderTopLeftRadius: UI_CONFIG.BORDER_RADIUS.LG,
    borderTopRightRadius: UI_CONFIG.BORDER_RADIUS.LG,
  },
  mapTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    marginLeft: UI_CONFIG.SPACING.SM,
    flex: 1,
  },
  mapSubtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    opacity: 0.9,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
    ...UI_CONFIG.SHADOWS.SM,
  },
  locationNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.SPACING.MD,
  },
  locationNumberText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
  locationDetails: {
    flex: 1,
  },
  locationTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  locationAddress: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  locationCoords: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
    fontFamily: 'monospace',
  },
  locationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  simpleMapContainer: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    overflow: 'hidden',
  },
  locationsScrollView: {
    flex: 1,
    padding: UI_CONFIG.SPACING.MD,
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
    ...UI_CONFIG.SHADOWS.SM,
  },
  locationNumberBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.SPACING.MD,
  },
  locationContent: {
    flex: 1,
  },
  locationIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugInfo: {
    backgroundColor: '#FFF3CD',
    padding: UI_CONFIG.SPACING.SM,
    margin: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  debugText: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: '#856404',
    marginBottom: 2,
  },
  emptyMapArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
  },
  emptyMapText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: UI_CONFIG.SPACING.SM,
  },
  dragHandle: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  dragHandleBar: {
    width: 40,
    height: 4,
    backgroundColor: UI_CONFIG.COLORS.TEXT_LIGHT,
    borderRadius: 2,
    marginBottom: 4,
  },
  dragHandleText: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  mapPlaceholder: {
    alignItems: 'center',
  },
  mapPlaceholderText: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: UI_CONFIG.SPACING.SM,
  },
  mapPlaceholderSubtext: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
    marginTop: UI_CONFIG.SPACING.XS,
  },
  mapLocationsList: {
    marginTop: UI_CONFIG.SPACING.MD,
    alignItems: 'center',
  },
  mapLocationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  mapLocationText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  mapLocationMore: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    fontStyle: 'italic',
  },
  planListScroll: {
    flex: 1,
  },
  daySection: {
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  dayHeaderText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  dayHeaderSubtext: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  emptyDayContainer: {
    padding: UI_CONFIG.SPACING.LG,
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  emptyDayText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  addPlanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '20',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.PRIMARY,
  },
  addPlanButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  plansContainer: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  plansScroll: {
    flex: 1,
  },
  plansHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  plansTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
  },
  addButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    fontWeight: '500',
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  planItem: {
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  planItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.MD,
  },
  planDragHandle: {
    padding: UI_CONFIG.SPACING.SM,
    marginRight: UI_CONFIG.SPACING.XS,
  },
  planItemReorderMode: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
    borderLeftWidth: 3,
    borderLeftColor: UI_CONFIG.COLORS.PRIMARY,
  },
  planItemDragging: {
    opacity: 0.5,
    transform: [{ scale: 1.05 }],
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  planTime: {
    width: 60,
    alignItems: 'center',
  },
  planTimeText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  planContent: {
    flex: 1,
    marginLeft: UI_CONFIG.SPACING.MD,
  },
  planLocation: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  planDescription: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
  },
  planActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  actionButton: {
    padding: UI_CONFIG.SPACING.SM,
    marginLeft: UI_CONFIG.SPACING.XS,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.SPACING.XXL,
  },
  loadingText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
    marginTop: UI_CONFIG.SPACING.MD,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.SPACING.XXL,
  },
  emptyText: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
    marginTop: UI_CONFIG.SPACING.MD,
    fontWeight: '600',
  },
  emptySubtext: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
    marginTop: UI_CONFIG.SPACING.XS,
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    minHeight: 200,
    width: '100%',
  },
});

export default PlanDetailScreen;
