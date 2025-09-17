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
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { createPlan } from '../../services/plan/planService';
import { PlanCreateDto } from '../../types';
// import DateTimePicker from '@react-native-community/datetimepicker';

interface TravelStyle {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const PlanCreateScreen = ({ navigation }: any) => {
  // Redux 상태
  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  
  // 단계 관리
  const [currentStep, setCurrentStep] = useState<number>(1);
  const [isCreating, setIsCreating] = useState<boolean>(false);
  
  // 1단계: 지역과 날짜
  const [place, setPlace] = useState<string>('');
  const [startDay, setStartDay] = useState<Date>(new Date());
  const [endDay, setEndDay] = useState<Date>(new Date());
  
  // 날짜 선택기 상태
  const [showStartDatePicker, setShowStartDatePicker] = useState<boolean>(false);
  const [showEndDatePicker, setShowEndDatePicker] = useState<boolean>(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  
  // 2단계: 카테고리
  const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
  
  // 3단계: 파트너
  const [partner, setPartner] = useState<string>('');

  // 컴포넌트 마운트 시 상태 초기화 (이전 데이터 정리)
  useEffect(() => {
    setSelectedStyles([]);
    setPartner('');
  }, []);

  // 날짜 포맷팅
  const formatDate = (date: Date) => {
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
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
      return date <= startDay;
    }
  };

  const handleDateSelect = (date: Date, isStartDate: boolean) => {
    if (isStartDate) {
      setStartDay(date);
      if (date >= endDay) {
        const newEndDay = new Date(date);
        newEndDay.setDate(newEndDay.getDate() + 1);
        setEndDay(newEndDay);
      }
      setShowStartDatePicker(false);
    } else {
      if (date > startDay) {
        setEndDay(date);
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
    const selectedDate = isStartDate ? startDay : endDay;
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

  // 여행 스타일 데이터 (백엔드 Style enum에 맞춤)
  const travelStyles: TravelStyle[] = [
    {
      id: 'HEALING',
      name: '힐링여행',
      description: '휴식과 힐링을 위한 여행',
      icon: 'leaf',
    },
    {
      id: 'ACTIVITY',
      name: '액티비티여행',
      description: '다양한 활동을 즐기는 여행',
      icon: 'flash',
    },
    {
      id: 'FAMILY',
      name: '가족여행',
      description: '가족과 함께하는 여행',
      icon: 'people',
    },
    {
      id: 'NATURE',
      name: '자연여행',
      description: '자연을 만끽하는 여행',
      icon: 'flower',
    },
    {
      id: 'CULTURE',
      name: '문화여행',
      description: '역사와 문화를 체험하는 여행',
      icon: 'library',
    },
    {
      id: 'FOOD',
      name: '맛집여행',
      description: '맛있는 음식을 찾는 여행',
      icon: 'restaurant',
    },
  ];

  // 단계별 네비게이션
  const nextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const goBack = () => {
    if (currentStep === 1) {
      navigation.goBack();
    } else {
      prevStep();
    }
  };

  // 단계별 유효성 검사
  const isStepValid = () => {
    switch (currentStep) {
      case 1:
        return place.trim() !== '' && startDay && endDay;
      case 2:
        return selectedStyles.length > 0;
      case 3:
        return partner.trim() !== '';
      default:
        return false;
    }
  };

  const handleStyleSelect = (styleId: string) => {
    setSelectedStyles(prev => {
      console.log('🎨 스타일 선택:', { styleId, prev });
      if (prev.includes(styleId)) {
        const newStyles = prev.filter(id => id !== styleId);
        console.log('🎨 스타일 제거 후:', newStyles);
        return newStyles;
      } else {
        const newStyles = [...prev, styleId];
        console.log('🎨 스타일 추가 후:', newStyles);
        return newStyles;
      }
    });
  };

  const handleSubmit = async () => {
    if (!isStepValid()) {
      Alert.alert('알림', '모든 필수 항목을 입력해주세요.');
      return;
    }

    if (!isAuthenticated || !user?.email) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    setIsCreating(true);
    try {
      console.log('🔄 계획 생성 시작:', { place, startDay, endDay, partner, selectedStyles });
      
      // 날짜를 ISO 문자열로 변환
      const createDto: PlanCreateDto = {
        place: place.trim(),
        startDay: startDay.toISOString(),
        endDay: endDay.toISOString(),
        partner: partner.trim() || undefined,
        styles: selectedStyles.length > 0 ? selectedStyles : undefined,
      };
      
      console.log('📤 전송할 데이터:', createDto);

      const response = await createPlan(createDto, user.email);
      
      console.log('✅ 계획 생성 성공:', response);
      
      Alert.alert(
        '🎉 계획 생성 완료!', 
        `"${place}" 여행 계획이 성공적으로 생성되었습니다.\n이제 세부 계획을 추가해보세요!`, 
        [
          { 
            text: '계획 보기', 
            onPress: () => {
              // Plan 탭으로 돌아가서 데이터 새로고침
              navigation.navigate('MainTabs', { 
                screen: 'Plan',
                params: { refresh: true }
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ 계획 생성 실패:', error);
      Alert.alert('오류', '계획 생성 중 오류가 발생했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 1단계: 지역과 날짜 렌더링
  const renderStep1 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>1단계: 지역과 날짜</Text>
        <Text style={styles.stepSubtitle}>여행할 장소와 기간을 선택해주세요</Text>
      </View>

      {/* 여행지 입력 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>여행지 *</Text>
        <TextInput
          style={styles.input}
          placeholder="여행할 장소를 입력해주세요 (예: 제주도, 부산, 강릉)"
          value={place}
          onChangeText={setPlace}
          maxLength={50}
        />
        <Text style={styles.characterCount}>{place.length}/50</Text>
      </View>

      {/* 시작일 입력 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>시작일 *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowStartDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#333" style={styles.inputIcon} />
          <Text style={styles.dateText}>{formatDate(startDay)}</Text>
        </TouchableOpacity>
      </View>

      {/* 종료일 입력 */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>종료일 *</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => setShowEndDatePicker(true)}
        >
          <Ionicons name="calendar-outline" size={20} color="#333" style={styles.inputIcon} />
          <Text style={styles.dateText}>{formatDate(endDay)}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // 2단계: 카테고리 렌더링
  const renderStep2 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>2단계: 여행 스타일</Text>
        <Text style={styles.stepSubtitle}>여행 스타일을 선택해주세요 (복수 선택 가능)</Text>
      </View>

      <View style={styles.stylesContainer}>
        {travelStyles.map((style) => (
          <TouchableOpacity
            key={style.id}
            style={[
              styles.styleCard,
              selectedStyles.includes(style.id) && styles.selectedStyleCard,
            ]}
            onPress={() => handleStyleSelect(style.id)}
          >
            <View style={styles.styleIcon}>
              <Ionicons
                name={style.icon as any}
                size={24}
                color={selectedStyles.includes(style.id) ? '#FFFFFF' : '#FF6B35'}
              />
            </View>
            <Text style={[
              styles.styleName,
              selectedStyles.includes(style.id) && styles.selectedStyleName,
            ]}>
              {style.name}
            </Text>
            <Text style={[
              styles.styleDescription,
              selectedStyles.includes(style.id) && styles.selectedStyleDescription,
            ]}>
              {style.description}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // 3단계: 파트너 렌더링
  const renderStep3 = () => (
    <View style={styles.stepContent}>
      <View style={styles.stepHeader}>
        <Text style={styles.stepTitle}>3단계: 여행 파트너</Text>
        <Text style={styles.stepSubtitle}>함께 여행할 파트너를 선택해주세요</Text>
      </View>

      <View style={styles.partnerContainer}>
        {[
          { id: 'ALONE', name: '혼자', icon: 'person' },
          { id: 'COUPLE', name: '커플', icon: 'heart' },
          { id: 'FAMILY', name: '가족', icon: 'people' },
          { id: 'FRIEND', name: '친구', icon: 'happy' },
          { id: 'BUSINESS', name: '비즈니스', icon: 'briefcase' },
          { id: 'CLUB', name: '동아리', icon: 'school' },
        ].map((partnerOption) => (
          <TouchableOpacity
            key={partnerOption.id}
            style={[
              styles.partnerCard,
              partner === partnerOption.id && styles.selectedPartnerCard,
            ]}
            onPress={() => setPartner(partnerOption.id)}
          >
            <Ionicons
              name={partnerOption.icon as any}
              size={32}
              color={partner === partnerOption.id ? '#FFFFFF' : '#FF6B35'}
            />
            <Text style={[
              styles.partnerName,
              partner === partnerOption.id && styles.selectedPartnerName,
            ]}>
              {partnerOption.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={goBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행 계획 만들기</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 진행 단계 표시 */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <View style={[styles.progressFill, { width: `${(currentStep / 3) * 100}%` }]} />
        </View>
        <Text style={styles.progressText}>{currentStep}/3</Text>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 단계별 콘텐츠 렌더링 */}
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        {currentStep < 3 ? (
          <TouchableOpacity
            style={[
              styles.nextButton,
              !isStepValid() && styles.disabledButton,
            ]}
            onPress={nextStep}
            disabled={!isStepValid()}
          >
            <Text style={[
              styles.nextButtonText,
              !isStepValid() && styles.disabledButtonText,
            ]}>
              다음
            </Text>
            <Ionicons name="chevron-forward" size={20} color={isStepValid() ? '#FFFFFF' : '#999'} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[
              styles.submitButton,
              (!isStepValid() || isCreating) && styles.disabledButton,
            ]}
            onPress={handleSubmit}
            disabled={!isStepValid() || isCreating}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={[
                styles.submitButtonText,
                (!isStepValid() || isCreating) && styles.disabledButtonText,
              ]}>
                여행 계획 만들기
              </Text>
            )}
          </TouchableOpacity>
        )}
      </View>

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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
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
  placeholder: {
    width: 32,
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E1E8ED',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#FF6B35',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: 20,
  },
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
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
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  dateInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E9ECEF',
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
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
    padding: 12,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFF5F2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  styleName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
    textAlign: 'center',
  },
  selectedStyleName: {
    color: '#FFFFFF',
  },
  styleDescription: {
    fontSize: 10,
    color: '#666',
    textAlign: 'center',
    lineHeight: 14,
  },
  selectedStyleDescription: {
    color: '#FFFFFF',
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
  },
  selectedPartnerName: {
    color: '#FFFFFF',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
    backgroundColor: '#FFFFFF',
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginRight: 8,
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
    width: '80%',
    maxWidth: 400,
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
    justifyContent: 'space-between',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    alignItems: 'center',
  },
  modalButtonPrimary: {
    backgroundColor: '#FF6B35',
    borderColor: '#FF6B35',
  },
  modalButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
  },
  modalButtonPrimaryText: {
    color: '#FFFFFF',
  },
  datePicker: {
    backgroundColor: '#FFFFFF',
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

export default PlanCreateScreen;