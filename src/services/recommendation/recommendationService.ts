import apiClient from '../api/client';
import { API_CONFIG } from '../../constants';
import { 
  Recommendation, 
  RecommendationBlock, 
  RecommendationSearchRequest,
  RecommendLikeRequest,
  RecommendationType,
  RecommendOrderType,
  Pageable,
  RecommendReadDto,
  RecommendReadTop10Dto,
  RecommendationBlockReadDto,
  RecommendationBlockUpdateDto,
  RecommendLikeDto,
  RootReviewResponseDto,
  ReviewPageResponse,
  ReplyPageResponse,
  ReviewUpdateDto,
  ReportRequestDto,
  ReportResponseDto
} from '../../types';

// 리뷰 작성 요청 타입
export interface RecommendWriteReviewRequest {
  placeId: number;
  content: string;
  parentId?: number;
}

/**
 * API 응답을 Recommendation 타입으로 변환 (API 문서 기반)
 */
const transformRecommendation = (apiData: RecommendReadDto): Recommendation => {
  return {
    id: apiData.id,
    title: apiData.title,
    subTitle: apiData.subTitle,
    author: apiData.author,
    authorId: apiData.authorId, // ✨ authorId 필드 추가
    location: apiData.location,
    price: apiData.price,
    type: 'PLACE' as RecommendationType, // API에서 type 정보가 없으므로 기본값
    tags: apiData.tags || [],
    createdAt: new Date(apiData.createdAt),
    likesCount: apiData.likesCount || 0,
    reviewsCount: apiData.reviewsCount || 0,
    viewsCount: apiData.viewsCount || 0,
    like: apiData.like || false,
    mainImage: undefined // 기본적으로는 undefined, 나중에 추가
  };
};

/**
 * 추천 장소 목록 조회 (API 문서 기반)
 * GET /recommendations
 */
export const getRecommendations = async (params: RecommendationSearchRequest = {}): Promise<Recommendation[]> => {
  try {
    console.log('🔍 추천 장소 목록 조회:', params);
    
    const queryParams = new URLSearchParams();
    if (params.q) queryParams.append('q', params.q);
    if (params.type) queryParams.append('type', params.type);
    if (params.sort) queryParams.append('sort', params.sort);
    
    // 페이징 정보 추가
    if (params.pageable) {
      queryParams.append('page', params.pageable.page.toString());
      queryParams.append('size', params.pageable.size.toString());
      if (params.pageable.sort) {
        queryParams.append('pageable.sort', params.pageable.sort);
      }
    }

    const response = await apiClient.get(`${API_CONFIG.ENDPOINTS.RECOMMENDATIONS}?${queryParams.toString()}`);
    
    console.log('✅ 추천 장소 목록 조회 성공:', response.data);
    
    // 페이징 응답에서 content 추출
    const pageData = response.data;
    const data = pageData?.content || response.data || [];
    const transformedData = Array.isArray(data) ? data.map(transformRecommendation) : [];
    
    // 각 추천 장소에 대표 이미지 추가
    const dataWithImages = transformedData.map(item => ({
      ...item,
      mainImage: getRecommendationImage(item.id)
    }));
    
    return dataWithImages;
  } catch (error: any) {
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
  } catch (error: any) {
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
    const transformedData = Array.isArray(data) ? data.map(transformRecommendation) : [];
    
    // 각 추천 장소에 대표 이미지 추가
    const dataWithImages = transformedData.map(item => ({
      ...item,
      mainImage: getRecommendationImage(item.id)
    }));
    
    return dataWithImages;
  } catch (error: any) {
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
    
    // 각 추천 장소에 대표 이미지 추가
    const dataWithImages = transformedData.map(item => ({
      ...item,
      mainImage: getRecommendationImage(item.id)
    }));
    
    console.log('🔄 변환된 데이터 (이미지 포함):', dataWithImages.length, '개');
    return dataWithImages;
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
 * 추천 장소 이미지 조회 (임시로 주석처리)
 * GET /recommendation/image?recommendationId={id}
 * 설명: 추천 장소의 이미지를 가져옵니다
 */
// export const getRecommendationImage = async (recommendationId: number): Promise<string> => {
//   try {
//     console.log('🔍 추천 장소 이미지 조회:', recommendationId);
    
//     const response = await apiClient.get(`/recommendation/image?recommendationId=${recommendationId}`, {
//       responseType: 'blob'
//     });
    
//     console.log('✅ 추천 장소 이미지 조회 성공');
    
//     // Blob을 URL로 변환
//     const imageUrl = URL.createObjectURL(response.data);
//     return imageUrl;
//   } catch (error) {
//     console.error('❌ 추천 장소 이미지 조회 실패:', error);
//     // 기본 이미지 반환
//     return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=300&h=300&fit=crop';
//   }
// };

// 임시 이미지 배열 (풍경 사진들)
const landscapeImages = [
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', // 산과 호수
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop', // 숲 속
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop', // 자연 경관
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop', // 바다
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop', // 강과 숲
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop', // 해안
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=400&fit=crop', // 산맥
  'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=400&h=400&fit=crop', // 별이 빛나는 하늘
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', // 호수
  'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?w=400&h=400&fit=crop', // 폭포
  'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=400&fit=crop', // 강변
  'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=400&fit=crop', // 해안 절벽
  'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=400&fit=crop', // 가을 숲
  'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=400&fit=crop', // 초원
  'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop', // 호수와 산
  'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=400&fit=crop', // 해안 풍경
  'https://images.unsplash.com/photo-1571896349842-33c8de2d89a2?w=400&h=400&fit=crop', // 바다 파도
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop', // 강릉 커피거리
  'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=400&fit=crop', // 전주 한옥마을
  'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=400&fit=crop', // 제주도
  'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=400&fit=crop', // 자연 풍경
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop', // 공원
  'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=400&fit=crop', // 카페 거리
  'https://images.unsplash.com/photo-1571896349842-33c8de2d89a2?w=400&h=400&fit=crop', // 해변
  'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=400&fit=crop', // 문화재
];

export const getRecommendationImage = (recommendationId: number): string => {
  // ID 기반으로 일관된 이미지 선택
  const imageIndex = recommendationId % landscapeImages.length;
  return landscapeImages[imageIndex];
};

/**
 * 좋아요 토글 (API 문서 기반)
 * PUT /recommendation/like?recommendationId={id}&memberId={memberId}
 */
export const toggleRecommendationLike = async (recommendationId: number, memberId: number): Promise<number> => {
  try {
    console.log('🔍 추천 장소 좋아요 토글:', { recommendationId, memberId });
    
    const response = await apiClient.put(`/recommendation/like?recommendationId=${recommendationId}&memberId=${memberId}`);
    
    console.log('✅ 추천 장소 좋아요 토글 성공:', response.data);
    
    // API 문서에 따르면 추천 장소 ID를 반환
    return response.data;
  } catch (error) {
    console.error('❌ 추천 장소 좋아요 토글 실패:', error);
    throw error;
  }
};

/**
 * 추천 장소 삭제
 * DELETE /recommend?placeId={placeId}
 */
export const deleteRecommendation = async (
  placeId: number,
  token: string
): Promise<number> => {
  try {
    console.log('🔄 추천 장소 삭제 시작:', { placeId, token: token.substring(0, 20) + '...' });
    
    const response = await fetch(`http://192.168.219.112:8080/recommend?placeId=${placeId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('📡 추천 장소 삭제 응답 받음:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`  OK: ${response.ok}`);
    
    if (!response.ok) {
      console.log('❌ 추천 장소 삭제 실패:');
      console.log(`  Status: ${response.status}`);
      console.log(`  Status Text: ${response.statusText}`);
      
      // 에러 응답 본문도 로그
      try {
        const errorText = await response.text();
        console.log(`  Error Body: ${errorText}`);
      } catch (e) {
        console.log('  Error Body: 읽기 실패');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('📄 추천 장소 삭제 응답 본문 파싱 중...');
    
    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    console.log(`  Content-Type: ${contentType}`);
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // JSON이 아닌 경우 텍스트로 파싱
      const textResult = await response.text();
      console.log(`  Raw Response: ${textResult}`);
      
      // 숫자인지 확인하고 파싱
      const parsedResult = parseInt(textResult.trim());
      result = isNaN(parsedResult) ? textResult : parsedResult;
    }
    
    console.log('✅ 추천 장소 삭제 성공:');
    console.log(`  삭제된 ID: ${JSON.stringify(result, null, 2)}`);
    console.log(`  응답 타입: ${typeof result}`);
    
    return result;
  } catch (error) {
    console.error('❌ 추천 장소 삭제 실패:');
    console.error(`  Error Type: ${typeof error}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Error Stack: ${error.stack}`);
    
    if (error.response) {
      console.error(`  Response Status: ${error.response.status}`);
      console.error(`  Response Data: ${error.response.data}`);
    }
    
    if (error.request) {
      console.error(`  Request: ${error.request}`);
    }
    
    throw error;
  }
};

/**
 * 추천 장소 메인 이미지 설정
 * POST /recommend/image
 */
export const setMainImageOfRecommendation = async (
  recommendationId: number,
  imageFile: any,
  token: string
): Promise<number> => {
  try {
    console.log('🔄 추천 장소 메인 이미지 설정 시작:', { recommendationId, token: token.substring(0, 20) + '...' });
    
    const formData = new FormData();
    formData.append('image', imageFile);
    
    // FormData 내용 상세 로그
    console.log('🔍 메인 이미지 FormData 상세 정보:');
    console.log(`  image: [File] ${imageFile.name || 'unnamed'} (${imageFile.type || 'unknown type'})`);
    
    console.log('🌐 메인 이미지 API 요청 시작:');
    console.log(`  URL: http://192.168.219.112:8080/recommend/image?recommendationId=${recommendationId}`);
    console.log(`  Method: POST`);
    console.log(`  Headers: Authorization: Bearer ${token.substring(0, 20)}...`);
    
    const response = await fetch(`http://192.168.219.112:8080/recommend/image?recommendationId=${recommendationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    console.log('📡 메인 이미지 API 응답 받음:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`  OK: ${response.ok}`);
    
    if (!response.ok) {
      console.log('❌ 메인 이미지 API 요청 실패:');
      console.log(`  Status: ${response.status}`);
      console.log(`  Status Text: ${response.statusText}`);
      
      // 에러 응답 본문도 로그
      try {
        const errorText = await response.text();
        console.log(`  Error Body: ${errorText}`);
      } catch (e) {
        console.log('  Error Body: 읽기 실패');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('📄 메인 이미지 응답 본문 파싱 중...');
    
    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    console.log(`  Content-Type: ${contentType}`);
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      // JSON이 아닌 경우 텍스트로 파싱
      const textResult = await response.text();
      console.log(`  Raw Response: ${textResult}`);
      
      // 숫자인지 확인하고 파싱
      const parsedResult = parseInt(textResult.trim());
      result = isNaN(parsedResult) ? textResult : parsedResult;
    }
    
    console.log('✅ 추천 장소 메인 이미지 설정 성공:');
    console.log(`  응답 데이터: ${JSON.stringify(result, null, 2)}`);
    console.log(`  응답 타입: ${typeof result}`);
    
    return result;
  } catch (error) {
    console.error('❌ 추천 장소 메인 이미지 설정 실패:');
    console.error(`  Error Type: ${typeof error}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Error Stack: ${error.stack}`);
    
    if (error.response) {
      console.error(`  Response Status: ${error.response.status}`);
      console.error(`  Response Data: ${error.response.data}`);
    }
    
    if (error.request) {
      console.error(`  Request: ${error.request}`);
    }
    
    throw error;
  }
};

/**
 * 추천 장소 기본 정보 수정
 * PATCH /recommend
 */
export const updateRecommendation = async (
  updateData: {
    placeId: number;
    title: string;
    subTitle: string;
    location: {
      name: string;
      latitude: number;
      longitude: number;
    };
    price: string;
    tags: string;
  },
  token: string
): Promise<RecommendReadDto> => {
  try {
    console.log('🔄 추천 장소 기본 정보 수정 시작:', { updateData, token: token.substring(0, 20) + '...' });
    
    const requestBody = {
      placeId: updateData.placeId,
      title: updateData.title,
      subTitle: updateData.subTitle,
      location: updateData.location,
      price: updateData.price,
      tags: updateData.tags
    };
    
    console.log('🌐 추천 장소 수정 API 요청 시작:');
    console.log(`  URL: http://192.168.219.112:8080/recommend`);
    console.log(`  Method: PATCH`);
    console.log(`  Headers: Authorization: Bearer ${token.substring(0, 20)}...`);
    console.log(`  Body:`, JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(`http://192.168.219.112:8080/recommend`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(requestBody),
    });
    
    console.log('📡 추천 장소 수정 API 응답 받음:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`  OK: ${response.ok}`);
    
    if (!response.ok) {
      console.log('❌ 추천 장소 수정 API 요청 실패:');
      console.log(`  Status: ${response.status}`);
      console.log(`  Status Text: ${response.statusText}`);
      
      // 에러 응답 본문도 로그
      try {
        const errorText = await response.text();
        console.log(`  Error Body: ${errorText}`);
      } catch (e) {
        console.log('  Error Body: 읽기 실패');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('📄 추천 장소 수정 응답 본문 파싱 중...');
    
    const contentType = response.headers.get('content-type');
    console.log(`  Content-Type: ${contentType}`);
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const textResult = await response.text();
      console.log(`  Raw Response: ${textResult}`);
      result = textResult;
    }
    
    console.log('✅ 추천 장소 기본 정보 수정 성공:');
    console.log(`  응답 데이터: ${JSON.stringify(result, null, 2)}`);
    console.log(`  응답 타입: ${typeof result}`);
    
    return result;
  } catch (error: any) {
    console.error('❌ 추천 장소 기본 정보 수정 실패:');
    console.error(`  Error Type: ${typeof error}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Error Stack: ${error.stack}`);
    
    if (error.response) {
      console.error(`  Response Status: ${error.response.status}`);
      console.error(`  Response Data: ${error.response.data}`);
    }
    
    if (error.request) {
      console.error(`  Request: ${error.request}`);
    }
    
    throw error;
  }
};

/**
 * 추천 장소 블록 수정
 * PATCH /recommend/blocks/{blockId}
 */
export const updateRecommendationBlock = async (
  blockId: number,
  blockData: {
    type: string;
    text?: string;
    imageFile?: any;
    caption?: string;
    orderIndex: string;
  },
  token: string
): Promise<RecommendationBlockUpdateDto> => {
  try {
    console.log('🔄 추천 장소 블록 수정 시작:', { blockId, blockData, token: token.substring(0, 20) + '...' });
    
    const formData = new FormData();
    formData.append('type', blockData.type);
    formData.append('orderIndex', blockData.orderIndex);
    
    if (blockData.text) {
      formData.append('text', blockData.text);
    }
    
    if (blockData.imageFile) {
      formData.append('imageFile', blockData.imageFile);
    }
    
    if (blockData.caption) {
      formData.append('caption', blockData.caption);
    }
    
    // FormData 내용 상세 로그
    console.log('🔍 블록 수정 FormData 상세 정보:');
    // FormData.entries()는 React Native에서 지원되지 않으므로 로그 제거
    
    console.log('🌐 블록 수정 API 요청 시작:');
    console.log(`  URL: http://192.168.219.112:8080/recommend/blocks/${blockId}`);
    console.log(`  Method: PATCH`);
    console.log(`  Headers: Authorization: Bearer ${token.substring(0, 20)}...`);
    
    const response = await fetch(`http://192.168.219.112:8080/recommend/blocks/${blockId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    console.log('📡 블록 수정 API 응답 받음:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`  OK: ${response.ok}`);
    
    if (!response.ok) {
      console.log('❌ 블록 수정 API 요청 실패:');
      console.log(`  Status: ${response.status}`);
      console.log(`  Status Text: ${response.statusText}`);
      
      // 에러 응답 본문도 로그
      try {
        const errorText = await response.text();
        console.log(`  Error Body: ${errorText}`);
      } catch (e) {
        console.log('  Error Body: 읽기 실패');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('📄 블록 수정 응답 본문 파싱 중...');
    
    const contentType = response.headers.get('content-type');
    console.log(`  Content-Type: ${contentType}`);
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
    } else {
      const textResult = await response.text();
      console.log(`  Raw Response: ${textResult}`);
      result = textResult;
    }
    
    console.log('✅ 추천 장소 블록 수정 성공:');
    console.log(`  응답 데이터: ${JSON.stringify(result, null, 2)}`);
    console.log(`  응답 타입: ${typeof result}`);
    
    return result;
  } catch (error: any) {
    console.error('❌ 추천 장소 블록 수정 실패:');
    console.error(`  Error Type: ${typeof error}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Error Stack: ${error.stack}`);
    
    if (error.response) {
      console.error(`  Response Status: ${error.response.status}`);
      console.error(`  Response Data: ${error.response.data}`);
    }
    
    if (error.request) {
      console.error(`  Request: ${error.request}`);
    }
    
    throw error;
  }
};

/**
 * 추천 장소 블록 삭제
 * DELETE /recommend/blocks/{blockId}
 */
export const deleteRecommendationBlock = async (
  blockId: number,
  token: string
): Promise<void> => {
  try {
    console.log('🔄 추천 장소 블록 삭제 시작:', { blockId });
    
    console.log('🌐 블록 삭제 API 요청 시작:');
    console.log(`  URL: http://192.168.219.112:8080/recommend/blocks/${blockId}`);
    console.log(`  Method: DELETE`);
    console.log(`  Headers: Authorization: Bearer ${token.substring(0, 20)}...`);
    
    const response = await fetch(`http://192.168.219.112:8080/recommend/blocks/${blockId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    
    console.log('📡 블록 삭제 API 응답 받음:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`  OK: ${response.ok}`);
    
    if (!response.ok) {
      console.log('❌ 블록 삭제 API 요청 실패:');
      console.log(`  Status: ${response.status}`);
      console.log(`  Status Text: ${response.statusText}`);
      
      // 에러 응답 본문도 로그
      try {
        const errorText = await response.text();
        console.log(`  Error Body: ${errorText}`);
      } catch (e) {
        console.log('  Error Body: 읽기 실패');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('✅ 추천 장소 블록 삭제 성공');
  } catch (error: any) {
    console.error('❌ 추천 장소 블록 삭제 실패:');
    console.error(`  Error Type: ${typeof error}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Error Stack: ${error.stack}`);
    
    if (error.response) {
      console.error(`  Response Status: ${error.response.status}`);
      console.error(`  Response Data: ${error.response.data}`);
    }
    
    if (error.request) {
      console.error(`  Request: ${error.request}`);
    }
    
    throw error;
  }
};

/**
 * 추천 장소 블록 추가
 * POST /recommend/{recommendationId}/blocks
 */
export const addRecommendationBlock = async (
  recommendationId: number,
  blockData: {
    type: string;
    text?: string;
    imageFile?: any;
    caption?: string;
    orderIndex: string;
  },
  token: string
): Promise<any> => {
  try {
    console.log('🔄 추천 장소 블록 추가 시작:', { recommendationId, blockData, token: token.substring(0, 20) + '...' });
    
    const formData = new FormData();
    formData.append('type', blockData.type);
    formData.append('orderIndex', blockData.orderIndex);
    
    if (blockData.text) {
      formData.append('text', blockData.text);
    }
    
    if (blockData.imageFile) {
      formData.append('imageFile', blockData.imageFile);
    }
    
    if (blockData.caption) {
      formData.append('caption', blockData.caption);
    }
    
    // FormData 내용 상세 로그
    console.log('🔍 블록 FormData 상세 정보:');
    // FormData.entries()는 React Native에서 지원되지 않으므로 로그 제거
    
    console.log('🌐 블록 API 요청 시작:');
    console.log(`  URL: http://192.168.219.112:8080/recommend/${recommendationId}/blocks`);
    console.log(`  Method: POST`);
    console.log(`  Headers: Authorization: Bearer ${token.substring(0, 20)}...`);
    console.log(`  Body: FormData with fields`);
    
    const response = await fetch(`http://192.168.219.112:8080/recommend/${recommendationId}/blocks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        'Authorization': `Bearer ${token}`,
      },
      body: formData,
    });
    
    console.log('📡 블록 API 응답 받음:');
    console.log(`  Status: ${response.status}`);
    console.log(`  Status Text: ${response.statusText}`);
    console.log(`  Headers:`, Object.fromEntries(response.headers.entries()));
    console.log(`  OK: ${response.ok}`);
    
    if (!response.ok) {
      console.log('❌ 블록 API 요청 실패:');
      console.log(`  Status: ${response.status}`);
      console.log(`  Status Text: ${response.statusText}`);
      
      // 에러 응답 본문도 로그
      try {
        const errorText = await response.text();
        console.log(`  Error Body: ${errorText}`);
      } catch (e) {
        console.log('  Error Body: 읽기 실패');
      }
      
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    console.log('📄 블록 응답 본문 파싱 중...');
    
    // 응답이 JSON인지 확인
    const contentType = response.headers.get('content-type');
    console.log(`  Content-Type: ${contentType}`);
    
    let result;
    if (contentType && contentType.includes('application/json')) {
      result = await response.json();
      console.log('✅ 추천 장소 블록 추가 성공 (JSON 응답):');
      console.log(`  응답 데이터: ${JSON.stringify(result, null, 2)}`);
      console.log(`  응답 타입: ${typeof result}`);
      
      // RecommendationBlockReadDto 구조 확인
      if (result && typeof result === 'object') {
        console.log('📋 RecommendationBlockReadDto 필드:');
        console.log(`  id: ${result.id}`);
        console.log(`  type: ${result.type}`);
        console.log(`  text: ${result.text || '없음'}`);
        console.log(`  caption: ${result.caption || '없음'}`);
        console.log(`  orderIndex: ${result.orderIndex}`);
        if (result.image) {
          console.log(`  image: ${JSON.stringify(result.image)}`);
        } else {
          console.log(`  image: 없음`);
        }
      }
    } else {
      // JSON이 아닌 경우 텍스트로 파싱
      const textResult = await response.text();
      console.log(`  Raw Response: ${textResult}`);
      result = textResult;
    }
    
    return result;
  } catch (error: any) {
    console.error('❌ 추천 장소 블록 추가 실패:');
    console.error(`  Error Type: ${typeof error}`);
    console.error(`  Error Message: ${error.message}`);
    console.error(`  Error Stack: ${error.stack}`);
    
    if (error.response) {
      console.error(`  Response Status: ${error.response.status}`);
      console.error(`  Response Data: ${error.response.data}`);
    }
    
    if (error.request) {
      console.error(`  Request: ${error.request}`);
    }
    
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