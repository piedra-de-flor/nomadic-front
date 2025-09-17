import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  FlatList,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface User {
  id: number;
  name: string;
  email: string;
  profileImage?: string;
  isFriend: boolean;
  isAlreadyShared: boolean;
}

interface PlanInfo {
  id: number;
  title: string;
  place: string;
  startDay: string;
  endDay: string;
}

interface ShareRequest {
  userId: number;
  role: 'editor' | 'viewer';
  message?: string;
}

const PlanShareScreen = ({ navigation, route }: any) => {
  const { planId } = route.params || {};
  
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedRole, setSelectedRole] = useState<'editor' | 'viewer'>('viewer');
  const [shareMessage, setShareMessage] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showRoleModal, setShowRoleModal] = useState<boolean>(false);

  // 임시 데이터
  const mockPlanInfo: PlanInfo = {
    id: planId || 1,
    title: '제주도 가족여행',
    place: '제주특별자치도',
    startDay: '2024-12-25',
    endDay: '2024-12-28',
  };

  const mockUsers: User[] = [
    {
      id: 1,
      name: '김친구',
      email: 'friend1@example.com',
      isFriend: true,
      isAlreadyShared: false,
    },
    {
      id: 2,
      name: '이커플',
      email: 'couple@example.com',
      isFriend: true,
      isAlreadyShared: true,
    },
    {
      id: 3,
      name: '박가족',
      email: 'family@example.com',
      isFriend: true,
      isAlreadyShared: false,
    },
    {
      id: 4,
      name: '최혼자',
      email: 'solo@example.com',
      isFriend: false,
      isAlreadyShared: false,
    },
    {
      id: 5,
      name: '정여행러',
      email: 'traveler@example.com',
      isFriend: true,
      isAlreadyShared: false,
    },
    {
      id: 6,
      name: '한동료',
      email: 'colleague@example.com',
      isFriend: false,
      isAlreadyShared: false,
    },
  ];

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      // TODO: API 호출
      // const [planResponse, usersResponse] = await Promise.all([
      //   planService.getPlanInfo(planId),
      //   userService.getShareableUsers(planId)
      // ]);
      
      // 임시로 목 데이터 사용
      setTimeout(() => {
        setPlanInfo(mockPlanInfo);
        setUsers(mockUsers);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('오류', '데이터를 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleUserSelect = (userId: number) => {
    setSelectedUsers(prev => {
      if (prev.includes(userId)) {
        return prev.filter(id => id !== userId);
      } else {
        return [...prev, userId];
      }
    });
  };

  const handleRoleSelect = (role: 'editor' | 'viewer') => {
    setSelectedRole(role);
    setShowRoleModal(false);
  };

  const handleSubmit = async () => {
    if (selectedUsers.length === 0) {
      Alert.alert('알림', '공유할 사용자를 선택해주세요.');
      return;
    }

    setIsSubmitting(true);

    try {
      const shareRequests: ShareRequest[] = selectedUsers.map(userId => ({
        userId,
        role: selectedRole,
        message: shareMessage.trim() || undefined,
      }));

      // TODO: API 호출
      // await planService.sharePlan(planId, shareRequests);

      // 임시로 성공 처리
      setTimeout(() => {
        setIsSubmitting(false);
        Alert.alert(
          '공유 완료',
          `${selectedUsers.length}명에게 계획 공유 요청을 보냈습니다.`,
          [
            {
              text: '확인',
              onPress: () => navigation.goBack(),
            },
          ]
        );
      }, 1000);
    } catch (error) {
      setIsSubmitting(false);
      Alert.alert('오류', '계획 공유 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'editor':
        return 'create';
      case 'viewer':
        return 'eye';
      default:
        return 'person';
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'editor':
        return '#4A90E2';
      case 'viewer':
        return '#7F8C8D';
      default:
        return '#7F8C8D';
    }
  };

  const getRoleLabel = (role: string) => {
    switch (role) {
      case 'editor':
        return '편집자';
      case 'viewer':
        return '조회자';
      default:
        return '사용자';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         user.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch && !user.isAlreadyShared;
  });

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>사용자 목록을 불러오는 중...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>계획 공유</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* 계획 정보 */}
        <View style={styles.planInfoSection}>
          <Text style={styles.sectionTitle}>공유할 계획</Text>
          <View style={styles.planCard}>
            <View style={styles.planHeader}>
              <Ionicons name="calendar" size={20} color="#FF6B35" />
              <Text style={styles.planTitle}>{planInfo?.title}</Text>
            </View>
            <View style={styles.planDetails}>
              <View style={styles.planRow}>
                <Ionicons name="location" size={16} color="#666" />
                <Text style={styles.planText}>{planInfo?.place}</Text>
              </View>
              <View style={styles.planRow}>
                <Ionicons name="time" size={16} color="#666" />
                <Text style={styles.planText}>
                  {formatDate(planInfo?.startDay || '')} - {formatDate(planInfo?.endDay || '')}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* 권한 선택 */}
        <View style={styles.roleSection}>
          <Text style={styles.sectionTitle}>공유 권한</Text>
          <TouchableOpacity
            style={styles.roleButton}
            onPress={() => setShowRoleModal(true)}
          >
            <View style={styles.roleInfo}>
              <Ionicons
                name={getRoleIcon(selectedRole) as any}
                size={20}
                color={getRoleColor(selectedRole)}
              />
              <Text style={styles.roleLabel}>{getRoleLabel(selectedRole)}</Text>
            </View>
            <Text style={styles.roleDescription}>
              {selectedRole === 'editor' 
                ? '계획을 수정하고 세부 계획을 추가할 수 있습니다'
                : '계획을 조회만 할 수 있습니다'
              }
            </Text>
            <Ionicons name="chevron-forward" size={20} color="#7F8C8D" />
          </TouchableOpacity>
        </View>

        {/* 사용자 검색 */}
        <View style={styles.searchSection}>
          <Text style={styles.sectionTitle}>사용자 선택</Text>
          <View style={styles.searchContainer}>
            <Ionicons name="search" size={20} color="#7F8C8D" />
            <TextInput
              style={styles.searchInput}
              placeholder="이름이나 이메일로 검색..."
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* 선택된 사용자 */}
        {selectedUsers.length > 0 && (
          <View style={styles.selectedSection}>
            <Text style={styles.sectionTitle}>선택된 사용자 ({selectedUsers.length}명)</Text>
            <View style={styles.selectedUsersList}>
              {selectedUsers.map(userId => {
                const user = users.find(u => u.id === userId);
                if (!user) return null;
                return (
                  <View key={userId} style={styles.selectedUserItem}>
                    <View style={styles.selectedUserInfo}>
                      <View style={styles.userAvatar}>
                        <Text style={styles.userAvatarText}>
                          {user.name.charAt(0)}
                        </Text>
                      </View>
                      <View>
                        <Text style={styles.selectedUserName}>{user.name}</Text>
                        <Text style={styles.selectedUserEmail}>{user.email}</Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleUserSelect(userId)}
                      style={styles.removeButton}
                    >
                      <Ionicons name="close-circle" size={24} color="#E74C3C" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          </View>
        )}

        {/* 사용자 목록 */}
        <View style={styles.usersSection}>
          <Text style={styles.sectionTitle}>사용자 목록</Text>
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>
                {searchQuery ? '검색 결과가 없습니다' : '공유 가능한 사용자가 없습니다'}
              </Text>
            </View>
          ) : (
            filteredUsers.map((user) => (
              <TouchableOpacity
                key={user.id}
                style={[
                  styles.userCard,
                  selectedUsers.includes(user.id) && styles.selectedUserCard,
                ]}
                onPress={() => handleUserSelect(user.id)}
                activeOpacity={0.7}
              >
                <View style={styles.userInfo}>
                  <View style={styles.userAvatar}>
                    <Text style={styles.userAvatarText}>
                      {user.name.charAt(0)}
                    </Text>
                  </View>
                  <View style={styles.userDetails}>
                    <View style={styles.userNameRow}>
                      <Text style={styles.userName}>{user.name}</Text>
                      {user.isFriend && (
                        <View style={styles.friendBadge}>
                          <Ionicons name="heart" size={12} color="#E74C3C" />
                          <Text style={styles.friendText}>친구</Text>
                        </View>
                      )}
                    </View>
                    <Text style={styles.userEmail}>{user.email}</Text>
                  </View>
                </View>
                {selectedUsers.includes(user.id) && (
                  <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* 공유 메시지 */}
        <View style={styles.messageSection}>
          <Text style={styles.sectionTitle}>공유 메시지 (선택사항)</Text>
          <TextInput
            style={styles.messageInput}
            placeholder="공유할 때 함께 보낼 메시지를 입력해주세요..."
            value={shareMessage}
            onChangeText={setShareMessage}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
            maxLength={200}
          />
          <Text style={styles.characterCount}>{shareMessage.length}/200</Text>
        </View>
      </ScrollView>

      {/* 하단 버튼 */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[
            styles.submitButton,
            (selectedUsers.length === 0 || isSubmitting) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={selectedUsers.length === 0 || isSubmitting}
        >
          <Text style={[
            styles.submitButtonText,
            (selectedUsers.length === 0 || isSubmitting) && styles.disabledButtonText,
          ]}>
            {isSubmitting ? '공유 중...' : `${selectedUsers.length}명에게 공유하기`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* 권한 선택 모달 */}
      <Modal
        visible={showRoleModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRoleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.roleModal}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>공유 권한 선택</Text>
              <TouchableOpacity onPress={() => setShowRoleModal(false)}>
                <Ionicons name="close" size={24} color="#333" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.roleOptions}>
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'viewer' && styles.selectedRoleOption,
                ]}
                onPress={() => handleRoleSelect('viewer')}
              >
                <View style={styles.roleOptionContent}>
                  <View style={[
                    styles.roleIcon,
                    { backgroundColor: getRoleColor('viewer') + '20' }
                  ]}>
                    <Ionicons
                      name={getRoleIcon('viewer') as any}
                      size={24}
                      color={getRoleColor('viewer')}
                    />
                  </View>
                  <View style={styles.roleOptionInfo}>
                    <Text style={[
                      styles.roleOptionTitle,
                      selectedRole === 'viewer' && styles.selectedRoleOptionTitle,
                    ]}>
                      조회자
                    </Text>
                    <Text style={styles.roleOptionDescription}>
                      계획을 조회만 할 수 있습니다
                    </Text>
                  </View>
                  {selectedRole === 'viewer' && (
                    <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
                  )}
                </View>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.roleOption,
                  selectedRole === 'editor' && styles.selectedRoleOption,
                ]}
                onPress={() => handleRoleSelect('editor')}
              >
                <View style={styles.roleOptionContent}>
                  <View style={[
                    styles.roleIcon,
                    { backgroundColor: getRoleColor('editor') + '20' }
                  ]}>
                    <Ionicons
                      name={getRoleIcon('editor') as any}
                      size={24}
                      color={getRoleColor('editor')}
                    />
                  </View>
                  <View style={styles.roleOptionInfo}>
                    <Text style={[
                      styles.roleOptionTitle,
                      selectedRole === 'editor' && styles.selectedRoleOptionTitle,
                    ]}>
                      편집자
                    </Text>
                    <Text style={styles.roleOptionDescription}>
                      계획을 수정하고 세부 계획을 추가할 수 있습니다
                    </Text>
                  </View>
                  {selectedRole === 'editor' && (
                    <Ionicons name="checkmark-circle" size={24} color="#27AE60" />
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
    backgroundColor: '#FFFFFF',
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  planInfoSection: {
    marginTop: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  planCard: {
    backgroundColor: '#F8F9FF',
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FF6B35',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 12,
  },
  planDetails: {
    gap: 8,
  },
  planRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
  roleSection: {
    marginBottom: 30,
  },
  roleButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  roleInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginLeft: 12,
  },
  roleDescription: {
    fontSize: 14,
    color: '#666',
    marginLeft: 32,
  },
  searchSection: {
    marginBottom: 30,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    marginLeft: 12,
  },
  selectedSection: {
    marginBottom: 30,
  },
  selectedUsersList: {
    gap: 12,
  },
  selectedUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F0F8FF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#4A90E2',
  },
  selectedUserInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectedUserName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  selectedUserEmail: {
    fontSize: 12,
    color: '#666',
  },
  removeButton: {
    padding: 4,
  },
  usersSection: {
    marginBottom: 30,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: 16,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  selectedUserCard: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4A90E2',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  userAvatarText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  userDetails: {
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginRight: 8,
  },
  friendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  friendText: {
    fontSize: 10,
    color: '#E74C3C',
    fontWeight: '500',
    marginLeft: 2,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
  },
  messageSection: {
    marginBottom: 30,
  },
  messageInput: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#E1E8ED',
    minHeight: 80,
  },
  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 8,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  roleModal: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '50%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  roleOptions: {
    padding: 20,
  },
  roleOption: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  selectedRoleOption: {
    backgroundColor: '#F0F8FF',
    borderColor: '#4A90E2',
  },
  roleOptionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  roleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  roleOptionInfo: {
    flex: 1,
  },
  roleOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  selectedRoleOptionTitle: {
    color: '#4A90E2',
  },
  roleOptionDescription: {
    fontSize: 14,
    color: '#666',
  },
});

export default PlanShareScreen;




