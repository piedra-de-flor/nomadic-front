import apiClient from '../api/client';
import { PlanReadAllResponseDto, PlanReadResponseDto, PlanStyleUpdateDto, PlanPartnerUpdateDto, PlanCreateDto, PlanDto, PlanUpdateDto } from '../../types';

/**
 * 사용자의 모든 여행 계획을 조회합니다.
 * @param email 사용자 이메일
 * @returns 여행 계획 목록
 */
export const getAllPlans = async (email: string): Promise<PlanReadAllResponseDto> => {
  try {
    console.log('🔄 여행 계획 조회 시작:', { email });
    
    const response = await apiClient.get<PlanReadAllResponseDto>('/plans', {
      params: { email }
    });
    
    console.log('✅ 여행 계획 조회 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 여행 계획 조회 실패:', error);
    throw error;
  }
};

/**
 * 단일 여행 계획 조회
 * GET /plan/{planId}
 */
export const getPlan = async (planId: number, email: string): Promise<PlanReadResponseDto> => {
  try {
    console.log('🔄 단일 계획 조회 시작:', { planId, email });
    
    const response = await apiClient.get(`/plan/${planId}`, {
      params: { email }
    });
    
    console.log('✅ 단일 계획 조회 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 단일 계획 조회 실패:', error);
    throw error;
  }
};

/**
 * 계획 스타일 수정
 * PUT /plan/style
 */
export const updatePlanStyle = async (updateData: PlanStyleUpdateDto, email: string): Promise<PlanStyleUpdateDto> => {
  try {
    console.log('🔄 계획 스타일 수정 시작:', { updateData, email });
    
    const response = await apiClient.put('/plan/style', updateData, {
      params: { email }
    });
    
    console.log('✅ 계획 스타일 수정 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 계획 스타일 수정 실패:', error);
    throw error;
  }
};

/**
 * 계획 파트너 수정
 * PUT /plan/partner
 */
export const updatePlanPartner = async (updateData: PlanPartnerUpdateDto, email: string): Promise<PlanPartnerUpdateDto> => {
  try {
    console.log('🔄 계획 파트너 수정 시작:', { updateData, email });
    
    const response = await apiClient.put('/plan/partner', updateData, {
      params: { email }
    });
    
    console.log('✅ 계획 파트너 수정 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 계획 파트너 수정 실패:', error);
    throw error;
  }
};

/**
 * 계획 생성
 * POST /plan
 */
export const createPlan = async (createDto: PlanCreateDto, email: string): Promise<PlanCreateDto> => {
  try {
    console.log('🔄 계획 생성 시작:', { createDto, email });
    
    const response = await apiClient.post('/plan', createDto, {
      params: { email }
    });
    
    console.log('✅ 계획 생성 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 계획 생성 실패:', error);
    throw error;
  }
};

/**
 * 계획 삭제
 * DELETE /plan
 */
export const deletePlan = async (deleteDto: PlanDto, email: string): Promise<PlanDto> => {
  try {
    console.log('🔄 계획 삭제 시작:', { deleteDto, email });
    
    const response = await apiClient.delete('/plan', {
      data: deleteDto,
      params: { email }
    });
    
    console.log('✅ 계획 삭제 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 계획 삭제 실패:', error);
    throw error;
  }
};

/**
 * 계획 이름 및 날짜 수정
 * PATCH /plan
 */
export const updatePlanNameAndDate = async (updateDto: PlanUpdateDto, email: string): Promise<PlanUpdateDto> => {
  try {
    console.log('🔄 계획 이름 및 날짜 수정 시작:', { updateDto, email });
    
    const response = await apiClient.patch('/plan', updateDto, {
      params: { email }
    });
    
    console.log('✅ 계획 이름 및 날짜 수정 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 계획 이름 및 날짜 수정 실패:', error);
    throw error;
  }
};