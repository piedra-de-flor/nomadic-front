import React, { useState, useCallback, useEffect } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { 
  Recommendation, 
  RecommendationType, 
  RecommendationSearchRequest,
  RecommendOrderType,
  Pageable
} from '../types';
import { 
  getRecommendations, 
  searchRecommendations, 
  getRandomRecommendations,
  getRelativeTime,
  useDebounce,
  toggleRecommendationLike,
  getRecommendationImage
} from '../services/recommendation/recommendationService';

// 좋아요 상태 관리 (전역 메모리 기반 - 페이지 간 공유)
const globalLikeStates = new Map<number, boolean>();

// 이미지 캐시 관리 (전역 메모리 기반)
const imageCache = new Map<number, string>();

const RecommendScreen = ({ navigation, route }: any) => {
  // Redux 상태
  const { user } = useSelector((state: any) => state.auth);
  
  // 탭 상태
  const [activeTab, setActiveTab] = useState<RecommendationType>(RecommendationType.PLACE);
  
  // 데이터 상태
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isInitialLoad, setIsInitialLoad] = useState(true); // 초기 로딩 상태 추가
  const [hasBeenFocused, setHasBeenFocused] = useState(false); // 포커스 상태 추적
  
  // 검색/필터 상태
  const [searchQuery, setSearchQuery] = useState('');
  const [sortType, setSortType] = useState<RecommendOrderType>(RecommendOrderType.CREATED_DESC);
  
  // 디바운스된 검색어
  const debouncedSearchQuery = useDebounce(searchQuery, 300);
  
  // 좋아요 상태 관리 (전역 메모리 기반)
  // const [likeStates, setLikeStates] = useState<Map<number, boolean>>(new Map());

  // 추천 장소 목록 로드 (랜덤 추천)
  const loadRecommendations = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 랜덤 추천 장소 로드 시작:', { 
        activeTab, 
        timestamp: new Date().toISOString(),
        searchQuery: searchQuery.trim(),
        debouncedSearchQuery: debouncedSearchQuery.trim(),
        isInitialLoad
      });
      
      // 랜덤 추천 사용 (20개 제한)
      const data = await getRandomRecommendations(activeTab, 20);
      console.log('📊 API 응답 데이터:', data);
      
      // 서버에서 받은 like 상태를 globalLikeStates에 설정
      data.forEach(item => {
        if (item.like !== undefined) {
          globalLikeStates.set(item.id, item.like);
        }
      });
      
      setRecommendations(data);
      
      console.log('✅ 랜덤 추천 장소 로드 성공:', data.length, '개');
    } catch (error: any) {
      console.error('❌ 랜덤 추천 장소 로드 실패:', error);
      console.error('❌ 에러 상세:', {
        message: error?.message,
        status: error?.response?.status,
        data: error?.response?.data,
        config: error?.config
      });
      Alert.alert('오류', '추천 장소를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 정렬된 추천 장소 목록 로드
  const loadSortedRecommendations = async () => {
    try {
      setIsLoading(true);
      console.log('🔍 정렬된 추천 장소 로드:', { activeTab, sortType });
      
      const params: RecommendationSearchRequest = {
        type: activeTab,
        sort: sortType,
        pageable: {
          page: 0,
          size: 20
        }
      };
      
      const data = await getRecommendations(params);
      
      // 서버에서 받은 like 상태를 globalLikeStates에 설정
      data.forEach(item => {
        if (item.like !== undefined) {
          globalLikeStates.set(item.id, item.like);
        }
      });
      
      setRecommendations(data);
      
      console.log('✅ 정렬된 추천 장소 로드 성공:', data.length, '개');
    } catch (error) {
      console.error('❌ 정렬된 추천 장소 로드 실패:', error);
      Alert.alert('오류', '추천 장소를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 검색 실행
  const performSearch = async (keyword: string) => {
    try {
      setIsLoading(true);
      console.log('🔍 추천 장소 검색:', { keyword, activeTab });
      
      const data = await searchRecommendations(keyword, activeTab);
      
      // 서버에서 받은 like 상태를 globalLikeStates에 설정
      data.forEach(item => {
        if (item.like !== undefined) {
          globalLikeStates.set(item.id, item.like);
        }
      });
      
      setRecommendations(data);
      
      console.log('✅ 추천 장소 검색 성공:', data.length, '개');
    } catch (error) {
      console.error('❌ 추천 장소 검색 실패:', error);
      Alert.alert('오류', '검색 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 랜덤 추천 장소 로드
  const loadRandomRecommendations = async () => {
    try {
      console.log('🔍 랜덤 추천 장소 로드:', activeTab);
      
      const data = await getRandomRecommendations(activeTab, 10);
      
      // 서버에서 받은 like 상태를 globalLikeStates에 설정
      data.forEach(item => {
        if (item.like !== undefined) {
          globalLikeStates.set(item.id, item.like);
        }
      });
      
      setRecommendations(data);
      
      console.log('✅ 랜덤 추천 장소 로드 성공:', data.length, '개');
    } catch (error) {
      console.error('❌ 랜덤 추천 장소 로드 실패:', error);
      Alert.alert('오류', '랜덤 추천 장소를 불러오는데 실패했습니다.');
    }
  };

  // 검색어 변경 핸들러
  const handleSearch = useCallback((query: string) => {
    setSearchQuery(query);
  }, []);

  // 탭 변경 핸들러
  const handleTabChange = useCallback((tab: RecommendationType) => {
    setActiveTab(tab);
    setSearchQuery('');
  }, []);

  // 새로고침 핸들러
  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      if (searchQuery.trim()) {
        await performSearch(searchQuery);
      } else {
        await loadRecommendations();
      }
    } finally {
      setIsRefreshing(false);
    }
  }, [searchQuery, activeTab]);

  // 추천 장소 클릭 핸들러
  const handleRecommendationPress = useCallback((recommendation: Recommendation) => {
    console.log('🏛️ 추천 장소 클릭:', recommendation);
    
    // 로그인 체크
    if (!user) {
      Alert.alert(
        '로그인 필요',
        '추천 상세 정보를 보려면 로그인이 필요합니다.',
        [
          {
            text: '취소',
            style: 'cancel',
          },
          {
            text: '로그인',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
      return;
    }
    
    navigation.navigate('RecommendDetail', { 
      recommendationId: recommendation.id,
      type: recommendation.type,
      fromTab: activeTab // 현재 탭 정보 전달
    });
  }, [navigation, activeTab, user]);

  // 이미지 로딩 함수 (풍경 사진 배열 사용)
  const loadImage = useCallback((recommendationId: number): string => {
    // 캐시에서 먼저 확인
    if (imageCache.has(recommendationId)) {
      return imageCache.get(recommendationId)!;
    }

    try {
      const imageUrl = getRecommendationImage(recommendationId);
      imageCache.set(recommendationId, imageUrl);
      return imageUrl;
    } catch (error) {
      console.error('❌ 이미지 로딩 실패:', error);
      // 기본 풍경 이미지 반환
      const defaultImage = 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop';
      imageCache.set(recommendationId, defaultImage);
      return defaultImage;
    }
  }, []);

  // 좋아요 토글 핸들러
  const handleLikeToggle = useCallback(async (recommendation: Recommendation) => {
    if (!user) {
      Alert.alert('로그인 필요', '좋아요를 누르려면 로그인이 필요합니다.');
      return;
    }

    try {
      // 즉시 UI 반영
      const newLikedState = !globalLikeStates.get(recommendation.id);
      globalLikeStates.set(recommendation.id, newLikedState);

      // 추천 장소 목록에서 좋아요 수만 업데이트
      setRecommendations(prev => 
        prev.map(rec => 
          rec.id === recommendation.id 
            ? { 
                ...rec, 
                likesCount: newLikedState ? (rec.likesCount || 0) + 1 : Math.max((rec.likesCount || 0) - 1, 0)
              }
            : rec
        )
      );

      console.log('💖 좋아요 UI 업데이트 완료:', { 
        id: recommendation.id, 
        newLikedState, 
        newLikesCount: newLikedState ? (recommendation.likesCount || 0) + 1 : Math.max((recommendation.likesCount || 0) - 1, 0)
      });

      // 서버에 좋아요 토글 요청 (백그라운드)
      toggleRecommendationLike(recommendation.id, user.userId)
        .then(result => {
          console.log('✅ 좋아요 토글 성공:', result);
          // API 문서에 따르면 추천 장소 ID만 반환되므로 클라이언트 상태 유지
        })
        .catch(error => {
          console.error('❌ 좋아요 토글 실패:', error);
          // 실패 시 UI 롤백
          globalLikeStates.set(recommendation.id, !newLikedState);
          
          setRecommendations(prev => 
            prev.map(rec => 
              rec.id === recommendation.id 
                ? { 
                    ...rec, 
                    likesCount: newLikedState ? Math.max((rec.likesCount || 0) - 1, 0) : (rec.likesCount || 0) + 1
                  }
                : rec
            )
          );
          
          Alert.alert('오류', '좋아요 처리 중 오류가 발생했습니다.\n잠시 후 다시 시도해주세요.');
        });

    } catch (error) {
      console.error('❌ 좋아요 처리 중 오류:', error);
    }
  }, [user]);

  // 추천 장소 카드 컴포넌트
  const RecommendationCard = React.memo(({ item }: { item: Recommendation }) => {
    const isPlace = item.type === RecommendationType.PLACE;
    const [imageUrl, setImageUrl] = useState<string>('https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=400&h=400&fit=crop');

    // 이미지 설정 - mainImage가 있으면 우선 사용, 없으면 기본 이미지
    useEffect(() => {
      const url = item.mainImage || loadImage(item.id);
      setImageUrl(url);
    }, [item.id, item.mainImage]); // loadImage 제거
    
    return (
      <TouchableOpacity 
        style={isPlace ? styles.placeCard : styles.postCard}
        onPress={() => handleRecommendationPress(item)}
      >
        <View style={isPlace ? styles.placeCardContent : styles.postCardContent}>
          <View style={isPlace ? styles.placeImageContainer : styles.postImageContainer}>
            <Image 
              source={{ uri: imageUrl }} 
              style={isPlace ? styles.placeCircularImage : styles.postCircularImage} 
            />
          </View>
          <View style={isPlace ? styles.placeInfo : styles.postInfo}>
            <View style={isPlace ? styles.placeHeader : styles.postHeader}>
              <Text style={isPlace ? styles.placeName : styles.postTitle} numberOfLines={isPlace ? 1 : 2}>
                {item.title}
              </Text>
            </View>
            
            {isPlace ? (
              // 추천 여행지 카드
              <>
                <Text style={styles.placeLocation}>{item.subTitle}</Text>
                <Text style={styles.placeDescription} numberOfLines={2}>
                  {item.author || '관리자'}
                </Text>
                <View style={styles.placeFooter}>
                  <TouchableOpacity 
                    style={styles.wishlistContainer}
                    onPress={() => handleLikeToggle(item)}
                  >
                    <Ionicons 
                      name={globalLikeStates.get(item.id) ? "heart" : "heart-outline"} 
                      size={12} 
                      color={globalLikeStates.get(item.id) ? "#FF6B6B" : "#FF6B6B"} 
                    />
                    <Text style={styles.wishlistText}>{(item.likesCount || 0).toLocaleString()}</Text>
                  </TouchableOpacity>
                  <Text style={styles.priceText}>{item.price}</Text>
                </View>
                <Text style={styles.placeDate}>{getRelativeTime(item.createdAt)}</Text>
              </>
            ) : (
              // 여행기 카드
              <>
                <View style={styles.postHeader}>
                  <Text style={styles.postLocation}>{item.subTitle}</Text>
                  <View style={styles.postAuthorTop}>
                    <View style={styles.authorInfo}>
                      <View style={styles.authorAvatar}>
                        <Text style={styles.authorAvatarText}>
                          {item.author?.charAt(0) || 'U'}
                        </Text>
                      </View>
                      <Text style={styles.authorName}>{item.author || '관리자'}</Text>
                    </View>
                    <Text style={styles.postDate}>{getRelativeTime(item.createdAt)}</Text>
                  </View>
                </View>
                <Text style={styles.postContentText} numberOfLines={2}>
                  {item.title}
                </Text>
                <View style={styles.postFooter}>
                  <View style={styles.postStats}>
                    <View style={styles.statItem}>
                      <Ionicons name="eye-outline" size={12} color="#666" />
                      <Text style={styles.statText}>{item.viewsCount || 0}</Text>
                    </View>
                    <TouchableOpacity 
                      style={styles.statItem}
                      onPress={() => handleLikeToggle(item)}
                    >
                      <Ionicons 
                        name={globalLikeStates.get(item.id) ? "heart" : "heart-outline"} 
                        size={12} 
                        color={globalLikeStates.get(item.id) ? "#FF6B6B" : "#666"} 
                      />
                      <Text style={[
                        styles.statText,
                        { color: globalLikeStates.get(item.id) ? "#FF6B6B" : "#666" }
                      ]}>
                        {item.likesCount || 0}
                      </Text>
                    </TouchableOpacity>
                    <View style={styles.statItem}>
                      <Ionicons name="chatbubble-outline" size={12} color="#666" />
                      <Text style={styles.statText}>{item.reviewsCount || 0}</Text>
                    </View>
                  </View>
                </View>
              </>
            )}
            
            <View style={styles.tagsContainer}>
              {item.tags?.slice(0, 3).map((tag, index) => (
                <View key={index} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  });

  // 추천 장소 카드 렌더링
  const renderRecommendationItem = ({ item }: { item: Recommendation }) => {
    return <RecommendationCard item={item} />;
  };

  // 네비게이션 파라미터로 전달받은 탭 상태 처리
  useEffect(() => {
    if (route?.params?.activeTab) {
      console.log('🔄 네비게이션 파라미터에서 탭 상태 복원:', route.params.activeTab);
      setActiveTab(route.params.activeTab);
    }
  }, [route?.params?.activeTab]);

  // 탭 변경 시 데이터 로드
  useEffect(() => {
    if (!isInitialLoad) {
      console.log('🔄 탭 변경으로 인한 데이터 로드:', { activeTab });
      loadRecommendations();
    }
  }, [activeTab, isInitialLoad]);

  // 정렬 옵션 변경 시 정렬된 목록 로드 (검색 중이 아닐 때만)
  useEffect(() => {
    if (!searchQuery.trim() && sortType !== RecommendOrderType.CREATED_DESC) {
      loadSortedRecommendations();
    }
  }, [sortType, searchQuery]);

  // 검색어 변경 시 검색 실행
  useEffect(() => {
    if (debouncedSearchQuery.trim()) {
      performSearch(debouncedSearchQuery);
    } else if (searchQuery.trim() === '') {
      // 검색어가 완전히 비어있을 때만 랜덤 추천 로드
      loadRecommendations();
    }
  }, [debouncedSearchQuery, activeTab]);

  // 초기 데이터 로드 (랜덤 추천) - 컴포넌트 마운트 시에만
  useEffect(() => {
    console.log('🔄 추천 페이지 초기 로딩 시작:', { 
      activeTab, 
      isInitialLoad,
      timestamp: new Date().toISOString()
    });
    
    if (isInitialLoad) {
      setIsInitialLoad(false);
      loadRecommendations();
    }
  }, []); // 빈 의존성 배열로 마운트 시에만 실행

  // 페이지가 포커스될 때 재로드 (다른 페이지에서 돌아올 때만)
  useFocusEffect(
    useCallback(() => {
      console.log('🔄 추천 페이지 포커스 감지:', { 
        isInitialLoad, 
        hasBeenFocused,
        timestamp: new Date().toISOString()
      });
      
      // 첫 번째 포커스가 아닌 경우에만 재로드 (다른 페이지에서 돌아온 경우)
      if (!isInitialLoad && hasBeenFocused) {
        console.log('🔄 다른 페이지에서 돌아옴 - 재로드 시작');
        loadRecommendations();
      }
      
      // 포커스 상태 업데이트
      if (!hasBeenFocused) {
        setHasBeenFocused(true);
      }
    }, [isInitialLoad, hasBeenFocused]) // loadRecommendations 제거
  );

  // 네비게이션 파라미터 처리 (좋아요 후 새로고침)
  useEffect(() => {
    if (route?.params?.refreshRecommendList && !isInitialLoad) {
      console.log('🔄 좋아요 후 추천 목록 새로고침:', route.params.likedRecommendationId);
      
      // 추천 목록 새로고침
      loadRecommendations();
      
      // 파라미터 초기화
      navigation.setParams({ 
        refreshRecommendList: undefined,
        likedRecommendationId: undefined 
      });
    }
  }, [route?.params?.refreshRecommendList, isInitialLoad, navigation]); // loadRecommendations 제거

  return (
    <View style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>추천</Text>
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === RecommendationType.PLACE && styles.activeTab]}
          onPress={() => handleTabChange(RecommendationType.PLACE)}
        >
          <Ionicons 
            name="location-outline" 
            size={20} 
            color={activeTab === RecommendationType.PLACE ? '#FF6B35' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === RecommendationType.PLACE && styles.activeTabText]}>
            추천 여행지
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === RecommendationType.POST && styles.activeTab]}
          onPress={() => handleTabChange(RecommendationType.POST)}
        >
          <Ionicons 
            name="book-outline" 
            size={20} 
            color={activeTab === RecommendationType.POST ? '#FF6B35' : '#666'} 
          />
          <Text style={[styles.tabText, activeTab === RecommendationType.POST && styles.activeTabText]}>
            여행기
          </Text>
        </TouchableOpacity>
      </View>

      {/* 검색바 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search-outline" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={activeTab === RecommendationType.PLACE ? '여행지 검색...' : '여행기 검색...'}
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#999"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* 탭 콘텐츠 */}
      <View style={styles.content}>
        <FlatList
          data={recommendations}
          renderItem={renderRecommendationItem}
          keyExtractor={(item) => item.id.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              colors={['#FF6B35']}
              tintColor="#FF6B35"
            />
          }
          ListEmptyComponent={
            isLoading ? (
              <View style={styles.emptyState}>
                <Ionicons name="hourglass-outline" size={48} color="#BDC3C7" />
                <Text style={styles.emptyStateTitle}>로딩 중...</Text>
                <Text style={styles.emptyStateSubtitle}>
                  추천 장소를 불러오는 중입니다.
                </Text>
              </View>
            ) : searchQuery ? (
              <View style={styles.emptyState}>
                <Ionicons name="search-outline" size={48} color="#BDC3C7" />
                <Text style={styles.emptyStateTitle}>검색 결과가 없습니다</Text>
                <Text style={styles.emptyStateSubtitle}>
                  '{searchQuery}'에 대한 검색 결과를 찾을 수 없습니다.
                </Text>
              </View>
            ) : (
              <View style={styles.emptyState}>
                <Ionicons name="location-outline" size={48} color="#BDC3C7" />
                <Text style={styles.emptyStateTitle}>추천 장소가 없습니다</Text>
                <Text style={styles.emptyStateSubtitle}>
                  새로운 추천 장소를 준비 중입니다.
                </Text>
              </View>
            )
          }
        />
      </View>

      {/* 여행기 작성 버튼 - 여행기 탭일 때만 표시 */}
      {activeTab === RecommendationType.POST && (
        <TouchableOpacity
          style={styles.writeButton}
          onPress={() => {
            console.log('📝 여행기 작성 버튼 클릭');
            navigation.navigate('TravelDiaryWrite');
          }}
          activeOpacity={0.8}
        >
          <Ionicons name="create-outline" size={24} color="#FFFFFF" />
          <Text style={styles.writeButtonText}>여행기 작성</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 8,
    marginHorizontal: 4,
  },
  activeTab: {
    backgroundColor: '#FFF5F2',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 6,
    fontWeight: '500',
  },
  activeTabText: {
    color: '#FF6B35',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
    paddingBottom: 180, // 여행기 작성 버튼을 위한 충분한 공간 확보
  },
  searchContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E1E8ED',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333',
    paddingVertical: 4,
  },
  clearButton: {
    marginLeft: 8,
    padding: 2,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 40,
  },
  emptyStateTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },
  // 여행지 카드 스타일
  placeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  placeCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  placeImageContainer: {
    marginRight: 12,
  },
  placeCircularImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'cover',
  },
  placeInfo: {
    flex: 1,
  },
  placeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  placeName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
  },
  recommendedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF8E1',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  recommendedText: {
    fontSize: 10,
    color: '#F57C00',
    fontWeight: '600',
    marginLeft: 2,
  },
  placeLocation: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  placeDescription: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 16,
    marginBottom: 6,
  },
  placeFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  wishlistContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  wishlistText: {
    fontSize: 14,
    color: '#333333',
    fontWeight: '600',
    marginLeft: 4,
  },
  priceText: {
    fontSize: 14,
    color: '#FF6B35',
    fontWeight: '600',
  },
  placeDate: {
    fontSize: 10,
    color: '#999999',
    marginTop: 4,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  tagText: {
    fontSize: 10,
    color: '#666666',
  },
  // 여행기 카드 스타일
  postCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
    minHeight: 100,
  },
  postCardContent: {
    flexDirection: 'row',
    padding: 12,
  },
  postImageContainer: {
    marginRight: 12,
  },
  postCircularImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    resizeMode: 'cover',
  },
  postInfo: {
    flex: 1,
  },
  postHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: -4,
    marginTop: 0,
  },
  postAuthorTop: {
    alignItems: 'flex-end',
    marginTop: -6,
  },
  postTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333333',
    flex: 1,
    lineHeight: 18,
  },
  featuredBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF5F2',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    marginLeft: 6,
  },
  featuredText: {
    fontSize: 10,
    color: '#FF6B35',
    fontWeight: '600',
    marginLeft: 2,
  },
  postAuthor: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  authorInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  authorAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  authorAvatarText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  authorName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333333',
  },
  postLocation: {
    fontSize: 10,
    color: '#666666',
    flex: 1,
    marginTop: 4,
  },
  postDate: {
    fontSize: 10,
    color: '#999999',
  },
  postContentText: {
    fontSize: 12,
    color: '#555555',
    lineHeight: 16,
    marginTop: -6,
    marginBottom: 6,
  },
  postFooter: {
    marginTop: -2,
    marginBottom: 6,
  },
  postStats: {
    flexDirection: 'row',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statText: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 4,
  },
  writeButton: {
    position: 'absolute',
    bottom: 100, // 하단 바 위에 위치하도록 100px로 조정
    left: '50%',
    marginLeft: -80, // 버튼 너비의 절반
    width: 160,
    backgroundColor: '#FF6B35',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  writeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default RecommendScreen;

