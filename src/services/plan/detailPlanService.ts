import apiClient from '../api/client';
import { DetailPlanDto, DetailPlanUpdateDto, DetailPlan } from '../../types';

/**
 * 세부 계획 전체 조회
 * GET /detail-plans
 */
export const getAllDetailPlans = async (planId: number, email: string): Promise<DetailPlan[]> => {
  try {
    console.log('🔄 세부 계획 조회 시작:', { planId, email });
    
    const response = await apiClient.get('/detail-plans', {
      params: { planId, email }
    });
    
    console.log('✅ 세부 계획 조회 성공:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('❌ 세부 계획 조회 실패:', error);
    throw error;
  }
};

/**
 * 세부 계획 생성
 * POST /detail-plan
 */
export const createDetailPlan = async (detailPlan: DetailPlanDto, email: string): Promise<DetailPlanDto> => {
  try {
    console.log('🔄 세부 계획 생성 시작:', { detailPlan, email });
    
    const response = await apiClient.post('/detail-plan', detailPlan, {
      params: { email }
    });
    
    console.log('✅ 세부 계획 생성 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 세부 계획 생성 실패:', error);
    throw error;
  }
};

/**
 * 세부 계획 수정
 * PATCH /detail-plan
 */
export const updateDetailPlan = async (updateDto: DetailPlanUpdateDto, email: string): Promise<DetailPlanDto> => {
  try {
    console.log('🔄 세부 계획 수정 시작:', { updateDto, email });
    
    const response = await apiClient.patch('/detail-plan', updateDto, {
      params: { email }
    });
    
    console.log('✅ 세부 계획 수정 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 세부 계획 수정 실패:', error);
    throw error;
  }
};

/**
 * 세부 계획 삭제
 * DELETE /detailPlan
 */
export const deleteDetailPlan = async (planId: number, detailPlanId: number, email: string): Promise<number> => {
  try {
    console.log('🔄 세부 계획 삭제 시작:', { planId, detailPlanId, email });
    
    const response = await apiClient.delete('/detailPlan', {
      params: { planId, detailPlanId, email }
    });
    
    console.log('✅ 세부 계획 삭제 성공:', response.data);
    return response.data; // detailPlanId 반환
  } catch (error) {
    console.error('❌ 세부 계획 삭제 실패:', error);
    throw error;
  }
};
