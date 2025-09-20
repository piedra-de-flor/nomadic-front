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
import { addRecommendationBlock } from '../../services/recommendation/recommendationService';

const { width } = Dimensions.get('window');

interface ContentBlock {
  id: string;
  type: 'TEXT' | 'IMAGE';
  content: string;
  imageUri?: string;
  orderIndex: number;
}

const TravelDiaryContentEditScreen = ({ navigation, route }: any) => {
  const { user, token } = useSelector((state: RootState) => state.auth);
  const { recommendationId, title } = route.params || {};
  
  // 컨텐츠 블록 상태
  const [blocks, setBlocks] = useState<ContentBlock[]>([
    { id: '1', type: 'TEXT', content: '', orderIndex: 0 }
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 텍스트 블록 추가
  const addTextBlock = useCallback(() => {
    const newBlock: ContentBlock = {
      id: Date.now().toString(),
      type: 'TEXT',
      content: '',
      orderIndex: blocks.length
    };
    setBlocks(prev => [...prev, newBlock]);
  }, [blocks.length]);

  // 이미지 블록 추가
  const addImageBlock = useCallback(async (blockId: string) => {
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
        
        setBlocks(prev => prev.map(block => 
          block.id === blockId 
            ? { ...block, type: 'IMAGE', imageUri: result.assets[0].uri }
            : block
        ));
      }
    } catch (error) {
      console.error('❌ 이미지 선택 실패:', error);
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  }, []);

  // 블록 내용 업데이트
  const updateBlockContent = useCallback((blockId: string, content: string) => {
    setBlocks(prev => prev.map(block => 
      block.id === blockId 
        ? { ...block, content }
        : block
    ));
  }, []);

  // 블록 삭제
  const deleteBlock = useCallback((blockId: string) => {
    setBlocks(prev => {
      const filtered = prev.filter(block => block.id !== blockId);
      // 순서 인덱스 재정렬
      return filtered.map((block, index) => ({ ...block, orderIndex: index }));
    });
  }, []);

  // 블록 순서 변경 (위로)
  const moveBlockUp = useCallback((blockId: string) => {
    setBlocks(prev => {
      const blockIndex = prev.findIndex(block => block.id === blockId);
      if (blockIndex <= 0) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[blockIndex], newBlocks[blockIndex - 1]] = [newBlocks[blockIndex - 1], newBlocks[blockIndex]];
      
      return newBlocks.map((block, index) => ({ ...block, orderIndex: index }));
    });
  }, []);

  // 블록 순서 변경 (아래로)
  const moveBlockDown = useCallback((blockId: string) => {
    setBlocks(prev => {
      const blockIndex = prev.findIndex(block => block.id === blockId);
      if (blockIndex >= prev.length - 1) return prev;
      
      const newBlocks = [...prev];
      [newBlocks[blockIndex], newBlocks[blockIndex + 1]] = [newBlocks[blockIndex + 1], newBlocks[blockIndex]];
      
      return newBlocks.map((block, index) => ({ ...block, orderIndex: index }));
    });
  }, []);

  // 컨텐츠 저장
  const handleSave = useCallback(async () => {
    if (!user?.email || !token || !recommendationId) {
      Alert.alert('오류', '로그인이 필요합니다.');
      return;
    }

    // 빈 텍스트 블록 제거
    const validBlocks = blocks.filter(block => 
      block.type === 'IMAGE' || (block.type === 'TEXT' && block.content.trim())
    );

    if (validBlocks.length === 0) {
      Alert.alert('알림', '최소 하나의 컨텐츠 블록을 작성해주세요.');
      return;
    }

    try {
      setIsSubmitting(true);
      console.log('📝 컨텐츠 저장 시작:', { recommendationId, blockCount: validBlocks.length });

      // 각 블록을 순차적으로 서버에 전송
      for (const block of validBlocks) {
        console.log(`📤 블록 ${block.orderIndex + 1} 전송 중:`, {
          type: block.type,
          orderIndex: block.orderIndex.toString(),
          hasContent: !!block.content,
          hasImage: !!block.imageUri
        });

        const blockData: any = {
          type: block.type,
          orderIndex: block.orderIndex.toString()
        };

        if (block.type === 'TEXT') {
          blockData.text = block.content.trim();
          console.log(`  📝 텍스트 블록 데이터:`, {
            type: blockData.type,
            orderIndex: blockData.orderIndex,
            text: blockData.text,
            textLength: blockData.text.length
          });
        } else if (block.type === 'IMAGE' && block.imageUri) {
          // 이미지 파일 처리
          const imageUri = block.imageUri;
          const filename = imageUri.split('/').pop() || 'image.jpg';
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : 'image/jpeg';
          
          blockData.imageFile = {
            uri: imageUri,
            type: type,
            name: filename,
          } as any;
          
          if (block.content.trim()) {
            blockData.caption = block.content.trim();
          }
          
          console.log(`  🖼️ 이미지 블록 데이터:`, {
            type: blockData.type,
            orderIndex: blockData.orderIndex,
            imageFile: {
              uri: blockData.imageFile.uri,
              type: blockData.imageFile.type,
              name: blockData.imageFile.name
            },
            caption: blockData.caption || '없음'
          });
        }

        console.log(`🌐 API 요청 시작 - 블록 ${block.orderIndex + 1}:`);
        console.log(`  URL: http:///api/recommend/${recommendationId}/blocks`);
        console.log(`  Method: POST`);
        console.log(`  Headers: Authorization: Bearer ${token.substring(0, 20)}...`);

        await addRecommendationBlock(recommendationId, blockData, token);
        console.log(`✅ 블록 ${block.orderIndex + 1} 전송 완료`);
      }

      console.log('✅ 모든 컨텐츠 저장 완료');
      
      Alert.alert(
        '성공',
        '여행기 컨텐츠가 성공적으로 저장되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 추천 상세 페이지로 이동
              navigation.navigate('RecommendDetail', { 
                recommendationId: recommendationId,
                fromContentEdit: true 
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ 컨텐츠 저장 실패:', error);
      Alert.alert('오류', '컨텐츠 저장에 실패했습니다.');
    } finally {
      setIsSubmitting(false);
    }
  }, [blocks, user?.email, token, recommendationId, navigation]);

  // 블록 렌더링
  const renderBlock = useCallback((block: ContentBlock) => {
    return (
      <View key={block.id} style={styles.blockContainer}>
        {/* 블록 헤더 */}
        <View style={styles.blockHeader}>
          <Text style={styles.blockTypeText}>
            {block.type === 'TEXT' ? '텍스트' : '이미지'} 블록
          </Text>
          <View style={styles.blockActions}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => moveBlockUp(block.id)}
              disabled={block.orderIndex === 0}
            >
              <Ionicons 
                name="chevron-up" 
                size={20} 
                color={block.orderIndex === 0 ? '#BDC3C7' : '#FF6B35'} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => moveBlockDown(block.id)}
              disabled={block.orderIndex === blocks.length - 1}
            >
              <Ionicons 
                name="chevron-down" 
                size={20} 
                color={block.orderIndex === blocks.length - 1 ? '#BDC3C7' : '#FF6B35'} 
              />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => deleteBlock(block.id)}
            >
              <Ionicons name="trash-outline" size={20} color="#E74C3C" />
            </TouchableOpacity>
          </View>
        </View>

        {/* 블록 내용 */}
        {block.type === 'TEXT' ? (
          <TextInput
            style={styles.textInput}
            value={block.content}
            onChangeText={(text) => updateBlockContent(block.id, text)}
            placeholder="여행 경험을 자유롭게 작성해주세요"
            placeholderTextColor="#999"
            multiline
            numberOfLines={6}
            textAlignVertical="top"
          />
        ) : (
          <View style={styles.imageBlockContainer}>
            {block.imageUri ? (
              <View>
                <Image source={{ uri: block.imageUri }} style={styles.blockImage} />
                <TextInput
                  style={styles.captionInput}
                  value={block.content}
                  onChangeText={(text) => updateBlockContent(block.id, text)}
                  placeholder="이미지 설명을 입력해주세요 (선택사항)"
                  placeholderTextColor="#999"
                />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.imagePlaceholder}
                onPress={() => addImageBlock(block.id)}
              >
                <Ionicons name="camera-outline" size={48} color="#BDC3C7" />
                <Text style={styles.imagePlaceholderText}>이미지 선택</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>
    );
  }, [blocks.length, moveBlockUp, moveBlockDown, deleteBlock, updateBlockContent, addImageBlock]);

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
        <Text style={styles.headerTitle}>컨텐츠 작성</Text>
        <TouchableOpacity
          style={[styles.headerButton, styles.saveButton]}
          onPress={handleSave}
          disabled={isSubmitting}
        >
          <Text style={[styles.saveButtonText, isSubmitting && styles.saveButtonTextDisabled]}>
            {isSubmitting ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 제목 표시 */}
        <View style={styles.titleSection}>
          <Text style={styles.titleText}>{title || '여행기 컨텐츠 작성'}</Text>
          <Text style={styles.subtitleText}>여행 경험을 블록 단위로 작성해보세요</Text>
        </View>

        {/* 블록 목록 */}
        {blocks.map(renderBlock)}

        {/* 블록 추가 버튼들 */}
        <View style={styles.addButtonsContainer}>
          <TouchableOpacity style={styles.addButton} onPress={addTextBlock}>
            <Ionicons name="text-outline" size={20} color="#FF6B35" />
            <Text style={styles.addButtonText}>텍스트 블록 추가</Text>
          </TouchableOpacity>
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
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  saveButtonTextDisabled: {
    opacity: 0.6,
  },
  content: {
    flex: 1,
  },
  titleSection: {
    padding: 20,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  titleText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  subtitleText: {
    fontSize: 14,
    color: '#666',
  },
  blockContainer: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
    overflow: 'hidden',
  },
  blockHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  blockTypeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  blockActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    padding: 4,
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#333',
    minHeight: 120,
    textAlignVertical: 'top',
  },
  imageBlockContainer: {
    padding: 16,
  },
  blockImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
    marginBottom: 12,
  },
  captionInput: {
    borderWidth: 1,
    borderColor: '#E1E8ED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    color: '#333',
    backgroundColor: '#FFFFFF',
  },
  imagePlaceholder: {
    height: 200,
    backgroundColor: '#F8F9FA',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E1E8ED',
    borderStyle: 'dashed',
    borderRadius: 8,
  },
  imagePlaceholderText: {
    fontSize: 16,
    color: '#BDC3C7',
    marginTop: 8,
  },
  addButtonsContainer: {
    padding: 16,
    gap: 12,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    backgroundColor: '#FFF5F2',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FF6B35',
    borderStyle: 'dashed',
  },
  addButtonText: {
    fontSize: 16,
    color: '#FF6B35',
    fontWeight: '500',
    marginLeft: 8,
  },
  bottomSpacer: {
    height: 100,
  },
});

export default TravelDiaryContentEditScreen;
