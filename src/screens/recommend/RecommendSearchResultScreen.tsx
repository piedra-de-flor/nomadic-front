import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { LoadingDots } from '../../components/ui';

// 추천 게시물 타입 정의
interface Recommendation {
  id: number;
  title: string;
  notionUrl?: string;
  subTitle?: string;
  location: Location;
  date: string;
  like: boolean;
  likeCount: number;
  commentCount: number;
  image?: string;
  description?: string;
}

interface Location {
  latitude: number;
  longitude: number;
  address?: string;
  name?: string;
}

// 정렬 옵션
type SortOption = 'date' | 'name' | 'likes' | 'region' | 'comments';

// 더 많은 데모 데이터 (페이지네이션용)
const allMockRecommendations: Recommendation[] = [
  {
    id: 1,
    title: '제주도 한라산 등반의 모든 것',
    subTitle: '한라산 정상까지의 완벽한 가이드',
    location: {
      latitude: 33.3617,
      longitude: 126.5292,
      address: '제주특별자치도 제주시',
      name: '한라산'
    },
    date: '2024-12-15T10:00:00Z',
    like: false,
    likeCount: 1247,
    commentCount: 89,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '한라산 등반을 위한 완벽한 가이드입니다.'
  },
  {
    id: 2,
    title: '부산 해운대 밤바다의 매력',
    subTitle: '해운대에서 즐기는 특별한 밤',
    location: {
      latitude: 35.1587,
      longitude: 129.1603,
      address: '부산광역시 해운대구',
      name: '해운대해수욕장'
    },
    date: '2024-12-14T15:30:00Z',
    like: true,
    likeCount: 892,
    commentCount: 67,
    image: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400',
    description: '부산 해운대의 아름다운 밤바다를 만끽할 수 있는 최고의 장소들을 소개합니다.'
  },
  {
    id: 3,
    title: '강릉 커피거리 완전정복',
    subTitle: '강릉의 숨은 커피 명소들',
    location: {
      latitude: 37.7519,
      longitude: 128.8761,
      address: '강원도 강릉시',
      name: '안목해변'
    },
    date: '2024-12-13T09:15:00Z',
    like: false,
    likeCount: 1456,
    commentCount: 123,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400',
    description: '강릉 커피거리의 모든 것을 알아보는 완벽한 가이드입니다.'
  },
  {
    id: 4,
    title: '전주 한옥마을 여행기',
    subTitle: '전통의 아름다움을 만나다',
    location: {
      latitude: 35.8242,
      longitude: 127.1480,
      address: '전라북도 전주시',
      name: '전주한옥마을'
    },
    date: '2024-12-12T14:20:00Z',
    like: true,
    likeCount: 678,
    commentCount: 45,
    image: 'https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400',
    description: '전주 한옥마을의 전통적인 아름다움을 경험할 수 있는 여행기입니다.'
  },
  {
    id: 5,
    title: '여수 밤바다의 환상',
    subTitle: '여수에서 만나는 특별한 밤',
    location: {
      latitude: 34.7604,
      longitude: 127.6622,
      address: '전라남도 여수시',
      name: '여수밤바다'
    },
    date: '2024-12-11T18:45:00Z',
    like: false,
    likeCount: 934,
    commentCount: 78,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '여수 밤바다의 환상적인 야경을 감상할 수 있는 최고의 장소들을 소개합니다.'
  },
  // 추가 데이터 (페이지네이션용)
  {
    id: 6,
    title: '경주 불국사의 역사',
    subTitle: '신라의 찬란한 문화유산',
    location: {
      latitude: 35.7894,
      longitude: 129.3320,
      address: '경상북도 경주시',
      name: '불국사'
    },
    date: '2024-12-10T11:30:00Z',
    like: false,
    likeCount: 756,
    commentCount: 34,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '경주 불국사의 역사와 아름다움을 소개합니다.'
  },
  {
    id: 7,
    title: '안동 하회마을의 전통',
    subTitle: '조선시대 마을의 모습',
    location: {
      latitude: 36.5392,
      longitude: 128.5189,
      address: '경상북도 안동시',
      name: '하회마을'
    },
    date: '2024-12-09T16:20:00Z',
    like: true,
    likeCount: 623,
    commentCount: 56,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '안동 하회마을의 전통적인 모습을 만나보세요.'
  },
  {
    id: 8,
    title: '춘천 남이섬의 자연',
    subTitle: '자연과 예술이 만나는 곳',
    location: {
      latitude: 37.7904,
      longitude: 127.5260,
      address: '강원도 춘천시',
      name: '남이섬'
    },
    date: '2024-12-08T13:45:00Z',
    like: false,
    likeCount: 1089,
    commentCount: 92,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '춘천 남이섬의 아름다운 자연을 감상해보세요.'
  },
  {
    id: 9,
    title: '속초 설악산의 가을',
    subTitle: '단풍이 아름다운 설악산',
    location: {
      latitude: 38.2070,
      longitude: 128.5918,
      address: '강원도 속초시',
      name: '설악산'
    },
    date: '2024-12-07T09:15:00Z',
    like: true,
    likeCount: 1345,
    commentCount: 78,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '속초 설악산의 아름다운 가을 단풍을 만나보세요.'
  },
  {
    id: 10,
    title: '포항 호미곶의 일출',
    subTitle: '한반도 최동단의 아름다운 일출',
    location: {
      latitude: 36.0764,
      longitude: 129.5653,
      address: '경상북도 포항시',
      name: '호미곶'
    },
    date: '2024-12-06T06:30:00Z',
    like: false,
    likeCount: 987,
    commentCount: 65,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '포항 호미곶에서 감상하는 아름다운 일출을 소개합니다.'
  },
];

const RecommendSearchResultScreen = ({ navigation, route }: any) => {
  const { searchQuery } = route.params || { searchQuery: '제주도' };
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [selectedSort, setSelectedSort] = useState<SortOption>('date');
  const [showSortOptions, setShowSortOptions] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastSearchQuery, setLastSearchQuery] = useState(searchQuery);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  
  // 스크롤 기반 UI 숨김/표시 상태
  const [isHeaderVisible, setIsHeaderVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const scrollY = useRef(new Animated.Value(0)).current;
  const headerTranslateY = useRef(new Animated.Value(0)).current;
  const contentPaddingTop = useRef(new Animated.Value(150)).current; // 헤더 높이만큼 초기 패딩

  const ITEMS_PER_PAGE = 5;

  const sortOptions = [
    { key: 'date', label: '날짜순', icon: 'calendar' },
    { key: 'name', label: '이름순', icon: 'text' },
    { key: 'likes', label: '찜 많은 순', icon: 'heart' },
    { key: 'region', label: '지역별', icon: 'location' },
    { key: 'comments', label: '댓글수 순', icon: 'chatbubble' },
  ];

  // 화면이 포커스될 때마다 실행
  useFocusEffect(
    React.useCallback(() => {
      // 검색어가 변경된 경우에만 업데이트
      if (searchQuery !== lastSearchQuery) {
        setLastSearchQuery(searchQuery);
        setCurrentPage(1);
        setRecommendations([]);
        setHasMore(true);
        // 검색어 변경 시 로딩 표시
        setIsInitialLoading(true);
        setTimeout(() => {
          loadRecommendations(searchQuery, 1, true);
          setIsInitialLoading(false);
        }, 1500);
      }
    }, [searchQuery, lastSearchQuery])
  );

  // 초기 로드
  useEffect(() => {
    // 초기 로딩 시뮬레이션
    setIsInitialLoading(true);
    setTimeout(() => {
      loadRecommendations(searchQuery, 1, true);
      setIsInitialLoading(false);
    }, 1500);
  }, []);

  const loadRecommendations = async (query: string, page: number, isRefresh: boolean = false) => {
    if (loading) return;
    
    setLoading(true);
    
    // 검색어에 따른 필터링 (실제로는 API 호출)
    const filteredRecommendations = allMockRecommendations.filter(rec => 
      rec.title.toLowerCase().includes(query.toLowerCase()) ||
      rec.subTitle?.toLowerCase().includes(query.toLowerCase()) ||
      rec.location.address?.toLowerCase().includes(query.toLowerCase()) ||
      rec.description?.toLowerCase().includes(query.toLowerCase())
    );

    // 페이지네이션
    const startIndex = (page - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageData = filteredRecommendations.slice(startIndex, endIndex);

    // 정렬 적용
    const sortedData = sortRecommendations(pageData, selectedSort);

    setTimeout(() => {
      if (isRefresh) {
        setRecommendations(sortedData);
      } else {
        setRecommendations(prev => [...prev, ...sortedData]);
      }
      
      setHasMore(endIndex < filteredRecommendations.length);
      setCurrentPage(page);
      setLoading(false);
    }, 1000); // 로딩 시뮬레이션
  };

  const sortRecommendations = (data: Recommendation[], sortKey: SortOption) => {
    const sorted = [...data];
    
    switch (sortKey) {
      case 'date':
        sorted.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        break;
      case 'name':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'likes':
        sorted.sort((a, b) => b.likeCount - a.likeCount);
        break;
      case 'region':
        sorted.sort((a, b) => a.location.address?.localeCompare(b.location.address || '') || 0);
        break;
      case 'comments':
        sorted.sort((a, b) => b.commentCount - a.commentCount);
        break;
    }
    
    return sorted;
  };

  const handleSort = (sortKey: SortOption) => {
    setSelectedSort(sortKey);
    setShowSortOptions(false);
    
    const sortedRecommendations = sortRecommendations(recommendations, sortKey);
    setRecommendations(sortedRecommendations);
  };

  const handleLoadMore = () => {
    if (hasMore && !loading) {
      loadRecommendations(searchQuery, currentPage + 1, false);
    }
  };

  const handleLike = (id: number) => {
    setRecommendations(prev => 
      prev.map(rec => 
        rec.id === id 
          ? { 
              ...rec, 
              like: !rec.like, 
              likeCount: rec.like ? rec.likeCount - 1 : rec.likeCount + 1 
            }
          : rec
      )
    );
  };

  const handleRecommendationPress = (recommendation: Recommendation) => {
    navigation.navigate('RecommendDetail', { 
      recommendationId: recommendation.id,
      fromPage: 'searchResult',
      searchQuery: searchQuery
    });
  };

  const handleBackPress = () => {
    // 뒤로가기 시 추천 여행지 메인 페이지로 이동
    navigation.navigate('Recommend');
  };

  // 스크롤 이벤트 핸들러
  const handleScroll = (event: any) => {
    const currentScrollY = event.nativeEvent.contentOffset.y;
    const scrollDelta = currentScrollY - lastScrollY;
    
    // 스크롤 임계값 설정 (50px 이상 스크롤할 때만 UI 숨김/표시)
    const threshold = 50;
    
    if (Math.abs(scrollDelta) > threshold) {
      if (scrollDelta > 0 && currentScrollY > 100) {
        // 아래로 스크롤 - 헤더 숨김
        if (isHeaderVisible) {
          setIsHeaderVisible(false);
          Animated.parallel([
            Animated.timing(headerTranslateY, {
              toValue: -150, // 헤더 높이만큼 위로 이동
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(contentPaddingTop, {
              toValue: 0, // 콘텐츠 패딩을 0으로 줄여서 확장
              duration: 300,
              useNativeDriver: false, // padding은 native driver 사용 불가
            })
          ]).start();
        }
      } else if (scrollDelta < 0) {
        // 위로 스크롤 - 헤더 표시
        if (!isHeaderVisible) {
          setIsHeaderVisible(true);
          Animated.parallel([
            Animated.timing(headerTranslateY, {
              toValue: 0,
              duration: 300,
              useNativeDriver: true,
            }),
            Animated.timing(contentPaddingTop, {
              toValue: 150, // 콘텐츠 패딩을 원래대로 복원
              duration: 300,
              useNativeDriver: false,
            })
          ]).start();
        }
      }
      setLastScrollY(currentScrollY);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 1) return '1일 전';
    if (diffDays < 7) return `${diffDays}일 전`;
    if (diffDays < 30) return `${Math.ceil(diffDays / 7)}주 전`;
    return `${Math.ceil(diffDays / 30)}개월 전`;
  };

  const renderRecommendationItem = ({ item }: { item: Recommendation }) => (
    <TouchableOpacity 
      style={styles.recommendationCard}
      onPress={() => handleRecommendationPress(item)}
    >
      <Image source={{ uri: item.image }} style={styles.recommendationImage} />
      <View style={styles.recommendationContent}>
        <View style={styles.recommendationHeader}>
          <Text style={styles.recommendationTitle} numberOfLines={2}>
            {item.title}
          </Text>
          <TouchableOpacity 
            style={styles.likeButton}
            onPress={() => handleLike(item.id)}
          >
            <Ionicons 
              name={item.like ? "heart" : "heart-outline"} 
              size={18} 
              color={item.like ? "#E74C3C" : "#7F8C8D"} 
            />
          </TouchableOpacity>
        </View>
        
        {item.subTitle && (
          <Text style={styles.recommendationSubtitle} numberOfLines={1}>
            {item.subTitle}
          </Text>
        )}
        
        <View style={styles.locationContainer}>
          <Ionicons name="location" size={12} color="#7F8C8D" />
          <Text style={styles.locationText}>{item.location.address}</Text>
        </View>
        
        <View style={styles.recommendationFooter}>
          <Text style={styles.dateText}>{formatDate(item.date)}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Ionicons name="heart" size={12} color="#E74C3C" />
              <Text style={styles.statText}>{item.likeCount}</Text>
            </View>
            <View style={styles.statItem}>
              <Ionicons name="chatbubble" size={12} color="#7F8C8D" />
              <Text style={styles.statText}>{item.commentCount}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderInitialLoading = () => (
    <View style={styles.initialLoadingState}>
      <LoadingDots size={12} color="#FF6B35" />
      <Text style={styles.initialLoadingText}>검색 중...</Text>
    </View>
  );

  const renderFooter = () => {
    if (!loading) return null;
    
    return (
      <View style={styles.loadingFooter}>
        <LoadingDots size={8} color="#FF6B35" />
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* 상단 네비게이션 - 애니메이션 적용 */}
      <Animated.View 
        style={[
          styles.headerContainer,
          {
            transform: [{ translateY: headerTranslateY }]
          }
        ]}
      >
        {/* 상단 네비게이션 */}
        <View style={styles.topNavigation}>
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#333333" />
          </TouchableOpacity>
          
          <View style={styles.searchInfo}>
            <Text style={styles.searchQuery}>'{searchQuery}' 검색 결과</Text>
            <Text style={styles.resultCount}>{recommendations.length}개 결과</Text>
          </View>

          <TouchableOpacity 
            style={styles.sortButton}
            onPress={() => setShowSortOptions(!showSortOptions)}
          >
            <Ionicons name="options-outline" size={20} color="#7F8C8D" />
          </TouchableOpacity>
        </View>

        {/* 정렬 옵션 */}
        {showSortOptions && (
          <View style={styles.sortOptionsContainer}>
            {sortOptions.map((option) => (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.sortOption,
                  selectedSort === option.key && styles.sortOptionSelected
                ]}
                onPress={() => handleSort(option.key as SortOption)}
              >
                <Ionicons 
                  name={option.icon as any} 
                  size={16} 
                  color={selectedSort === option.key ? '#FF6B35' : '#7F8C8D'} 
                />
                <Text style={[
                  styles.sortOptionText,
                  selectedSort === option.key && styles.sortOptionTextSelected
                ]}>
                  {option.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </Animated.View>

      {/* 추천 게시물 리스트 */}
      <Animated.View style={[styles.listWrapper, { paddingTop: contentPaddingTop }]}>
        {isInitialLoading ? (
          renderInitialLoading()
        ) : (
          <FlatList
            data={recommendations}
            renderItem={renderRecommendationItem}
            keyExtractor={(item) => item.id.toString()}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.listContainer}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.1}
            ListFooterComponent={renderFooter}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            ListEmptyComponent={
              isInitialLoading ? null : (
                <View style={styles.emptyState}>
                  <Ionicons name="search" size={64} color="#BDC3C7" />
                  <Text style={styles.emptyTitle}>검색 결과가 없습니다</Text>
                  <Text style={styles.emptySubtitle}>다른 키워드로 검색해보세요</Text>
                </View>
              )
            }
          />
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  headerContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    backgroundColor: '#FFFFFF',
  },
  topNavigation: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  backButton: {
    marginRight: 12,
    padding: 4,
  },
  searchInfo: {
    flex: 1,
  },
  searchQuery: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
  },
  resultCount: {
    fontSize: 12,
    color: '#7F8C8D',
    marginTop: 2,
  },
  sortButton: {
    padding: 8,
  },
  sortOptionsContainer: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  sortOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  sortOptionSelected: {
    backgroundColor: '#FFF5F2',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#7F8C8D',
    marginLeft: 8,
  },
  sortOptionTextSelected: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  initialLoadingState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  initialLoadingText: {
    fontSize: 16,
    color: '#7F8C8D',
    marginTop: 16,
    fontWeight: '500',
  },
  recommendationCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  recommendationImage: {
    width: 120,
    height: 120,
    resizeMode: 'cover',
  },
  recommendationContent: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  recommendationTitle: {
    flex: 1,
    fontSize: 15,
    fontWeight: 'bold',
    color: '#333333',
    marginRight: 8,
    lineHeight: 20,
  },
  likeButton: {
    padding: 2,
  },
  recommendationSubtitle: {
    fontSize: 13,
    color: '#7F8C8D',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  locationText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginLeft: 4,
  },
  recommendationFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateText: {
    fontSize: 11,
    color: '#7F8C8D',
  },
  statsContainer: {
    flexDirection: 'row',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  statText: {
    fontSize: 11,
    color: '#7F8C8D',
    marginLeft: 3,
  },
  loadingFooter: {
    padding: 20,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#7F8C8D',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginTop: 16,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
  },
});

export default RecommendSearchResultScreen;
