import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
} from 'react-native';
// import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getPlan, updatePlanStyle, updatePlanPartner, updatePlanNameAndDate } from '../../services/plan/planService';
import { getAllDetailPlans, deleteDetailPlan, updateDetailPlan } from '../../services/plan/detailPlanService';
import { PlanReadResponseDto, TravelPartner, TravelStyle as ApiTravelStyle, PlanUpdateDto, DetailPlan } from '../../types';

interface TravelStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

interface PlanEditData {
  name: string;
  place: string;
  startDay: Date;
  endDay: Date;
  partner: string;
  styles: string[];
}

const PlanEditScreen = ({ navigation, route }: any) => {
  const { planId } = route.params;
  console.log('🔍 PlanEditScreen 초기화:', { planId, routeParams: route.params });
  
  // Redux에서 사용자 정보 가져오기
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // 상태 관리
  const [planData, setPlanData] = useState<PlanReadResponseDto | null>(null);
  const [planName, setPlanName] = useState<string>('');
  const [startDate, setStartDate] = useState<Date>(new Date());
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [selectedPartner, setSelectedPartner] = useState<number | null>(null);
  const [selectedStyles, setSelectedStyles] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());

  // 계획 데이터 로드
  useEffect(() => {
    const loadPlanData = async () => {
      if (!isAuthenticated || !user?.email) {
        Alert.alert('오류', '로그인이 필요합니다.');
        navigation.goBack();
        return;
      }

      try {
        setIsLoading(true);
        console.log('🔄 계획 데이터 로드 시작:', { planId, email: user.email });
        
        const response = await getPlan(planId, user.email);
        console.log('✅ 계획 데이터 로드 성공:', response);
        console.log('🔍 API 응답 상세 분석:', {
          partner: response.partner,
          partnerType: typeof response.partner,
          styles: response.styles,
          stylesType: typeof response.styles,
          stylesLength: response.styles?.length
        });
        
        setPlanData(response);
        
        // 계획 이름과 날짜 초기화
        setPlanName(response.place || '');
        setStartDate(new Date(response.startDay));
        setEndDate(new Date(response.endDay));
        
        // 파트너 매핑 (API enum name → UI ID)
        const partnerMapping: { [key: string]: number } = {
          'ALONE': 1,    // ALONE → SOLO
          'COUPLE': 2,   // COUPLE → COUPLE  
          'FAMILY': 3,   // FAMILY → FAMILY
          'FRIEND': 4,   // FRIEND → FRIENDS
          'BUSINESS': 5, // BUSINESS → BUSINESS
          'CLUB': 6      // CLUB → CLUB
        };
        
        // 파트너 매핑 (대소문자 구분 없이 처리)
        const partnerValue = (response.partner as any)?.toUpperCase?.() || response.partner;
        const partnerId = partnerMapping[partnerValue as string] || 1;
        console.log('🔍 파트너 매핑 과정:', {
          originalPartner: response.partner,
          normalizedPartner: partnerValue,
          mappedPartnerId: partnerId,
          partnerMapping
        });
        setSelectedPartner(partnerId);
        
        // 스타일 매핑 (API enum name → UI ID)
        const styleMapping: { [key: string]: number } = {
          'HEALING': 2,   // HEALING → 힐링여행
          'ACTIVITY': 6,  // ACTIVITY → 액티비티
          'FAMILY': 1,    // FAMILY → 가족여행
          'NATURE': 3,    // NATURE → 자연여행
          'CULTURE': 4,   // CULTURE → 문화여행
          'FOOD': 5       // FOOD → 맛집여행
        };
        
        // 스타일 배열이 있는지 확인하고 매핑
        const styleIds = response.styles?.map((style: any) => {
          const normalizedStyle = style?.toUpperCase?.() || style;
          const mappedId = styleMapping[normalizedStyle] || 1;
          console.log('🔍 개별 스타일 매핑:', {
            originalStyle: style,
            normalizedStyle,
            mappedId
          });
          return mappedId;
        }) || [];
        
        console.log('🔍 스타일 매핑 과정:', {
          originalStyles: response.styles,
          mappedStyleIds: styleIds,
          styleMapping
        });
        setSelectedStyles(styleIds);
        
        console.log('📊 초기 선택 상태:', {
          apiPartner: response.partner,
          mappedPartnerId: partnerId,
          apiStyles: response.styles,
          mappedStyleIds: styleIds
        });
        
        console.log('🔍 파트너 매핑 확인:', {
          apiPartner: response.partner,
          mappedToUIId: partnerId,
          partnerMapping: partnerMapping
        });
        
        console.log('🔍 스타일 매핑 확인:', {
          apiStyles: response.styles,
          mappedToUIIds: styleIds,
          styleMapping: styleMapping
        });
      } catch (error) {
        console.error('❌ 계획 데이터 로드 실패:', error);
        Alert.alert('오류', '계획 데이터를 불러오는데 실패했습니다.');
        navigation.goBack();
      } finally {
        setIsLoading(false);
      }
    };

    loadPlanData();
  }, [planId, isAuthenticated, user?.email, navigation]);

  // 파트너 수정 저장
  const handleSavePartner = async () => {
    if (!isAuthenticated || !user?.email || !selectedPartner) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      setIsSaving(true);
      
      // UI ID → API enum name 매핑
      const partnerIdMapping: { [key: number]: string } = {
        1: 'ALONE',    // SOLO → ALONE
        2: 'COUPLE',   // COUPLE → COUPLE
        3: 'FAMILY',   // FAMILY → FAMILY
        4: 'FRIEND',   // FRIENDS → FRIEND
        5: 'BUSINESS', // BUSINESS → BUSINESS
        6: 'CLUB'      // CLUB → CLUB
      };
      const apiPartnerValue = partnerIdMapping[selectedPartner] || 'ALONE';
      
      console.log('🔄 파트너 수정 시작:', { 
        planId, 
        uiPartnerId: selectedPartner, 
        apiPartnerValue: apiPartnerValue 
      });
      
      await updatePlanPartner({ planDto: { planId: planData!.planId }, partner: apiPartnerValue }, user.email);
      
      Alert.alert('성공', '파트너가 성공적으로 수정되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('❌ 파트너 수정 실패:', error);
      Alert.alert('오류', '파트너 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 스타일 수정 저장
  const handleSaveStyles = async () => {
    if (!isAuthenticated || !user?.email) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    try {
      setIsSaving(true);
      
      // UI ID → API enum name 매핑
      const styleIdMapping: { [key: number]: string } = {
        1: 'FAMILY',   // 가족여행 → FAMILY
        2: 'HEALING',  // 힐링여행 → HEALING
        3: 'NATURE',   // 자연여행 → NATURE
        4: 'CULTURE',  // 문화여행 → CULTURE
        5: 'FOOD',     // 맛집여행 → FOOD
        6: 'ACTIVITY'  // 액티비티 → ACTIVITY
      };
      const apiStyleValues = selectedStyles.map(uiId => styleIdMapping[uiId] || 'FAMILY');
      
      console.log('🔄 스타일 수정 시작:', { 
        planId, 
        uiStyleIds: selectedStyles, 
        apiStyleValues: apiStyleValues 
      });
      
      await updatePlanStyle({ planDto: { planId: planData!.planId }, styles: apiStyleValues }, user.email);
      
      Alert.alert('성공', '여행 스타일이 성공적으로 수정되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('❌ 스타일 수정 실패:', error);
      Alert.alert('오류', '여행 스타일 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 날짜 변경 시 세부 계획 관리
  const handleDateChange = async (newStartDate: Date, newEndDate: Date) => {
    if (!planData || !user?.email) return true;

    try {
      console.log('🔄 날짜 변경으로 인한 세부 계획 관리 시작');
      console.log('📅 새로운 날짜 범위:', { 
        startDate: newStartDate.toISOString().split('T')[0], 
        endDate: newEndDate.toISOString().split('T')[0] 
      });
      
      const detailPlans = await getAllDetailPlans(planData.planId, user.email);
      console.log('🔍 기존 세부 계획 조회:', detailPlans);

      // 날짜 범위 검증
      const newDuration = Math.ceil((newEndDate.getTime() - newStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      if (detailPlans.length > newDuration) {
        console.log('⚠️ 새로운 기간이 기존 세부 계획보다 짧음:', { 
          기존계획수: detailPlans.length, 
          새로운기간: newDuration 
        });
        
        // 사용자에게 경고 표시
        const result = await new Promise<boolean>((resolve) => {
          Alert.alert(
            '날짜 범위 변경',
            `새로운 여행 기간(${newDuration}일)이 기존 세부 계획 수(${detailPlans.length}개)보다 짧습니다.\n\n모든 세부 계획을 유지하고 날짜만 조정하시겠습니까?`,
            [
              {
                text: '취소',
                style: 'cancel',
                onPress: () => resolve(false)
              },
              {
                text: '계속',
                onPress: () => resolve(true)
              }
            ]
          );
        });
        
        if (!result) {
          console.log('❌ 사용자가 날짜 변경을 취소함');
          return false;
        }
      }

      // 기존 계획의 날짜 범위 계산
      const originalStartDate = new Date(planData.startDay);
      const originalEndDate = new Date(planData.endDay);
      const originalDuration = Math.ceil((originalEndDate.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
      
      console.log('📊 기존 계획 정보:', {
        시작일: originalStartDate.toISOString().split('T')[0],
        종료일: originalEndDate.toISOString().split('T')[0],
        기간: originalDuration + '일'
      });

      // 모든 세부 계획의 날짜를 상대적 비율로 조정
      for (let i = 0; i < detailPlans.length; i++) {
        const plan = detailPlans[i];
        
        // 기존 세부 계획의 날짜
        const originalPlanDate = new Date(plan.date);
        
        // 기존 계획 시작일로부터의 일수 계산
        const daysFromOriginalStart = Math.ceil((originalPlanDate.getTime() - originalStartDate.getTime()) / (1000 * 60 * 60 * 24));
        
        // 새로운 시작일로부터 동일한 비율로 날짜 계산
        const newDate = new Date(newStartDate);
        newDate.setDate(newStartDate.getDate() + daysFromOriginalStart);
        
        // 날짜를 YYYY-MM-DD 형식으로 변환
        const dateString = newDate.toISOString().split('T')[0];
        
        console.log(`📅 세부 계획 ${i + 1} 날짜 수정:`, {
          detailPlanId: plan.detailPlanId,
          기존날짜: plan.date,
          기존시작일로부터일수: daysFromOriginalStart,
          새로운날짜: dateString,
          비율유지: `${daysFromOriginalStart}일 후`
        });
        
        await updateDetailPlan({
          planId: planData.planId,
          detailPlanId: plan.detailPlanId,
          location: plan.location,
          date: dateString, // YYYY-MM-DD 형식
          time: plan.time || '09:00'
        }, user.email);
      }

      console.log('✅ 모든 세부 계획 날짜 수정 완료');
      return true;
    } catch (error) {
      console.error('❌ 날짜 변경 중 오류 발생:', error);
      return false;
    }
  };

  // 전체 수정 저장 (이름, 날짜, 스타일 + 파트너)
  const handleSaveAll = async () => {
    if (!isAuthenticated || !user?.email || !planData) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    if (selectedStyles.length === 0 || !selectedPartner) {
      Alert.alert('알림', '파트너와 스타일을 모두 선택해주세요.');
      return;
    }

    try {
      setIsSaving(true);
      console.log('🔄 전체 수정 시작:', { planId, planName, startDate, endDate, selectedPartner, selectedStyles });

      // 날짜가 변경된 경우 세부 계획 관리
      const originalStart = new Date(planData.startDay);
      const originalEnd = new Date(planData.endDay);
      
      if (startDate.getTime() !== originalStart.getTime() || endDate.getTime() !== originalEnd.getTime()) {
        const canProceed = await handleDateChange(startDate, endDate);
        if (!canProceed) {
          setIsSaving(false);
          return;
        }
      }

      // 모든 수정 사항을 병렬로 실행
      const promises = [];

      // 계획 이름 및 날짜 수정
      if (planName !== planData.place || startDate.getTime() !== originalStart.getTime() || endDate.getTime() !== originalEnd.getTime()) {
        const updateDto: PlanUpdateDto = {
          planDto: { planId: planData.planId }, // planData에서 가져온 planId 사용
          name: planName.trim() || undefined, // 빈 문자열이면 undefined
          start: startDate.toISOString(),
          end: endDate.toISOString()
        };
        
        console.log('🔄 계획 이름 및 날짜 수정:', updateDto);
        console.log('🔍 planId 확인:', { routePlanId: planId });
        promises.push(updatePlanNameAndDate(updateDto, user.email));
      }

      // 파트너 수정 (UI ID → API enum name)
      const partnerIdMapping: { [key: number]: string } = {
        1: 'ALONE',    // SOLO → ALONE
        2: 'COUPLE',   // COUPLE → COUPLE
        3: 'FAMILY',   // FAMILY → FAMILY
        4: 'FRIEND',   // FRIENDS → FRIEND
        5: 'BUSINESS', // BUSINESS → BUSINESS
        6: 'CLUB'      // CLUB → CLUB
      };
      const apiPartnerValue = partnerIdMapping[selectedPartner] || 'ALONE';
      promises.push(updatePlanPartner({ planDto: { planId: planData.planId }, partner: apiPartnerValue }, user.email));

      // 스타일 수정 (UI ID → API enum name)
      const styleIdMapping: { [key: number]: string } = {
        1: 'FAMILY',   // 가족여행 → FAMILY
        2: 'HEALING',  // 힐링여행 → HEALING
        3: 'NATURE',   // 자연여행 → NATURE
        4: 'CULTURE',  // 문화여행 → CULTURE
        5: 'FOOD',     // 맛집여행 → FOOD
        6: 'ACTIVITY'  // 액티비티 → ACTIVITY
      };
      const apiStyleValues = selectedStyles.map(uiId => styleIdMapping[uiId] || 'FAMILY');
      promises.push(updatePlanStyle({ planDto: { planId: planData.planId }, styles: apiStyleValues }, user.email));

      // 모든 API 호출 완료 대기
      await Promise.all(promises);

      console.log('✅ 전체 수정 완료');
      Alert.alert('성공', '계획이 성공적으로 수정되었습니다.');
      navigation.goBack();
    } catch (error) {
      console.error('❌ 전체 수정 실패:', error);
      Alert.alert('오류', '계획 수정에 실패했습니다.');
    } finally {
      setIsSaving(false);
    }
  };

  // 여행 스타일 데이터
  const travelStyles: TravelStyle[] = [
    {
      id: '1',
      name: '가족여행',
      description: '가족과 함께하는 편안한 여행',
      icon: 'people',
    },
    {
      id: '2',
      name: '힐링여행',
      description: '휴식과 힐링을 위한 여행',
      icon: 'leaf',
    },
    {
      id: '3',
      name: '자연여행',
      description: '자연을 즐기는 여행',
      icon: 'mountain',
    },
    {
      id: '4',
      name: '문화여행',
      description: '역사와 문화를 체험하는 여행',
      icon: 'library',
    },
    {
      id: '5',
      name: '맛집여행',
      description: '맛있는 음식을 찾아 떠나는 여행',
      icon: 'restaurant',
    },
    {
      id: '6',
      name: '액티비티',
      description: '다양한 활동을 즐기는 여행',
      icon: 'bicycle',
    },
  ];


  const handleStyleSelect = (styleId: number) => {
    setSelectedStyles(prev => {
      if (prev.includes(styleId)) {
        return prev.filter(id => id !== styleId);
      } else {
        return [...prev, styleId];
      }
    });
  };

  // 캘린더 관련 함수들
  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const generateCalendarDays = (date: Date) => {
    const daysInMonth = getDaysInMonth(date);
    const firstDay = getFirstDayOfMonth(date);
    const days = [];

    // 이전 달의 빈 날짜들
    for (let i = 0; i < firstDay; i++) {
      days.push(null);
    }

    // 현재 달의 날짜들
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(date.getFullYear(), date.getMonth(), day));
    }

    return days;
  };

  const isDateSelected = (date: Date, selectedDate: Date) => {
    return date.toDateString() === selectedDate.toDateString();
  };

  const isDateDisabled = (date: Date, isStartDate: boolean) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (isStartDate) {
      return date < today;
    } else {
      return date <= startDate;
    }
  };

  const handleDateSelect = (date: Date, isStartDate: boolean) => {
    if (isStartDate) {
      setStartDate(date);
      if (date >= endDate) {
        const newEndDate = new Date(date);
        newEndDate.setDate(newEndDate.getDate() + 1);
        setEndDate(newEndDate);
      }
      setShowStartDatePicker(false);
    } else {
      if (date > startDate) {
        setEndDate(date);
        setShowEndDatePicker(false);
      } else {
        Alert.alert('알림', '종료일은 시작일보다 늦어야 합니다.');
      }
    }
  };

  const changeMonth = (direction: 'prev' | 'next') => {
    const newMonth = new Date(currentMonth);
    if (direction === 'prev') {
      newMonth.setMonth(newMonth.getMonth() - 1);
    } else {
      newMonth.setMonth(newMonth.getMonth() + 1);
    }
    setCurrentMonth(newMonth);
  };

  // 캘린더 렌더링
  const renderCalendar = (isStartDate: boolean) => {
    const selectedDate = isStartDate ? startDate : endDate;
    const calendarDays = generateCalendarDays(currentMonth);
    const weekDays = ['일', '월', '화', '수', '목', '금', '토'];

    return (
      <View style={styles.calendarContainer}>
        {/* 월/년 헤더 */}
        <View style={styles.calendarHeader}>
          <TouchableOpacity onPress={() => changeMonth('prev')}>
            <Ionicons name="chevron-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.calendarMonthText}>
            {currentMonth.toLocaleDateString('ko-KR', { year: 'numeric', month: 'long' })}
          </Text>
          <TouchableOpacity onPress={() => changeMonth('next')}>
            <Ionicons name="chevron-forward" size={24} color="#333" />
          </TouchableOpacity>
        </View>

        {/* 요일 헤더 */}
        <View style={styles.weekDaysContainer}>
          {weekDays.map((day, index) => (
            <Text key={index} style={styles.weekDayText}>{day}</Text>
          ))}
        </View>

        {/* 날짜 그리드 */}
        <View style={styles.calendarGrid}>
          {calendarDays.map((date, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.calendarDay,
                date && isDateSelected(date, selectedDate) && styles.selectedDay,
                date && isDateDisabled(date, isStartDate) && styles.disabledDay,
              ]}
              onPress={() => date && !isDateDisabled(date, isStartDate) && handleDateSelect(date, isStartDate)}
              disabled={!date || isDateDisabled(date, isStartDate)}
            >
              {date && (
                <Text style={[
                  styles.calendarDayText,
                  isDateSelected(date, selectedDate) && styles.selectedDayText,
                  isDateDisabled(date, isStartDate) && styles.disabledDayText,
                ]}>
                  {date.getDate()}
                </Text>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
    );
  };


  const getPartnerText = (partnerType: string) => {
    const partnerMap = {
      'SOLO': '혼자',
      'COUPLE': '커플',
      'FAMILY': '가족',
      'FRIENDS': '친구',
      'BUSINESS': '비즈니스',
      'CLUB': '동아리'
    };
    return partnerMap[partnerType as keyof typeof partnerMap] || partnerType;
  };

  const getStyleText = (styles: string[]) => {
    const styleMap = {
      'family': '가족',
      'relaxation': '힐링',
      'nature': '자연',
      'culture': '문화',
      'food': '맛집',
      'shopping': '쇼핑'
    };
    return styles.map(style => styleMap[style as keyof typeof styleMap] || style).join(', ');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>계획을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 계획 수정</Text>
        <View style={styles.placeholderButton} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 여행지 이름 수정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>여행지 이름</Text>
          <TextInput
            style={styles.textInput}
            value={planName}
            onChangeText={setPlanName}
            placeholder="여행지 이름을 입력하세요"
            placeholderTextColor="#999"
          />
        </View>

        {/* 여행 기간 수정 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>여행 기간</Text>
          <View style={styles.dateContainer}>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>시작일</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowStartDatePicker(true)}
              >
                <Text style={styles.dateText}>{startDate.toLocaleDateString('ko-KR')}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
            <View style={styles.dateField}>
              <Text style={styles.dateLabel}>종료일</Text>
              <TouchableOpacity 
                style={styles.dateButton}
                onPress={() => setShowEndDatePicker(true)}
              >
                <Text style={styles.dateText}>{endDate.toLocaleDateString('ko-KR')}</Text>
                <Ionicons name="calendar-outline" size={20} color="#666" />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* 동행자 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>동행자 *</Text>
          <View style={styles.partnerContainer}>
            {[
              { id: 1, name: 'SOLO' },
              { id: 2, name: 'COUPLE' },
              { id: 3, name: 'FAMILY' },
              { id: 4, name: 'FRIENDS' },
              { id: 5, name: 'BUSINESS' },
              { id: 6, name: 'CLUB' }
            ].map((partnerType) => (
              <TouchableOpacity
                key={partnerType.id}
                style={[
                  styles.partnerCard,
                  selectedPartner === partnerType.id && styles.selectedPartnerCard,
                ]}
                onPress={() => setSelectedPartner(partnerType.id)}
              >
                <Ionicons
                  name={
                    partnerType.name === 'SOLO' ? 'person' :
                    partnerType.name === 'COUPLE' ? 'heart' :
                    partnerType.name === 'FAMILY' ? 'people' :
                    partnerType.name === 'FRIENDS' ? 'people-circle' :
                    partnerType.name === 'BUSINESS' ? 'briefcase' : 'school'
                  }
                  size={24}
                  color={selectedPartner === partnerType.id ? '#FFFFFF' : '#FF6B35'}
                />
                <Text style={[
                  styles.partnerName,
                  selectedPartner === partnerType.id && styles.selectedPartnerName,
                ]}>
                  {getPartnerText(partnerType.name)}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 여행 스타일 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>여행 스타일 *</Text>
          <Text style={styles.sectionSubtitle}>여행의 성격에 맞는 스타일을 선택해주세요</Text>
          
          <View style={styles.stylesContainer}>
            {travelStyles.map((style) => (
              <TouchableOpacity
                key={style.id}
                style={[
                  styles.styleCard,
                  selectedStyles.includes(parseInt(style.id)) && styles.selectedStyleCard,
                ]}
                onPress={() => handleStyleSelect(parseInt(style.id))}
              >
                <View style={styles.styleIcon}>
                  <Ionicons
                    name={style.icon as any}
                    size={24}
                    color={selectedStyles.includes(parseInt(style.id)) ? '#FFFFFF' : '#FF6B35'}
                  />
                </View>
                <Text style={[
                  styles.styleName,
                  selectedStyles.includes(parseInt(style.id)) && styles.selectedStyleName,
                ]}>
                  {style.name}
                </Text>
                <Text style={[
                  styles.styleDescription,
                  selectedStyles.includes(parseInt(style.id)) && styles.selectedStyleDescription,
                ]}>
                  {style.description}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* 미리보기 */}
        <View style={styles.previewSection}>
          <Text style={styles.sectionTitle}>수정 미리보기</Text>
          <View style={styles.previewCard}>
            <View style={styles.previewHeader}>
              <Ionicons name="location" size={20} color="#FF6B35" />
              <Text style={styles.previewPlace}>{planData?.place || '여행지'}</Text>
            </View>
            <View style={styles.previewInfo}>
              <View style={styles.previewRow}>
                <Ionicons name="calendar" size={16} color="#666" />
                <Text style={styles.previewText}>
                  {planData ? 
                    `${new Date(planData.startDay).toLocaleDateString('ko-KR')} - ${new Date(planData.endDay).toLocaleDateString('ko-KR')}` 
                    : '로딩 중...'
                  }
                </Text>
              </View>
              <View style={styles.previewRow}>
                <Ionicons name="person" size={16} color="#666" />
                <Text style={styles.previewText}>
                  with {selectedPartner ? getPartnerText(['SOLO', 'COUPLE', 'FAMILY', 'FRIENDS', 'BUSINESS'][selectedPartner - 1]) : '선택 중...'}
                </Text>
              </View>
              {selectedStyles.length > 0 && (
                <View style={styles.previewRow}>
                  <Ionicons name="pricetag" size={16} color="#666" />
                  <Text style={styles.previewText}>
                    {selectedStyles.map(id => travelStyles.find(s => parseInt(s.id) === id)?.name).join(', ')}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* 시작일 선택 캘린더 */}
      <Modal
        visible={showStartDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>시작일 선택</Text>
            {renderCalendar(true)}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowStartDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 종료일 선택 캘린더 */}
      <Modal
        visible={showEndDatePicker}
        transparent={true}
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>종료일 선택</Text>
            {renderCalendar(false)}
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.modalButton}
                onPress={() => setShowEndDatePicker(false)}
              >
                <Text style={styles.modalButtonText}>취소</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (selectedStyles.length === 0 || !selectedPartner || isSaving) && styles.disabledButton,
          ]}
          onPress={handleSaveAll}
          disabled={selectedStyles.length === 0 || !selectedPartner || isSaving}
        >
          <Text style={[
            styles.submitButtonText,
            (selectedStyles.length === 0 || !selectedPartner || isSaving) && styles.disabledButtonText,
          ]}>
            {isSaving ? '저장 중...' : '수정 완료'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  deleteButton: {
    padding: 4,
  },
  placeholderButton: {
    width: 32, // 삭제 버튼과 동일한 크기로 공간 확보
  },
  content: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    fontSize: 16,
    color: '#333',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    flexWrap: 'wrap',
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dateField: {
    flex: 1,
    marginHorizontal: 4,
  },
  dateLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  dateText: {
    fontSize: 16,
    color: '#333',
  },
  debugText: {
    fontSize: 12,
    color: '#FF6B35',
    fontStyle: 'italic',
    marginBottom: 8,
    backgroundColor: '#FFF5F0',
    padding: 4,
    borderRadius: 4,
  },
  partnerContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  partnerCard: {
    width: '30%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
  },
  selectedPartnerCard: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  partnerName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
    marginTop: 6,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  selectedPartnerName: {
    color: '#FFFFFF',
  },
  stylesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  styleCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
  },
  selectedStyleCard: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  styleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  styleName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
    flexWrap: 'wrap',
  },
  selectedStyleName: {
    color: '#FFFFFF',
  },
  styleDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    lineHeight: 16,
    flexWrap: 'wrap',
  },
  selectedStyleDescription: {
    color: '#FFFFFF',
  },
  previewSection: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  previewCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  previewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  previewPlace: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  previewInfo: {
    gap: 8,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
    flex: 1,
    flexWrap: 'wrap',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    backgroundColor: '#FFFFFF',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButton: {
    backgroundColor: '#E1E8ED',
  },
  disabledButtonText: {
    color: '#999',
  },
  readOnlyField: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F8F9FA',
  },
  readOnlyText: {
    fontSize: 16,
    color: '#666',
  },
  // 캘린더 관련 스타일
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginTop: 16,
  },
  modalButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
    minWidth: 80,
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  calendarContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarMonthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
    paddingVertical: 8,
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  selectedDay: {
    backgroundColor: '#FF6B35',
    borderRadius: 20,
  },
  disabledDay: {
    opacity: 0.3,
  },
  calendarDayText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '500',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  disabledDayText: {
    color: '#999',
  },
});

export default PlanEditScreen;