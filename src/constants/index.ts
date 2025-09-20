// API 관련 상수
export const API_CONFIG = {
  BASE_URL: 'http://50.19.209.214:8080', // 휴대폰에서 접근 시 컴퓨터 IP 사용
  TIMEOUT: 10000,
  ENDPOINTS: {
    // 인증
    SIGN_UP: '/sign-up',
    SIGN_IN: '/sign-in',
    USER: '/user',
    
    // 숙소
    ACCOMMODATIONS: '/accommodations',
    ACCOMMODATION_SEARCH: '/accommodations/search',
    ACCOMMODATION_AUTOCOMPLETE: '/accommodations/autocomplete',
    ACCOMMODATION_TYPO_CORRECTION: '/accommodations/typo-correction',
    
    // 여행 계획
    PLAN: '/plan',
    PLANS: '/plans',
    DETAIL_PLAN: '/detail-plan',
    DETAIL_PLANS: '/detail-plans',
    PLAN_SHARE: '/plan/share',
    PLAN_HISTORY: '/plan',
    SHOW_MAP: '/show-map',
    
    // 추천 장소
    RECOMMENDATIONS: '/recommendations',
    RECOMMENDATION: '/recommendation',
    RECOMMENDATION_LIKE: '/recommendation/like',
    RECOMMENDATION_TOP10: '/recommendations/top10',
    
    // 리뷰
    REVIEW: '/recommendation/review',
    REVIEW_IMAGE: '/recommendation/review/image',
    
    // 알림
    NOTIFICATIONS: '/notifications',
    
    // 신고
    REPORT: '/report',
  }
};

// 앱 관련 상수
export const APP_CONFIG = {
  NAME: 'Nomadic',
  VERSION: '1.0.0',
  STORAGE_KEYS: {
    ACCESS_TOKEN: 'access_token',
    REFRESH_TOKEN: 'refresh_token',
    USER_INFO: 'user_info',
  }
};

// UI 관련 상수
export const UI_CONFIG = {
  COLORS: {
    // 여행 테마 색상
    PRIMARY: '#FF6B35', // 따뜻한 오렌지
    SECONDARY: '#4A90E2', // 하늘색
    ACCENT: '#50C878', // 자연 녹색
    SUCCESS: '#2ECC71',
    WARNING: '#F39C12',
    ERROR: '#E74C3C',
    
    // 배경 색상
    BACKGROUND: '#F8F9FA',
    SURFACE: '#FFFFFF',
    SURFACE_LIGHT: '#FAFBFC',
    
    // 텍스트 색상
    TEXT_PRIMARY: '#2C3E50',
    TEXT_SECONDARY: '#7F8C8D',
    TEXT_LIGHT: '#BDC3C7',
    TEXT_WHITE: '#FFFFFF',
    
    // 테두리 및 그림자
    BORDER: '#E1E8ED',
    BORDER_LIGHT: '#F1F3F4',
    SHADOW: '#00000010',
    
    // 그라데이션 색상
    GRADIENT_START: '#667eea',
    GRADIENT_END: '#764ba2',
    GRADIENT_SUNSET_START: '#ff9a9e',
    GRADIENT_SUNSET_END: '#fecfef',
    GRADIENT_OCEAN_START: '#2196F3',
    GRADIENT_OCEAN_END: '#21CBF3',
    GRADIENT_FOREST_START: '#56ab2f',
    GRADIENT_FOREST_END: '#a8e6cf',
  },
  SPACING: {
    XS: 4,
    SM: 8,
    MD: 16,
    LG: 24,
    XL: 32,
    XXL: 48,
  },
  FONT_SIZES: {
    XS: 12,
    SM: 14,
    MD: 16,
    LG: 18,
    XL: 20,
    XXL: 24,
    TITLE: 28,
  },
  BORDER_RADIUS: {
    SM: 4,
    MD: 8,
    LG: 12,
    XL: 16,
    ROUND: 50,
  },
  SHADOWS: {
    SM: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    MD: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.15,
      shadowRadius: 4,
      elevation: 4,
    },
    LG: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 8,
    },
  }
};

// 검색 관련 상수
export const SEARCH_CONFIG = {
  DEFAULT_PAGE_SIZE: 20,
  MAX_AUTOCOMPLETE_RESULTS: 10,
  DEBOUNCE_DELAY: 500, // 300ms → 500ms로 증가하여 API 호출 빈도 감소
};

// 날짜 관련 상수
export const DATE_FORMATS = {
  DISPLAY: 'YYYY-MM-DD',
  API: 'YYYY-MM-DD',
  DATETIME: 'YYYY-MM-DD HH:mm',
  TIME: 'HH:mm',
};

// 유효성 검사 관련 상수
export const VALIDATION = {
  PASSWORD: {
    MIN_LENGTH: 4,
    MAX_LENGTH: 13,
  },
  EMAIL: {
    REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  },
  NAME: {
    MAX_LENGTH: 255,
  },
};

// 에러 메시지
export const ERROR_MESSAGES = {
  NETWORK_ERROR: '네트워크 연결을 확인해주세요.',
  INVALID_CREDENTIALS: '이메일 또는 비밀번호가 올바르지 않습니다.',
  USER_NOT_FOUND: '사용자를 찾을 수 없습니다.',
  ACCOMMODATION_NOT_FOUND: '숙소를 찾을 수 없습니다.',
  PLAN_NOT_FOUND: '여행 계획을 찾을 수 없습니다.',
  UNAUTHORIZED: '로그인이 필요합니다.',
  FORBIDDEN: '접근 권한이 없습니다.',
  SERVER_ERROR: '서버 오류가 발생했습니다.',
  UNKNOWN_ERROR: '알 수 없는 오류가 발생했습니다.',
};

// 성공 메시지
export const SUCCESS_MESSAGES = {
  LOGIN_SUCCESS: '로그인되었습니다.',
  SIGNUP_SUCCESS: '회원가입이 완료되었습니다.',
  PLAN_CREATED: '여행 계획이 생성되었습니다.',
  PLAN_UPDATED: '여행 계획이 수정되었습니다.',
  PLAN_DELETED: '여행 계획이 삭제되었습니다.',
  RESERVATION_CREATED: '예약이 완료되었습니다.',
  REVIEW_CREATED: '리뷰가 작성되었습니다.',
  SHARE_SUCCESS: '계획이 공유되었습니다.',
};

// 로딩 메시지
export const LOADING_MESSAGES = {
  LOGIN: '로그인 중...',
  SIGNUP: '회원가입 중...',
  LOADING: '로딩 중...',
  SAVING: '저장 중...',
  SEARCHING: '검색 중...',
  UPLOADING: '업로드 중...',
};
