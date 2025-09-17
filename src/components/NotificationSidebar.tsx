import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { getNotifications, markNotificationAsRead, Notification } from '../services/notification/notificationService';

const { width } = Dimensions.get('window');

// 로컬 알림 타입 (UI용)
interface LocalNotification {
  id: number;
  title: string;
  message: string;
  time: string;
  type: 'info' | 'warning' | 'success' | 'error';
  isRead: boolean;
}

interface NotificationSidebarProps {
  isVisible: boolean;
  onClose: () => void;
  slideAnimation: Animated.Value;
  onMarkAllRead?: () => void;
}

const NotificationSidebar: React.FC<NotificationSidebarProps> = ({
  isVisible,
  onClose,
  slideAnimation,
  onMarkAllRead,
}) => {
  const [notifications, setNotifications] = useState<LocalNotification[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // 알림 데이터 로드
  useEffect(() => {
    if (isVisible) {
      loadNotifications();
    }
  }, [isVisible]);

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      console.log('🔔 알림 데이터 로드 시작');
      
      const apiNotifications = await getNotifications();
      
      // API 데이터를 로컬 타입으로 변환
      const convertedNotifications: LocalNotification[] = apiNotifications.map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.content,
        time: formatTimeAgo(notification.createdAt),
        type: getNotificationType(notification.type),
        isRead: notification.isRead,
      }));
      
      setNotifications(convertedNotifications);
      console.log('🔔 알림 데이터 로드 완료:', convertedNotifications.length);
    } catch (error) {
      console.error('❌ 알림 데이터 로드 실패:', error);
      setNotifications([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 시간 포맷팅
  const formatTimeAgo = (dateString: string): string => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return '방금 전';
    if (diffInMinutes < 60) return `${diffInMinutes}분 전`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours}시간 전`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays}일 전`;
    
    return date.toLocaleDateString('ko-KR');
  };

  // 알림 타입 변환
  const getNotificationType = (type: string): 'info' | 'warning' | 'success' | 'error' => {
    switch (type) {
      case 'PLAN': return 'info';
      case 'REVIEW': return 'success';
      case 'RECOMMENDATION': return 'info';
      case 'SYSTEM': return 'warning';
      default: return 'info';
    }
  };

  // 알림 클릭 처리
  const handleNotificationPress = async (notification: LocalNotification) => {
    if (!notification.isRead) {
      try {
        console.log('✅ 알림 읽음 처리:', notification.id);
        await markNotificationAsRead(notification.id);
        
        // 로컬 상태 업데이트
        setNotifications(prev => 
          prev.map(n => 
            n.id === notification.id ? { ...n, isRead: true } : n
          )
        );
      } catch (error) {
        console.error('❌ 알림 읽음 처리 실패:', error);
      }
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
      default:
        return '#7F8C8D';
    }
  };

  const unreadCount = notifications.filter(notification => !notification.isRead).length;

  return (
    <>
      {/* 오버레이 */}
      {isVisible && (
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        />
      )}
      
      {/* 사이드바 */}
      <Animated.View
        style={[
          styles.sidebar,
          {
            transform: [
              {
                translateX: slideAnimation.interpolate({
                  inputRange: [0, 1],
                  outputRange: [width * 0.8, 0], // 화면의 4/5 (80%) 크기로 슬라이드
                }),
              },
            ],
          },
        ]}
      >
        {/* 헤더 */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="notifications" size={24} color="#333" />
            <Text style={styles.headerTitle}>알림</Text>
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{unreadCount}</Text>
              </View>
            )}
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#7F8C8D" />
          </TouchableOpacity>
        </View>

        {/* 알림 목록 */}
        <ScrollView style={styles.notificationList} showsVerticalScrollIndicator={false}>
          {isLoading ? (
            <View style={styles.loadingState}>
              <Text style={styles.loadingText}>알림을 불러오는 중...</Text>
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="notifications-off" size={48} color="#D1D5DB" />
              <Text style={styles.emptyText}>알림이 없습니다</Text>
            </View>
          ) : (
            notifications.map((notification) => (
              <TouchableOpacity
                key={notification.id}
                style={[
                  styles.notificationItem,
                  !notification.isRead && styles.unreadNotification,
                ]}
                activeOpacity={0.7}
                onPress={() => handleNotificationPress(notification)}
              >
                <View style={styles.notificationContent}>
                  <View style={styles.notificationHeader}>
                    <View style={styles.notificationIconContainer}>
                      <Ionicons
                        name={getNotificationIcon(notification.type) as any}
                        size={20}
                        color={getNotificationColor(notification.type)}
                      />
                    </View>
                    <View style={styles.notificationTextContainer}>
                      <Text style={[
                        styles.notificationTitle,
                        !notification.isRead && styles.unreadText,
                      ]}>
                        {notification.title}
                      </Text>
                      <Text style={styles.notificationTime}>
                        {notification.time}
                      </Text>
                    </View>
                    {!notification.isRead && (
                      <View style={styles.unreadDot} />
                    )}
                  </View>
                  <Text style={styles.notificationMessage} numberOfLines={2}>
                    {notification.message}
                  </Text>
                </View>
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        {/* 하단 액션 버튼 */}
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.markAllReadButton}
            onPress={onMarkAllRead}
          >
            <Ionicons name="checkmark-done" size={20} color="#4A90E2" />
            <Text style={styles.markAllReadText}>모두 읽음</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.4)', // 약간 더 연한 오버레이
    zIndex: 999,
  },
  sidebar: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: width * 0.8, // 화면의 4/5 (80%) 차지
    height: '100%',
    backgroundColor: '#FFFFFF',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: -2, height: 0 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
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
  closeButton: {
    padding: 4,
  },
  notificationList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  loadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    color: '#7F8C8D',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 16,
  },
  notificationItem: {
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
  notificationIconContainer: {
    marginRight: 12,
    marginTop: 2,
  },
  notificationTextContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  unreadText: {
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
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginLeft: 32,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: '#E1E8ED',
  },
  markAllReadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    backgroundColor: '#F8F9FF',
    borderRadius: 8,
  },
  markAllReadText: {
    fontSize: 14,
    color: '#4A90E2',
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default NotificationSidebar;

