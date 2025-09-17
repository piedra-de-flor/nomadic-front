import apiClient from '../api/client';
import { API_CONFIG } from '../../constants';
import { Accommodation } from '../../types';

// 숙소 검색 요청 타입
export interface AccommodationSearchRequest {
  keyword: string;
  page?: number;
  size?: number;
  sortBy?: 'rating' | 'price' | 'distance' | 'popularity';
  sortOrder?: 'asc' | 'desc';
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  region?: string;
}

// 숙소 검색 응답 타입
export interface AccommodationSearchResponse {
  content: Accommodation[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

// 자동완성 요청 타입
export interface AutocompleteRequest {
  query: string;
  limit?: number;
}

// 자동완성 응답 타입
export interface AutocompleteResponse {
  suggestions: string[];
  totalCount: number;
}

// 오타 검증 요청 타입
export interface TypoCorrectionRequest {
  query: string;
}

// 오타 검증 응답 타입
export interface TypoCorrectionResponse {
  originalQuery: string;
  correctedQuery?: string;
  hasTypo: boolean;
  confidence: number;
  suggestions: string[];
}

// 숙소 검색
export const searchAccommodations = async (params: AccommodationSearchRequest): Promise<AccommodationSearchResponse> => {
  try {
    console.log('🔍 숙소 검색 API 호출:', params);
    
    const response = await apiClient.get<AccommodationSearchResponse>(API_CONFIG.ENDPOINTS.ACCOMMODATION_SEARCH, {
      params: {
        q: params.keyword, // API에서 요구하는 파라미터명으로 변경
        page: params.page || 0,
        size: params.size || 20,
        sort: params.sortBy || 'ID_ASC', // sort 파라미터로 변경 (기본값: ID_ASC)
        minPrice: params.minPrice,
        maxPrice: params.maxPrice,
        rating: params.rating,
        amenities: params.amenities?.join(','),
        region: params.region,
      }
    });
    
    console.log('✅ 숙소 검색 API 응답:', response.data);
    console.log('📊 응답 데이터 타입:', typeof response.data);
    console.log('📊 응답이 배열인가?', Array.isArray(response.data));
    console.log('📊 응답 구조:', JSON.stringify(response.data, null, 2));
    
    // 응답 구조 확인 및 정규화
    let normalizedResponse = response.data;
    
    if (response.data && typeof response.data === 'object') {
      if (response.data.content && Array.isArray(response.data.content)) {
        console.log('📋 content 배열 길이:', response.data.content.length);
        if (response.data.content.length > 0) {
          console.log('📋 첫 번째 숙소 데이터:', response.data.content[0]);
        }
        // 이미 올바른 구조
        normalizedResponse = response.data;
      } else if (Array.isArray(response.data)) {
        console.log('📋 직접 배열 길이:', response.data.length);
        if (response.data.length > 0) {
          console.log('📋 첫 번째 숙소 데이터:', response.data[0]);
        }
        // 배열을 content 구조로 변환
        normalizedResponse = {
          content: response.data,
          totalElements: response.data.length,
          totalPages: 1,
          currentPage: 0,
          size: response.data.length,
          hasNext: false,
          hasPrevious: false
        };
      } else {
        console.warn('⚠️ 예상하지 못한 응답 구조, 기본값 사용');
        normalizedResponse = {
          content: [],
          totalElements: 0,
          totalPages: 0,
          currentPage: 0,
          size: 0,
          hasNext: false,
          hasPrevious: false
        };
      }
    }
    
    console.log('🎯 정규화된 응답:', normalizedResponse);
    return normalizedResponse;
  } catch (error) {
    console.error('❌ 숙소 검색 API 실패:', error);
    console.error('❌ 에러 상세:', {
      message: error.message,
      status: error.response?.status,
      data: error.response?.data,
      config: error.config
    });
    throw error;
  }
};

// 자동완성 검색
export const getAutocompleteSuggestions = async (params: AutocompleteRequest): Promise<AutocompleteResponse> => {
  try {
    console.log('🔍 자동완성 API 호출:', params);
    
    const response = await apiClient.get(API_CONFIG.ENDPOINTS.ACCOMMODATION_AUTOCOMPLETE, {
      params: {
        q: params.query, // API에서 요구하는 파라미터명으로 변경
        limit: params.limit || 10,
      }
    });
    
    console.log('✅ 자동완성 API 원본 응답:', response.data);
    console.log('📋 응답 데이터 타입:', typeof response.data);
    console.log('📋 응답이 배열인가?', Array.isArray(response.data));
    if (Array.isArray(response.data) && response.data.length > 0) {
      console.log('📋 첫 번째 항목:', response.data[0]);
      console.log('📋 첫 번째 항목 타입:', typeof response.data[0]);
    }
    
    // API 응답 구조에 따라 적절히 변환
    let suggestions: string[] = [];
    
    if (Array.isArray(response.data)) {
      // 응답이 배열인 경우 - 객체 배열일 수 있음
      suggestions = response.data.map((item: any) => {
        if (typeof item === 'string') {
          return item;
        } else if (item && typeof item === 'object') {
          // 객체인 경우 text 필드에서 쉼표로 나누어 첫 번째 항목만 사용
          const text = item.text || item.name || item.title || '';
          if (text) {
            // 쉼표로 나누어 첫 번째 항목만 반환
            return text.split(',')[0].trim();
          }
          return JSON.stringify(item);
        }
        return String(item);
      });
    } else if (response.data && Array.isArray(response.data.suggestions)) {
      // 응답이 객체이고 suggestions 배열이 있는 경우
      suggestions = response.data.suggestions.map((item: any) => {
        if (typeof item === 'string') {
          return item;
        } else if (item && typeof item === 'object') {
          const text = item.text || item.name || item.title || '';
          if (text) {
            return text.split(',')[0].trim();
          }
          return JSON.stringify(item);
        }
        return String(item);
      });
    } else if (response.data && Array.isArray(response.data.data)) {
      // 응답이 객체이고 data 배열이 있는 경우
      suggestions = response.data.data.map((item: any) => {
        if (typeof item === 'string') {
          return item;
        } else if (item && typeof item === 'object') {
          const text = item.text || item.name || item.title || '';
          if (text) {
            return text.split(',')[0].trim();
          }
          return JSON.stringify(item);
        }
        return String(item);
      });
    } else if (response.data && Array.isArray(response.data.results)) {
      // 응답이 객체이고 results 배열이 있는 경우
      suggestions = response.data.results.map((item: any) => {
        if (typeof item === 'string') {
          return item;
        } else if (item && typeof item === 'object') {
          const text = item.text || item.name || item.title || '';
          if (text) {
            return text.split(',')[0].trim();
          }
          return JSON.stringify(item);
        }
        return String(item);
      });
    } else {
      console.warn('⚠️ 예상하지 못한 API 응답 구조:', response.data);
      suggestions = [];
    }
    
    // 중복 제거
    const uniqueSuggestions = [...new Set(suggestions)];
    
    const result: AutocompleteResponse = {
      suggestions: uniqueSuggestions,
      totalCount: uniqueSuggestions.length
    };
    
    console.log('✅ 자동완성 변환된 응답:', result);
    return result;
    } catch (error) {
      console.error('❌ 자동완성 API 실패:', error);
      
      // API 실패 시 데모 데이터 반환
      const demoData = getDemoAutocompleteData(params.query);
      console.log('🔄 데모 자동완성 데이터 사용:', demoData);
      return demoData;
    }
};

// 오타 검증
export const checkTypoCorrection = async (params: TypoCorrectionRequest): Promise<TypoCorrectionResponse> => {
  try {
    console.log('🔍 오타 검증 API 호출:', params);
    
    const response = await apiClient.get(
      API_CONFIG.ENDPOINTS.ACCOMMODATION_TYPO_CORRECTION,
      {
        params: {
          query: params.query, // API에서 요구하는 파라미터명으로 변경
        }
      }
    );
    
    console.log('✅ 오타 검증 API 원본 응답:', response.data);
    
    // API 응답 구조에 따라 적절히 변환
    let result: TypoCorrectionResponse;
    
    if (response.data && typeof response.data === 'object') {
      // API 응답이 객체인 경우
      result = {
        originalQuery: response.data.originalQuery || params.query,
        correctedQuery: response.data.correctedQuery || response.data.suggestion,
        hasTypo: response.data.hasTypo || response.data.isTypo || false,
        confidence: response.data.confidence || response.data.score || 0,
        suggestions: response.data.suggestions || response.data.alternatives || []
      };
    } else {
      // 예상하지 못한 응답 구조인 경우 기본값 반환
      result = {
        originalQuery: params.query,
        correctedQuery: undefined,
        hasTypo: false,
        confidence: 0,
        suggestions: []
      };
    }
    
    console.log('✅ 오타 검증 변환된 응답:', result);
    return result;
  } catch (error) {
    console.error('❌ 오타 검증 API 실패:', error);
    
    // API 실패 시 기본값 반환 (오타 없음으로 처리)
    return {
      originalQuery: params.query,
      correctedQuery: undefined,
      hasTypo: false,
      confidence: 0,
      suggestions: []
    };
  }
};

// 데모 자동완성 데이터
const getDemoAutocompleteData = (query: string): AutocompleteResponse => {
  const demoData: { [key: string]: string[] } = {
    '제주': ['제주도', '제주시', '제주 공항', '제주 올레길', '제주 한라산', '제주 성산일출봉'],
    '부산': ['부산 해운대', '부산 감천문화마을', '부산 자갈치시장', '부산 태종대', '부산 광안리', '부산 남포동'],
    '강릉': ['강릉 커피거리', '강릉 안목해변', '강릉 경포대', '강릉 주문진', '강릉 정동진', '강릉 오죽헌'],
    '전주': ['전주 한옥마을', '전주 비빔밥', '전주 경기전', '전주 풍남문', '전주 덕진공원', '전주 전동성당'],
    '여수': ['여수 밤바다', '여수 오동도', '여수 돌산도', '여수 향일암', '여수 엑스포', '여수 진남관'],
    '서울': ['서울 강남', '서울 명동', '서울 홍대', '서울 이태원', '서울 인사동', '서울 남산타워'],
    '경주': ['경주 불국사', '경주 석굴암', '경주 첨성대', '경주 대릉원', '경주 안압지', '경주 보문단지'],
  };

  // 입력된 텍스트와 가장 유사한 키워드 찾기
  for (const key in demoData) {
    if (query.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(query.toLowerCase())) {
      return {
        suggestions: demoData[key],
        totalCount: demoData[key].length
      };
    }
  }

  // 기본 관련 검색어
  return {
    suggestions: ['제주도', '부산 해운대', '강릉 커피거리', '전주 한옥마을', '여수 밤바다'],
    totalCount: 5
  };
};

// 인기 검색어 (현재는 하드코딩, 추후 API 연동 가능)
export const getPopularSearches = async (): Promise<string[]> => {
  // TODO: 추후 인기 검색어 API 연동
  return [
    '제주도',
    '부산 해운대',
    '강릉 커피거리',
    '전주 한옥마을',
    '여수 밤바다',
    '서울 강남',
    '경주 불국사',
    '안동 하회마을',
    '통영 미륵산',
    '속초 설악산'
  ];
};
