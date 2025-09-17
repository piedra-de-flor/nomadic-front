// 공통 타입 정의
export interface ApiResponse<T> {
  data: T;
  message?: string;
  status: number;
}

export interface PaginationParams {
  page: number;
  size: number;
}

export interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// 사용자 관련 타입
export interface User {
  userId: number;
  name: string;
  email: string;
  role: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface SignUpRequest {
  name: string;
  email: string;
  password: string;
  role?: string;
}

export interface JwtToken {
  grantType: string;
  accessToken: string;
  refreshToken: string;
}

// 숙소 관련 타입
export interface Accommodation {
  id: number;
  image?: string;
  name: string;
  category?: string;
  grade?: string;
  rating?: number;
  reviewCount?: number;
  region: string;
  address: string;
  landmarkDistance?: string;
  intro?: string;
  amenities?: string;
  info?: string;
  minStayPrice?: number;
  rooms: Room[];
}

export interface Room {
  id: number;
  name: string;
  dayusePrice?: number;
  dayuseSalePrice?: number;
  hasDayuseDiscount?: boolean;
  dayuseSoldout?: boolean;
  dayuseTime?: string;
  stayPrice?: number;
  staySalePrice?: number;
  hasStayDiscount?: boolean;
  staySoldout?: boolean;
  stayCheckinTime?: string;
  stayCheckoutTime?: string;
  capacity?: number;
  maxCapacity?: number;
}

export interface AccommodationCreateRequest {
  image?: string;
  name: string;
  category?: string;
  grade?: string;
  region: string;
  address: string;
  landmarkDistance?: string;
  intro?: string;
  amenities?: string;
  info?: string;
}

// 숙소 검색 관련 타입
export interface AccommodationSearchRequest {
  keyword: string;
  page?: number;
  size?: number;
  sortBy?: 'ID_ASC' | 'REVIEW_DESC' | 'DAYUSE_PRICE_ASC' | 'DAYUSE_PRICE_DESC' | 'STAY_PRICE_ASC' | 'STAY_PRICE_DESC' | 'ROOM_PRICE_ASC' | 'ROOM_PRICE_DESC' | 'RATING_DESC';
  minPrice?: number;
  maxPrice?: number;
  rating?: number;
  amenities?: string[];
  region?: string;
}

export interface AccommodationSearchResponse {
  content: Accommodation[];
  totalElements: number;
  totalPages: number;
  currentPage: number;
  size: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface AutocompleteRequest {
  query: string;
  limit?: number;
}

export interface AutocompleteResponse {
  suggestions: string[];
  totalCount: number;
}

export interface TypoCorrectionRequest {
  query: string;
}

export interface TypoCorrectionResponse {
  originalQuery: string;
  correctedQuery?: string;
  hasTypo: boolean;
  confidence: number;
  suggestions: string[];
}

// 여행 계획 관련 타입
export interface Plan {
  id: number;
  place: string;
  partner: Partner;
  styles: Style[];
  startDay: Date;
  endDay: Date;
  member: User;
}

export interface DetailPlan {
  planId: number;
  detailPlanId: number;
  location: Location;
  date: Date;
  time: string;
  version: number;
}

export interface Location {
  latitude: number;
  longitude: number;
  name: string;
}

export interface PlanCreateRequest {
  place: string;
  startDay: Date;
  endDay: Date;
  partner?: string;
  styles?: string[];
}

// 추천 장소 관련 타입 (API 문서 기반)
export interface Recommendation {
  id: number;
  title: string;
  subTitle: string;
  author: string; // 작성자명 (API에서 직접 제공)
  authorId: number; // 작성자 ID
  location: Location;
  price: string;
  type: RecommendationType;
  tags: string[]; // Set<String>에서 string[]로 변경
  createdAt: Date;
  likesCount: number;
  reviewsCount: number;
  viewsCount: number;
  like: boolean; // 사용자의 좋아요 상태
  mainImage?: string; // 대표 이미지 URL
}

export interface RecommendationBlock {
  id: number;
  type: BlockType;
  text?: string;
  image?: Image;
  caption?: string;
  orderIndex: number;
  recommendation: Recommendation;
}

export interface PostMeta {
  author: string;
  source?: string;
}

export interface Image {
  id: number;
  originalFileName: string;
  storedFileName: string;
  fileSize: number;
  contentType: string;
  url: string;
}

export enum RecommendationType {
  PLACE = 'PLACE',
  POST = 'POST'
}

export enum BlockType {
  TEXT = 'TEXT',
  IMAGE = 'IMAGE'
}

export interface RecommendLikeRequest {
  recommendationId: number;
  userId: number;
}

export interface RecommendationSearchRequest {
  q?: string;
  type?: RecommendationType;
  sort?: RecommendOrderType; // API 문서에 따른 정렬 타입
  pageable?: Pageable; // 페이징 정보
}

// API 문서에 따른 정렬 타입
export enum RecommendOrderType {
  CREATED_DESC = 'CREATED_DESC',
  CREATED_ASC = 'CREATED_ASC',
  LIKES_DESC = 'LIKES_DESC',
  LIKES_ASC = 'LIKES_ASC',
  VIEWS_DESC = 'VIEWS_DESC',
  VIEWS_ASC = 'VIEWS_ASC',
  REVIEWS_DESC = 'REVIEWS_DESC',
  REVIEWS_ASC = 'REVIEWS_ASC'
}

// 페이징 정보
export interface Pageable {
  page: number;
  size: number;
  sort?: string;
}

// 리뷰 관련 타입
export interface Review {
  id: number;
  writer: string;
  content: string;
  rating?: number;
  images?: string[];
  parentId?: number;
  children?: Review[];
  deleted?: boolean;
}

export interface ReviewCreateRequest {
  content: string;
  rating?: number;
  recommendationId: number;
}

// 서버 응답 리뷰 타입
export interface ReviewResponseDto {
  id: number;
  writerId: number;
  writer: string;
  content: string;
  status: string;
}

export interface RootReviewResponseDto {
  reviewResponseDto: ReviewResponseDto;
  replyCount: number;
}

export interface ReviewPageResponse {
  content: RootReviewResponseDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// 답글 응답 타입 (서버에서 직접 반환하는 구조)
export interface ReplyResponseDto {
  id: number;
  writerId: number;
  writer: string;
  content: string;
  status: string;
  depth?: number; // 대댓글 깊이 (0: 댓글, 1: 대댓글, 2: 대대댓글)
  parentId?: number; // 부모 댓글/답글 ID
}

// 신고 관련 타입
export enum ReportingReason {
  SPAM = 'SPAM',
  OFFENSIVE_LANGUAGE = 'OFFENSIVE_LANGUAGE',
  HARASSMENT = 'HARASSMENT',
  INAPPROPRIATE = 'INAPPROPRIATE',
  FALSE_INFORMATION = 'FALSE_INFORMATION',
  OTHER = 'OTHER'
}

export interface ReportRequestDto {
  reason: ReportingReason;
  detail?: string;
}

export interface ReportResponseDto {
  id: number;
  targetType: string;
  targetId: number;
  reporterName: string;
  reason: ReportingReason;
  status: string;
  createdAt: string;
}

export interface ReplyPageResponse {
  content: ReplyResponseDto[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

// 리뷰 수정 요청 타입
export interface ReviewUpdateDto {
  reviewId: number;
  content: string;
}

// 알림 관련 타입
export interface Notification {
  id: number;
  title: string;
  content: string;
  sentAt: Date;
  isRead: boolean;
}

// 공유 관련 타입
export interface PlanShare {
  id: number;
  planId: number;
  sharedMemberEmail: string;
  role: string;
  status: ShareStatus;
}

export interface PlanShareCreateRequest {
  planId: number;
  sharedMemberEmail: string;
  role: string;
}

// 열거형 타입
export enum Partner {
  SOLO = 'SOLO',
  COUPLE = 'COUPLE',
  FAMILY = 'FAMILY',
  FRIENDS = 'FRIENDS',
  BUSINESS = 'BUSINESS'
}

export enum Style {
  BUDGET = 'BUDGET',
  LUXURY = 'LUXURY',
  ADVENTURE = 'ADVENTURE',
  RELAXATION = 'RELAXATION',
  CULTURE = 'CULTURE',
  FOOD = 'FOOD',
  NATURE = 'NATURE',
  URBAN = 'URBAN'
}

export enum ShareStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED'
}

export enum SortOption {
  ID_ASC = 'ID_ASC',
  ID_DESC = 'ID_DESC',
  NAME_ASC = 'NAME_ASC',
  NAME_DESC = 'NAME_DESC',
  RATING_DESC = 'RATING_DESC',
  PRICE_ASC = 'PRICE_ASC',
  PRICE_DESC = 'PRICE_DESC'
}

// 네비게이션 타입
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  MainTabs: undefined;
  Login: undefined;
  SignUp: undefined;
  AccommodationSearch: undefined;
  AccommodationDetail: { accommodationId: number };
  PlanCreate: undefined;
  PlanDetail: { planId: number };
  PlanEdit: { planId: number };
  PlanShareView: { planId: number };
  PlanShareRequest: undefined;
  PlanHistory: { planId: number };
  MyShareRequest: undefined;
  DetailPlanCreate: { planId: number; selectedDate: string };
  DetailPlanEdit: { 
    planId: number; 
    detailPlanId: number; 
    selectedDate: string; 
    planData: {
      id: number;
      time: string;
      title: string;
      location: string;
      description?: string;
      latitude: number;
      longitude: number;
    };
  };
  RecommendList: undefined;
  RecommendDetail: { recommendationId: number; fromPage?: 'recommend' | 'searchResult'; searchQuery?: string };
  Profile: undefined;
  SearchResult: { searchQuery: string };
  Report: { 
    reviewId: number; 
    reviewContent: string; 
    placeName: string; 
    reviewAuthor: string; 
  };
  ReviewEdit: {
    reviewId: number;
    reviewContent: string;
    placeName: string;
    reviewAuthor: string;
    onEditSuccess?: () => void;
  };
  ReviewDelete: {
    reviewId: number;
    reviewContent: string;
    placeName: string;
    reviewAuthor: string;
    onDeleteSuccess?: () => void;
  };
};

export type MainTabParamList = {
  Search: { preserveSearchQuery?: string } | undefined;
  Recommend: undefined;
  Home: undefined;
  Plan: undefined;
  PlanDetail: { planId: number };
  Profile: undefined;
  SearchResult: { searchQuery: string };
  AccommodationDetail: { accommodationId: number; searchQuery?: string };
  RecommendDetail: { recommendationId: number; fromPage?: 'recommend' | 'searchResult'; searchQuery?: string };
  RecommendSearch: { preserveSearchQuery?: string } | undefined;
  RecommendSearchResult: { searchQuery: string };
};

// 여행 계획 관련 타입
export interface TravelPartner {
  id: number;
  name: string;
  email: string;
}

export interface TravelStyle {
  id: number;
  name: string;
  description?: string;
}

export interface PlanReadResponseDto {
  planId: number;
  place: string;
  partner: string; // Partner enum (ALONE, COUPLE, FAMILY, FRIEND, BUSINESS, CLUB)
  styles: string[]; // Style enum 배열 (HEALING, ACTIVITY, FAMILY, NATURE, CULTURE, FOOD)
  startDay: string; // Date를 string으로 변환
  endDay: string;   // Date를 string으로 변환
}

export interface PlanReadAllResponseDto {
  plans: PlanReadResponseDto[];
}

// 추천 여행지 Top 10 DTO
export interface RecommendReadTop10Dto {
  id: number;
  image: string;
  title: string;
}


// 계획 스타일 수정 DTO
export interface PlanStyleUpdateDto {
  planDto: {
    planId: number;
  };
  styles: string[]; // 스타일 enum name 배열 (예: ["HEALING", "ACTIVITY"])
}

// 계획 파트너 수정 DTO
export interface PlanPartnerUpdateDto {
  planDto: {
    planId: number;
  };
  partner: string; // 파트너 enum name (예: "ALONE", "COUPLE", "FAMILY")
}

// 계획 이름 및 날짜 수정 DTO
export interface PlanUpdateDto {
  planDto: {
    planId: number;
  };
  name?: string; // null 가능
  start: string; // Date를 string으로 변환 (ISO format)
  end: string; // Date를 string으로 변환 (ISO format)
}

// 세부 계획 DTO
export interface DetailPlanDto {
  planId: number;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  date: string; // Date를 string으로 변환
  time: string;
  version: number;
}

// 세부 계획 수정 DTO
export interface DetailPlanUpdateDto {
  planId: number;
  detailPlanId: number;
  location: {
    latitude: number;
    longitude: number;
    name: string;
  };
  date: string;
  time: string;
}

// 계획 변경 이력 관련 타입
export enum ChangeType {
  CREATED = 'CREATED',
  UPDATED = 'UPDATED',
  DELETED = 'DELETED',
  MOVED = 'MOVED',
  SHARED = 'SHARED',
  UNSHARED = 'UNSHARED',
}

export interface PlanChangeHistoryResponseDto {
  id: number;
  planId: number;
  changedByName: string;
  changedByEmail: string;
  changeType: ChangeType;
  changeTypeDescription: string;
  targetId: number;
  targetType: string;
  changeData: string;
  createdAt: string; // LocalDateTime을 string으로 변환
}

export interface PageResponse<T> {
  content: T[];
  pageable: {
    pageNumber: number;
    pageSize: number;
    sort: {
      empty: boolean;
      sorted: boolean;
      unsorted: boolean;
    };
    offset: number;
    paged: boolean;
    unpaged: boolean;
  };
  totalElements: number;
  totalPages: number;
  last: boolean;
  size: number;
  number: number;
  sort: {
    empty: boolean;
    sorted: boolean;
    unsorted: boolean;
  };
  first: boolean;
  numberOfElements: number;
  empty: boolean;
}

// 계획 공유 관련 타입
export enum ShareRole {
  EDITOR = 'EDITOR',
  VIEWER = 'VIEWER',
}

export enum ShareStatus {
  PENDING = 'PENDING',
  ACCEPTED = 'ACCEPTED',
  REJECTED = 'REJECTED',
  CANCELLED = 'CANCELLED',
}

export interface PlanShareCreateDto {
  planId: number;
  sharedMemberEmail: string;
  role: string;
}

export interface PlanShareResponseDto {
  shareId: number;
  planId: number;
  planName: string;
  memberEmail: string;
  memberName: string;
  role: ShareRole;
  status: ShareStatus;
  sharedAt: string; // LocalDateTime을 string으로 변환
  acceptedAt?: string; // LocalDateTime을 string으로 변환 (optional)
}

// 계획 생성 관련 타입
export interface PlanCreateDto {
  place: string;
  startDay: string; // Date를 string으로 변환
  endDay: string;   // Date를 string으로 변환
  partner?: string;
  styles?: string[];
}

// 계획 삭제 관련 타입
export interface PlanDto {
  planId: number;
}

// API 문서 기반 응답 DTO들
export interface RecommendReadDto {
  id: number;
  title: string;
  subTitle: string;
  author: string;
  authorId: number; // ✨ authorId 필드 추가
  location: Location;
  createdAt: Date;
  price: string;
  tags: string[];
  likesCount: number;
  reviewsCount: number;
  viewsCount: number;
  like: boolean;
}

export interface RecommendationBlockUpdateDto {
  id: number;
  type: 'TEXT' | 'IMAGE';
  text?: string;
  image?: {
    id: number;
    url: string;
    alt?: string;
  };
  caption?: string;
  orderIndex: number;
}

export interface RecommendReadTop10Dto {
  id: number;
  image: Image;
  title: string;
}

export interface RecommendationBlockReadDto {
  id: number;
  type: BlockType;
  text?: string;
  image?: Image;
  caption?: string;
  orderIndex: number;
}

export interface RecommendLikeDto {
  userId: number;
  placeId: number;
}

