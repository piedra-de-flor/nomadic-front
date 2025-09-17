import apiClient from '../api/client';
import { API_CONFIG } from '../../constants';
import { getStoredToken } from '../storage/tokenStorage';

// 알림 타입 정의
export interface Notification {
  id: number;
  title: string;
  content: string;
  type: 'PLAN' | 'REVIEW' | 'RECOMMENDATION' | 'SYSTEM';
  isRead: boolean;
  createdAt: string;
  relatedId?: number; // 관련된 계획, 리뷰 등의 ID
}

// 알림 목록 조회
export const getNotifications = async (): Promise<Notification[]> => {
  try {
    // 인증 토큰 확인
    const token = await getStoredToken();
    if (!token) {
      console.log('🔔 로그인하지 않은 사용자 - 알림 조회 건너뜀');
      return [];
    }

    console.log('🔔 알림 목록 API 호출');
    
    const response = await apiClient.get<Notification[]>(API_CONFIG.ENDPOINTS.NOTIFICATIONS);
    
    console.log('🔔 알림 목록 API 응답:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 알림 목록 API 에러:', error);
    
    // 에러 시 빈 배열 반환
    return [];
  }
};

// 알림 읽음 처리
export const markNotificationAsRead = async (notificationId: number): Promise<void> => {
  try {
    // 인증 토큰 확인
    const token = await getStoredToken();
    if (!token) {
      console.log('✅ 로그인하지 않은 사용자 - 알림 읽음 처리 건너뜀');
      return;
    }

    console.log('✅ 알림 읽음 처리 API 호출:', notificationId);
    
    await apiClient.post(`/notifications/read/${notificationId}`);
    
    console.log('✅ 알림 읽음 처리 성공');
  } catch (error) {
    console.error('❌ 알림 읽음 처리 API 에러:', error);
    throw error;
  }
};

// 읽지 않은 알림 개수 조회
export const getUnreadNotificationCount = async (): Promise<number> => {
  try {
    const notifications = await getNotifications();
    return notifications.filter(notification => !notification.isRead).length;
  } catch (error) {
    console.error('❌ 읽지 않은 알림 개수 조회 에러:', error);
    return 0;
  }
};
