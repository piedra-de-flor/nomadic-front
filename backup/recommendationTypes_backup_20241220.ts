// 추천 장소 관련 타입 정의 백업 (2024-12-20)

// 추천 장소 관련 타입 (블록 기반 구조)
export interface Recommendation {
  id: number;
  title: string;
  subTitle: string;
  location: Location;
  price: string;
  type: RecommendationType;
  postMeta?: PostMeta;
  tags: string[];
  blocks: RecommendationBlock[];
  createdAt: Date;
  updatedAt: Date;
  likesCount: number;
  reviewsCount: number;
  viewsCount: number;
  like: boolean; // 사용자의 좋아요 상태
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

export interface Location {
  latitude: number;
  longitude: number;
  address: string;
  city: string;
  country: string;
}

export interface Image {
  id: number;
  fileName: string;
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
  IMAGE = 'IMAGE',
  VIDEO = 'VIDEO'
}

export interface RecommendLikeRequest {
  recommendationId: number;
  userId: number;
}

export interface RecommendationSearchRequest {
  q?: string;
  type?: RecommendationType;
  order?: 'createdAt' | 'likesCount' | 'viewsCount' | 'reviewsCount';
  direction?: 'ASC' | 'DESC';
  limit?: number;
}

// 리뷰 관련 타입
export interface RootReviewResponseDto {
  reviewResponseDto: ReviewResponseDto;
  replyCount: number;
}

export interface ReviewResponseDto {
  id: number;
  writerId: number;
  writer: string;
  content: string;
  status: 'ACTIVE' | 'DELETED' | 'BLOCKED';
  createdAt: string;
  updatedAt: string;
}

export interface ReplyResponseDto {
  id: number;
  writerId: number;
  writer: string;
  content: string;
  status: 'ACTIVE' | 'DELETED' | 'BLOCKED';
  depth: number;
  parentId?: number;
  createdAt: string;
  updatedAt: string;
}

export interface ReviewPageResponse {
  content: RootReviewResponseDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface ReplyPageResponse {
  content: ReplyResponseDto[];
  totalPages: number;
  totalElements: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
  numberOfElements: number;
}

export interface ReviewUpdateDto {
  reviewId: number;
  content: string;
}

export interface ReportRequestDto {
  reason: string;
  description?: string;
}

export interface ReportResponseDto {
  id: number;
  reporterId: number;
  reviewId: number;
  reason: string;
  description?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

// TOP 10 추천 장소 타입
export interface RecommendReadTop10Dto {
  id: number;
  title: string;
  subTitle: string;
  location: Location;
  price: string;
  type: RecommendationType;
  tags: string[];
  likesCount: number;
  reviewsCount: number;
  viewsCount: number;
  createdAt: Date;
  image?: string;
}
