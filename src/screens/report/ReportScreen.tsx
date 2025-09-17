import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { reportReview } from '../../services/recommendation/recommendationService';
import { ReportingReason, ReportRequestDto } from '../../types';

interface ReportReason {
  id: string;
  label: string;
  description: string;
}

const ReportScreen = ({ navigation, route }: any) => {
  const { reviewId, reviewContent, placeName, reviewAuthor } = route.params || {};
  
  const handleBackPress = () => {
    // 이전 화면으로 돌아가기 (추천 상세 페이지)
    navigation.goBack();
  };
  
  const [selectedReason, setSelectedReason] = useState<string>('');
  const [detailText, setDetailText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // 신고 사유 목록 (API의 ReportingReason enum 기반)
  const reportReasons: ReportReason[] = [
    {
      id: ReportingReason.SPAM,
      label: '스팸/홍보',
      description: '상업적 목적의 홍보나 스팸성 내용',
    },
    {
      id: ReportingReason.OFFENSIVE_LANGUAGE,
      label: '욕설/비방',
      description: '욕설, 비방, 혐오 표현 등 부적절한 언어',
    },
    {
      id: ReportingReason.HARASSMENT,
      label: '괴롭힘/협박',
      description: '다른 사용자를 괴롭히거나 협박하는 내용',
    },
    {
      id: ReportingReason.INAPPROPRIATE,
      label: '부적절한 내용',
      description: '성인 콘텐츠나 부적절한 내용',
    },
    {
      id: ReportingReason.FALSE_INFORMATION,
      label: '거짓 정보',
      description: '사실과 다른 잘못된 정보',
    },
    {
      id: ReportingReason.OTHER,
      label: '기타',
      description: '위 사유에 해당하지 않는 기타 사유',
    },
  ];

  const handleReasonSelect = (reasonId: string) => {
    setSelectedReason(reasonId);
  };

  const handleSubmit = async () => {
    if (!selectedReason) {
      Alert.alert('알림', '신고 사유를 선택해주세요.');
      return;
    }

    if (selectedReason === ReportingReason.OTHER && !detailText.trim()) {
      Alert.alert('알림', '기타 사유를 선택한 경우 상세 내용을 입력해주세요.');
      return;
    }

    if (!reviewId) {
      Alert.alert('오류', '신고할 리뷰 정보가 없습니다.');
      return;
    }

    setIsSubmitting(true);

    try {
      console.log('🚨 신고 요청 시작:', { reviewId, selectedReason, detailText });
      
      const reportRequest: ReportRequestDto = {
        reason: selectedReason as ReportingReason,
        detail: detailText.trim() || undefined
      };

      const response = await reportReview(reviewId, reportRequest);
      
      console.log('✅ 신고 성공:', response);
      
      setIsSubmitting(false);
      Alert.alert(
        '신고 완료',
        '신고가 접수되었습니다. 검토 후 조치하겠습니다.',
        [
          {
            text: '확인',
            onPress: handleBackPress,
          },
        ]
      );
    } catch (error) {
      console.error('❌ 신고 실패:', error);
      setIsSubmitting(false);
      Alert.alert('오류', '신고 접수 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>신고하기</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 신고 대상 정보 */}
        <View style={styles.reportTargetSection}>
          <Text style={styles.sectionTitle}>신고 대상</Text>
          <View style={styles.targetCard}>
            <View style={styles.targetHeader}>
              <Ionicons name="location" size={20} color="#FF6B35" />
              <Text style={styles.placeName}>{placeName || '장소명'}</Text>
            </View>
        <View style={styles.reviewContent}>
          <Text style={styles.reviewLabel}>리뷰 내용:</Text>
          <Text style={styles.reviewText} numberOfLines={3}>
            {reviewContent || '리뷰 내용이 여기에 표시됩니다...'}
          </Text>
          {reviewAuthor && (
            <Text style={styles.reviewAuthor}>작성자: {reviewAuthor}</Text>
          )}
        </View>
          </View>
        </View>

        {/* 신고 사유 선택 */}
        <View style={styles.reasonSection}>
          <Text style={styles.sectionTitle}>신고 사유</Text>
          <Text style={styles.sectionSubtitle}>해당하는 사유를 선택해주세요</Text>
          
          {reportReasons.map((reason) => (
            <TouchableOpacity
              key={reason.id}
              style={[
                styles.reasonCard,
                selectedReason === reason.id && styles.selectedReasonCard,
              ]}
              onPress={() => handleReasonSelect(reason.id)}
            >
              <View style={styles.reasonHeader}>
                <View style={[
                  styles.radioButton,
                  selectedReason === reason.id && styles.selectedRadioButton,
                ]}>
                  {selectedReason === reason.id && (
                    <View style={styles.radioButtonInner} />
                  )}
                </View>
                <Text style={[
                  styles.reasonLabel,
                  selectedReason === reason.id && styles.selectedReasonLabel,
                ]}>
                  {reason.label}
                </Text>
              </View>
              <Text style={styles.reasonDescription}>{reason.description}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* 상세 내용 입력 */}
        {selectedReason === ReportingReason.OTHER && (
          <View style={styles.detailSection}>
            <Text style={styles.sectionTitle}>상세 내용</Text>
            <Text style={styles.sectionSubtitle}>신고 사유를 자세히 설명해주세요</Text>
            <TextInput
              style={styles.detailInput}
              placeholder="신고 사유를 구체적으로 작성해주세요..."
              value={detailText}
              onChangeText={setDetailText}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={500}
            />
            <Text style={styles.characterCount}>{detailText.length}/500</Text>
          </View>
        )}

        {/* 주의사항 */}
        <View style={styles.warningSection}>
          <View style={styles.warningHeader}>
            <Ionicons name="warning" size={20} color="#F39C12" />
            <Text style={styles.warningTitle}>신고 시 주의사항</Text>
          </View>
          <Text style={styles.warningText}>
            • 허위 신고는 신고자에게 불이익을 줄 수 있습니다.{'\n'}
            • 신고된 내용은 검토 후 적절한 조치가 취해집니다.{'\n'}
            • 신고 접수 후 취소할 수 없습니다.
          </Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (!selectedReason || isSubmitting) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!selectedReason || isSubmitting}
        >
          <Text style={[
            styles.submitButtonText,
            (!selectedReason || isSubmitting) && styles.disabledButtonText,
          ]}>
            {isSubmitting ? '신고 접수 중...' : '신고하기'}
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
  reportTargetSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 16,
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
  reasonSection: {
    marginBottom: 30,
  },
  reasonCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  selectedReasonCard: {
    borderColor: '#FF6B35',
    backgroundColor: '#FFF5F2',
  },
  reasonHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadioButton: {
    borderColor: '#FF6B35',
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FF6B35',
  },
  reasonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  selectedReasonLabel: {
    color: '#FF6B35',
  },
  reasonDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 32,
  },
  detailSection: {
    marginBottom: 30,
  },
  detailInput: {
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
  warningSection: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 16,
    marginBottom: 30,
    borderLeftWidth: 4,
    borderLeftColor: '#F39C12',
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F39C12',
    marginLeft: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
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
});

export default ReportScreen;

