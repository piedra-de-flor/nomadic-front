import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { sharePlan, getPlanSharedMembers } from '../../services/plan/planShareService';
import { PlanShareResponseDto, ShareRole, ShareStatus } from '../../types';

interface PlanShareViewScreenProps {
  navigation: any;
  route: any;
}

const PlanShareViewScreen = ({ navigation, route }: PlanShareViewScreenProps) => {
  const { planId } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  
  // 상태 관리
  const [sharedMembers, setSharedMembers] = useState<PlanShareResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  
  // 새 공유 관련 상태
  const [showShareModal, setShowShareModal] = useState<boolean>(false);
  const [emailInput, setEmailInput] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<ShareRole>(ShareRole.VIEWER);
  const [isSharing, setIsSharing] = useState<boolean>(false);

  // 공유 멤버 목록 로드
  const loadSharedMembers = useCallback(async () => {
    if (!user?.email) {
      console.log('⚠️ 로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 공유 멤버 로드 시작:', { planId, email: user.email });
      
      const response = await getPlanSharedMembers(planId, user.email);
      console.log('✅ 공유 멤버 로드 성공:', response);
      
      setSharedMembers(response);
    } catch (error) {
      console.error('❌ 공유 멤버 로드 실패:', error);
      Alert.alert('오류', '공유 멤버 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [planId, user?.email]);

  // 새로고침
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadSharedMembers();
  }, [loadSharedMembers]);

  // 계획 공유
  const handleSharePlan = async () => {
    if (!emailInput.trim()) {
      Alert.alert('알림', '이메일을 입력해주세요.');
      return;
    }

    if (!user?.email) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    setIsSharing(true);
    try {
      console.log('🔄 계획 공유 시작:', { planId, emailInput, selectedRole });
      
      await sharePlan({
        planId,
        sharedMemberEmail: emailInput.trim(),
        role: selectedRole,
      }, user.email);

      Alert.alert('성공', '계획이 성공적으로 공유되었습니다.');
      setShowShareModal(false);
      setEmailInput('');
      setSelectedRole(ShareRole.VIEWER);
      
      // 공유 멤버 목록 새로고침
      loadSharedMembers();
    } catch (error) {
      console.error('❌ 계획 공유 실패:', error);
      Alert.alert('오류', '계획 공유에 실패했습니다.');
    } finally {
      setIsSharing(false);
    }
  };

  // 초기 로드
  useEffect(() => {
    loadSharedMembers();
  }, [loadSharedMembers]);

  // 상태별 색상
  const getStatusColor = (status: ShareStatus) => {
    switch (status) {
      case ShareStatus.ACCEPTED:
        return UI_CONFIG.COLORS.SUCCESS;
      case ShareStatus.PENDING:
        return UI_CONFIG.COLORS.WARNING;
      case ShareStatus.REJECTED:
        return UI_CONFIG.COLORS.ERROR;
      case ShareStatus.CANCELLED:
        return UI_CONFIG.COLORS.TEXT_SECONDARY;
      default:
        return UI_CONFIG.COLORS.TEXT_SECONDARY;
    }
  };

  // 상태별 텍스트
  const getStatusText = (status: ShareStatus) => {
    switch (status) {
      case ShareStatus.ACCEPTED:
        return '수락됨';
      case ShareStatus.PENDING:
        return '대기중';
      case ShareStatus.REJECTED:
        return '거부됨';
      case ShareStatus.CANCELLED:
        return '취소됨';
      default:
        return status;
    }
  };

  // 역할별 텍스트
  const getRoleText = (role: ShareRole) => {
    switch (role) {
      case ShareRole.EDITOR:
        return '편집자';
      case ShareRole.VIEWER:
        return '조회자';
      default:
        return role;
    }
  };

  // 날짜 포맷팅
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 공유 멤버 아이템 렌더링
  const renderSharedMember = (member: PlanShareResponseDto) => (
    <View key={member.shareId} style={styles.memberCard}>
      <View style={styles.memberCardHeader}>
        <View style={styles.memberAvatar}>
          <Text style={styles.memberAvatarText}>
            {member.memberName.charAt(0)}
          </Text>
        </View>
        <View style={styles.memberInfo}>
          <Text style={styles.memberName}>{member.memberName}</Text>
          <Text style={styles.memberEmail}>{member.memberEmail}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(member.status) }]}>
          <Text style={styles.statusBadgeText}>
            {getStatusText(member.status)}
          </Text>
        </View>
      </View>
      
      <View style={styles.memberCardBody}>
        <View style={styles.roleContainer}>
          <Ionicons 
            name={member.role === ShareRole.EDITOR ? "create-outline" : "eye-outline"} 
            size={16} 
            color={UI_CONFIG.COLORS.PRIMARY} 
          />
          <Text style={styles.roleText}>
            {getRoleText(member.role)}
          </Text>
        </View>
        
        <View style={styles.dateContainer}>
          <Ionicons name="time-outline" size={14} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
          <Text style={styles.dateText}>
            {formatDate(member.sharedAt)}
          </Text>
        </View>
      </View>
    </View>
  );

  // 공유 모달 렌더링
  const renderShareModal = () => (
    <Modal
      visible={showShareModal}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <TouchableOpacity
            onPress={() => setShowShareModal(false)}
            style={styles.modalCloseButton}
          >
            <Ionicons name="close" size={24} color={UI_CONFIG.COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.modalTitle}>계획 공유</Text>
          <View style={styles.modalHeaderRight} />
        </View>

        <ScrollView style={styles.modalContent}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>이메일</Text>
            <TextInput
              style={styles.textInput}
              placeholder="공유할 사용자의 이메일을 입력하세요"
              value={emailInput}
              onChangeText={setEmailInput}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>권한</Text>
            <View style={styles.roleSelector}>
              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === ShareRole.VIEWER && styles.roleButtonSelected
                ]}
                onPress={() => setSelectedRole(ShareRole.VIEWER)}
              >
                <Ionicons
                  name="eye-outline"
                  size={20}
                  color={selectedRole === ShareRole.VIEWER ? UI_CONFIG.COLORS.TEXT_WHITE : UI_CONFIG.COLORS.TEXT_SECONDARY}
                />
                <Text style={[
                  styles.roleButtonText,
                  selectedRole === ShareRole.VIEWER && styles.roleButtonTextSelected
                ]}>
                  조회자
                </Text>
                <Text style={[
                  styles.roleButtonDescription,
                  selectedRole === ShareRole.VIEWER && styles.roleButtonDescriptionSelected
                ]}>
                  계획을 볼 수만 있습니다
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.roleButton,
                  selectedRole === ShareRole.EDITOR && styles.roleButtonSelected
                ]}
                onPress={() => setSelectedRole(ShareRole.EDITOR)}
              >
                <Ionicons
                  name="create-outline"
                  size={20}
                  color={selectedRole === ShareRole.EDITOR ? UI_CONFIG.COLORS.TEXT_WHITE : UI_CONFIG.COLORS.TEXT_SECONDARY}
                />
                <Text style={[
                  styles.roleButtonText,
                  selectedRole === ShareRole.EDITOR && styles.roleButtonTextSelected
                ]}>
                  편집자
                </Text>
                <Text style={[
                  styles.roleButtonDescription,
                  selectedRole === ShareRole.EDITOR && styles.roleButtonDescriptionSelected
                ]}>
                  계획을 수정할 수 있습니다
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>

        <View style={styles.modalFooter}>
          <TouchableOpacity
            style={[styles.shareButton, isSharing && styles.shareButtonDisabled]}
            onPress={handleSharePlan}
            disabled={isSharing}
          >
            {isSharing ? (
              <ActivityIndicator size="small" color={UI_CONFIG.COLORS.TEXT_WHITE} />
            ) : (
              <>
                <Ionicons name="share" size={20} color={UI_CONFIG.COLORS.TEXT_WHITE} />
                <Text style={styles.shareButtonText}>공유하기</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={UI_CONFIG.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계획 공유</Text>
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => setShowShareModal(true)}
        >
          <Ionicons name="person-add" size={24} color={UI_CONFIG.COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>

      {/* 콘텐츠 */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[UI_CONFIG.COLORS.PRIMARY]}
          />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={UI_CONFIG.COLORS.PRIMARY} />
            <Text style={styles.loadingText}>공유 멤버를 불러오는 중...</Text>
          </View>
        ) : (
          <View style={styles.membersList}>
            {sharedMembers.length > 0 ? (
              sharedMembers.map(renderSharedMember)
            ) : (
              <View style={styles.emptyContainer}>
                <Ionicons name="people-outline" size={48} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
                <Text style={styles.emptyText}>공유된 멤버가 없습니다</Text>
                <Text style={styles.emptySubtext}>
                  계획을 다른 사용자와 공유해보세요
                </Text>
                <TouchableOpacity
                  style={styles.emptyShareButton}
                  onPress={() => setShowShareModal(true)}
                >
                  <Ionicons name="person-add" size={20} color={UI_CONFIG.COLORS.TEXT_WHITE} />
                  <Text style={styles.emptyShareButtonText}>사용자 초대하기</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {renderShareModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingTop: UI_CONFIG.SPACING.MD,
    paddingBottom: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  backButton: {
    padding: UI_CONFIG.SPACING.SM,
  },
  headerTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  addButton: {
    padding: UI_CONFIG.SPACING.SM,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.XL,
  },
  loadingText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: UI_CONFIG.SPACING.MD,
  },
  membersList: {
    padding: UI_CONFIG.SPACING.MD,
  },
  memberCard: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    marginBottom: UI_CONFIG.SPACING.MD,
    ...UI_CONFIG.SHADOWS.MD,
  },
  memberCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.LG,
  },
  memberCardBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.LG,
    minHeight: 64,
  },
  memberAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: UI_CONFIG.SPACING.MD,
    ...UI_CONFIG.SHADOWS.SM,
  },
  memberAvatarText: {
    fontSize: UI_CONFIG.FONT_SIZES.XL,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
  memberInfo: {
    flex: 1,
  },
  memberName: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  memberEmail: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  statusBadge: {
    paddingHorizontal: UI_CONFIG.SPACING.SM,
    paddingVertical: 4,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
  },
  statusBadgeText: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
  roleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONFIG.SPACING.SM,
    paddingVertical: UI_CONFIG.SPACING.SM,
  },
  roleText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '500',
    color: UI_CONFIG.COLORS.PRIMARY,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: UI_CONFIG.SPACING.SM,
    paddingVertical: UI_CONFIG.SPACING.SM,
  },
  dateText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.XL,
  },
  emptyText: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginTop: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  emptySubtext: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  emptyShareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    paddingHorizontal: UI_CONFIG.SPACING.LG,
    paddingVertical: UI_CONFIG.SPACING.MD,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    gap: UI_CONFIG.SPACING.SM,
    ...UI_CONFIG.SHADOWS.SM,
  },
  emptyShareButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  modalCloseButton: {
    padding: UI_CONFIG.SPACING.SM,
  },
  modalTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  modalHeaderRight: {
    width: 40,
  },
  modalContent: {
    flex: 1,
    padding: UI_CONFIG.SPACING.MD,
  },
  inputGroup: {
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  inputLabel: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  textInput: {
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER_LIGHT,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  roleSelector: {
    gap: UI_CONFIG.SPACING.SM,
  },
  roleButton: {
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER_LIGHT,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
  },
  roleButtonSelected: {
    borderColor: UI_CONFIG.COLORS.PRIMARY,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
  },
  roleButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginTop: UI_CONFIG.SPACING.XS,
  },
  roleButtonTextSelected: {
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
  roleButtonDescription: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginTop: 2,
  },
  roleButtonDescriptionSelected: {
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    opacity: 0.9,
  },
  modalFooter: {
    padding: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    paddingVertical: UI_CONFIG.SPACING.MD,
    gap: UI_CONFIG.SPACING.SM,
  },
  shareButtonDisabled: {
    opacity: 0.6,
  },
  shareButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
});

export default PlanShareViewScreen;