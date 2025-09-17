import apiClient from '../api/client';
import { API_CONFIG } from '../../constants';

// 지도 위치 타입 정의
export interface MapLocation {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  description?: string;
}

// 지도 데이터 응답 타입
export interface MapDataResponse {
  locations: MapLocation[];
}

// HTML을 WebView에 최적화
const optimizeHTMLForWebView = (html: string): string => {
  try {
    console.log('🔧 HTML WebView 최적화 시작');
    
    // DOCTYPE과 meta 태그 추가
    if (!html.includes('<!DOCTYPE html>')) {
      html = '<!DOCTYPE html>\n' + html;
    }
    
    // viewport meta 태그 추가
    if (!html.includes('viewport')) {
      html = html.replace('<head>', '<head>\n        <meta charset="utf-8">\n        <meta name="viewport" content="width=device-width, initial-scale=1.0">');
    }
    
    // CSS 스타일 추가 - 기존 스타일을 완전히 교체
    const styleTag = `
        <style>
            body, html {
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                overflow: hidden;
            }
            #map_div {
                height: 100vh !important;
                width: 100vw !important;
                min-height: 200px;
            }
        </style>`;
    
    // 기존 스타일 제거하고 새 스타일 추가
    html = html.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');
    html = html.replace('</head>', styleTag + '\n    </head>');
    
    // map_div 스타일 속성 제거
    html = html.replace(/<div id="map_div" style="[^"]*">/g, '<div id="map_div">');
    
    // 콜백 함수 추가
    if (!html.includes('callback=initMap')) {
      html = html.replace(
        '&libraries=visualization">',
        '&libraries=visualization&callback=initMap">'
      );
    }
    
    // initMap 함수에 에러 처리 추가
    if (!html.includes('console.log')) {
      html = html.replace(
        'function initMap() {',
        `function initMap() {
            console.log('🗺️ 지도 초기화 시작');
            try {`
      );
      html = html.replace(
        '}',
        `}
            } catch (error) {
                console.error('❌ 지도 초기화 에러:', error);
            }
        }`
      );
    }
    
    console.log('🔧 HTML WebView 최적화 완료');
    return html;
    
  } catch (error) {
    console.error('❌ HTML 최적화 에러:', error);
    return html;
  }
};

// 계획의 지도 HTML 조회
export const getPlanMapHTML = async (planId: number): Promise<string> => {
  try {
    console.log('🗺️ 계획 지도 HTML API 호출:', planId);

    // HTML 응답 받기
    const response = await apiClient.get(`/show-map?planId=${planId}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });

    console.log('🗺️ 계획 지도 HTML API 응답:', response.data);

    // 서버 응답 HTML을 그대로 사용
    return response.data;

  } catch (error) {
    console.error('❌ 계획 지도 HTML API 에러:', error);

    // 에러 시 기본 HTML 반환
    return getDefaultMapHTML();
  }
};

// 계획의 지도 데이터 조회 (HTML 응답 파싱)
export const getPlanMapData = async (planId: number): Promise<MapLocation[]> => {
  try {
    console.log('🗺️ 계획 지도 데이터 API 호출:', planId);
    
    // HTML 응답 받기
    const response = await apiClient.get(`/show-map?planId=${planId}`, {
      headers: {
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8'
      }
    });
    
    console.log('🗺️ 계획 지도 데이터 API 응답 (HTML):', response.data);
    
    // HTML에서 locations JavaScript 변수 파싱
    const locations = parseLocationsFromHTML(response.data);
    
    console.log('🗺️ 추출된 지도 위치 데이터:', locations);
    return locations;
    
  } catch (error) {
    console.error('❌ 계획 지도 데이터 API 에러:', error);
    
    // 에러 시 데모 데이터 반환
    return getMockMapLocations(planId);
  }
};

// HTML에서 locations JavaScript 변수 파싱
const parseLocationsFromHTML = (html: string): MapLocation[] => {
  try {
    console.log('🔍 HTML에서 locations 변수 파싱 시작');
    
    // locations 변수가 포함된 script 태그 찾기
    const scriptMatch = html.match(/var locations = (\[.*?\]);/s);
    
    if (!scriptMatch) {
      console.warn('⚠️ HTML에서 locations 변수를 찾을 수 없습니다');
      return [];
    }
    
    const locationsString = scriptMatch[1];
    console.log('🔍 추출된 locations 문자열:', locationsString);
    
    // JSON 파싱
    const rawLocations = JSON.parse(locationsString);
    console.log('🔍 파싱된 원본 locations:', rawLocations);
    
    // MapLocation 형태로 변환
    const locations: MapLocation[] = rawLocations.map((location: any, index: number) => ({
      id: index + 1,
      name: location.name || `위치 ${index + 1}`,
      address: location.address || '주소 정보 없음',
      latitude: location.latitude || 0,
      longitude: location.longitude || 0,
      description: location.description || location.name || `위치 ${index + 1}`,
    }));
    
    console.log('🔍 변환된 MapLocation 배열:', locations);
    return locations;
  } catch (error) {
    console.error('❌ HTML 파싱 에러:', error);
    return [];
  }
};

// 기본 지도 HTML (API 에러 시 사용)
const getDefaultMapHTML = (): string => {
  return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            body, html {
                margin: 0;
                padding: 0;
                height: 100%;
                width: 100%;
                overflow: hidden;
            }
            #map_div {
                height: 100vh;
                width: 100vw;
            }
        </style>
        <script>
            var locations = [
              {"latitude":37.5665,"longitude":126.9780,"name":"서울시청"},
              {"latitude":37.5636,"longitude":126.9826,"name":"명동"}
            ];
            
            function initMap() {
                console.log('🗺️ 지도 초기화 시작');
                try {
                    var map = new google.maps.Map(document.getElementById('map_div'), {
                        center: { lat: 37.5665, lng: 126.9780 },
                        zoom: 12,
                        mapTypeId: google.maps.MapTypeId.ROADMAP
                    });

                    var pathCoordinates = locations.map(function (location) {
                        return { lat: location.latitude, lng: location.longitude };
                    });

                    var polyline = new google.maps.Polyline({
                        path: pathCoordinates,
                        strokeColor: '#9400D3',
                        strokeOpacity: 1.0,
                        strokeWeight: 2
                    });

                    polyline.setMap(map);

                    locations.forEach(function (location) {
                        var marker = new google.maps.Marker({
                            position: { lat: location.latitude, lng: location.longitude },
                            map: map,
                            title: location.name
                        });
                    });
                    
                    console.log('🗺️ 지도 초기화 완료');
                } catch (error) {
                    console.error('❌ 지도 초기화 에러:', error);
                }
            }
        </script>
    </head>
    <body>
        <div id="map_div"></div>
        <script async defer 
            src="https://maps.googleapis.com/maps/api/js?key=AIzaSyDDlrPUgoxyo4-R5t9FF_wmmr1gNBoyYQM&v=3.exp&libraries=visualization&callback=initMap">
        </script>
    </body>
    </html>
  `;
};

// 데모 지도 데이터 (API 에러 시 사용)
const getMockMapLocations = (planId: number): MapLocation[] => {
  // planId에 따라 다른 데모 데이터 반환
  if (planId === 1) {
    // 제주도 여행
    return [
      {
        id: 1,
        name: '제주국제공항',
        address: '제주특별자치도 제주시 공항로 2',
        latitude: 33.5120,
        longitude: 126.4929,
        description: '제주도 입구',
      },
      {
        id: 2,
        name: '제주 흑돼지 맛집',
        address: '제주특별자치도 제주시 연동',
        latitude: 33.4996,
        longitude: 126.5312,
        description: '제주도 특산물 흑돼지 구이',
      },
      {
        id: 3,
        name: '한라산 국립공원',
        address: '제주특별자치도 제주시 해안동',
        latitude: 33.3617,
        longitude: 126.5292,
        description: '제주도 최고봉',
      },
      {
        id: 4,
        name: '성산일출봉',
        address: '제주특별자치도 서귀포시 성산읍',
        latitude: 33.4584,
        longitude: 126.9425,
        description: '일출 명소',
      },
    ];
  } else if (planId === 2) {
    // 부산 여행
    return [
      {
        id: 1,
        name: '부산역',
        address: '부산광역시 동구 중앙대로 206',
        latitude: 35.1167,
        longitude: 129.0403,
        description: '부산 입구',
      },
      {
        id: 2,
        name: '해운대 해수욕장',
        address: '부산광역시 해운대구 우동',
        latitude: 35.1587,
        longitude: 129.1603,
        description: '부산 대표 해수욕장',
      },
      {
        id: 3,
        name: '감천문화마을',
        address: '부산광역시 사하구 감내2로 203',
        latitude: 35.0972,
        longitude: 129.0104,
        description: '부산의 마추픽추',
      },
    ];
  } else {
    // 기본 데이터
    return [
      {
        id: 1,
        name: '서울역',
        address: '서울특별시 중구 한강대로 405',
        latitude: 37.5551,
        longitude: 126.9707,
        description: '서울 입구',
      },
      {
        id: 2,
        name: '명동',
        address: '서울특별시 중구 명동',
        latitude: 37.5636,
        longitude: 126.9826,
        description: '쇼핑 명소',
      },
    ];
  }
};
