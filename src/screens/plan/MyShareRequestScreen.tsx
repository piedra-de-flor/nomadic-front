import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getPendingShares, acceptShare, rejectShare } from '../../services/plan/planShareService';
import { PlanShareResponseDto, ShareRole, ShareStatus } from '../../types';

interface MyShareRequestScreenProps {
  navigation: any;
  route: any;
}

const MyShareRequestScreen = ({ navigation }: MyShareRequestScreenProps) => {
  const { user } = useSelector((state: RootState) => state.auth);
  
  // 상태 관리
  const [pendingShares, setPendingShares] = useState<PlanShareResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [processingShareId, setProcessingShareId] = useState<number | null>(null);

  // 대기중인 공유 요청 로드
  const loadPendingShares = useCallback(async () => {
    if (!user?.email) {
      console.log('⚠️ 로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      console.log('🔄 대기중인 공유 요청 로드 시작:', { email: user.email });
      
      const response = await getPendingShares(user.email);
      console.log('✅ 대기중인 공유 요청 로드 성공:', response);
      
      setPendingShares(response);
    } catch (error) {
      console.error('❌ 대기중인 공유 요청 로드 실패:', error);
      Alert.alert('오류', '공유 요청 목록을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [user?.email]);

  // 새로고침
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadPendingShares();
  }, [loadPendingShares]);

  // 공유 요청 수락
  const handleAcceptShare = async (shareId: number, planName: string) => {
    if (!user?.email) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    Alert.alert(
      '공유 요청 수락',
      `"${planName}" 계획 공유를 수락하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '수락',
          onPress: async () => {
            setProcessingShareId(shareId);
            try {
              console.log('🔄 공유 요청 수락 시작:', { shareId, email: user.email });
              
              await acceptShare(shareId, user.email);
              
              Alert.alert('성공', '공유 요청을 수락했습니다.');
              
              // 목록 새로고침
              loadPendingShares();
            } catch (error) {
              console.error('❌ 공유 요청 수락 실패:', error);
              Alert.alert('오류', '공유 요청 수락에 실패했습니다.');
            } finally {
              setProcessingShareId(null);
            }
          }
        }
      ]
    );
  };

  // 공유 요청 거부
  const handleRejectShare = async (shareId: number, planName: string) => {
    if (!user?.email) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }

    Alert.alert(
      '공유 요청 거부',
      `"${planName}" 계획 공유를 거부하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '거부',
          style: 'destructive',
          onPress: async () => {
            setProcessingShareId(shareId);
            try {
              console.log('🔄 공유 요청 거부 시작:', { shareId, email: user.email });
              
              await rejectShare(shareId, user.email);
              
              Alert.alert('완료', '공유 요청을 거부했습니다.');
              
              // 목록 새로고침
              loadPendingShares();
            } catch (error) {
              console.error('❌ 공유 요청 거부 실패:', error);
              Alert.alert('오류', '공유 요청 거부에 실패했습니다.');
            } finally {
              setProcessingShareId(null);
            }
          }
        }
      ]
    );
  };

  // 초기 로드
  useEffect(() => {
    loadPendingShares();
  }, [loadPendingShares]);

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

  // 공유 요청 아이템 렌더링
  const renderShareRequest = (share: PlanShareResponseDto) => (
    <View key={share.shareId} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.planInfo}>
          <Text style={styles.planName}>{share.planName}</Text>
          <Text style={styles.requesterInfo}>
            {share.memberName}님이 공유를 요청했습니다
          </Text>
        </View>
        <View style={styles.statusBadge}>
          <Text style={styles.statusBadgeText}>대기중</Text>
        </View>
      </View>
      
      <View style={styles.requestDetails}>
        <View style={styles.detailRow}>
          <Ionicons name="person-outline" size={16} color={UI_CONFIG.COLORS.TEXT_SECONDARY} />
          <Text style={styles.detailText}>요청자: {share.memberName}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="mail-outline" size={16} color={UI_CONFIG.COLORS.TEXT_SECONDARY} />
          <Text style={styles.detailText}>{share.memberEmail}</Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons 
            name={share.role === ShareRole.EDITOR ? "create-outline" : "eye-outline"} 
            size={16} 
            color={UI_CONFIG.COLORS.PRIMARY} 
          />
          <Text style={styles.detailText}>
            권한: {getRoleText(share.role)}
          </Text>
        </View>
        
        <View style={styles.detailRow}>
          <Ionicons name="time-outline" size={16} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
          <Text style={styles.detailText}>
            요청일: {formatDate(share.sharedAt)}
          </Text>
        </View>
      </View>
      
      <View style={styles.requestActions}>
        <TouchableOpacity
          style={[styles.actionButton, styles.rejectButton]}
          onPress={() => handleRejectShare(share.shareId, share.planName)}
          disabled={processingShareId === share.shareId}
        >
          {processingShareId === share.shareId ? (
            <ActivityIndicator size="small" color={UI_CONFIG.COLORS.TEXT_WHITE} />
          ) : (
            <>
              <Ionicons name="close" size={18} color={UI_CONFIG.COLORS.TEXT_WHITE} />
              <Text style={styles.actionButtonText}>거부</Text>
            </>
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.acceptButton]}
          onPress={() => handleAcceptShare(share.shareId, share.planName)}
          disabled={processingShareId === share.shareId}
        >
          {processingShareId === share.shareId ? (
            <ActivityIndicator size="small" color={UI_CONFIG.COLORS.TEXT_WHITE} />
          ) : (
            <>
              <Ionicons name="checkmark" size={18} color={UI_CONFIG.COLORS.TEXT_WHITE} />
              <Text style={styles.actionButtonText}>수락</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
        <Text style={styles.headerTitle}>내 공유 요청</Text>
        <View style={styles.headerRight} />
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
            <Text style={styles.loadingText}>공유 요청을 불러오는 중...</Text>
          </View>
        ) : pendingShares.length > 0 ? (
          <View style={styles.requestsList}>
            {pendingShares.map(renderShareRequest)}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="mail-outline" size={64} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
            <Text style={styles.emptyText}>대기중인 공유 요청이 없습니다</Text>
            <Text style={styles.emptySubtext}>
              다른 사용자가 계획을 공유하면 여기에 표시됩니다
            </Text>
          </View>
        )}
      </ScrollView>
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
  headerRight: {
    width: 40,
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
  requestsList: {
    padding: UI_CONFIG.SPACING.MD,
  },
  requestCard: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    marginBottom: UI_CONFIG.SPACING.MD,
    ...UI_CONFIG.SHADOWS.MD,
    overflow: 'hidden',
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.MD,
  },
  planInfo: {
    flex: 1,
    marginRight: UI_CONFIG.SPACING.MD,
  },
  planName: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: 4,
  },
  requesterInfo: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  statusBadge: {
    backgroundColor: UI_CONFIG.COLORS.WARNING,
    paddingHorizontal: UI_CONFIG.SPACING.SM,
    paddingVertical: 4,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
  },
  statusBadgeText: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
  requestDetails: {
    paddingHorizontal: UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.MD,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.SM,
    gap: UI_CONFIG.SPACING.SM,
  },
  detailText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  requestActions: {
    flexDirection: 'row',
    padding: UI_CONFIG.SPACING.LG,
    paddingTop: UI_CONFIG.SPACING.MD,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
    gap: UI_CONFIG.SPACING.SM,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: UI_CONFIG.SPACING.MD,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    gap: UI_CONFIG.SPACING.SM,
  },
  rejectButton: {
    backgroundColor: UI_CONFIG.COLORS.ERROR,
  },
  acceptButton: {
    backgroundColor: UI_CONFIG.COLORS.SUCCESS,
  },
  actionButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_WHITE,
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
    marginTop: UI_CONFIG.SPACING.LG,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  emptySubtext: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MyShareRequestScreen;
