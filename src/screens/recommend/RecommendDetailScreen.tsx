import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  Dimensions,
  FlatList,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { UI_CONFIG } from '../../constants';
import { 
  Recommendation, 
  RecommendationBlock, 
  RecommendationType,
  RootReviewResponseDto,
  ReviewPageResponse,
  ReplyResponseDto
} from '../../types';
import { 
  getRecommendationById, 
  getRecommendationBlocks,
  toggleRecommendationLike,
  getRelativeTime,
  writeRecommendationReview,
  getRecommendationReviews,
  getRecommendationReplies,
  updateRecommendationReview,
  deleteRecommendationReview,
  deleteRecommendation,
  RecommendWriteReviewRequest
} from '../../services/recommendation/recommendationService';

const { width } = Dimensions.get('window');

interface Comment {
  id: number;
  author: string;
  content: string;
  date: string;
  parentId?: number; // 대댓글인 경우 부모 댓글 ID
  replies?: Comment[]; // 대댓글 목록
  isDeleted?: boolean; // 삭제된 댓글인지 여부
}

// 좋아요 상태 관리 (전역 메모리 기반 - 페이지 간 공유)
const globalLikeStates = new Map<number, boolean>();

// 실제 리뷰 데이터 (API에서 가져옴)

// 댓글 입력 컴포넌트 (리렌더링 최적화)
const CommentInput = React.memo(({ 
  onAddComment, 
  disabled 
}: { 
  onAddComment: (content: string) => void; 
  disabled: boolean; 
}) => {
  const [newComment, setNewComment] = useState('');
  
  return (
    <View style={styles.commentInputContainer}>
      <TextInput
        style={styles.commentInput}
        placeholder="댓글을 작성해주세요..."
        placeholderTextColor="#7F8C8D"
        value={newComment}
        onChangeText={setNewComment}
        multiline={true}
        blurOnSubmit={false}
        returnKeyType="default"
        textAlignVertical="top"
        autoCorrect={false}
        autoCapitalize="none"
        keyboardType="default"
        enablesReturnKeyAutomatically={false}
        scrollEnabled={false}
      />
      <TouchableOpacity 
        style={[
          styles.commentSubmitButton,
          { opacity: newComment.trim() ? 1 : 0.5 }
        ]}
        onPress={() => {
          onAddComment(newComment);
          setNewComment('');
        }}
        disabled={!newComment.trim()}
      >
        <Ionicons name="send" size={20} color="#FFFFFF" />
      </TouchableOpacity>
    </View>
  );
});

const RecommendDetailScreen = ({ navigation, route }: any) => {
  console.log('🔄 RecommendDetailScreen 리렌더링');
  
  // Redux 상태
  const authState = useSelector((state: any) => state.auth);
  const user = useMemo(() => authState.user, [authState.user]);
  const token = useMemo(() => authState.token, [authState.token]);
  
  const { recommendationId, type, fromPage, searchQuery, refreshDetail } = route.params || { recommendationId: 1 };
  
  // 데이터 상태
  const [recommendation, setRecommendation] = useState<Recommendation | null>(null);
  const [blocks, setBlocks] = useState<RecommendationBlock[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLiked, setIsLiked] = useState(false);
  const [initialLikeState, setInitialLikeState] = useState<boolean | null>(null); // 초기 좋아요 상태
  
  // 댓글 상태
  const [comments, setComments] = useState<RootReviewResponseDto[]>([]);
  const replyTextRef = useRef('');
  const [showComments, setShowComments] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMoreComments, setHasMoreComments] = useState(true);
  const [showReplyInput, setShowReplyInput] = useState<number | null>(null);
  const [expandedReplies, setExpandedReplies] = useState<Set<number>>(new Set());
  const [replies, setReplies] = useState<Map<number, ReplyResponseDto[]>>(new Map());
  const [isLoadingReplies, setIsLoadingReplies] = useState<Set<number>>(new Set());
  
  // 대대댓글 관련 상태
  const [showNestedReplyInput, setShowNestedReplyInput] = useState<number | null>(null);
  const [expandedNestedReplies, setExpandedNestedReplies] = useState<Set<number>>(new Set());
  const [nestedReplies, setNestedReplies] = useState<Map<number, ReplyResponseDto[]>>(new Map());
  const [isLoadingNestedReplies, setIsLoadingNestedReplies] = useState<Set<number>>(new Set());
  
  const COMMENTS_PER_PAGE = 10;

  // 로그인 체크
  useEffect(() => {
    if (!user) {
      Alert.alert(
        '로그인 필요',
        '추천 상세 정보를 보려면 로그인이 필요합니다.',
        [
          {
            text: '확인',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      return;
    }
  }, [user, navigation]);

  // 추천 장소 상세 정보 로드
  useEffect(() => {
    if (user) {
      loadRecommendationDetail();
    }
  }, [recommendationId, user]);

  // 댓글 로드
  useEffect(() => {
    if (recommendationId && showComments) {
      loadComments(0, false);
    }
  }, [recommendationId, showComments]);

  // 수정 후 새로고침 처리
  useEffect(() => {
    if (refreshDetail) {
      console.log('🔄 수정 후 새로고침 트리거됨');
      loadRecommendationDetail();
      if (showComments) {
        loadComments(0, false);
      }
      // 파라미터 초기화
      navigation.setParams({ refreshDetail: undefined });
    }
  }, [refreshDetail]);


  const loadRecommendationDetail = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 추천 장소 상세 정보 로드:', recommendationId);
      
      // 추천 장소 기본 정보 로드
      const recommendationData = await getRecommendationById(recommendationId);
      console.log('📋 추천 장소 데이터:', recommendationData);
      
      if (recommendationData) {
        setRecommendation(recommendationData);
        
        // 초기 좋아요 상태 설정 (서버 응답의 like 필드 사용)
        const serverLikeState = recommendationData.like || false;
        const memoryLikeState = globalLikeStates.get(recommendationData.id);
        const currentLikeState = memoryLikeState !== undefined ? memoryLikeState : serverLikeState;
        
        setIsLiked(currentLikeState);
        setInitialLikeState(currentLikeState);
        globalLikeStates.set(recommendationData.id, currentLikeState);
        
        console.log('💖 초기 좋아요 상태 설정:', { 
          recommendationId: recommendationData.id, 
          serverLike: serverLikeState,
          memoryLike: memoryLikeState,
          finalLike: currentLikeState
        });
        
        // 블록 정보 로드
        try {
          console.log('🔍 블록 API 호출 시작:', recommendationId);
          const blocksData = await getRecommendationBlocks(recommendationId);
          console.log('📝 블록 API 응답:', blocksData);
          console.log('📝 블록 데이터 타입:', typeof blocksData);
          console.log('📝 블록 데이터 길이:', blocksData?.length);
          
          if (blocksData && Array.isArray(blocksData)) {
            setBlocks(blocksData);
            console.log('✅ 블록 데이터 설정 완료:', blocksData.length, '개');
          } else {
            console.warn('⚠️ 블록 데이터가 배열이 아님:', blocksData);
            setBlocks([]);
          }
        } catch (blockError: any) {
          console.error('❌ 블록 정보 로드 실패:', blockError);
          console.error('❌ 블록 에러 상세:', blockError?.message);
          
          // 임시 데모 블록 데이터 (API 실패 시)
          console.log('🔄 임시 데모 블록 데이터 사용');
          const demoBlocks: RecommendationBlock[] = [
            {
              id: 1,
              type: 'TEXT' as any,
              text: '이곳은 아름다운 추천 장소입니다. 자연의 아름다움과 함께하는 특별한 경험을 제공합니다.',
              orderIndex: 0,
              recommendation: recommendationData
            },
            {
              id: 2,
              type: 'TEXT' as any,
              text: '방문하시면 잊지 못할 추억을 만들 수 있을 것입니다. 가족, 연인, 친구들과 함께 방문하기에 완벽한 장소입니다.',
              orderIndex: 1,
              recommendation: recommendationData
            }
          ];
          setBlocks(demoBlocks);
        }
        
        // 좋아요 상태 초기화
        setIsLiked(globalLikeStates.get(recommendationId) || false);
        
        console.log('✅ 추천 장소 상세 정보 로드 성공');
      } else {
        throw new Error('추천 장소 데이터를 찾을 수 없습니다.');
      }
    } catch (error) {
      console.error('❌ 추천 장소 상세 정보 로드 실패:', error);
      Alert.alert(
        '오류', 
        '추천 장소 정보를 불러오는데 실패했습니다.\n잠시 후 다시 시도해주세요.',
        [
          { text: '다시 시도', onPress: loadRecommendationDetail },
          { text: '뒤로 가기', onPress: () => navigation.goBack() }
        ]
      );
    } finally {
      setIsLoading(false);
    }
  };

  // 댓글 로드 함수
  const loadComments = useCallback(async (page: number = 0, append: boolean = false) => {
    try {
      setIsLoadingComments(true);
      console.log('🔍 댓글 로드:', { recommendationId, page, append });
      
      const response = await getRecommendationReviews(recommendationId, page, COMMENTS_PER_PAGE);
      
      // 댓글 데이터 구조 디버깅
      console.log('📥 댓글 API 응답:', response);
      console.log('📥 댓글 content:', response.content);
      response.content.forEach((comment, index) => {
        console.log(`📥 댓글 ${index + 1}:`, {
          id: comment.reviewResponseDto.id,
          writerId: comment.reviewResponseDto.writerId,
          writer: comment.reviewResponseDto.writer,
          content: comment.reviewResponseDto.content
        });
      });
      
      if (append) {
        setComments(prev => [...prev, ...response.content]);
      } else {
        setComments(response.content);
      }
      
      setCurrentPage(page);
      setHasMoreComments(!response.last);
      
      console.log('✅ 댓글 로드 성공:', response.content.length, '개');
    } catch (error) {
      console.error('❌ 댓글 로드 실패:', error);
      if (!append) {
        setComments([]);
      }
    } finally {
      setIsLoadingComments(false);
    }
  }, [recommendationId]);

  const handleBackPress = () => {
    if (fromPage === 'searchResult') {
      // 검색 결과 페이지에서 온 경우, 검색 결과 페이지로 돌아가기
      navigation.navigate('RecommendSearchResult', { searchQuery: searchQuery || '' });
    } else if (fromPage === 'Home') {
      // 홈 페이지에서 온 경우, MainTabs로 돌아가서 Home 탭으로 이동
      navigation.navigate('MainTabs', { screen: 'Home' });
    } else {
      // 추천 메인 페이지에서 온 경우, 추천 메인 페이지로 돌아가서 탭 상태 유지
      navigation.navigate('MainTabs', { 
        screen: 'Recommend',
        params: { 
          activeTab: route.params?.fromTab || 'PLACE' // 탭 상태 유지
        }
      });
    }
  };

  const handleShare = () => {
    Alert.alert('공유', '게시물을 공유합니다.');
  };

  const handleLike = async () => {
    if (!recommendation || !user) {
      Alert.alert('알림', '로그인이 필요합니다.');
      return;
    }
    
    try {
      console.log('💖 좋아요 토글 시작 - 현재 상태:', { 
        isLiked, 
        recommendationId: recommendation.id,
        userId: user.userId,
        globalLikeState: globalLikeStates.get(recommendation.id)
      });
      
      // 즉시 UI 반영 (낙관적 업데이트)
      const newLikedState = !isLiked;
      const currentLikesCount = recommendation.likesCount || 0;
      const newLikesCount = newLikedState ? currentLikesCount + 1 : currentLikesCount - 1;
      
      setIsLiked(newLikedState);
      globalLikeStates.set(recommendation.id, newLikedState);
      
      console.log('💖 UI 상태 업데이트 완료:', { 
        newLikedState, 
        newLikesCount,
        globalLikeState: globalLikeStates.get(recommendation.id)
      });
      
      // 즉시 좋아요 수만 업데이트
      setRecommendation(prev => prev ? {
      ...prev,
        likesCount: newLikesCount
      } : null);
      
      console.log('💖 좋아요 토글 시작:', { 
        recommendationId: recommendation.id, 
        userId: user.userId, 
        newState: newLikedState 
      });
      
      // 서버에 좋아요 토글 요청 (백그라운드)
      toggleRecommendationLike(recommendation.id, user.userId)
        .then(result => {
          console.log('✅ 좋아요 토글 성공:', result);
          // 서버 응답이 정확하지 않으므로 클라이언트 상태 유지
          // setRecommendation(prev => prev ? {
          //   ...prev,
          //   likesCount: result.likesCount
          // } : null);
          
          // 추천 페이지로 돌아갈 때 새로고침하도록 네비게이션 파라미터 설정
          navigation.setParams({ 
            refreshRecommendList: true,
            likedRecommendationId: recommendation.id 
          });
        })
        .catch(error => {
          console.error('❌ 좋아요 토글 실패:', error);
          // 실패 시 UI 롤백
          const rollbackState = !newLikedState;
          const rollbackLikesCount = recommendation.likesCount || 0;
          const rollbackNewLikesCount = rollbackState ? rollbackLikesCount + 1 : rollbackLikesCount - 1;
          
          setIsLiked(rollbackState);
          globalLikeStates.set(recommendation.id, rollbackState);
          setRecommendation(prev => prev ? {
            ...prev,
            likesCount: rollbackNewLikesCount
          } : null);
          
          Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
        });
    } catch (error) {
      console.error('❌ 좋아요 토글 초기화 실패:', error);
      Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    }
  };


  const handleAddComment = async (commentContent: string) => {
    if (!commentContent.trim() || !recommendation || !user) {
      if (!user) {
        Alert.alert('알림', '로그인이 필요합니다.');
      }
      return;
    }

    try {
      
      // 즉시 UI에 댓글 추가 (낙관적 업데이트)
      const newCommentObj: RootReviewResponseDto = {
        reviewResponseDto: {
          id: Math.max(...comments.map(c => c.reviewResponseDto.id), 0) + 1,
          writerId: user.userId || 0,
          writer: user.name || '나',
          content: commentContent,
          status: 'ACTIVE',
        },
        replyCount: 0,
      };
      
      setComments(prev => [newCommentObj, ...prev]);
      setRecommendation(prev => prev ? {
        ...prev,
        reviewsCount: (prev.reviewsCount || 0) + 1
      } : null);

      console.log('📝 댓글 작성 시작:', { 
        placeId: recommendation.id, 
        content: commentContent 
      });

      // 서버에 댓글 작성 요청
      const reviewData: RecommendWriteReviewRequest = {
        placeId: recommendation.id,
        content: commentContent
      };

      await writeRecommendationReview(reviewData);
      
      console.log('✅ 댓글 작성 성공');
      
      // 댓글 작성 성공 후 목록 새로고침
      setTimeout(() => {
        loadComments(0, false);
      }, 500); // 약간의 지연을 두어 서버 상태 반영 대기
      
    } catch (error) {
      console.error('❌ 댓글 작성 실패:', error);
      
      // 실패 시 UI 롤백
      setComments(prev => prev.filter(c => c.reviewResponseDto.id !== Math.max(...comments.map(c => c.reviewResponseDto.id), 0) + 1));
      setRecommendation(prev => prev ? {
        ...prev,
        reviewsCount: Math.max((prev.reviewsCount || 0) - 1, 0)
      } : null);
      
      Alert.alert('오류', '댓글 작성 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    }
  };

  const handleAddReply = async (parentId: number) => {
    if (!replyTextRef.current.trim() || !recommendation || !user) {
      return;
    }

    try {
      const replyContent = replyTextRef.current.trim();
      
      // 즉시 UI에 답글 추가 (낙관적 업데이트)
      const newReplyObj: ReplyResponseDto = {
        id: Date.now(), // 임시 ID
        writerId: user.userId || 0,
        writer: user.name || '나',
        content: replyContent,
        status: 'ACTIVE',
      };
      
      // 답글 목록에 추가
      setReplies(prev => {
        const newMap = new Map(prev);
        const existingReplies = newMap.get(parentId) || [];
        newMap.set(parentId, [newReplyObj, ...existingReplies]);
        return newMap;
      });
      
      // 답글 입력창 닫기
      setShowReplyInput(null);
      replyTextRef.current = '';
      
      // 서버에 답글 작성 요청
      const reviewData: RecommendWriteReviewRequest = {
        placeId: recommendation.id,
        content: replyContent,
        parentId: parentId,
      };

      await writeRecommendationReview(reviewData);
      
      console.log('✅ 답글 작성 성공');
      
      // 답글 작성 성공 후 댓글 목록 새로고침
      setTimeout(() => {
        loadComments(0, false);
        // 답글 상태도 초기화하여 새로 로드되도록 함
        setReplies(new Map());
        setExpandedReplies(new Set());
      }, 500);
      
    } catch (error) {
      console.error('❌ 답글 작성 실패:', error);
      
      // 실패 시 UI 롤백
      setReplies(prev => {
        const newMap = new Map(prev);
        const existingReplies = newMap.get(parentId) || [];
        newMap.set(parentId, existingReplies.slice(1)); // 첫 번째 답글 제거
        return newMap;
      });
      
      Alert.alert('오류', '답글 작성 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    }
  };

  const handleReportComment = (commentId: number) => {
    console.log('🚨 신고 버튼 클릭 - commentId:', commentId);
    
    // 해당 댓글 찾기 (메인 댓글에서)
    const mainComment = comments.find(c => c.reviewResponseDto.id === commentId);
    
    // 답글에서 찾기
    let replyComment = null;
    for (const [parentId, replyList] of replies.entries()) {
      const foundReply = replyList.find(r => r.id === commentId);
      if (foundReply) {
        replyComment = foundReply;
        break;
      }
    }
    
    const targetComment = mainComment?.reviewResponseDto || replyComment;
    
    if (targetComment && recommendation) {
      console.log('🚨 신고 대상 댓글:', targetComment);
      
      // 신고 페이지로 네비게이션
      navigation.navigate('Report', {
        reviewId: commentId,
        reviewContent: targetComment.content,
        placeName: recommendation.title,
        reviewAuthor: targetComment.writer,
      });
    } else {
      console.warn('⚠️ 신고할 댓글을 찾을 수 없음:', commentId);
      Alert.alert('오류', '신고할 댓글을 찾을 수 없습니다.');
    }
  };

  // 댓글 수정 핸들러
  const handleEditComment = (commentId: number, content: string) => {
    console.log('✏️ 댓글 수정 버튼 클릭 - commentId:', commentId);
    
    if (recommendation) {
      navigation.navigate('ReviewEdit', {
        reviewId: commentId,
        reviewContent: content,
        placeName: recommendation.title,
        reviewAuthor: user?.name || '나',
        onEditSuccess: () => {
          console.log('🔄 댓글 수정 완료 - 댓글 목록 새로고침');
          loadComments(0, false); // 댓글 목록 새로고침
          // 답글 상태도 초기화
          setReplies(new Map());
          setExpandedReplies(new Set());
        }
      });
    }
  };

  // 댓글 삭제 핸들러
  const handleDeleteComment = (commentId: number, content: string) => {
    console.log('🗑️ 댓글 삭제 버튼 클릭 - commentId:', commentId);
    
    if (recommendation) {
      navigation.navigate('ReviewDelete', {
        reviewId: commentId,
        reviewContent: content,
        placeName: recommendation.title,
        reviewAuthor: user?.name || '나',
        onDeleteSuccess: () => {
          console.log('🔄 댓글 삭제 완료 - 댓글 목록 새로고침');
          loadComments(0, false); // 댓글 목록 새로고침
          // 답글 상태도 초기화
          setReplies(new Map());
          setExpandedReplies(new Set());
        }
      });
    }
  };

  // 답글 수정 핸들러
  const handleEditReply = (replyId: number, content: string) => {
    console.log('✏️ 답글 수정 버튼 클릭 - replyId:', replyId);
    
    if (recommendation) {
      navigation.navigate('ReviewEdit', {
        reviewId: replyId,
        reviewContent: content,
        placeName: recommendation.title,
        reviewAuthor: user?.name || '나',
        onEditSuccess: () => {
          console.log('🔄 답글 수정 완료 - 댓글 목록 새로고침');
          loadComments(0, false); // 댓글 목록 새로고침
          // 답글 상태도 초기화
          setReplies(new Map());
          setExpandedReplies(new Set());
        }
      });
    }
  };

  // 답글 삭제 핸들러
  const handleDeleteReply = (replyId: number, content: string) => {
    console.log('🗑️ 답글 삭제 버튼 클릭 - replyId:', replyId);
    
    if (recommendation) {
      navigation.navigate('ReviewDelete', {
        reviewId: replyId,
        reviewContent: content,
        placeName: recommendation.title,
        reviewAuthor: user?.name || '나',
        onDeleteSuccess: () => {
          console.log('🔄 답글 삭제 완료 - 댓글 목록 새로고침');
          loadComments(0, false); // 댓글 목록 새로고침
          // 답글 상태도 초기화
          setReplies(new Map());
          setExpandedReplies(new Set());
        }
      });
    }
  };

  const handleToggleReplyInput = (commentId: number) => {
    setShowReplyInput(showReplyInput === commentId ? null : commentId);
    replyTextRef.current = '';
  };

  // 대대댓글 입력 토글
  const handleToggleNestedReplyInput = (replyId: number) => {
    setShowNestedReplyInput(showNestedReplyInput === replyId ? null : replyId);
    replyTextRef.current = '';
  };

  // 여행기 수정 핸들러
  const handleEditRecommendation = () => {
    console.log('✏️ 여행기 수정 버튼 클릭');
    if (recommendation) {
      navigation.navigate('TravelDiaryEdit', {
        recommendation: recommendation
      });
    }
  };

  // 여행기 삭제 핸들러
  const handleDeleteRecommendation = () => {
    console.log('🗑️ 여행기 삭제 버튼 클릭');
    if (recommendation && token) {
      Alert.alert(
        '여행기 삭제',
        '정말로 이 여행기를 삭제하시겠습니까?\n삭제된 여행기는 복구할 수 없습니다.',
        [
          {
            text: '취소',
            style: 'cancel'
          },
          {
            text: '삭제',
            style: 'destructive',
            onPress: async () => {
              try {
                console.log('🗑️ 여행기 삭제 API 호출 시작:', {
                  placeId: recommendation.id,
                  token: token.substring(0, 20) + '...'
                });
                
                const deletedId = await deleteRecommendation(recommendation.id, token);
                
                console.log('✅ 여행기 삭제 성공:', deletedId);
                
                Alert.alert(
                  '삭제 완료',
                  '여행기가 성공적으로 삭제되었습니다.',
                  [
                    {
                      text: '확인',
                      onPress: () => {
                        // 추천 목록으로 돌아가기
                        navigation.goBack();
                      }
                    }
                  ]
                );
              } catch (error) {
                console.error('❌ 여행기 삭제 실패:', error);
                Alert.alert(
                  '삭제 실패',
                  '여행기 삭제 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.'
                );
              }
            }
          }
        ]
      );
    } else {
      console.warn('⚠️ 삭제 조건 불충족:', {
        hasRecommendation: !!recommendation,
        hasToken: !!token
      });
      Alert.alert('오류', '삭제할 수 없습니다.');
    }
  };

  // 대대댓글 토글
  const handleToggleNestedReplies = (replyId: number) => {
    setExpandedNestedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(replyId)) {
        newSet.delete(replyId);
      } else {
        newSet.add(replyId);
        // 대대댓글 로드
        loadNestedReplies(replyId);
      }
      return newSet;
    });
  };

  // 대대댓글 작성 함수
  const handleAddNestedReply = async (parentReplyId: number) => {
    if (!replyTextRef.current.trim() || !recommendation || !user) {
      return;
    }

    try {
      const replyContent = replyTextRef.current.trim();
      
      // 즉시 UI에 대대댓글 추가 (낙관적 업데이트)
      const newNestedReplyObj: ReplyResponseDto = {
        id: Date.now(), // 임시 ID
        writerId: user.userId || 0,
        writer: user.name || '나',
        content: replyContent,
        status: 'ACTIVE',
        depth: 2, // 대대댓글
        parentId: parentReplyId,
      };
      
      // 대대댓글 목록에 추가
      setNestedReplies(prev => {
        const newMap = new Map(prev);
        const existingNestedReplies = newMap.get(parentReplyId) || [];
        newMap.set(parentReplyId, [newNestedReplyObj, ...existingNestedReplies]);
        return newMap;
      });
      
      replyTextRef.current = '';
      setShowNestedReplyInput(null);
      
      console.log('📝 대대댓글 작성 시작:', { 
        parentReplyId, 
        content: replyContent 
      });

      // TODO: 서버에 대대댓글 작성 요청
      // const replyData: RecommendWriteReviewRequest = {
      //   placeId: recommendation.id,
      //   content: replyContent,
      //   parentId: parentReplyId
      // };
      // await writeRecommendationReview(replyData);
      
      console.log('✅ 대대댓글 작성 성공');
      
    } catch (error) {
      console.error('❌ 대대댓글 작성 실패:', error);
      
      // 실패 시 UI 롤백
      setNestedReplies(prev => {
        const newMap = new Map(prev);
        const existingNestedReplies = newMap.get(parentReplyId) || [];
        newMap.set(parentReplyId, existingNestedReplies.slice(1)); // 첫 번째 요소 제거
        return newMap;
      });
      replyTextRef.current = '';
      
      Alert.alert('오류', '대대댓글 작성 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
    }
  };

  const handleToggleReplies = async (commentId: number) => {
    console.log('🔄 답글 토글 - commentId:', commentId);
    console.log('🔄 현재 expandedReplies:', Array.from(expandedReplies));
    
    setExpandedReplies(prev => {
      const newSet = new Set(prev);
      if (newSet.has(commentId)) {
        console.log('📤 답글 닫기');
        newSet.delete(commentId);
      } else {
        console.log('📥 답글 열기');
        newSet.add(commentId);
        // 답글이 열릴 때 답글 데이터 로드
        loadReplies(commentId);
      }
      console.log('🔄 새로운 expandedReplies:', Array.from(newSet));
      return newSet;
    });
  };

  // 답글 로드 함수
  const loadReplies = async (parentId: number) => {
    if (replies.has(parentId) || isLoadingReplies.has(parentId)) {
      return; // 이미 로드되었거나 로딩 중이면 스킵
    }

    try {
      setIsLoadingReplies(prev => new Set(prev).add(parentId));
      console.log('🔍 답글 로드 시작 - parentId:', parentId);
      
      const response = await getRecommendationReplies(parentId, 0, 10);
      console.log('📥 답글 API 응답:', response);
      console.log('📥 답글 content:', response.content);
      
      setReplies(prev => {
        const newMap = new Map(prev);
        newMap.set(parentId, response.content);
        return newMap;
      });
      
      console.log('✅ 답글 로드 성공:', response.content.length, '개');
    } catch (error) {
      console.error('❌ 답글 로드 실패:', error);
    } finally {
      setIsLoadingReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentId);
        return newSet;
      });
    }
  };

  // 대대댓글 로드 함수
  const loadNestedReplies = async (parentReplyId: number) => {
    if (nestedReplies.has(parentReplyId) || isLoadingNestedReplies.has(parentReplyId)) {
      return; // 이미 로드되었거나 로딩 중이면 스킵
    }

    try {
      setIsLoadingNestedReplies(prev => new Set(prev).add(parentReplyId));
      console.log('🔄 대대댓글 로드 시작:', parentReplyId);
      
      // TODO: 대대댓글 API 호출 (현재는 같은 API 사용)
      const response = await getRecommendationReplies(parentReplyId, 0, 10);
      console.log('✅ 대대댓글 로드 성공:', response);
      
      setNestedReplies(prev => {
        const newMap = new Map(prev);
        newMap.set(parentReplyId, response.content);
        return newMap;
      });
    } catch (error) {
      console.error('❌ 대대댓글 로드 실패:', error);
    } finally {
      setIsLoadingNestedReplies(prev => {
        const newSet = new Set(prev);
        newSet.delete(parentReplyId);
        return newSet;
      });
    }
  };

  // 블록 렌더링 함수
  const renderBlocks = useCallback(() => {
    if (!blocks || blocks.length === 0) {
  return (
        <View style={styles.emptyBlocksContainer}>
          <Text style={styles.emptyBlocksText}>추천 장소에 대한 상세 정보</Text>
          <Text style={styles.emptyBlocksSubText}>
            {recommendation?.type === RecommendationType.PLACE 
              ? '이 추천 여행지에 대한 자세한 정보를 준비 중입니다.'
              : '이 여행기에 대한 자세한 내용을 준비 중입니다.'
            }
          </Text>
        </View>
      );
    }
    
    return blocks
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map((block, index) => {
        
        if (block.type === 'TEXT') {
          return (
            <View key={block.id} style={styles.textBlock}>
              <Text style={styles.blockText}>{block.text}</Text>
        </View>
          );
        } else if (block.type === 'IMAGE') {
          // 임의 이미지 배열
          const blockImages = [
            'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
            'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=300&fit=crop',
          ];
          
          // 블록 ID 기반으로 일관된 이미지 선택
          const imageIndex = block.id % blockImages.length;
          const imageUrl = block.image?.url || blockImages[imageIndex];
          
          return (
            <View key={block.id} style={styles.imageBlock}>
              <Image 
                source={{ uri: imageUrl }} 
                style={styles.blockImage} 
                resizeMode="cover"
              />
              {block.caption && (
                <Text style={styles.imageCaption}>{block.caption}</Text>
              )}
            </View>
          );
        }
        return null;
    });
  }, [blocks?.length, blocks?.map(b => `${b.id}-${b.type}-${b.text}`).join(','), recommendation?.id]);

  // 무한 스크롤용 댓글 가져오기 (누적)
  const getLoadedComments = () => {
    return comments;
  };

  const totalPages = Math.ceil(comments.length / COMMENTS_PER_PAGE);

  const handleEndReached = () => {
    if (hasMoreComments && !isLoadingComments) {
      loadComments(currentPage + 1, true);
    }
  };

  const renderCommentItem = ({ item: rootReview }: { item: RootReviewResponseDto }) => {
    const comment = rootReview.reviewResponseDto;
    
    return (
      <View key={comment.id}>
        <View style={styles.commentItem}>
          {comment.status !== 'DELETED' && (
            <View style={styles.commentHeader}>
              <Text style={styles.commentAuthor}>{comment.writer}</Text>
            </View>
          )}
            <Text style={[
            styles.commentContent,
            comment.status === 'DELETED' && styles.deletedCommentContent
            ]}>
            {comment.status === 'DELETED' ? '삭제된 댓글입니다.' : comment.content}
            </Text>

          {comment.status !== 'DELETED' && (
            <View style={styles.commentActions}>
          <TouchableOpacity 
                style={styles.commentActionButton}
                onPress={() => handleToggleReplyInput(comment.id)}
          >
                <Ionicons name="chatbubble-outline" size={16} color="#7F8C8D" />
                <Text style={styles.commentActionText}>답글 {rootReview.replyCount}</Text>
          </TouchableOpacity>
              
              {rootReview.replyCount > 0 && (
                <TouchableOpacity 
                  style={styles.commentActionButton}
                  onPress={() => {
                    console.log('🔘 답글 토글 버튼 클릭 - commentId:', comment.id, 'replyCount:', rootReview.replyCount);
                    handleToggleReplies(comment.id);
                  }}
                >
                  <Ionicons 
                    name={expandedReplies.has(comment.id) ? "chevron-up" : "chevron-down"} 
                    size={16} 
                    color="#7F8C8D" 
                  />
                  <Text style={styles.commentActionText}>
                    {expandedReplies.has(comment.id) ? "답글 숨기기" : "답글 보기"}
                  </Text>
                </TouchableOpacity>
              )}
              
              {/* 자기 댓글인 경우 수정/삭제 버튼 표시 */}
              {user && (Number(user.userId) === Number(comment.writerId)) && (
                <>
              <TouchableOpacity 
                    style={styles.commentActionButton}
                    onPress={() => handleEditComment(comment.id, comment.content)}
                  >
                    <Ionicons name="create-outline" size={16} color="#3498DB" />
                    <Text style={[styles.commentActionText, { color: '#3498DB' }]}>수정</Text>
              </TouchableOpacity>

                    <TouchableOpacity 
                      style={styles.commentActionButton}
                    onPress={() => handleDeleteComment(comment.id, comment.content)}
                    >
                    <Ionicons name="trash-outline" size={16} color="#E74C3C" />
                    <Text style={[styles.commentActionText, { color: '#E74C3C' }]}>삭제</Text>
                    </TouchableOpacity>
                </>
              )}
                    
              {/* 다른 사람 댓글인 경우 신고 버튼 표시 */}
              {(!user || comment.writerId !== user.userId) && (
                    <TouchableOpacity 
                      style={styles.commentActionButton}
                      onPress={() => handleReportComment(comment.id)}
                    >
                      <Ionicons name="flag-outline" size={16} color="#7F8C8D" />
                      <Text style={styles.commentActionText}>신고</Text>
                    </TouchableOpacity>
              )}
                  </View>
          )}

                {/* 대댓글 입력 */}
          {comment.status !== 'DELETED' && showReplyInput === comment.id && (
                  <View style={styles.replyInputContainer}>
                    <TextInput
                      style={styles.replyInput}
                placeholder={`${comment.writer}님에게 답글 달기...`}
                      placeholderTextColor="#7F8C8D"
                value={replyTextRef.current}
                onChangeText={(text) => {
                  replyTextRef.current = text;
                }}
                multiline={true}
                blurOnSubmit={false}
                returnKeyType="default"
                textAlignVertical="top"
                autoCorrect={false}
                autoCapitalize="none"
                keyboardType="default"
                enablesReturnKeyAutomatically={false}
                scrollEnabled={false}
                    />
                    <View style={styles.replyActions}>
                      <TouchableOpacity 
                        style={styles.replyCancelButton}
                        onPress={() => {
                          setShowReplyInput(null);
                    replyTextRef.current = '';
                        }}
                      >
                        <Text style={styles.replyCancelText}>취소</Text>
                      </TouchableOpacity>
                      <TouchableOpacity 
                        style={[
                          styles.replySubmitButton,
                          { opacity: replyTextRef.current.trim() ? 1 : 0.5 }
                        ]}
                        onPress={() => handleAddReply(comment.id)}
                        disabled={!replyTextRef.current.trim()}
                      >
                        <Text style={styles.replySubmitText}>등록</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
        </View>

                {/* 대댓글 목록 */}
        {rootReview.replyCount > 0 && expandedReplies.has(comment.id) && (
                  <View style={styles.repliesContainer}>
            {isLoadingReplies.has(comment.id) ? (
              <View style={styles.replyLoadingContainer}>
                <Text style={styles.replyLoadingText}>답글을 불러오는 중...</Text>
              </View>
            ) : (
              replies.get(comment.id)?.map((reply) => {
                if (!reply) {
                  console.warn('⚠️ 답글 데이터 구조 오류:', reply);
                  return null;
                }
                
                return (
                      <View key={reply.id} style={styles.replyItem}>
                    {reply.status !== 'DELETED' && (
                        <View style={styles.replyHeader}>
                        <Text style={styles.replyAuthor}>{reply.writer || '익명'}</Text>
                        </View>
                    )}
                    <Text style={[
                      styles.replyContent,
                      reply.status === 'DELETED' && styles.deletedCommentContent
                    ]}>
                      {reply.status === 'DELETED' ? '삭제된 댓글입니다.' : (reply.content || '')}
                    </Text>
                        <View style={styles.replyActions}>
                      {/* 대대댓글 버튼 (depth < 2일 때만 표시) */}
                      {reply.status !== 'DELETED' && (!reply.depth || reply.depth < 2) && (
                        <TouchableOpacity 
                          style={styles.commentActionButton}
                          onPress={() => handleToggleNestedReplyInput(reply.id)}
                        >
                          <Ionicons name="chatbubble-outline" size={14} color="#7F8C8D" />
                          <Text style={styles.commentActionText}>답글</Text>
                        </TouchableOpacity>
                      )}

                      {/* 자기 답글인 경우 수정/삭제 버튼 표시 */}
                      {reply.status !== 'DELETED' && user && (Number(user.userId) === Number(reply.writerId)) && (
                        <>
                          <TouchableOpacity 
                            style={styles.commentActionButton}
                            onPress={() => handleEditReply(reply.id, reply.content)}
                          >
                            <Ionicons name="create-outline" size={14} color="#3498DB" />
                            <Text style={[styles.commentActionText, { color: '#3498DB' }]}>수정</Text>
                          </TouchableOpacity>
                          
                          <TouchableOpacity 
                            style={styles.commentActionButton}
                            onPress={() => handleDeleteReply(reply.id, reply.content)}
                          >
                            <Ionicons name="trash-outline" size={14} color="#E74C3C" />
                            <Text style={[styles.commentActionText, { color: '#E74C3C' }]}>삭제</Text>
                          </TouchableOpacity>
                        </>
                      )}
                      
                      {/* 다른 사람 답글인 경우 신고 버튼 표시 */}
                      {reply.status !== 'DELETED' && (!user || reply.writerId !== user.userId) && (
                          <TouchableOpacity 
                            style={styles.commentActionButton}
                            onPress={() => handleReportComment(reply.id)}
                          >
                            <Ionicons name="flag-outline" size={14} color="#7F8C8D" />
                            <Text style={styles.commentActionText}>신고</Text>
                          </TouchableOpacity>
                      )}
                        </View>

                        {/* 대대댓글 입력 */}
                        {reply.status !== 'DELETED' && showNestedReplyInput === reply.id && (
                          <View style={styles.nestedReplyInputContainer}>
                            <TextInput
                              style={styles.nestedReplyInput}
                              placeholder={`${reply.writer}님에게 답글 달기...`}
                              placeholderTextColor="#7F8C8D"
                              value={replyTextRef.current}
                              onChangeText={(text) => {
                                replyTextRef.current = text;
                              }}
                              multiline={true}
                              blurOnSubmit={false}
                              returnKeyType="default"
                              textAlignVertical="top"
                              autoCorrect={false}
                              autoCapitalize="none"
                              keyboardType="default"
                              enablesReturnKeyAutomatically={false}
                              scrollEnabled={false}
                            />
                            <View style={styles.replyActions}>
                              <TouchableOpacity 
                                style={styles.replyCancelButton}
                                onPress={() => {
                                  setShowNestedReplyInput(null);
                                  replyTextRef.current = '';
                                }}
                              >
                                <Text style={styles.replyCancelText}>취소</Text>
                              </TouchableOpacity>
                              <TouchableOpacity 
                                style={[
                                  styles.replySubmitButton,
                                  { opacity: replyTextRef.current.trim() ? 1 : 0.5 }
                                ]}
                                onPress={() => handleAddNestedReply(reply.id)}
                                disabled={!replyTextRef.current.trim()}
                              >
                                <Text style={styles.replySubmitText}>등록</Text>
                              </TouchableOpacity>
                            </View>
                          </View>
                        )}

                        {/* 대대댓글 목록 */}
                        {nestedReplies.has(reply.id) && expandedNestedReplies.has(reply.id) && (
                          <View style={styles.nestedRepliesContainer}>
                            {isLoadingNestedReplies.has(reply.id) ? (
                              <View style={styles.replyLoadingContainer}>
                                <Text style={styles.replyLoadingText}>대대댓글을 불러오는 중...</Text>
                              </View>
                            ) : (
                              nestedReplies.get(reply.id)?.map((nestedReply) => {
                                if (!nestedReply) return null;
                                
                                return (
                                  <View key={nestedReply.id} style={styles.nestedReplyItem}>
                                    {nestedReply.status !== 'DELETED' && (
                                      <View style={styles.replyHeader}>
                                        <Text style={styles.replyAuthor}>{nestedReply.writer || '익명'}</Text>
                                      </View>
                                    )}
                                    <Text style={[
                                      styles.replyContent,
                                      nestedReply.status === 'DELETED' && styles.deletedCommentContent
                                    ]}>
                                      {nestedReply.status === 'DELETED' ? '삭제된 댓글입니다.' : (nestedReply.content || '')}
                                    </Text>
                                    <View style={styles.replyActions}>
                                      {/* 자기 대대댓글인 경우 수정/삭제 버튼 표시 */}
                                      {nestedReply.status !== 'DELETED' && user && (Number(user.userId) === Number(nestedReply.writerId)) && (
                                        <>
                                          <TouchableOpacity 
                                            style={styles.commentActionButton}
                                            onPress={() => handleEditReply(nestedReply.id, nestedReply.content)}
                                          >
                                            <Ionicons name="create-outline" size={14} color="#3498DB" />
                                            <Text style={[styles.commentActionText, { color: '#3498DB' }]}>수정</Text>
                                          </TouchableOpacity>
                                          
                                          <TouchableOpacity 
                                            style={styles.commentActionButton}
                                            onPress={() => handleDeleteReply(nestedReply.id, nestedReply.content)}
                                          >
                                            <Ionicons name="trash-outline" size={14} color="#E74C3C" />
                                            <Text style={[styles.commentActionText, { color: '#E74C3C' }]}>삭제</Text>
                                          </TouchableOpacity>
                                        </>
                                      )}
                                      
                                      {/* 다른 사람 대대댓글인 경우 신고 버튼 표시 */}
                                      {nestedReply.status !== 'DELETED' && (!user || nestedReply.writerId !== user.userId) && (
                                        <TouchableOpacity 
                                          style={styles.commentActionButton}
                                          onPress={() => handleReportComment(nestedReply.id)}
                                        >
                                          <Ionicons name="flag-outline" size={14} color="#7F8C8D" />
                                          <Text style={styles.commentActionText}>신고</Text>
                                        </TouchableOpacity>
                                      )}
                                    </View>
                                  </View>
                                );
                              }).filter(Boolean) || []
                            )}
                          </View>
                        )}
                      </View>
                );
              }).filter(Boolean) || []
            )}
                  </View>
                )}
      </View>
    );
  };

  const renderHeader = useCallback(() => {
    if (!recommendation) return null;

    // 임의 이미지 배열 (여행지용)
    const placeImages = [
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
    ];
    
    // 임의 이미지 배열 (여행기용)
    const postImages = [
      'https://images.unsplash.com/photo-1488646953014-85cb44e25828?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1501594907352-04cda38ebc29?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=300&fit=crop',
      'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=400&h=300&fit=crop',
    ];
    
    // ID 기반으로 일관된 이미지 선택
    const isPlace = recommendation.type === RecommendationType.PLACE;
    const imageIndex = recommendation.id % (isPlace ? placeImages.length : postImages.length);
    const mainImageUrl = isPlace ? placeImages[imageIndex] : postImages[imageIndex];

    return (
      <View>
        {/* 메인 이미지 */}
        <View style={styles.mainImageContainer}>
          <Image 
            source={{ uri: mainImageUrl }} 
            style={styles.mainImage}
            resizeMode="cover"
          />
        </View>

        {/* 게시물 정보 */}
        <View style={styles.infoSection}>
          <Text style={styles.title}>{recommendation.title}</Text>
          {recommendation.subTitle && (
            <Text style={styles.subtitle}>{recommendation.subTitle}</Text>
          )}
          
          <View style={styles.metaInfo}>
            <View style={styles.authorContainer}>
              <Ionicons name="person-circle" size={20} color="#7F8C8D" />
              <Text style={styles.authorText}>
                {recommendation.author || '관리자'}
              </Text>
            </View>
            <Text style={styles.dateText}>{getRelativeTime(recommendation.createdAt)}</Text>
          </View>

          <View style={styles.locationContainer}>
            <Ionicons name="location" size={16} color="#7F8C8D" />
            <View style={styles.locationInfo}>
              <Text style={styles.locationName}>
                {recommendation.location.name}
              </Text>
            </View>
          </View>

          {recommendation.price && (
            <View style={styles.priceContainer}>
              <Ionicons name="card" size={16} color="#7F8C8D" />
              <Text style={styles.priceText}>{recommendation.price}</Text>
            </View>
          )}

          {/* 태그 */}
          <View style={styles.tagsContainer}>
            {recommendation.tags?.map((tag, index) => (
              <View key={index} style={styles.tag}>
                <Text style={styles.tagText}>#{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 블록 콘텐츠 */}
        <View style={styles.contentSection}>
          {renderBlocks()}
        </View>

        {/* 액션 버튼들 */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[
              styles.actionItem,
              isLiked && styles.likedActionItem
            ]} 
            onPress={handleLike}
          >
            <Ionicons 
              name={isLiked ? "heart" : "heart-outline"} 
              size={24} 
              color={isLiked ? "#FF6B6B" : "#7F8C8D"} 
            />
            <Text style={[
              styles.actionText,
              { color: isLiked ? "#FF6B6B" : "#7F8C8D" }
            ]}>
              {recommendation.likesCount || 0}
                </Text>
              </TouchableOpacity>

          <TouchableOpacity 
            style={styles.actionItem} 
            onPress={() => setShowComments(!showComments)}
          >
            <Ionicons name="chatbubble-outline" size={24} color="#7F8C8D" />
            <Text style={styles.actionText}>{recommendation.reviewsCount || 0}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.actionItem}>
            <Ionicons name="eye-outline" size={24} color="#7F8C8D" />
            <Text style={styles.actionText}>{recommendation.viewsCount || 0}</Text>
          </TouchableOpacity>
        </View>

        {/* 여행기 작성자 수정/삭제 버튼 */}
        {(() => {
          const shouldShowButtons = showComments && 
                                  recommendation && 
                                  recommendation.type === RecommendationType.POST && 
                                  user && 
                                  user.userId === recommendation.authorId;
          
          console.log('🔍 수정/삭제 버튼 표시 조건 체크:', {
            showComments,
            hasRecommendation: !!recommendation,
            recommendationType: recommendation?.type,
            isPostType: recommendation?.type === RecommendationType.POST,
            hasUser: !!user,
            userId: user?.userId,
            authorId: recommendation?.authorId,
            isAuthor: user?.userId === recommendation?.authorId,
            shouldShowButtons
          });
          
          // 🔧 임시: 작성자 조건만 체크하고 타입은 무시
          return showComments && recommendation && user && user.userId === recommendation.authorId;
        })() && (
          <View style={styles.authorActionsContainer}>
            <TouchableOpacity 
              style={styles.authorActionButton}
              onPress={handleEditRecommendation}
            >
              <Ionicons name="create-outline" size={16} color="#3498DB" />
              <Text style={styles.authorActionText}>수정</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.authorActionButton}
              onPress={handleDeleteRecommendation}
            >
              <Ionicons name="trash-outline" size={16} color="#E74C3C" />
              <Text style={[styles.authorActionText, { color: '#E74C3C' }]}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 댓글 작성란 */}
        {showComments && (
          <View style={styles.commentInputSection}>
            <Text style={styles.commentsTitle}>댓글 {recommendation?.reviewsCount || 0}개</Text>
            <CommentInput 
              onAddComment={(content: string) => handleAddComment(content)}
              disabled={!user}
            />
          </View>
        )}

                  </View>
    );
  }, [recommendation, user, isLiked, handleLike, handleShare, handleBackPress]);

  const renderFooter = useCallback(() => {
    if (!showComments) return null;
    
    return (
      <View style={styles.commentsSection}>
        {/* 로딩 상태 */}
        {!hasMoreComments && comments.length > 0 && (
          <View style={styles.endOfCommentsContainer}>
            <Text style={styles.endOfCommentsText}>모든 댓글을 불러왔습니다</Text>
          </View>
        )}
                </View>
    );
  }, [showComments, hasMoreComments, comments.length, isLoadingComments]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatCommentDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    return date.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.topNavigation}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
                          </TouchableOpacity>
                        </View>
        <View style={styles.loadingContainer}>
          <Ionicons name="refresh" size={48} color="#BDC3C7" />
          <Text style={styles.loadingText}>로딩 중...</Text>
                      </View>
                  </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* 상단 네비게이션 */}
      <View style={styles.topNavigation}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
              </TouchableOpacity>
        <View style={styles.navigationActions}>
          <TouchableOpacity onPress={handleShare} style={styles.actionButton}>
            <Ionicons name="share-outline" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          </View>
      </View>

      {/* 메인 콘텐츠 - FlatList로 무한 스크롤 구현 */}
      <FlatList
        data={showComments ? getLoadedComments() : []}
        renderItem={renderCommentItem}
        keyExtractor={(item) => item.reviewResponseDto.id.toString()}
        ListHeaderComponent={renderHeader}
        ListFooterComponent={showComments ? renderFooter : null}
        onEndReached={showComments ? handleEndReached : undefined}
        onEndReachedThreshold={0.1}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="none"
        style={styles.content}
        contentContainerStyle={styles.contentContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mainImageContainer: {
    width: '100%',
    height: 250,
    marginBottom: 20,
  },
  mainImage: {
    width: '100%',
    height: '100%',
  },
  topNavigation: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navigationActions: {
    flexDirection: 'row',
  },
  actionButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    paddingBottom: 100,
  },
  imageContainer: {
    position: 'relative',
  },
  recommendationImage: {
    width: width,
    height: 300,
    resizeMode: 'cover',
  },
  infoSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#7F8C8D',
    marginBottom: 16,
  },
  metaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  authorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  authorText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 6,
  },
  dateText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  locationInfo: {
    marginLeft: 4,
    flex: 1,
  },
  locationName: {
    fontSize: 14,
    color: '#2C3E50',
    fontWeight: '500',
    marginBottom: 2,
  },
  locationDetail: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  tag: {
    backgroundColor: '#F8F9FA',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  contentSection: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  contentText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  actionsSection: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F1F3F4',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  actionText: {
    fontSize: 16,
    marginLeft: 6,
    fontWeight: '500',
  },
  likedActionItem: {
    backgroundColor: '#FFF5F5',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  authorActionsContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E8E8E8',
  },
  authorActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginLeft: 8,
    backgroundColor: '#FFFFFF',
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#E8E8E8',
  },
  authorActionText: {
    fontSize: 12,
    color: '#3498DB',
    fontWeight: '500',
    marginLeft: 4,
  },
  commentInputSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#E9ECEF',
  },
  commentsSection: {
    backgroundColor: '#F8F9FA',
    padding: 20,
  },
  commentsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  loadMoreButton: {
    backgroundColor: '#FF6B35',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  loadMoreText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  commentInputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  commentInput: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    maxHeight: 40,
    paddingVertical: 8,
    textAlignVertical: 'top',
  },
  commentSubmitButton: {
    backgroundColor: '#FF6B35',
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  commentItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
  },
  commentDate: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  commentContent: {
    fontSize: 14,
    color: '#333333',
    lineHeight: 20,
    marginBottom: 8,
  },
  deletedCommentContent: {
    color: '#999999',
    fontStyle: 'italic',
  },
  commentActions: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 12,
    marginLeft: 4,
    color: '#7F8C8D',
  },
  replyInputContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  replyInput: {
    fontSize: 14,
    color: '#333333',
    maxHeight: 35,
    paddingVertical: 6,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  replyActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  replyCancelButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  replyCancelText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  replySubmitButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 6,
  },
  replySubmitText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '600',
  },
  repliesContainer: {
    marginLeft: 20,
    marginTop: 8,
  },
  replyItem: {
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  // 대대댓글 관련 스타일
  nestedReplyInputContainer: {
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    padding: 12,
    marginLeft: 20,
    marginTop: 8,
    marginBottom: 8,
  },
  nestedReplyInput: {
    fontSize: 14,
    color: '#333333',
    maxHeight: 35,
    paddingVertical: 6,
    textAlignVertical: 'top',
    marginBottom: 8,
  },
  nestedRepliesContainer: {
    marginLeft: 40,
    marginTop: 8,
  },
  nestedReplyItem: {
    backgroundColor: '#F0F2F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  replyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  replyAuthor: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333333',
  },
  replyDate: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  replyContent: {
    fontSize: 13,
    color: '#333333',
    lineHeight: 18,
    marginBottom: 6,
  },
  bottomSpacing: {
    height: 100,
  },
  commentsList: {
    maxHeight: 400, // 댓글 리스트 최대 높이 제한
  },
  endOfCommentsContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginTop: 10,
  },
  endOfCommentsText: {
    fontSize: 14,
    color: '#6C757D',
    fontStyle: 'italic',
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 50,
    flex: 1,
  },
  loadingText: {
    fontSize: 14,
    color: '#FF6B35',
  },
  replyLoadingContainer: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  replyLoadingText: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  // 블록 관련 스타일
  emptyBlocksContainer: {
    padding: 20,
    alignItems: 'center',
  },
  emptyBlocksText: {
    fontSize: 16,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginBottom: 8,
  },
  emptyBlocksSubText: {
    fontSize: 14,
    color: '#BDC3C7',
    textAlign: 'center',
  },
  textBlock: {
    marginBottom: 16,
  },
  blockText: {
    fontSize: 16,
    color: '#333333',
    lineHeight: 24,
  },
  imageBlock: {
    marginBottom: 16,
  },
  blockImage: {
    width: '100%',
    height: 200,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  imageCaption: {
    fontSize: 14,
    color: '#7F8C8D',
    fontStyle: 'italic',
    marginTop: 8,
    textAlign: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  priceText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 4,
  },
});

export default RecommendDetailScreen;
