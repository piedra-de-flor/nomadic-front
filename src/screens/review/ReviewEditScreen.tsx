import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { updateRecommendationReview } from '../../services/recommendation/recommendationService';

interface ReviewEditScreenProps {
  navigation: any;
  route: any;
}

const ReviewEditScreen: React.FC<ReviewEditScreenProps> = ({ navigation, route }) => {
  const { reviewId, reviewContent, placeName, reviewAuthor, onEditSuccess } = route.params || {};
  
  const [content, setContent] = useState(reviewContent || '');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    if (!content.trim()) {
      Alert.alert('알림', '댓글 내용을 입력해주세요.');
      return;
    }

    if (content.trim() === reviewContent) {
      Alert.alert('알림', '변경된 내용이 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      await updateRecommendationReview({
        reviewId: reviewId,
        content: content.trim(),
      });

      Alert.alert(
        '수정 완료',
        '댓글이 성공적으로 수정되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 콜백 함수가 있으면 호출
              if (onEditSuccess && typeof onEditSuccess === 'function') {
                onEditSuccess();
              }
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ 댓글 수정 실패:', error);
      Alert.alert('오류', '댓글 수정 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>댓글 수정</Text>
        <TouchableOpacity 
          onPress={handleSave}
          disabled={isSubmitting || !content.trim()}
          style={[
            styles.saveButton,
            (!content.trim() || isSubmitting) && styles.disabledButton
          ]}
        >
          <Text style={[
            styles.saveButtonText,
            (!content.trim() || isSubmitting) && styles.disabledButtonText
          ]}>
            {isSubmitting ? '저장 중...' : '저장'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 내용 */}
      <View style={styles.content}>
        {/* 신고 대상 정보 */}
        <View style={styles.targetSection}>
          <Text style={styles.sectionTitle}>수정할 댓글</Text>
          <View style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <Ionicons name="location" size={20} color="#FF6B35" />
              <Text style={styles.placeName}>{placeName || '장소명'}</Text>
            </View>
            {reviewAuthor && (
              <Text style={styles.reviewAuthor}>작성자: {reviewAuthor}</Text>
            )}
          </View>
        </View>

        {/* 댓글 내용 입력 */}
        <View style={styles.editSection}>
          <Text style={styles.sectionTitle}>댓글 내용</Text>
          <TextInput
            style={styles.contentInput}
            placeholder="댓글 내용을 입력해주세요..."
            value={content}
            onChangeText={setContent}
            multiline
            numberOfLines={6}
            textAlignVertical="top"
            maxLength={1000}
            autoFocus
          />
          <Text style={styles.characterCount}>{content.length}/1000</Text>
        </View>

        {/* 주의사항 */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="information-circle" size={20} color="#3498DB" />
            <Text style={styles.warningTitle}>수정 시 주의사항</Text>
          </View>
          <Text style={styles.warningText}>
            • 댓글 수정 시 이전 내용은 복구할 수 없습니다.{'\n'}
            • 부적절한 내용은 신고될 수 있습니다.{'\n'}
            • 수정된 댓글은 다른 사용자에게 즉시 반영됩니다.
          </Text>
        </View>
      </View>
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
  saveButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  saveButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  targetSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  targetCard: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  targetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  reviewAuthor: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
  },
  editSection: {
    marginBottom: 30,
  },
  contentInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    minHeight: 120,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
  },
  warningSection: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#3498DB',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3498DB',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
});

export default ReviewEditScreen;

