import apiClient from '../api/client';
import { PlanChangeHistoryResponseDto, PageResponse, ChangeType } from '../../types';

/**
 * 계획 변경 이력 전체 조회
 * GET /plan/{planId}/history
 */
export const getPlanHistory = async (
  planId: number, 
  email: string, 
  page: number = 0, 
  size: number = 10
): Promise<PageResponse<PlanChangeHistoryResponseDto>> => {
  try {
    console.log('🔄 계획 변경 이력 조회 시작:', { planId, email, page, size });
    
    const response = await apiClient.get(`/plan/${planId}/history`, {
      params: { page, size, email }
    });
    
    console.log('✅ 계획 변경 이력 조회 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 계획 변경 이력 조회 실패:', error);
    throw error;
  }
};

/**
 * 특정 타입 변경사항 조회
 * GET /plan/{planId}/history/type/{changeType}
 */
export const getChangesByType = async (
  planId: number,
  changeType: ChangeType,
  email: string,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<PlanChangeHistoryResponseDto>> => {
  try {
    console.log('🔄 특정 타입 변경사항 조회 시작:', { planId, changeType, email, page, size });
    
    const response = await apiClient.get(`/plan/${planId}/history/type/${changeType}`, {
      params: { page, size, email }
    });
    
    console.log('✅ 특정 타입 변경사항 조회 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 특정 타입 변경사항 조회 실패:', error);
    throw error;
  }
};

/**
 * 내 활동 내역 조회
 * GET /my/activity
 */
export const getMyActivity = async (
  email: string,
  page: number = 0,
  size: number = 10
): Promise<PageResponse<PlanChangeHistoryResponseDto>> => {
  try {
    console.log('🔄 내 활동 내역 조회 시작:', { email, page, size });
    
    const response = await apiClient.get('/my/activity', {
      params: { page, size, email }
    });
    
    console.log('✅ 내 활동 내역 조회 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 내 활동 내역 조회 실패:', error);
    throw error;
  }
};
