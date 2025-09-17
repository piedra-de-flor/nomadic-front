import apiClient from '../api/client';

// 장소 검색 결과 타입
export interface PlaceSearchResult {
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  placeId?: string;
}

// Google Places API 키 (실제 사용 시 환경변수로 관리)
const GOOGLE_PLACES_API_KEY = 'AIzaSyAlCI_PdY5Z4dL-EXaMdagQlyaUAe6GpIs'; // 새로운 API 키

// 장소 검색 서비스
export const searchPlaces = async (query: string): Promise<PlaceSearchResult[]> => {
  try {
    console.log('🔍 Google Places API (New) 검색 시작:', query);
    console.log('🔍 API 요청 URL:', 'https://places.googleapis.com/v1/places:searchText');
    console.log('🔍 API 요청 헤더:', {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY ? 'API 키 있음' : 'API 키 없음',
      'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id'
    });
    console.log('🔍 API 요청 바디:', {
      textQuery: query,
      languageCode: 'ko',
      regionCode: 'KR',
      maxResultCount: 10
    });
    
    // Google Places API (New) 사용
    const response = await fetch(
      `https://places.googleapis.com/v1/places:searchText`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': GOOGLE_PLACES_API_KEY,
          'X-Goog-FieldMask': 'places.displayName,places.formattedAddress,places.location,places.id'
        },
        body: JSON.stringify({
          textQuery: query,
          languageCode: 'ko',
          regionCode: 'KR',
          maxResultCount: 10
        })
      }
    );
    
    console.log('🔍 API 응답 상태:', response.status, response.statusText);
    console.log('🔍 API 응답 헤더:', Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log('🔍 API 응답 데이터 (원본):', JSON.stringify(data, null, 2));
    
    if (response.ok && data.places) {
      console.log('🔍 검색된 장소 개수:', data.places.length);
      console.log('🔍 검색된 장소 원본 데이터:', JSON.stringify(data.places, null, 2));
      
      const results: PlaceSearchResult[] = data.places.map((place: any, index: number) => {
        console.log(`🔍 장소 ${index + 1} 원본 데이터:`, JSON.stringify(place, null, 2));
        console.log(`🔍 장소 ${index + 1} displayName:`, place.displayName);
        console.log(`🔍 장소 ${index + 1} formattedAddress:`, place.formattedAddress);
        console.log(`🔍 장소 ${index + 1} location:`, place.location);
        console.log(`🔍 장소 ${index + 1} id:`, place.id);
        
        const result = {
          name: place.displayName?.text || '이름 없음',
          address: place.formattedAddress || '주소 없음',
          latitude: place.location?.latitude || 0,
          longitude: place.location?.longitude || 0,
          placeId: place.id
        };
        
        console.log(`🔍 장소 ${index + 1} 변환된 결과:`, result);
        return result;
      });
      
      console.log('✅ Google Places API (New) 검색 성공 - 최종 결과:', JSON.stringify(results, null, 2));
      return results;
    } else {
      console.error('❌ Google Places API (New) 에러 - 응답 상태:', response.status);
      console.error('❌ Google Places API (New) 에러 - 응답 데이터:', JSON.stringify(data, null, 2));
      return [];
    }
  } catch (error) {
    console.error('❌ Google Places API (New) 검색 실패:', error);
    console.error('❌ 에러 타입:', typeof error);
    console.error('❌ 에러 메시지:', error.message);
    console.error('❌ 에러 스택:', error.stack);
    
    // API 실패 시 더미 데이터 반환 (개발용)
    console.log('🔄 더미 데이터 반환으로 대체');
    return getDummyPlaces(query);
  }
};

// 개발용 더미 데이터
const getDummyPlaces = (query: string): PlaceSearchResult[] => {
  const dummyPlaces: PlaceSearchResult[] = [
    {
      name: `${query} - 강남역`,
      address: '서울특별시 강남구 강남대로 396',
      latitude: 37.4979,
      longitude: 127.0276,
      placeId: 'place_1'
    },
    {
      name: `${query} - 홍대입구역`,
      address: '서울특별시 마포구 양화로 188',
      latitude: 37.5563,
      longitude: 126.9226,
      placeId: 'place_2'
    },
    {
      name: `${query} - 명동`,
      address: '서울특별시 중구 명동',
      latitude: 37.5636,
      longitude: 126.9826,
      placeId: 'place_3'
    }
  ];
  
  return dummyPlaces.filter(place => 
    place.name.toLowerCase().includes(query.toLowerCase()) ||
    place.address.toLowerCase().includes(query.toLowerCase())
  );
};

