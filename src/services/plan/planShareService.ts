import apiClient from '../api/client';
import { PlanShareCreateDto, PlanShareResponseDto } from '../../types';

/**
 * 계획 공유
 * POST /plan/share
 */
export const sharePlan = async (createDto: PlanShareCreateDto, email: string): Promise<PlanShareCreateDto> => {
  try {
    console.log('🔄 계획 공유 시작:', { createDto, email });
    
    const response = await apiClient.post('/plan/share', createDto, {
      params: { email }
    });
    
    console.log('✅ 계획 공유 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 계획 공유 실패:', error);
    throw error;
  }
};

/**
 * 계획 공유 멤버 조회
 * GET /plan/{planId}/members
 */
export const getPlanSharedMembers = async (planId: number, email: string): Promise<PlanShareResponseDto[]> => {
  try {
    console.log('🔄 계획 공유 멤버 조회 시작:', { planId, email });
    
    const response = await apiClient.get(`/plan/${planId}/members`, {
      params: { email }
    });
    
    console.log('✅ 계획 공유 멤버 조회 성공:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('❌ 계획 공유 멤버 조회 실패:', error);
    throw error;
  }
};

/**
 * 대기중인 공유 요청 조회
 * GET /plan/share/pending
 */
export const getPendingShares = async (email: string): Promise<PlanShareResponseDto[]> => {
  try {
    console.log('🔄 대기중인 공유 요청 조회 시작:', { email });
    
    const response = await apiClient.get('/plan/share/pending', {
      params: { email }
    });
    
    console.log('✅ 대기중인 공유 요청 조회 성공:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('❌ 대기중인 공유 요청 조회 실패:', error);
    throw error;
  }
};

/**
 * 공유 요청 수락
 * PUT /plan/share/{shareId}/accept
 */
export const acceptShare = async (shareId: number, email: string): Promise<PlanShareResponseDto> => {
  try {
    console.log('🔄 공유 요청 수락 시작:', { shareId, email });
    
    const response = await apiClient.put(`/plan/share/${shareId}/accept`, {}, {
      params: { email }
    });
    
    console.log('✅ 공유 요청 수락 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 공유 요청 수락 실패:', error);
    throw error;
  }
};

/**
 * 공유 요청 거부
 * PUT /plan/share/{shareId}/reject
 */
export const rejectShare = async (shareId: number, email: string): Promise<PlanShareResponseDto> => {
  try {
    console.log('🔄 공유 요청 거부 시작:', { shareId, email });
    
    const response = await apiClient.put(`/plan/share/${shareId}/reject`, {}, {
      params: { email }
    });
    
    console.log('✅ 공유 요청 거부 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 공유 요청 거부 실패:', error);
    throw error;
  }
};
