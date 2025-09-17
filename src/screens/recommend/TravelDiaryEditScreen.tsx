import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import * as ImagePicker from 'expo-image-picker';
import { Recommendation, RecommendationType, RecommendationBlock } from '../../types';
import { 
  getRecommendationBlocks,
  setMainImageOfRecommendation,
  updateRecommendation,
  updateRecommendationBlock,
  deleteRecommendationBlock,
  addRecommendationBlock
} from '../../services/recommendation/recommendationService';

const { width } = Dimensions.get('window');

interface ContentBlock {
  id: string;
  type: 'TEXT' | 'IMAGE';
  content: string;
  imageUri?: string;
  orderIndex: number;
}

const TravelDiaryEditScreen = ({ navigation, route }: any) => {
  const { recommendation } = route.params || {};
  
  // Redux 상태
  const authState = useSelector((state: any) => state.auth);
  const user = authState.user;
  const token = authState.token;

  // 기본 정보 상태
  const [title, setTitle] = useState(recommendation?.title || '');
  const [subTitle, setSubTitle] = useState(recommendation?.subTitle || '');
  const [location, setLocation] = useState(recommendation?.location?.name || '');
  const [price, setPrice] = useState(recommendation?.price || '');
  const [tags, setTags] = useState(recommendation?.tags?.join(', ') || '');
  const [mainImageUri, setMainImageUri] = useState(recommendation?.mainImage || '');

  // 컨텐츠 블록 상태
  const [contentBlocks, setContentBlocks] = useState<ContentBlock[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingBlocks, setIsLoadingBlocks] = useState(false);

  // 기존 블록 로드
  const loadExistingBlocks = async () => {
    if (!recommendation?.id) return;
    
    try {
      console.log('🔄 기존 블록 로드 시작:', recommendation.id);
      setIsLoadingBlocks(true);
      
      const blocks = await getRecommendationBlocks(recommendation.id);
      console.log('📥 기존 블록 로드 성공:', blocks);
      
      // API 응답을 ContentBlock 형태로 변환
      const convertedBlocks: ContentBlock[] = blocks.map((block: RecommendationBlock) => ({
        id: block.id.toString(),
        type: block.type,
        content: block.type === 'TEXT' ? (block.text || '') : (block.caption || ''),
        imageUri: block.type === 'IMAGE' && block.image ? block.image.url : undefined,
        orderIndex: block.orderIndex
      }));
      
      // orderIndex 순으로 정렬
      convertedBlocks.sort((a, b) => a.orderIndex - b.orderIndex);
      
      console.log('🔄 변환된 블록:', convertedBlocks);
      setContentBlocks(convertedBlocks);
      
    } catch (error) {
      console.error('❌ 기존 블록 로드 실패:', error);
      Alert.alert('오류', '기존 컨텐츠를 불러오는 중 오류가 발생했습니다.');
      
      // 실패 시 빈 배열로 초기화
      setContentBlocks([]);
    } finally {
      setIsLoadingBlocks(false);
    }
  };

  useEffect(() => {
    if (recommendation) {
      console.log('📝 여행기 수정 페이지 로드:', recommendation);
      loadExistingBlocks();
    }
  }, [recommendation]);

  // 메인 이미지 선택
  const handleSelectMainImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        setMainImageUri(result.assets[0].uri);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  // 텍스트 블록 추가
  const handleAddTextBlock = () => {
    // 새 블록의 ID는 기존 블록 ID와 충돌하지 않도록 큰 숫자 사용
    const newId = Math.max(...contentBlocks.map(block => parseInt(block.id)), 0) + 1000000;
    const newBlock: ContentBlock = {
      id: newId.toString(),
      type: 'TEXT',
      content: '',
      orderIndex: contentBlocks.length
    };
    setContentBlocks([...contentBlocks, newBlock]);
  };

  // 이미지 블록 추가
  const handleAddImageBlock = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [16, 9],
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        // 새 블록의 ID는 기존 블록 ID와 충돌하지 않도록 큰 숫자 사용
        const newId = Math.max(...contentBlocks.map(block => parseInt(block.id)), 0) + 1000000;
        const newBlock: ContentBlock = {
          id: newId.toString(),
          type: 'IMAGE',
          content: '',
          imageUri: result.assets[0].uri,
          orderIndex: contentBlocks.length
        };
        setContentBlocks([...contentBlocks, newBlock]);
      }
    } catch (error) {
      console.error('이미지 선택 오류:', error);
      Alert.alert('오류', '이미지를 선택하는 중 오류가 발생했습니다.');
    }
  };

  // 블록 내용 업데이트
  const handleUpdateBlockContent = (blockId: string, content: string) => {
    setContentBlocks(blocks => 
      blocks.map(block => 
        block.id === blockId ? { ...block, content } : block
      )
    );
  };

  // 블록 삭제
  const handleDeleteBlock = async (blockId: string) => {
    Alert.alert(
      '블록 삭제',
      '이 블록을 삭제하시겠습니까?',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: async () => {
            try {
              // 서버에 저장된 블록인지 확인 (ID가 숫자로만 구성되어 있으면 서버 블록)
              const isServerBlock = /^\d+$/.test(blockId);
              
              if (isServerBlock) {
                console.log('🗑️ 서버 블록 삭제:', blockId);
                await deleteRecommendationBlock(parseInt(blockId), token);
                console.log('✅ 서버 블록 삭제 성공');
              } else {
                console.log('🗑️ 로컬 블록 삭제:', blockId);
              }
              
              // UI에서 블록 제거
              setContentBlocks(blocks => 
                blocks.filter(block => block.id !== blockId)
              );
              
            } catch (error) {
              console.error('❌ 블록 삭제 실패:', error);
              Alert.alert('오류', '블록 삭제 중 오류가 발생했습니다.');
            }
          }
        }
      ]
    );
  };

  // 블록 순서 이동
  const handleMoveBlock = (blockId: string, direction: 'up' | 'down') => {
    setContentBlocks(blocks => {
      const blockIndex = blocks.findIndex(block => block.id === blockId);
      if (blockIndex === -1) return blocks;

      const newBlocks = [...blocks];
      const targetIndex = direction === 'up' ? blockIndex - 1 : blockIndex + 1;

      if (targetIndex >= 0 && targetIndex < blocks.length) {
        // 순서 교환
        [newBlocks[blockIndex], newBlocks[targetIndex]] = [newBlocks[targetIndex], newBlocks[blockIndex]];
        
        // orderIndex 업데이트
        newBlocks.forEach((block, index) => {
          block.orderIndex = index;
        });
      }

      return newBlocks;
    });
  };

  // 저장
  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return;
    }

    if (!location.trim()) {
      Alert.alert('오류', '위치를 입력해주세요.');
      return;
    }

    if (!recommendation || !user?.email || !token) {
      Alert.alert('오류', '저장할 수 없습니다.');
      return;
    }

    try {
      setIsLoading(true);
      
      console.log('💾 여행기 수정 저장 시작:', {
        recommendationId: recommendation.id,
        title,
        subTitle,
        location,
        price,
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag),
        mainImageUri,
        contentBlocks
      });

      // 1. 기본 정보 수정
      console.log('📝 1단계: 기본 정보 수정');
      await updateRecommendation({
        placeId: recommendation.id,
        title: title.trim(),
        subTitle: subTitle.trim(),
        location: {
          name: location.trim(),
          latitude: recommendation.location.latitude, // 기존 값 유지
          longitude: recommendation.location.longitude // 기존 값 유지
        },
        price: price.trim(),
        tags: tags.split(',').map(tag => tag.trim()).filter(tag => tag).join(',')
      }, token);

      // 2. 메인 이미지 수정 (새로 선택된 경우)
      if (mainImageUri && mainImageUri !== recommendation.mainImage) {
        console.log('🖼️ 2단계: 메인 이미지 수정');
        
        // 이미지 파일 객체 생성
        const imageFile = {
          uri: mainImageUri,
          type: 'image/jpeg',
          name: 'main_image.jpg'
        };
        
        await setMainImageOfRecommendation(recommendation.id, imageFile, token);
      }

      // 3. 블록 수정/추가
      console.log('📄 3단계: 블록 수정/추가');
      
      for (let i = 0; i < contentBlocks.length; i++) {
        const block = contentBlocks[i];
        const blockId = parseInt(block.id);
        
        // 서버에 저장된 블록인지 확인
        const isServerBlock = /^\d+$/.test(block.id);
        
        if (isServerBlock) {
          // 기존 블록 수정
          console.log(`📝 블록 수정: ${block.id}`);
          
          const blockData: any = {
            type: block.type,
            orderIndex: i.toString()
          };
          
          if (block.type === 'TEXT') {
            blockData.text = block.content.trim();
          } else if (block.type === 'IMAGE') {
            if (block.imageUri && !block.imageUri.startsWith('http')) {
              // 새로 선택된 이미지인 경우
              blockData.imageFile = {
                uri: block.imageUri,
                type: 'image/jpeg',
                name: `image_${block.id}.jpg`
              };
            }
            if (block.content.trim()) {
              blockData.caption = block.content.trim();
            }
          }
          
          await updateRecommendationBlock(blockId, blockData, token);
        } else {
          // 새 블록 추가
          console.log(`➕ 새 블록 추가: ${block.id}`);
          
          const blockData: any = {
            type: block.type,
            orderIndex: i.toString()
          };
          
          if (block.type === 'TEXT') {
            blockData.text = block.content.trim();
          } else if (block.type === 'IMAGE') {
            if (block.imageUri) {
              blockData.imageFile = {
                uri: block.imageUri,
                type: 'image/jpeg',
                name: `image_${block.id}.jpg`
              };
            }
            if (block.content.trim()) {
              blockData.caption = block.content.trim();
            }
          }
          
          await addRecommendationBlock(recommendation.id, blockData, token);
        }
      }

      console.log('✅ 모든 수정 완료');
      
      Alert.alert(
        '저장 완료',
        '여행기가 성공적으로 수정되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 상세 페이지로 돌아가면서 새로고침 트리거
              navigation.navigate('RecommendDetail', { 
                recommendationId: recommendation.id,
                refreshDetail: true 
              });
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ 저장 오류:', error);
      Alert.alert('오류', '저장 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // 렌더링 함수들
  const renderMainImage = () => (
    <View style={styles.imageSection}>
      <Text style={styles.sectionTitle}>메인 이미지</Text>
      <TouchableOpacity style={styles.imageContainer} onPress={handleSelectMainImage}>
        {mainImageUri ? (
          <Image source={{ uri: mainImageUri }} style={styles.mainImage} />
        ) : (
          <View style={styles.imagePlaceholder}>
            <Ionicons name="camera" size={48} color="#BDC3C7" />
            <Text style={styles.imagePlaceholderText}>이미지 선택</Text>
          </View>
        )}
      </TouchableOpacity>
    </View>
  );

  const renderContentBlock = (block: ContentBlock, index: number) => (
    <View key={block.id} style={styles.contentBlock}>
      <View style={styles.blockHeader}>
        <Text style={styles.blockType}>
          {block.type === 'TEXT' ? '텍스트' : '이미지'} 블록 {index + 1}
        </Text>
        <View style={styles.blockActions}>
          {index > 0 && (
            <TouchableOpacity 
              style={styles.blockActionButton}
              onPress={() => handleMoveBlock(block.id, 'up')}
            >
              <Ionicons name="arrow-up" size={16} color="#3498DB" />
            </TouchableOpacity>
          )}
          {index < contentBlocks.length - 1 && (
            <TouchableOpacity 
              style={styles.blockActionButton}
              onPress={() => handleMoveBlock(block.id, 'down')}
            >
              <Ionicons name="arrow-down" size={16} color="#3498DB" />
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={styles.blockActionButton}
            onPress={() => handleDeleteBlock(block.id)}
          >
            <Ionicons name="trash-outline" size={16} color="#E74C3C" />
          </TouchableOpacity>
        </View>
      </View>

      {block.type === 'TEXT' ? (
        <TextInput
          style={styles.textBlockInput}
          placeholder="텍스트 내용을 입력하세요..."
          placeholderTextColor="#7F8C8D"
          value={block.content}
          onChangeText={(text) => handleUpdateBlockContent(block.id, text)}
          multiline
          textAlignVertical="top"
        />
      ) : (
        <View style={styles.imageBlockContainer}>
          {block.imageUri && (
            <Image source={{ uri: block.imageUri }} style={styles.blockImage} />
          )}
          <TextInput
            style={styles.imageCaptionInput}
            placeholder="이미지 설명 (선택사항)"
            placeholderTextColor="#7F8C8D"
            value={block.content}
            onChangeText={(text) => handleUpdateBlockContent(block.id, text)}
          />
        </View>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 상단 네비게이션 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>여행기 수정</Text>
        <TouchableOpacity 
          onPress={handleSave} 
          style={styles.saveButton}
          disabled={isLoading}
        >
          <Text style={styles.saveButtonText}>
            {isLoading ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 기본 정보 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>제목 *</Text>
            <TextInput
              style={styles.input}
              placeholder="여행기 제목을 입력하세요"
              placeholderTextColor="#7F8C8D"
              value={title}
              onChangeText={setTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>부제목</Text>
            <TextInput
              style={styles.input}
              placeholder="부제목을 입력하세요 (선택사항)"
              placeholderTextColor="#7F8C8D"
              value={subTitle}
              onChangeText={setSubTitle}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>위치 *</Text>
            <TextInput
              style={styles.input}
              placeholder="여행지 위치를 입력하세요"
              placeholderTextColor="#7F8C8D"
              value={location}
              onChangeText={setLocation}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>가격</Text>
            <TextInput
              style={styles.input}
              placeholder="예: 무료, 10,000원, $50"
              placeholderTextColor="#7F8C8D"
              value={price}
              onChangeText={setPrice}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>태그</Text>
            <TextInput
              style={styles.input}
              placeholder="태그를 쉼표로 구분하여 입력하세요 (예: 바다, 휴양, 가족)"
              placeholderTextColor="#7F8C8D"
              value={tags}
              onChangeText={setTags}
            />
            <Text style={styles.inputHelp}>최대 4개, 각 태그는 5자 이하</Text>
          </View>
        </View>

        {/* 메인 이미지 */}
        {renderMainImage()}

        {/* 컨텐츠 블록 */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>컨텐츠</Text>
            <View style={styles.addBlockButtons}>
              <TouchableOpacity 
                style={styles.addBlockButton}
                onPress={handleAddTextBlock}
              >
                <Ionicons name="text" size={16} color="#3498DB" />
                <Text style={styles.addBlockButtonText}>텍스트</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.addBlockButton}
                onPress={handleAddImageBlock}
              >
                <Ionicons name="image" size={16} color="#3498DB" />
                <Text style={styles.addBlockButtonText}>이미지</Text>
              </TouchableOpacity>
            </View>
          </View>

          {isLoadingBlocks ? (
            <View style={styles.loadingContent}>
              <Ionicons name="refresh" size={32} color="#3498DB" />
              <Text style={styles.loadingContentText}>컨텐츠를 불러오는 중...</Text>
            </View>
          ) : (
            <>
              {contentBlocks.map((block, index) => renderContentBlock(block, index))}
              
              {contentBlocks.length === 0 && (
                <View style={styles.emptyContent}>
                  <Ionicons name="document-text-outline" size={48} color="#BDC3C7" />
                  <Text style={styles.emptyContentText}>아직 컨텐츠가 없습니다.</Text>
                  <Text style={styles.emptyContentSubText}>텍스트나 이미지 블록을 추가해보세요.</Text>
                </View>
              )}
            </>
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
    paddingHorizontal: 20,
    paddingVertical: 15,
    backgroundColor: '#3498DB',
    paddingTop: 50,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3498DB',
  },
  content: {
    flex: 1,
  },
  section: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2C3E50',
    marginBottom: 15,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  inputHelp: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 4,
  },
  imageSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8E8',
  },
  imageContainer: {
    alignItems: 'center',
  },
  mainImage: {
    width: width - 40,
    height: (width - 40) * 0.6,
    borderRadius: 12,
  },
  imagePlaceholder: {
    width: width - 40,
    height: (width - 40) * 0.6,
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E8E8E8',
    borderStyle: 'dashed',
  },
  imagePlaceholderText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginTop: 8,
  },
  addBlockButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  addBlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F8F9FA',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  addBlockButtonText: {
    fontSize: 12,
    color: '#3498DB',
    marginLeft: 4,
    fontWeight: '500',
  },
  contentBlock: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  blockHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  blockType: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2C3E50',
  },
  blockActions: {
    flexDirection: 'row',
    gap: 4,
  },
  blockActionButton: {
    padding: 4,
  },
  textBlockInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    minHeight: 100,
  },
  imageBlockContainer: {
    alignItems: 'center',
  },
  blockImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    marginBottom: 10,
  },
  imageCaptionInput: {
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  loadingContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingContentText: {
    fontSize: 14,
    color: '#3498DB',
    marginTop: 10,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyContentText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 10,
  },
  emptyContentSubText: {
    fontSize: 14,
    color: '#BDC3C7',
    marginTop: 4,
  },
  bottomSpacer: {
    height: 50,
  },
});

export default TravelDiaryEditScreen;
