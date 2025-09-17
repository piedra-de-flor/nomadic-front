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
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Location {
  id: number;
  name: string;
  address: string;
  category: string;
  rating: number;
}

interface DetailPlan {
  id: number;
  planId: number;
  location: Location;
  date: Date;
  time: string;
  notes?: string;
  version: number;
}

const DetailPlanEditScreen = ({ navigation, route }: any) => {
  const { planId, detailPlanId, selectedDate: initialDate, planData } = route.params || {};
  
  const [detailPlan, setDetailPlan] = useState<DetailPlan | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<Location | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date>(
    initialDate ? new Date(initialDate) : new Date()
  );
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [showLocationModal, setShowLocationModal] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 임시 장소 데이터
  const mockLocations: Location[] = [
    {
      id: 1,
      name: '제주 신라호텔',
      address: '제주특별자치도 제주시',
      category: '숙박',
      rating: 4.8,
    },
    {
      id: 2,
      name: '해운대 해수욕장',
      address: '부산광역시 해운대구',
      category: '관광지',
      rating: 4.6,
    },
    {
      id: 3,
      name: '강릉 커피거리',
      address: '강원도 강릉시',
      category: '카페',
      rating: 4.7,
    },
    {
      id: 4,
      name: '전주 한옥마을',
      address: '전라북도 전주시',
      category: '문화시설',
      rating: 4.5,
    },
    {
      id: 5,
      name: '여수 밤바다',
      address: '전라남도 여수시',
      category: '관광지',
      rating: 4.4,
    },
  ];

  // 임시 세부 계획 데이터
  const mockDetailPlan: DetailPlan = {
    id: detailPlanId || 1,
    planId: 1,
    location: mockLocations[0],
    date: new Date('2024-12-25'),
    time: '10:00',
    notes: '제주도 첫날 숙소 체크인 후 근처 카페에서 휴식',
    version: 1,
  };

  const timeSlots = [
    '06:00', '07:00', '08:00', '09:00', '10:00', '11:00',
    '12:00', '13:00', '14:00', '15:00', '16:00', '17:00',
    '18:00', '19:00', '20:00', '21:00', '22:00', '23:00'
  ];

  useEffect(() => {
    loadDetailPlan();
  }, []);

  const loadDetailPlan = async () => {
    try {
      // TODO: API 호출
      // const response = await detailPlanService.getDetailPlan(detailPlanId);
      // setDetailPlan(response.data);
      
      // 전달받은 planData를 사용하여 초기값 설정
      if (planData) {
        // planData를 DetailPlan 형태로 변환
        const detailPlanData: DetailPlan = {
          id: planData.id,
          planId: planId || 1,
          location: {
            id: 1,
            name: planData.title,
            address: planData.location,
            category: '관광지',
            rating: 4.5,
            latitude: planData.latitude,
            longitude: planData.longitude,
          },
          date: selectedDate,
          time: planData.time,
          notes: planData.description || '',
          version: 1,
        };
        
        setDetailPlan(detailPlanData);
        setSelectedLocation(detailPlanData.location);
        setSelectedTime(planData.time);
        setNotes(planData.description || '');
        setIsLoading(false);
      } else {
        // planData가 없으면 목 데이터 사용
        setTimeout(() => {
          setDetailPlan(mockDetailPlan);
          setSelectedLocation(mockDetailPlan.location);
          setSelectedDate(mockDetailPlan.date);
          setSelectedTime(mockDetailPlan.time);
          setNotes(mockDetailPlan.notes || '');
          setIsLoading(false);
        }, 500);
      }
    } catch (error) {
      setIsLoading(false);
      Alert.alert('오류', '세부 계획을 불러오는 중 오류가 발생했습니다.');
    }
  };


  const handleLocationSelect = (location: Location) => {
    setSelectedLocation(location);
    setShowLocationModal(false);
  };

  const handleSubmit = async () => {
    if (!selectedLocation) {
      Alert.alert('알림', '장소를 선택해주세요.');
      return;
    }

    if (!selectedTime) {
      Alert.alert('알림', '시간을 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const updatedDetailPlan: DetailPlan = {
        ...detailPlan!,
        location: selectedLocation,
        date: selectedDate,
        time: selectedTime,
        notes: notes.trim(),
      };

      // TODO: API 호출
      // const response = await detailPlanService.updateDetailPlan(updatedDetailPlan);

      // 임시로 성공 처리
      setTimeout(() => {
        setIsSubmitting(false);
        Alert.alert(
          '수정 완료',
          '세부 계획이 성공적으로 수정되었습니다.',
          [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('오류', '세부 계획 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const handleDelete = () => {
    Alert.alert(
      '세부 계획 삭제',
      '이 세부 계획을 삭제하시겠습니까?',
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
              // TODO: API 호출
              // await detailPlanService.deleteDetailPlan(detailPlanId);
              
              Alert.alert(
                '삭제 완료',
                '세부 계획이 삭제되었습니다.',
                [
                  {
                    text: '확인',
                    onPress: () => navigation.goBack(),
                  },
                ]
              );
            } catch (error) {
              Alert.alert('오류', '세부 계획 삭제 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };


  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>세부 계획을 불러오는 중...</Text>
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
        <Text style={styles.headerTitle}>세부 계획 수정</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <Ionicons name="trash-outline" size={24} color="#E74C3C" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 계획 정보 */}
        <View style={styles.planInfoSection}>
          <Text style={styles.sectionTitle}>계획 정보</Text>
          <View style={styles.planCard}>
            <Ionicons name="calendar" size={20} color="#FF6B35" />
            <Text style={styles.planTitle}>{planData?.title || '제주도 여행'}</Text>
          </View>
        </View>

        {/* 장소 선택 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>장소 선택 *</Text>
          <TouchableOpacity
            style={styles.locationButton}
            onPress={() => setShowLocationModal(true)}
          >
            {selectedLocation ? (
              <View style={styles.selectedLocation}>
                <View style={styles.locationInfo}>
                  <Text style={styles.locationName}>{selectedLocation.name}</Text>
                  <Text style={styles.locationAddress}>{selectedLocation.address}</Text>
                  <View style={styles.locationMeta}>
                    <Text style={styles.locationCategory}>{selectedLocation.category}</Text>
                    <View style={styles.ratingContainer}>
                      <Ionicons name="star" size={14} color="#FFD700" />
                      <Text style={styles.rating}>{selectedLocation.rating}</Text>
                    </View>
                  </View>
                </View>
                <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
              </View>
            ) : (
              <View style={styles.placeholderLocation}>
                <Ionicons name="location-outline" size={24} color="#7F8C8D" />
                <Text style={styles.placeholderText}>장소를 선택해주세요</Text>
                <Ionicons name="chevron-forward" size={20} color="#7F8C8D" />
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 날짜 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>날짜 *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="calendar-outline" size={20} color="#333" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="YYYY-MM-DD"
              value={selectedDate.toISOString().split('T')[0]}
              onChangeText={(text) => {
                const date = new Date(text);
                if (!isNaN(date.getTime())) {
                  setSelectedDate(date);
                }
              }}
            />
          </View>
        </View>

        {/* 시간 입력 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>시간 *</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="time-outline" size={20} color="#333" style={styles.inputIcon} />
            <TextInput
              style={styles.textInput}
              placeholder="HH:MM"
              value={selectedTime}
              onChangeText={setSelectedTime}
            />
          </View>
        </View>

        {/* 메모 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>메모</Text>
          <TextInput
            style={styles.notesInput}
            placeholder="세부 계획에 대한 메모를 입력해주세요..."
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            maxLength={500}
          />
          <Text style={styles.characterCount}>{notes.length}/500</Text>
        </View>

        {/* 버전 정보 */}
        <View style={styles.versionSection}>
          <Text style={styles.versionText}>버전: {detailPlan?.version || 1}</Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedLocation || !selectedTime || isSubmitting) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!selectedLocation || !selectedTime || isSubmitting}
        >
          <Text style={[
            styles.submitButtonText,
            (!selectedLocation || !selectedTime || isSubmitting) && styles.disabledButtonText,
          ]}>
            {isSubmitting ? '수정 중...' : '수정 완료'}
          </Text>
        </TouchableOpacity>
      </View>


      {/* 장소 선택 모달 */}
      <Modal
        visible={showLocationModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowLocationModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.locationModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>장소 선택</Text>
              <TouchableOpacity onPress={() => setShowLocationModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={mockLocations}
              keyExtractor={(item) => item.id.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.locationItem}
                  onPress={() => handleLocationSelect(item)}
                >
                  <View style={styles.locationItemContent}>
                    <View style={styles.locationItemInfo}>
                      <Text style={styles.locationItemName}>{item.name}</Text>
                      <Text style={styles.locationItemAddress}>{item.address}</Text>
                      <View style={styles.locationItemMeta}>
                        <Text style={styles.locationItemCategory}>{item.category}</Text>
                        <View style={styles.ratingContainer}>
                          <Ionicons name="star" size={14} color="#FFD700" />
                          <Text style={styles.rating}>{item.rating}</Text>
                        </View>
                      </View>
                    </View>
                    {selectedLocation?.id === item.id && (
                      <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
                    )}
                  </View>
                </TouchableOpacity>
              )}
            />
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  planInfoSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  planCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  locationButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationInfo: {
    flex: 1,
  },
  locationName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationCategory: {
    fontSize: 12,
    color: '#FF6B35',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rating: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    marginTop: 8,
  },
  inputIcon: {
    marginRight: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
  placeholderLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  placeholderText: {
    flex: 1,
    fontSize: 16,
    color: '#7F8C8D',
    marginLeft: 12,
  },
  dateTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  dateTimeText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  notesInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    minHeight: 100,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  versionSection: {
    alignItems: 'center',
    marginBottom: 20,
  },
  versionText: {
    fontSize: 12,
    color: '#999',
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  timeModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  locationModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  timeList: {
    padding: 20,
  },
  timeSlot: {
    flex: 1,
    margin: 4,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedTimeSlot: {
    backgroundColor: '#FF6B35',
  },
  timeSlotText: {
    fontSize: 14,
    color: '#333',
    fontWeight: '500',
  },
  selectedTimeSlotText: {
    color: '#FFFFFF',
  },
  locationItem: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  locationItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationItemInfo: {
    flex: 1,
  },
  locationItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  locationItemAddress: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
  },
  locationItemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  locationItemCategory: {
    fontSize: 12,
    color: '#FF6B35',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
});

export default DetailPlanEditScreen;

