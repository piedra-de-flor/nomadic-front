import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  FlatList,
  Alert,
  ActivityIndicator,
  ScrollView,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../constants';
import { searchPlaces, PlaceSearchResult } from '../services/place/placeSearchService';
import { createDetailPlan } from '../services/plan/detailPlanService';
import { DetailPlanDto, Location } from '../types';

interface DetailPlanAddModalProps {
  visible: boolean;
  onClose: () => void;
  planId: number;
  selectedDate: string;
  userEmail: string;
  onSuccess: () => void;
  availableDates?: string[]; // 선택 가능한 날짜 목록
}

const DetailPlanAddModal: React.FC<DetailPlanAddModalProps> = ({
  visible,
  onClose,
  planId,
  selectedDate,
  userEmail,
  onSuccess,
  availableDates = [],
}) => {
  const [placeQuery, setPlaceQuery] = useState('');
  const [searchResults, setSearchResults] = useState<PlaceSearchResult[]>([]);
  const [selectedPlace, setSelectedPlace] = useState<PlaceSearchResult | null>(null);
  const [selectedHour, setSelectedHour] = useState(9);
  const [selectedMinute, setSelectedMinute] = useState(0);
  const [currentSelectedDate, setCurrentSelectedDate] = useState(selectedDate);
  const [isSearching, setIsSearching] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [showHourPicker, setShowHourPicker] = useState(false);
  const [showMinutePicker, setShowMinutePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // 시간과 분 옵션 생성
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  // selectedDate prop이 변경될 때 currentSelectedDate 상태 업데이트
  useEffect(() => {
    console.log('🔄 DetailPlanAddModal - selectedDate 변경:', selectedDate);
    setCurrentSelectedDate(selectedDate);
  }, [selectedDate]);

  // 모달이 열릴 때마다 상태 초기화
  useEffect(() => {
    if (visible) {
      console.log('🔄 DetailPlanAddModal - 모달 열림, 상태 초기화:', { selectedDate, planId });
      setCurrentSelectedDate(selectedDate);
      setPlaceQuery('');
      setSearchResults([]);
      setSelectedPlace(null);
      setSelectedHour(9);
      setSelectedMinute(0);
      setShowHourPicker(false);
      setShowMinutePicker(false);
      setShowDatePicker(false);
    }
  }, [visible, selectedDate, planId]);

  // 날짜 포맷 함수
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const dayOfWeek = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
    return `${month}월 ${day}일 (${dayOfWeek})`;
  };

  // 장소 검색
  const handleSearch = async () => {
    if (!placeQuery.trim()) {
      Alert.alert('알림', '장소명을 입력해주세요.');
      return;
    }

    setIsSearching(true);
    try {
      const results = await searchPlaces(placeQuery);
      setSearchResults(results);
    } catch (error) {
      console.error('장소 검색 실패:', error);
      Alert.alert('오류', '장소 검색에 실패했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  // 장소 선택
  const handlePlaceSelect = (place: PlaceSearchResult) => {
    setSelectedPlace(place);
    setSearchResults([]);
  };

  // 세부 계획 생성
  const handleCreate = async () => {
    if (!selectedPlace) {
      Alert.alert('알림', '장소를 선택해주세요.');
      return;
    }

    console.log('🔍 DetailPlanAddModal - planId:', planId, 'userEmail:', userEmail);
    setIsCreating(true);
    try {
      const location: Location = {
        latitude: selectedPlace.latitude,
        longitude: selectedPlace.longitude,
        address: selectedPlace.address,
        name: selectedPlace.name,
      };
      
      console.log('🔍 Selected place location:', location);

      const timeString = `${selectedHour.toString().padStart(2, '0')}:${selectedMinute.toString().padStart(2, '0')}`;

      const detailPlan: DetailPlanDto = {
        planId,
        location,
        date: currentSelectedDate,
        time: timeString,
        version: 0, // 생성 시에는 0
      };

      console.log('🔄 세부 계획 생성 시작:', { detailPlan, email: userEmail });
      console.log('🔍 DetailPlanDto 구조:', {
        planId: typeof planId,
        location: typeof location,
        date: typeof currentSelectedDate,
        time: typeof timeString,
        version: typeof 0
      });
      
      await createDetailPlan(detailPlan, userEmail);
      
      // 성공 시 모달 닫기 및 데이터 재로드
      handleClose();
      onSuccess(); // 맵 재로드 트리거
      
    } catch (error) {
      console.error('세부 계획 생성 실패:', error);
      Alert.alert('오류', '세부 계획 추가에 실패했습니다.');
    } finally {
      setIsCreating(false);
    }
  };

  // 모달 닫기
  const handleClose = () => {
    setPlaceQuery('');
    setSearchResults([]);
    setSelectedPlace(null);
    setSelectedHour(9);
    setSelectedMinute(0);
    setCurrentSelectedDate(selectedDate);
    setShowHourPicker(false);
    setShowMinutePicker(false);
    setShowDatePicker(false);
    onClose();
  };

  // 장소 검색 결과 렌더링
  const renderSearchResult = ({ item }: { item: PlaceSearchResult }) => (
    <TouchableOpacity
      style={styles.searchResultItem}
      onPress={() => handlePlaceSelect(item)}
    >
      <Ionicons name="location-outline" size={20} color={UI_CONFIG.COLORS.PRIMARY} />
      <View style={styles.searchResultContent}>
        <Text style={styles.searchResultName}>{item.name}</Text>
        <Text style={styles.searchResultAddress}>{item.address}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={handleClose}
    >
      <View style={styles.container}>
        {/* 헤더 */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Ionicons name="close" size={24} color={UI_CONFIG.COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>세부 계획 추가</Text>
          <TouchableOpacity
            onPress={handleCreate}
            disabled={!selectedPlace || isCreating}
            style={[
              styles.createButton,
              (!selectedPlace || isCreating) && styles.createButtonDisabled
            ]}
          >
            {isCreating ? (
              <ActivityIndicator size="small" color={UI_CONFIG.COLORS.TEXT_WHITE} />
            ) : (
              <Text style={styles.createButtonText}>추가</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* 내용 */}
        <View style={styles.content}>
          {/* 날짜 선택 */}
          <View style={styles.dateContainer}>
            <Text style={styles.dateLabel}>날짜</Text>
            <TouchableOpacity
              style={styles.dateSelector}
              onPress={() => setShowDatePicker(!showDatePicker)}
            >
              <Text style={styles.dateText}>{formatDate(currentSelectedDate)}</Text>
              <Ionicons 
                name={showDatePicker ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={UI_CONFIG.COLORS.TEXT_SECONDARY} 
              />
            </TouchableOpacity>
            
            {/* 날짜 선택 드롭다운 */}
            {showDatePicker && availableDates && availableDates.length > 0 && (
              <View style={styles.datePickerContainer}>
                <ScrollView style={styles.datePickerList} showsVerticalScrollIndicator={false}>
                  {availableDates.map((date, index) => (
                    <TouchableOpacity
                      key={index}
                      style={[
                        styles.datePickerItem,
                        currentSelectedDate === date && styles.datePickerItemSelected
                      ]}
                      onPress={() => {
                        setCurrentSelectedDate(date);
                        setShowDatePicker(false);
                      }}
                    >
                      <Text style={[
                        styles.datePickerItemText,
                        currentSelectedDate === date && styles.datePickerItemTextSelected
                      ]}>
                        {formatDate(date)}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}
          </View>

          {/* 장소 검색 */}
          <View style={styles.searchContainer}>
            <Text style={styles.label}>장소</Text>
            <View style={styles.searchInputContainer}>
              <TextInput
                style={styles.searchInput}
                placeholder="장소명을 입력하세요"
                value={placeQuery}
                onChangeText={setPlaceQuery}
                onSubmitEditing={handleSearch}
              />
              <TouchableOpacity
                style={styles.searchButton}
                onPress={handleSearch}
                disabled={isSearching}
              >
                {isSearching ? (
                  <ActivityIndicator size="small" color={UI_CONFIG.COLORS.PRIMARY} />
                ) : (
                  <Ionicons name="search" size={20} color={UI_CONFIG.COLORS.PRIMARY} />
                )}
              </TouchableOpacity>
            </View>

            {/* 검색 결과 */}
            {searchResults.length > 0 && (
              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item) => item.placeId || `${item.latitude}-${item.longitude}`}
                style={styles.searchResults}
                showsVerticalScrollIndicator={false}
              />
            )}

            {/* 선택된 장소 */}
            {selectedPlace && (
              <View style={styles.selectedPlace}>
                <Ionicons name="checkmark-circle" size={20} color={UI_CONFIG.COLORS.SUCCESS} />
                <View style={styles.selectedPlaceContent}>
                  <Text style={styles.selectedPlaceName}>{selectedPlace.name}</Text>
                  <Text style={styles.selectedPlaceAddress}>{selectedPlace.address}</Text>
                </View>
                <TouchableOpacity onPress={() => setSelectedPlace(null)}>
                  <Ionicons name="close-circle" size={20} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
                </TouchableOpacity>
              </View>
            )}
          </View>


          {/* 시간 선택 */}
          <View style={styles.timeContainer}>
            <Text style={styles.label}>시간</Text>
            
            {/* 시간 선택 드롭박스 */}
            <View style={styles.timePickerContainer}>
              {/* 시간 선택 */}
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>시간</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowHourPicker(!showHourPicker)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedHour.toString().padStart(2, '0')}
                  </Text>
                  <Ionicons 
                    name={showHourPicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={UI_CONFIG.COLORS.TEXT_SECONDARY} 
                  />
                </TouchableOpacity>
                
                {showHourPicker && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                      {hours.map((hour) => (
                        <TouchableOpacity
                          key={hour}
                          style={[
                            styles.dropdownItem,
                            selectedHour === hour && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setSelectedHour(hour);
                            setShowHourPicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedHour === hour && styles.dropdownItemTextSelected
                            ]}
                          >
                            {hour.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>

              {/* 분 선택 */}
              <View style={styles.timePickerColumn}>
                <Text style={styles.timePickerLabel}>분</Text>
                <TouchableOpacity
                  style={styles.dropdownButton}
                  onPress={() => setShowMinutePicker(!showMinutePicker)}
                >
                  <Text style={styles.dropdownButtonText}>
                    {selectedMinute.toString().padStart(2, '0')}
                  </Text>
                  <Ionicons 
                    name={showMinutePicker ? "chevron-up" : "chevron-down"} 
                    size={20} 
                    color={UI_CONFIG.COLORS.TEXT_SECONDARY} 
                  />
                </TouchableOpacity>
                
                {showMinutePicker && (
                  <View style={styles.dropdownList}>
                    <ScrollView style={styles.dropdownScroll} showsVerticalScrollIndicator={false}>
                      {minutes.map((minute) => (
                        <TouchableOpacity
                          key={minute}
                          style={[
                            styles.dropdownItem,
                            selectedMinute === minute && styles.dropdownItemSelected
                          ]}
                          onPress={() => {
                            setSelectedMinute(minute);
                            setShowMinutePicker(false);
                          }}
                        >
                          <Text
                            style={[
                              styles.dropdownItemText,
                              selectedMinute === minute && styles.dropdownItemTextSelected
                            ]}
                          >
                            {minute.toString().padStart(2, '0')}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  </View>
                )}
              </View>
            </View>

            {/* 선택된 시간 표시 */}
            <View style={styles.selectedTimeContainer}>
              <Ionicons name="time" size={20} color={UI_CONFIG.COLORS.PRIMARY} />
              <Text style={styles.selectedTimeText}>
                {selectedHour.toString().padStart(2, '0')}:{selectedMinute.toString().padStart(2, '0')}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
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
    justifyContent: 'space-between',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingTop: UI_CONFIG.SPACING.XXL + UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  headerTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  createButton: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
  },
  createButtonDisabled: {
    backgroundColor: UI_CONFIG.COLORS.TEXT_LIGHT,
  },
  createButtonText: {
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    padding: UI_CONFIG.SPACING.MD,
  },
  dateContainer: {
    marginBottom: UI_CONFIG.SPACING.LG,
    position: 'relative',
  },
  dateLabel: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: UI_CONFIG.SPACING.SM,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER,
  },
  dateText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  datePickerContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER_LIGHT,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  datePickerList: {
    maxHeight: 200,
  },
  datePickerItem: {
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  datePickerItemSelected: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
  },
  datePickerItemText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  datePickerItemTextSelected: {
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  searchContainer: {
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  label: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  searchInput: {
    flex: 1,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  searchButton: {
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
  },
  searchResults: {
    maxHeight: 200,
    marginTop: UI_CONFIG.SPACING.SM,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER_LIGHT,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  searchResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.MD,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  searchResultContent: {
    flex: 1,
    marginLeft: UI_CONFIG.SPACING.SM,
  },
  searchResultName: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    fontWeight: '500',
  },
  searchResultAddress: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: UI_CONFIG.SPACING.XS,
  },
  selectedPlace: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.SUCCESS + '10',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    marginTop: UI_CONFIG.SPACING.SM,
  },
  selectedPlaceContent: {
    flex: 1,
    marginLeft: UI_CONFIG.SPACING.SM,
  },
  selectedPlaceName: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  selectedPlaceAddress: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: UI_CONFIG.SPACING.XS,
  },
  dateContainer: {
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  dateButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  dateButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  datePickerList: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER_LIGHT,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  datePickerScroll: {
    maxHeight: 200,
  },
  datePickerItem: {
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  selectedDatePickerItem: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
  },
  datePickerItemText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  selectedDatePickerItemText: {
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  timeContainer: {
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  timePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER,
    paddingVertical: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.MD,
  },
  timePickerColumn: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  timePickerLabel: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: UI_CONFIG.SPACING.SM,
    fontWeight: '600',
  },
  dropdownButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: 80,
    paddingHorizontal: UI_CONFIG.SPACING.SM,
    paddingVertical: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER,
  },
  dropdownButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  dropdownList: {
    position: 'absolute',
    top: 60,
    left: 0,
    right: 0,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER,
    maxHeight: 150,
    zIndex: 1000,
    shadowColor: UI_CONFIG.COLORS.TEXT_PRIMARY,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  dropdownScroll: {
    maxHeight: 150,
  },
  dropdownItem: {
    paddingHorizontal: UI_CONFIG.SPACING.SM,
    paddingVertical: UI_CONFIG.SPACING.SM,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  dropdownItemSelected: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
  },
  dropdownItemText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    textAlign: 'center',
  },
  dropdownItemTextSelected: {
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
  },
  selectedTimeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY + '10',
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.PRIMARY + '20',
  },
  selectedTimeText: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    color: UI_CONFIG.COLORS.PRIMARY,
    fontWeight: '600',
    marginLeft: UI_CONFIG.SPACING.SM,
  },
});

export default DetailPlanAddModal;
