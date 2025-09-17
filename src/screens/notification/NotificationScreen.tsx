import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface Notification {
  id: number;
  title: string;
  content: string;
  sentAt: string;
  isRead: boolean;
  type: 'info' | 'warning' | 'success' | 'error' | 'invite';
}

const NotificationScreen = ({ navigation }: any) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);

  // 임시 알림 데이터 (실제로는 API에서 가져올 데이터)
  const mockNotifications: Notification[] = [
    {
      id: 1,
      title: '새로운 여행 추천',
      content: '제주도에서 특별한 경험을 할 수 있는 새로운 장소가 추가되었습니다.',
      sentAt: '2024-12-15T10:30:00',
      isRead: false,
      type: 'info',
    },
    {
      id: 2,
      title: '여행 계획 알림',
      content: '부산 여행이 3일 후에 시작됩니다. 준비물을 확인해보세요.',
      sentAt: '2024-12-15T09:15:00',
      isRead: false,
      type: 'warning',
    },
    {
      id: 3,
      title: '리뷰 작성 완료',
      content: '강릉 커피거리 리뷰가 성공적으로 등록되었습니다.',
      sentAt: '2024-12-15T08:45:00',
      isRead: true,
      type: 'success',
    },
    {
      id: 4,
      title: '친구 초대',
      content: '김여행러님이 당신을 여행 그룹에 초대했습니다.',
      sentAt: '2024-12-14T20:30:00',
      isRead: true,
      type: 'invite',
    },
    {
      id: 5,
      title: '할인 이벤트',
      content: '제주도 숙박 시설 최대 50% 할인 이벤트가 진행 중입니다.',
      sentAt: '2024-12-14T15:20:00',
      isRead: true,
      type: 'info',
    },
    {
      id: 6,
      title: '날씨 알림',
      content: '예정된 여행지의 날씨가 좋지 않을 예정입니다. 대비책을 세워보세요.',
      sentAt: '2024-12-14T12:00:00',
      isRead: true,
      type: 'warning',
    },
    {
      id: 7,
      title: '계획 공유 요청',
      content: '이커플님이 당신의 제주도 여행 계획 공유를 요청했습니다.',
      sentAt: '2024-12-13T18:45:00',
      isRead: true,
      type: 'invite',
    },
    {
      id: 8,
      title: '리뷰 신고 처리 완료',
      content: '신고하신 리뷰에 대한 검토가 완료되었습니다.',
      sentAt: '2024-12-13T14:30:00',
      isRead: true,
      type: 'success',
    },
  ];

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      // TODO: API 호출
      // const response = await notificationService.getNotifications();
      // setNotifications(response.data);
      
      // 임시로 목 데이터 사용
      setTimeout(() => {
        setNotifications(mockNotifications);
        setIsLoading(false);
      }, 500);
    } catch (error) {
      setIsLoading(false);
      Alert.alert('오류', '알림을 불러오는 중 오류가 발생했습니다.');
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadNotifications();
    setIsRefreshing(false);
  };

  const markAsRead = async (notificationId: number) => {
    try {
      // TODO: API 호출
      // await notificationService.markAsRead(notificationId);
      
      setNotifications(prev => 
        prev.map(notification => 
          notification.id === notificationId 
            ? { ...notification, isRead: true }
            : notification
        )
      );
    } catch (error) {
      Alert.alert('오류', '알림을 읽음 처리하는 중 오류가 발생했습니다.');
    }
  };

  const markAllAsRead = async () => {
    try {
      // TODO: API 호출
      // await notificationService.markAllAsRead();
      
      setNotifications(prev => 
        prev.map(notification => ({ ...notification, isRead: true }))
      );
    } catch (error) {
      Alert.alert('오류', '모든 알림을 읽음 처리하는 중 오류가 발생했습니다.');
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'info':
        return 'information-circle';
      case 'warning':
        return 'warning';
      case 'success':
        return 'checkmark-circle';
      case 'error':
        return 'alert-circle';
      case 'invite':
        return 'person-add';
      default:
        return 'notifications';
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'info':
        return '#4A90E2';
      case 'warning':
        return '#F39C12';
      case 'success':
        return '#27AE60';
      case 'error':
        return '#E74C3C';
      case 'invite':
        return '#9B59B6';
      default:
        return '#7F8C8D';
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>알림을 불러오는 중...</Text>
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
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>알림</Text>
          {unreadCount > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{unreadCount}</Text>
            </View>
          )}
        </View>
        <TouchableOpacity onPress={markAllAsRead} style={styles.markAllButton}>
          <Text style={styles.markAllText}>모두 읽음</Text>
        </TouchableOpacity>
      </View>

      {/* 알림 목록 */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={handleRefresh} />
        }
      >
        {notifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={64} color="#D1D5DB" />
            <Text style={styles.emptyTitle}>알림이 없습니다</Text>
            <Text style={styles.emptySubtitle}>새로운 알림이 오면 여기에 표시됩니다</Text>
          </View>
        ) : (
          notifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.isRead && styles.unreadNotification,
              ]}
              onPress={() => markAsRead(notification.id)}
              activeOpacity={0.7}
            >
              <View style={styles.notificationContent}>
                <View style={styles.notificationHeader}>
                  <View style={styles.iconContainer}>
                    <Ionicons
                      name={getNotificationIcon(notification.type) as any}
                      size={24}
                      color={getNotificationColor(notification.type)}
                    />
                  </View>
                  <View style={styles.textContainer}>
                    <Text style={[
                      styles.notificationTitle,
                      !notification.isRead && styles.unreadTitle,
                    ]}>
                      {notification.title}
                    </Text>
                    <Text style={styles.notificationTime}>
                      {formatTime(notification.sentAt)}
                    </Text>
                  </View>
                  {!notification.isRead && (
                    <View style={styles.unreadDot} />
                  )}
                </View>
                <Text style={styles.notificationContent} numberOfLines={3}>
                  {notification.content}
                </Text>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>
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
  headerCenter: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  badge: {
    backgroundColor: '#E74C3C',
    borderRadius: 10,
    minWidth: 20,
    height: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  markAllButton: {
    padding: 4,
  },
  markAllText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  notificationItem: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  unreadNotification: {
    backgroundColor: '#F8F9FF',
  },
  notificationContent: {
    flex: 1,
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  iconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  textContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadTitle: {
    fontWeight: 'bold',
  },
  notificationTime: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E74C3C',
    marginTop: 6,
  },
  notificationContent: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 36,
  },
});

export default NotificationScreen;




