import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { searchPlaces } from '../../services/place/placeSearchService';

const { width } = Dimensions.get('window');

interface Location {
  name: string;
  latitude: number;
  longitude: number;
}

interface PlaceSearchResult {
  placeId: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
}

const TravelDiaryWriteScreen = ({ navigation }: any) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  
  // 폼 데이터 상태
  const [title, setTitle] = useState('');
  const [subTitle, setSubTitle] = useState('');
  const [location, setLocation] = useState<Location | null>(null);
  const [locationInput, setLocationInput] = useState('');
  const [price, setPrice] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [mainImage, setMainImage] = useState<string | null>(null);
  
  // UI 상태
  const [isLocationSearching, setIsLocationSearching] = useState(false);
  const [locationResults, setLocationResults] = useState<PlaceSearchResult[]>([]);
  const [showLocationResults, setShowLocationResults] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 위치 검색 핸들러
  const handleLocationSearch = useCallback(async () => {
    const query = locationInput.trim();
    
    if (!query) {
      Alert.alert('알림', '검색할 위치를 입력해주세요.');
      return;
    }

    try {
      setIsLocationSearching(true);
      console.log('🔍 위치 검색 시작:', query);
      
      const results = await searchPlaces(query);
      console.log('✅ 위치 검색 결과:', results);
      
      setLocationResults(results);
      setShowLocationResults(true);
    } catch (error) {
      console.error('❌ 위치 검색 실패:', error);
      Alert.alert('오류', '위치 검색에 실패했습니다.');
    } finally {
      setIsLocationSearching(false);
    }
  }, [locationInput]);

  // 위치 선택 핸들러
  const handleLocationSelect = useCallback((place: PlaceSearchResult) => {
    console.log('📍 위치 선택:', place);
    
    setLocation({
      name: place.name,
      latitude: place.latitude,
      longitude: place.longitude,
    });
    setLocationInput(place.name);
    setShowLocationResults(false);
  }, []);

  // 태그 추가 핸들러
  const handleAddTag = useCallback(() => {
    const trimmedTag = tagInput.trim();
    
    if (!trimmedTag) return;
    
    // 5자 이하 검증
    if (trimmedTag.length > 5) {
      Alert.alert('알림', '태그는 5자 이하로 입력해주세요.');
      return;
    }
    
    // 4개 제한 검증
    if (tags.length >= 4) {
      Alert.alert('알림', '태그는 최대 4개까지 입력할 수 있습니다.');
      return;
    }
    
    // 중복 검증
    if (tags.includes(trimmedTag)) {
      Alert.alert('알림', '이미 추가된 태그입니다.');
      return;
    }
    
    setTags(prev => [...prev, trimmedTag]);
    setTagInput('');
  }, [tagInput, tags]);

  // 태그 제거 핸들러
  const handleRemoveTag = useCallback((tagToRemove: string) => {
    setTags(prev => prev.filter(tag => tag !== tagToRemove));
  }, []);

  // 이미지 선택 핸들러
  const handleImagePicker = useCallback(async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (status !== 'granted') {
        Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        console.log('📷 이미지 선택:', result.assets[0].uri);
        setMainImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('❌ 이미지 선택 실패:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  }, []);

  // 폼 검증
  const validateForm = useCallback(() => {
    if (!title.trim()) {
      Alert.alert('입력 오류', '제목을 입력해주세요.');
      return false;
    }
    
    if (!subTitle.trim()) {
      Alert.alert('입력 오류', '부제목을 입력해주세요.');
      return false;
    }
    
    if (!location) {
      Alert.alert('입력 오류', '위치를 선택해주세요.');
      return false;
    }
    
    if (!price.trim()) {
      Alert.alert('입력 오류', '예상 비용을 입력해주세요.');
      return false;
    }
    
    if (tags.length === 0) {
      Alert.alert('입력 오류', '최소 1개의 태그를 입력해주세요.');
      return false;
    }
    
    if (!mainImage) {
      Alert.alert('입력 오류', '메인 이미지를 선택해주세요.');
      return false;
    }
    
    
    return true;
  }, [title, subTitle, location, price, tags, mainImage]);

  // 여행기 작성 제출
  const handleSubmit = useCallback(async () => {
    if (!validateForm() || !user?.email || !token) {
      if (!token) {
        Alert.alert('오류', '로그인이 필요합니다.');
      }
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('📝 여행기 작성 시작');

      // 1단계: 여행기 기본 정보 생성
      const formData = new FormData();
      
      // Text 필드들 추가
      formData.append('title', title.trim());
      formData.append('subTitle', subTitle.trim());
      
      // 비용 처리: 0이거나 빈 값이면 "무료"로 설정
      const priceValue = price.trim();
      const finalPrice = (priceValue === '' || priceValue === '0') ? '무료' : priceValue;
      formData.append('price', finalPrice);
      
      formData.append('type', 'POST'); // 고정값
      
      // location JSON 문자열로 추가
      formData.append('location', JSON.stringify(location));
      
      // tags 배열을 쉼표로 구분된 문자열로 추가
      formData.append('tags', tags.join(','));
      
      // 메인 이미지 추가
      if (mainImage) {
        const imageUri = mainImage;
        const filename = imageUri.split('/').pop() || 'image.jpg';
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        
        formData.append('mainImage', {
          uri: imageUri,
          type: type,
          name: filename,
        } as any);
      }

      console.log('📤 1단계: 여행기 기본 정보 전송:', {
        title: title.trim(),
        subTitle: subTitle.trim(),
        location: location,
        price: finalPrice,
        type: 'POST',
        tags: tags.join(','),
        hasImage: !!mainImage
      });

      // FormData 내용 상세 로그
      console.log('🔍 FormData 상세 정보:');
      for (let [key, value] of formData.entries()) {
        if (key === 'mainImage') {
          console.log(`  ${key}: [File] ${value.name || 'unnamed'} (${value.type || 'unknown type'})`);
        } else {
          console.log(`  ${key}: ${value}`);
        }
      }

      console.log('🌐 API 요청 시작:');
      console.log('  URL: http://192.168.219.112:8080/recommend');
      console.log('  Method: POST');
      console.log('  Headers:', {
        'Authorization': `Bearer ${token}`,
      });
      console.log('  Body: FormData with', Array.from(formData.keys()).length, 'fields');

      // 1단계: 여행기 기본 정보 생성 API 호출
      const response = await fetch('http://192.168.219.112:8080/recommend', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      console.log('📡 API 응답 받음:');
      console.log('  Status:', response.status);
      console.log('  Status Text:', response.statusText);
      console.log('  Headers:', Object.fromEntries(response.headers.entries()));
      console.log('  OK:', response.ok);

      if (!response.ok) {
        console.log('❌ API 요청 실패:');
        console.log('  Status:', response.status);
        console.log('  Status Text:', response.statusText);
        
        // 에러 응답 본문도 로그
        try {
          const errorText = await response.text();
          console.log('  Error Body:', errorText);
        } catch (e) {
          console.log('  Error Body: 읽기 실패');
        }
        
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      console.log('📄 응답 본문 파싱 중...');
      
      // 응답이 JSON인지 확인
      const contentType = response.headers.get('content-type');
      console.log('  Content-Type:', contentType);
      
      let result;
      if (contentType && contentType.includes('application/json')) {
        result = await response.json();
      } else {
        // JSON이 아닌 경우 텍스트로 파싱
        const textResult = await response.text();
        console.log('  Raw Response:', textResult);
        
        // 숫자인지 확인하고 파싱
        const parsedResult = parseInt(textResult.trim());
        result = isNaN(parsedResult) ? textResult : parsedResult;
      }
      
      console.log('✅ 여행기 기본 정보 생성 성공:');
      console.log('  응답 데이터:', result);
      console.log('  응답 타입:', typeof result);
      
      // result가 숫자(Long)인 경우 recommendationId로 사용
      const recommendationId = typeof result === 'number' ? result : result.id || result.recommendationId;
      console.log('  추출된 recommendationId:', recommendationId);

      Alert.alert(
        '성공',
        '여행기 기본 정보가 작성되었습니다. 이제 컨텐츠를 작성해보세요.',
        [
          {
            text: '컨텐츠 작성',
            onPress: () => {
              navigation.navigate('TravelDiaryContentEdit', {
                recommendationId: recommendationId,
                title: title.trim()
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ 여행기 작성 실패:');
      console.error('  Error Type:', typeof error);
      console.error('  Error Message:', error.message);
      console.error('  Error Stack:', error.stack);
      
      if (error.response) {
        console.error('  Response Status:', error.response.status);
        console.error('  Response Data:', error.response.data);
      }
      
      if (error.request) {
        console.error('  Request:', error.request);
      }
      
      Alert.alert('오류', '여행기 작성에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [title, subTitle, location, price, tags, mainImage, user?.email, token, navigation, validateForm]);

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행기 작성</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.submitButton]}
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Text style={[styles.submitButtonText, isSubmitting && styles.submitButtonTextDisabled]}>
            {isSubmitting ? '작성 중...' : '완료'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 메인 이미지 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>메인 이미지 *</Text>
          <TouchableOpacity style={styles.imagePicker} onPress={handleImagePicker}>
            {mainImage ? (
              <Image source={{ uri: mainImage }} style={styles.selectedImage} />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="camera-outline" size={48} color="#BDC3C7" />
                <Text style={styles.imagePlaceholderText}>이미지 선택</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* 제목 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>제목 *</Text>
          <TextInput
            style={styles.textInput}
            value={title}
            onChangeText={setTitle}
            placeholder="여행기 제목을 입력해주세요"
            placeholderTextColor="#999"
          />
        </View>

        {/* 부제목 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>부제목 *</Text>
          <TextInput
            style={styles.textInput}
            value={subTitle}
            onChangeText={setSubTitle}
            placeholder="여행기 부제목을 입력해주세요"
            placeholderTextColor="#999"
          />
        </View>

        {/* 위치 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>위치 *</Text>
          <View style={styles.locationContainer}>
            <TextInput
              style={styles.locationInput}
              value={locationInput}
              onChangeText={setLocationInput}
              placeholder="위치를 입력해주세요"
              placeholderTextColor="#999"
              onSubmitEditing={handleLocationSearch}
            />
            <TouchableOpacity
              style={[styles.searchButton, isLocationSearching && styles.searchButtonDisabled]}
              onPress={handleLocationSearch}
              disabled={isLocationSearching}
            >
              <Ionicons 
                name={isLocationSearching ? "hourglass-outline" : "search-outline"} 
                size={20} 
                color={isLocationSearching ? "#999" : "#FF6B35"} 
              />
            </TouchableOpacity>
          </View>
          
          {/* 위치 검색 결과 */}
          {showLocationResults && locationResults.length > 0 && (
            <View style={styles.locationResults}>
              {locationResults.map((place, index) => (
                <TouchableOpacity
                  key={place.placeId}
                  style={styles.locationResultItem}
                  onPress={() => handleLocationSelect(place)}
                >
                  <Ionicons name="location-outline" size={16} color="#FF6B35" />
                  <View style={styles.locationResultText}>
                    <Text style={styles.locationResultName}>{place.name}</Text>
                    <Text style={styles.locationResultAddress}>{place.address}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          )}
          
          {/* 선택된 위치 */}
          {location && (
            <View style={styles.selectedLocation}>
              <Ionicons name="checkmark-circle" size={16} color="#27AE60" />
              <Text style={styles.selectedLocationText}>{location.name}</Text>
              <TouchableOpacity
                onPress={() => {
                  setLocation(null);
                  setLocationInput('');
                }}
              >
                <Ionicons name="close-circle" size={16} color="#E74C3C" />
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* 예상 비용 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>예상 비용 *</Text>
          <TextInput
            style={styles.textInput}
            value={price}
            onChangeText={setPrice}
            placeholder="예상 비용을 입력해주세요 (예: 50,000원)"
            placeholderTextColor="#999"
            keyboardType="numeric"
          />
        </View>

        {/* 태그 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>태그 * (최대 4개, 각 5자 이하)</Text>
          <View style={styles.tagInputContainer}>
            <TextInput
              style={styles.tagInput}
              value={tagInput}
              onChangeText={setTagInput}
              placeholder="태그를 입력해주세요"
              placeholderTextColor="#999"
              onSubmitEditing={handleAddTag}
              maxLength={5}
            />
            <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
              <Ionicons name="add" size={20} color="#FF6B35" />
            </TouchableOpacity>
          </View>
          
          {/* 태그 목록 */}
          {tags.length > 0 && (
            <View style={styles.tagList}>
              {tags.map((tag, index) => (
                <View key={index} style={styles.tagItem}>
                  <Text style={styles.tagText}>#{tag}</Text>
                  <TouchableOpacity onPress={() => handleRemoveTag(tag)}>
                    <Ionicons name="close" size={16} color="#E74C3C" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          )}
        </View>


        {/* 하단 여백 */}
        <View style={styles.bottomSpacer} />
      </ScrollView>
    </KeyboardAvoidingView>
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
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  submitButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  submitButtonTextDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  imagePicker: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  selectedImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  imagePlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E1E8ED',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#BDC3C7',
    marginTop: 8,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  locationInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  searchButton: {
    padding: 12,
    backgroundColor: '#FFF5F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  searchButtonDisabled: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E1E8ED',
  },
  locationResults: {
    marginTop: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    maxHeight: 200,
  },
  locationResultItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F8F9FA',
  },
  locationResultText: {
    flex: 1,
    marginLeft: 8,
  },
  locationResultName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  locationResultAddress: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  selectedLocation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    padding: 12,
    backgroundColor: '#F0F9F0',
    borderRadius: 8,
  },
  selectedLocationText: {
    flex: 1,
    fontSize: 14,
    color: '#27AE60',
    marginLeft: 8,
  },
  tagInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#333',
    backgroundColor: '#FFFFFF',
    marginRight: 8,
  },
  addTagButton: {
    padding: 12,
    backgroundColor: '#FFF5F2',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  tagList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
    gap: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
  },
  tagText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '500',
    marginRight: 4,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default TravelDiaryWriteScreen;
