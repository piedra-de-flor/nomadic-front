import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface ShareRequest {
  id: number;
  planId: number;
  planTitle: string;
  requesterName: string;
  requesterEmail: string;
  requesterProfileImage?: string;
  status: 'PENDING' | 'ACCEPTED' | 'REJECTED';
  requestedAt: string;
  respondedAt?: string;
  role: 'EDITOR' | 'VIEWER';
}

const PlanShareRequestScreen = ({ navigation }: any) => {
  // 상태 관리
  const [shareRequests, setShareRequests] = useState<ShareRequest[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'accepted' | 'rejected'>('pending');

  useEffect(() => {
    loadShareRequests();
  }, []);

  const loadShareRequests = async () => {
    try {
      // TODO: API 호출
      // const response = await planService.getShareRequests();
      // setShareRequests(response.data);
      
      // 임시로 목 데이터 사용
      setTimeout(() => {
        setShareRequests([
          {
            id: 1,
            planId: 1,
            planTitle: '제주도 힐링 여행',
            requesterName: '김철수',
            requesterEmail: 'kim@example.com',
            requesterProfileImage: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150',
            status: 'PENDING',
            requestedAt: '2024-12-20',
            role: 'EDITOR',
          },
          {
            id: 2,
            planId: 2,
            planTitle: '부산 맛집 투어',
            requesterName: '이영희',
            requesterEmail: 'lee@example.com',
            requesterProfileImage: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150',
            status: 'PENDING',
            requestedAt: '2024-12-19',
            role: 'VIEWER',
          },
          {
            id: 3,
            planId: 3,
            planTitle: '강릉 바다 여행',
            requesterName: '박민수',
            requesterEmail: 'park@example.com',
            status: 'ACCEPTED',
            requestedAt: '2024-12-18',
            respondedAt: '2024-12-18',
            role: 'VIEWER',
          },
          {
            id: 4,
            planId: 4,
            planTitle: '서울 문화 체험',
            requesterName: '정수진',
            requesterEmail: 'jung@example.com',
            status: 'REJECTED',
            requestedAt: '2024-12-17',
            respondedAt: '2024-12-17',
            role: 'EDITOR',
          },
        ]);
        setIsLoading(false);
      }, 1000);
    } catch (error) {
      console.error('공유 요청 목록 로드 실패:', error);
      setIsLoading(false);
      Alert.alert('오류', '공유 요청 목록을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleAcceptRequest = (requestId: number, requesterName: string) => {
    Alert.alert(
      '공유 요청 수락',
      `${requesterName}님의 공유 요청을 수락하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '수락',
          onPress: async () => {
            try {
              // TODO: API 호출
              // await planService.acceptShareRequest(requestId);
              
              setShareRequests(prev => 
                prev.map(request => 
                  request.id === requestId 
                    ? { ...request, status: 'ACCEPTED', respondedAt: new Date().toISOString().split('T')[0] }
                    : request
                )
              );
              
              Alert.alert('성공', '공유 요청을 수락했습니다.');
            } catch (error) {
              console.error('공유 요청 수락 실패:', error);
              Alert.alert('오류', '공유 요청 수락 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const handleRejectRequest = (requestId: number, requesterName: string) => {
    Alert.alert(
      '공유 요청 거절',
      `${requesterName}님의 공유 요청을 거절하시겠습니까?`,
      [
        {
          text: '취소',
          style: 'cancel',
        },
        {
          text: '거절',
          style: 'destructive',
          onPress: async () => {
            try {
              // TODO: API 호출
              // await planService.rejectShareRequest(requestId);
              
              setShareRequests(prev => 
                prev.map(request => 
                  request.id === requestId 
                    ? { ...request, status: 'REJECTED', respondedAt: new Date().toISOString().split('T')[0] }
                    : request
                )
              );
              
              Alert.alert('성공', '공유 요청을 거절했습니다.');
            } catch (error) {
              console.error('공유 요청 거절 실패:', error);
              Alert.alert('오류', '공유 요청 거절 중 오류가 발생했습니다.');
            }
          },
        },
      ]
    );
  };

  const getStatusText = (status: string) => {
    const statusMap = {
      'PENDING': '대기중',
      'ACCEPTED': '수락됨',
      'REJECTED': '거절됨'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  };

  const getStatusColor = (status: string) => {
    const colorMap = {
      'PENDING': '#F39C12',
      'ACCEPTED': '#27AE60',
      'REJECTED': '#E74C3C'
    };
    return colorMap[status as keyof typeof colorMap] || '#95A5A6';
  };

  const getRoleText = (role: string) => {
    const roleMap = {
      'EDITOR': '편집자',
      'VIEWER': '조회자'
    };
    return roleMap[role as keyof typeof roleMap] || role;
  };

  const getFilteredRequests = () => {
    return shareRequests.filter(request => {
      switch (activeTab) {
        case 'pending':
          return request.status === 'PENDING';
        case 'accepted':
          return request.status === 'ACCEPTED';
        case 'rejected':
          return request.status === 'REJECTED';
        default:
          return false;
      }
    });
  };

  const renderRequestItem = (request: ShareRequest) => (
    <View key={request.id} style={styles.requestCard}>
      <View style={styles.requestHeader}>
        <View style={styles.requesterInfo}>
          <View style={styles.avatarContainer}>
            <Text style={styles.avatarText}>{request.requesterName.charAt(0)}</Text>
          </View>
          <View style={styles.requesterDetails}>
            <Text style={styles.requesterName}>{request.requesterName}</Text>
            <Text style={styles.requesterEmail}>{request.requesterEmail}</Text>
          </View>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) }]}>
          <Text style={styles.statusText}>{getStatusText(request.status)}</Text>
        </View>
      </View>
      
      <View style={styles.requestContent}>
        <Text style={styles.planTitle}>{request.planTitle}</Text>
        <View style={styles.requestMeta}>
          <View style={styles.metaItem}>
            <Ionicons name="person-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{getRoleText(request.role)} 권한 요청</Text>
          </View>
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.metaText}>{request.requestedAt}</Text>
          </View>
        </View>
      </View>
      
      {request.status === 'PENDING' && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton]}
            onPress={() => handleRejectRequest(request.id, request.requesterName)}
          >
            <Ionicons name="close" size={16} color="#E74C3C" />
            <Text style={styles.rejectButtonText}>거절</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionButton, styles.acceptButton]}
            onPress={() => handleAcceptRequest(request.id, request.requesterName)}
          >
            <Ionicons name="checkmark" size={16} color="#27AE60" />
            <Text style={styles.acceptButtonText}>수락</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {request.status !== 'PENDING' && request.respondedAt && (
        <View style={styles.respondedInfo}>
          <Text style={styles.respondedText}>
            {request.status === 'ACCEPTED' ? '수락' : '거절'}됨 - {request.respondedAt}
          </Text>
        </View>
      )}
    </View>
  );

  const renderTabContent = () => {
    const filteredRequests = getFilteredRequests();
    
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>로딩 중...</Text>
        </View>
      );
    }

    if (filteredRequests.length === 0) {
      return (
        <View style={styles.emptyState}>
          <Ionicons 
            name={
              activeTab === 'pending' ? 'time-outline' :
              activeTab === 'accepted' ? 'checkmark-circle-outline' : 'close-circle-outline'
            } 
            size={48} 
            color="#BDC3C7" 
          />
          <Text style={styles.emptyStateTitle}>
            {activeTab === 'pending' ? '대기중인 요청이 없습니다' :
             activeTab === 'accepted' ? '수락된 요청이 없습니다' : '거절된 요청이 없습니다'}
          </Text>
          <Text style={styles.emptyStateSubtitle}>
            {activeTab === 'pending' ? '새로운 공유 요청이 오면 여기에 표시됩니다' :
             activeTab === 'accepted' ? '수락된 공유 요청이 여기에 표시됩니다' : '거절된 공유 요청이 여기에 표시됩니다'}
          </Text>
        </View>
      );
    }

    return (
      <ScrollView showsVerticalScrollIndicator={false}>
        {filteredRequests.map(renderRequestItem)}
      </ScrollView>
    );
  };

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>내 공유 요청</Text>
        <View style={styles.placeholder} />
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.activeTab]}
          onPress={() => setActiveTab('pending')}
        >
          <Ionicons 
            name="time-outline" 
            size={20} 
            color={activeTab === 'pending' ? '#FF6B35' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'pending' && styles.activeTabText]}>
            대기중 ({shareRequests.filter(r => r.status === 'PENDING').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'accepted' && styles.activeTab]}
          onPress={() => setActiveTab('accepted')}
        >
          <Ionicons 
            name="checkmark-circle-outline" 
            size={20} 
            color={activeTab === 'accepted' ? '#FF6B35' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'accepted' && styles.activeTabText]}>
            수락됨 ({shareRequests.filter(r => r.status === 'ACCEPTED').length})
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'rejected' && styles.activeTab]}
          onPress={() => setActiveTab('rejected')}
        >
          <Ionicons 
            name="close-circle-outline" 
            size={20} 
            color={activeTab === 'rejected' ? '#FF6B35' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === 'rejected' && styles.activeTabText]}>
            거절됨 ({shareRequests.filter(r => r.status === 'REJECTED').length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* 탭 콘텐츠 */}
      <View style={styles.content}>
        {renderTabContent()}
      </View>
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
  placeholder: {
    width: 32,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 6,
    textAlign: 'center',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginHorizontal: 20,
    marginVertical: 8,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  requesterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  avatarText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  requesterDetails: {
    flex: 1,
  },
  requesterName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  requesterEmail: {
    fontSize: 14,
    color: '#666',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  requestContent: {
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  requestMeta: {
    flexDirection: 'row',
    gap: 16,
  },
  metaItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metaText: {
    fontSize: 12,
    color: '#666',
    marginLeft: 4,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  acceptButton: {
    backgroundColor: '#F8FFF8',
    borderColor: '#27AE60',
  },
  rejectButton: {
    backgroundColor: '#FFF8F8',
    borderColor: '#E74C3C',
  },
  acceptButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#27AE60',
    marginLeft: 4,
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
    marginLeft: 4,
  },
  respondedInfo: {
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  respondedText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PlanShareRequestScreen;