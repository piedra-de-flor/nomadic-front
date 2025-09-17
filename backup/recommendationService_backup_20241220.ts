import apiClient from '../api/client';
import { API_CONFIG } from '../../constants';
import { 
  Recommendation, 
  RecommendationBlock, 
  RecommendationSearchRequest,
  RecommendLikeRequest,
  RecommendationType,
  PostMeta,
  RootReviewResponseDto,
  ReviewPageResponse,
  ReplyPageResponse,
  ReviewUpdateDto,
  ReportRequestDto,
  ReportResponseDto,
  RecommendReadTop10Dto
} from '../../types';

// 리뷰 작성 요청 타입
export interface RecommendWriteReviewRequest {
  placeId: number;
  content: string;
  parentId?: number;
}

/**
 * API 응답을 Recommendation 타입으로 변환
 */
const transformRecommendation = (apiData: any): Recommendation => {
  return {
    ...apiData,
    // name 필드를 postMeta.author로 변환
    postMeta: apiData.name ? {
      author: apiData.name,
      source: apiData.source || '시스템'
    } as PostMeta : apiData.postMeta,
    // 날짜 문자열을 Date 객체로 변환
    createdAt: new Date(apiData.createdAt),
    updatedAt: new Date(apiData.updatedAt),
    // 기본값 설정
    likesCount: apiData.likesCount || 0,
    reviewsCount: apiData.reviewsCount || 0,
    viewsCount: apiData.viewsCount || 0,
    tags: apiData.tags || [],
    blocks: apiData.blocks || [],
    // 사용자의 좋아요 상태 (서버에서 제공)
    like: apiData.like || false
  };
};

/**
 * 추천 장소 목록 조회 (기존 API 사용)
 * GET /recommendations
 */
export const getRecommendations = async (params: RecommendationSearchRequest = {}): Promise<Recommendation[]> => {
  try {
    console.log('🔍 추천 장소 목록 조회:', params);
    
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.type) queryParams.append('type', params.type);
    if (params.order) queryParams.append('order', params.order);
    if (params.direction) queryParams.append('direction', params.direction);
    if (params.limit) queryParams.append('limit', params.limit.toString());

    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.RECOMMENDATIONS}?${queryParams.toString()}`);
    
    console.log('✅ 추천 장소 목록 조회 성공:', response.data);
    const data = response.data || [];
    return Array.isArray(data) ? data.map(transformRecommendation) : [];
  } catch (error) {
    console.error('❌ 추천 장소 목록 조회 실패:', error);
    throw error;
  }
};

/**
 * 단일 추천 장소 조회 (조회수 증가)
 * GET /recommendation?placeId={id}
 */
export const getRecommendationById = async (id: number): Promise<Recommendation> => {
  try {
    console.log('🔍 추천 장소 상세 조회:', id);
    
    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.RECOMMENDATION}?placeId=${id}`);
    
    console.log('✅ 추천 장소 상세 조회 성공:', response.data);
    return transformRecommendation(response.data);
  } catch (error) {
    console.error('❌ 추천 장소 상세 조회 실패:', error);
    throw error;
  }
};

/**
 * TOP 10 추천 장소 조회 (홈페이지용)
 * GET /recommendations/top10
 */
export const getTop10Recommendations = async (): Promise<RecommendReadTop10Dto[]> => {
  try {
    console.log('🔍 TOP 10 추천 장소 조회');
    
    const response = await apiClient.get('/recommendations/top10');
    
    console.log('✅ TOP 10 추천 장소 조회 성공:', response.data);
    const data = response.data || [];
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error('❌ TOP 10 추천 장소 조회 실패:', error);
    // 에러 시 빈 배열 반환
    return [];
  }
};

/**
 * 추천 장소 검색 (문서 기준)
 * GET /recommendations/search?q={keyword}&type={type}
 */
export const searchRecommendations = async (keyword: string, type?: RecommendationType): Promise<Recommendation[]> => {
  try {
    console.log('🔍 추천 장소 검색:', { keyword, type });
    
    const queryParams = new URLSearchParams();
    queryParams.append('q', keyword);
    if (type) queryParams.append('type', type);

    const response = await apiClient.get(`/recommendations/search?${queryParams.toString()}`);
    
    console.log('✅ 추천 장소 검색 성공:', response.data);
    const data = response.data || [];
    return Array.isArray(data) ? data.map(transformRecommendation) : [];
  } catch (error) {
    console.error('❌ 추천 장소 검색 실패:', error);
    throw error;
  }
};

/**
 * 랜덤 추천 장소 조회 (문서 기준)
 * GET /recommendations/random?type={type}&limit={limit}
 */
export const getRandomRecommendations = async (type: RecommendationType, limit: number = 10): Promise<Recommendation[]> => {
  try {
    console.log('🔍 랜덤 추천 장소 조회 시작:', { type, limit });
    
    const queryParams = new URLSearchParams();
    queryParams.append('type', type);
    queryParams.append('limit', limit.toString());

    const url = `/recommendations/random?${queryParams.toString()}`;
    console.log('🌐 API 요청 URL:', url);
    
    const response = await apiClient.get(url);
    
    console.log('✅ 랜덤 추천 장소 조회 성공:', {
      status: response.status,
      dataLength: response.data?.length || 0,
      data: response.data
    });
    
    const data = response.data || [];
    const transformedData = Array.isArray(data) ? data.map(transformRecommendation) : [];
    
    console.log('🔄 변환된 데이터:', transformedData.length, '개');
    return transformedData;
  } catch (error) {
    console.error('❌ 랜덤 추천 장소 조회 실패:', error);
    console.error('❌ 에러 상세 정보:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      data: error.response?.data,
      url: error.config?.url,
      method: error.config?.method
    });
    throw error;
  }
};

/**
 * 추천 장소 블록 조회 (문서 기준)
 * GET /recommendation/{id}/blocks
 */
export const getRecommendationBlocks = async (id: number): Promise<RecommendationBlock[]> => {
  try {
    console.log('🔍 추천 장소 블록 조회:', id);
    
    const response = await apiClient.get(`/recommendation/${id}/blocks`);
    
    console.log('✅ 추천 장소 블록 조회 성공:', response.data);
    return response.data || [];
  } catch (error) {
    console.error('❌ 추천 장소 블록 조회 실패:', error);
    return [];
  }
};

/**
 * 좋아요 토글 (새로운 API 사용)
 * PUT /recommendation/like?recommendationId={id}&memberId={memberId}
 */
export const toggleRecommendationLike = async (recommendationId: number, memberId: number): Promise<{ isLiked: boolean; likesCount: number }> => {
  try {
    console.log('🔍 추천 장소 좋아요 토글:', { recommendationId, memberId });
    
    const response = await apiClient.put(`${API_CONFIG.ENDPOINTS.RECOMMENDATION_LIKE}?recommendationId=${recommendationId}&memberId=${memberId}`);
    
    console.log('✅ 추천 장소 좋아요 토글 성공:', response.data);
    
    // API 응답이 recommendationId만 반환하므로, 클라이언트에서 상태를 추정
    // 실제로는 서버에서 현재 좋아요 상태와 수를 반환해야 함
    console.log('⚠️ 서버에서 정확한 좋아요 상태와 수를 반환하지 않음. 클라이언트에서 추정 사용');
    return {
      isLiked: true, // 서버에서 정확한 상태를 반환해야 함
      likesCount: 1  // 임시로 1로 설정 (실제로는 서버에서 반환해야 함)
    };
  } catch (error) {
    console.error('❌ 추천 장소 좋아요 토글 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 조회 (페이지네이션)
 * GET /recommendation/review/{recommendationId}?page={page}&size={size}
 */
export const getRecommendationReviews = async (
  recommendationId: number, 
  page: number = 0, 
  size: number = 10
): Promise<ReviewPageResponse> => {
  try {
    console.log('🔍 추천 장소 리뷰 조회:', { recommendationId, page, size });
    
    const response = await apiClient.get(`/recommendation/review/${recommendationId}?page=${page}&size=${size}`);
    
    console.log('✅ 추천 장소 리뷰 조회 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 추천 장소 리뷰 조회 실패:', error);
    throw error;
  }
};

/**
 * 상대 시간 계산 (예: "3일 전", "1주 전")
 */
export const getRelativeTime = (date: Date): string => {
  const now = new Date();
  const diffInMs = now.getTime() - new Date(date).getTime();
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));
  const diffInWeeks = Math.floor(diffInDays / 7);
  const diffInMonths = Math.floor(diffInDays / 30);

  if (diffInDays === 0) {
    return '오늘';
  } else if (diffInDays === 1) {
    return '어제';
  } else if (diffInDays < 7) {
    return `${diffInDays}일 전`;
  } else if (diffInWeeks < 4) {
    return `${diffInWeeks}주 전`;
  } else if (diffInMonths < 12) {
    return `${diffInMonths}개월 전`;
  } else {
    return `${Math.floor(diffInMonths / 12)}년 전`;
  }
};

/**
 * 디바운스 훅 (검색 최적화)
 */
export const useDebounce = (value: string, delay: number): string => {
  const [debouncedValue, setDebouncedValue] = React.useState(value);

  React.useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
};

/**
 * 리뷰 작성
 */
export const writeRecommendationReview = async (reviewData: RecommendWriteReviewRequest): Promise<any> => {
  try {
    console.log('📝 리뷰 작성 요청:', reviewData);
    
    const response = await apiClient.post(`${API_CONFIG.ENDPOINTS.RECOMMENDATION}/review`, reviewData);
    
    console.log('✅ 리뷰 작성 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 리뷰 작성 실패:', error);
    throw error;
  }
};

/**
 * 답글 조회 API
 * GET /recommendation/reply/{parentId}
 */
export const getRecommendationReplies = async (
  parentId: number, 
  page: number = 0, 
  size: number = 10
): Promise<ReplyPageResponse> => {
  try {
    const response = await apiClient.get(`/recommendation/reply/${parentId}?page=${page}&size=${size}`);
    return response.data;
  } catch (error) {
    console.error('❌ 답글 조회 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 수정 API
 * PUT /recommendation/review
 */
export const updateRecommendationReview = async (updateData: ReviewUpdateDto): Promise<any> => {
  try {
    console.log('📝 리뷰 수정 요청:', updateData);
    
    const response = await apiClient.put(`${API_CONFIG.ENDPOINTS.RECOMMENDATION}/review`, updateData);
    
    console.log('✅ 리뷰 수정 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 리뷰 수정 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 삭제 API
 * DELETE /recommendation/review/{reviewId}
 */
export const deleteRecommendationReview = async (reviewId: number): Promise<void> => {
  try {
    console.log('🗑️ 리뷰 삭제 요청 - reviewId:', reviewId);
    
    await apiClient.delete(`${API_CONFIG.ENDPOINTS.RECOMMENDATION}/review/${reviewId}`);
    
    console.log('✅ 리뷰 삭제 성공');
  } catch (error) {
    console.error('❌ 리뷰 삭제 실패:', error);
    throw error;
  }
};

/**
 * 리뷰 신고
 */
export const reportReview = async (reviewId: number, request: ReportRequestDto): Promise<ReportResponseDto> => {
  try {
    console.log('🚨 리뷰 신고 요청:', { reviewId, request });
    
    const response = await apiClient.post(`/report/${reviewId}`, request);
    
    console.log('✅ 리뷰 신고 성공:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ 리뷰 신고 실패:', error);
    throw error;
  }
};

// TODO: 관리자용 API는 백엔드 구현 후 추가

// React import 추가
import React from 'react';
