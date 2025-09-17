import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { deleteRecommendationReview } from '../../services/recommendation/recommendationService';

interface ReviewDeleteScreenProps {
  navigation: any;
  route: any;
}

const ReviewDeleteScreen: React.FC<ReviewDeleteScreenProps> = ({ navigation, route }) => {
  const { reviewId, reviewContent, placeName, reviewAuthor, onDeleteSuccess } = route.params || {};
  
  const [isDeleting, setIsDeleting] = useState(false);

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleDelete = async () => {
    Alert.alert(
      '댓글 삭제',
      '정말로 이 댓글을 삭제하시겠습니까?\n삭제된 댓글은 복구할 수 없습니다.',
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '삭제',
          style: 'destructive',
          onPress: confirmDelete,
        },
      ]
    );
  };

  const confirmDelete = async () => {
    setIsDeleting(true);

    try {
      await deleteRecommendationReview(reviewId);

      Alert.alert(
        '삭제 완료',
        '댓글이 성공적으로 삭제되었습니다.',
        [
          {
            text: '확인',
            onPress: () => {
              // 콜백 함수가 있으면 호출
              if (onDeleteSuccess && typeof onDeleteSuccess === 'function') {
                onDeleteSuccess();
              }
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      console.error('❌ 댓글 삭제 실패:', error);
      Alert.alert('오류', '댓글 삭제 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>댓글 삭제</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 내용 */}
      <View style={styles.content}>
        {/* 삭제 대상 정보 */}
        <View style={styles.targetSection}>
          <Text style={styles.sectionTitle}>삭제할 댓글</Text>
          <View style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <Ionicons name="location" size={20} color="#FF6B35" />
              <Text style={styles.placeName}>{placeName || '장소명'}</Text>
            </View>
            <View style={styles.reviewContent}>
              <Text style={styles.reviewLabel}>댓글 내용:</Text>
              <Text style={styles.reviewText} numberOfLines={4}>
                {reviewContent || '댓글 내용이 여기에 표시됩니다...'}
              </Text>
              {reviewAuthor && (
                <Text style={styles.reviewAuthor}>작성자: {reviewAuthor}</Text>
              )}
            </View>
          </View>
        </View>

        {/* 경고 메시지 */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={24} color="#E74C3C" />
            <Text style={styles.warningTitle}>삭제 시 주의사항</Text>
          </View>
          <Text style={styles.warningText}>
            • 삭제된 댓글은 복구할 수 없습니다.{'\n'}
            • 이 댓글에 달린 답글도 함께 삭제됩니다.{'\n'}
            • 삭제 후에는 다른 사용자에게 보이지 않습니다.{'\n'}
            • 삭제 작업은 되돌릴 수 없습니다.
          </Text>
        </View>

        {/* 삭제 버튼 */}
        <View style={styles.buttonSection}>
          <TouchableOpacity
            style={[
              styles.deleteButton,
              isDeleting && styles.disabledButton,
            ]}
            onPress={handleDelete}
            disabled={isDeleting}
          >
            <Ionicons 
              name="trash-outline" 
              size={20} 
              color={isDeleting ? "#9CA3AF" : "#FFFFFF"} 
            />
            <Text style={[
              styles.deleteButtonText,
              isDeleting && styles.disabledButtonText,
            ]}>
              {isDeleting ? '삭제 중...' : '댓글 삭제'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
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
    marginBottom: 12,
  },
  placeName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 8,
  },
  reviewContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
  },
  reviewLabel: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  reviewText: {
    fontSize: 14,
    color: '#333',
    lineHeight: 20,
  },
  reviewAuthor: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    fontStyle: 'italic',
  },
  warningSection: {
    backgroundColor: '#FEF2F2',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#E74C3C',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#E74C3C',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  buttonSection: {
    marginBottom: 30,
  },
  deleteButton: {
    backgroundColor: '#E74C3C',
    borderRadius: 12,
    paddingVertical: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#D1D5DB',
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  disabledButtonText: {
    color: '#9CA3AF',
  },
});

export default ReviewDeleteScreen;

