import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSelector } from 'react-redux';
import { UI_CONFIG } from '../../constants';

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

// 데모 추천 게시물 데이터
const mockRecommendations: Recommendation[] = [
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
    description: '한라산 등반을 위한 완벽한 가이드입니다. 등반 코스, 준비물, 주의사항까지 모든 것을 알려드립니다.'
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
  {
    id: 6,
    title: '경주 불국사와 석굴암',
    subTitle: '신라 천년의 역사를 만나다',
    location: {
      latitude: 35.7894,
      longitude: 129.3318,
      address: '경상북도 경주시',
      name: '불국사'
    },
    date: '2024-12-10T11:00:00Z',
    like: true,
    likeCount: 1123,
    commentCount: 92,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '신라 천년의 역사가 살아있는 경주 불국사와 석굴암을 탐방하는 여행기입니다.'
  },
  {
    id: 7,
    title: '안동 하회마을의 전통',
    subTitle: '조선시대 양반문화 체험',
    location: {
      latitude: 36.5392,
      longitude: 128.5189,
      address: '경상북도 안동시',
      name: '하회마을'
    },
    date: '2024-12-09T13:30:00Z',
    like: false,
    likeCount: 756,
    commentCount: 58,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '안동 하회마을에서 체험하는 조선시대 양반문화와 전통 건축의 아름다움을 소개합니다.'
  },
  {
    id: 8,
    title: '태안 반려동물과 함께하는 바다',
    subTitle: '반려동물 친화적인 해변 여행',
    location: {
      latitude: 36.7456,
      longitude: 126.2978,
      address: '충청남도 태안군',
      name: '태안해안국립공원'
    },
    date: '2024-12-08T16:45:00Z',
    like: true,
    likeCount: 445,
    commentCount: 34,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '반려동물과 함께 즐길 수 있는 태안의 아름다운 해변들을 소개합니다.'
  },
  {
    id: 9,
    title: '울산 대왕암공원의 일출',
    subTitle: '동해의 첫 햇살을 맞이하다',
    location: {
      latitude: 35.5384,
      longitude: 129.3114,
      address: '울산광역시 동구',
      name: '대왕암공원'
    },
    date: '2024-12-07T06:00:00Z',
    like: false,
    likeCount: 678,
    commentCount: 41,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '울산 대왕암공원에서 감상하는 동해의 장관적인 일출을 소개합니다.'
  },
  {
    id: 10,
    title: '포항 호미곶의 끝없는 바다',
    subTitle: '한반도 최동단의 감동',
    location: {
      latitude: 36.0764,
      longitude: 129.5653,
      address: '경상북도 포항시',
      name: '호미곶'
    },
    date: '2024-12-06T17:20:00Z',
    like: true,
    likeCount: 823,
    commentCount: 67,
    image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400',
    description: '한반도 최동단 호미곶에서 만나는 끝없는 바다의 아름다움을 소개합니다.'
  },
];

const RecommendListScreen = ({ navigation }: any) => {
  // Redux 상태
  const { user } = useSelector((state: any) => state.auth);
  
  // 초기에 랜덤으로 10개만 표시
  const getRandomRecommendations = () => {
    const shuffled = [...mockRecommendations].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, 10);
  };
  
  const [recommendations, setRecommendations] = useState<Recommendation[]>(getRandomRecommendations());
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    
    // 1초 지연 (새로고침 효과)
    setTimeout(() => {
      setRecommendations(getRandomRecommendations());
      setRefreshing(false);
    }, 1000);
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
      fromPage: 'recommend'
    });
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


  return (
    <View style={styles.container}>
      {/* 상단 검색창 */}
      <View style={styles.searchContainer}>
        <TouchableOpacity 
          style={styles.searchInputContainer}
          onPress={() => navigation.navigate('RecommendSearch')}
        >
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <Text style={styles.searchPlaceholder}>추천 장소를 검색해보세요</Text>
          <Ionicons name="arrow-forward" size={20} color="#FF6B35" />
        </TouchableOpacity>
      </View>

      {/* 추천 게시물 리스트 */}
      <FlatList
        data={recommendations}
        renderItem={renderRecommendationItem}
        keyExtractor={(item) => item.id.toString()}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#FF6B35']}
            tintColor="#FF6B35"
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="map" size={64} color="#BDC3C7" />
            <Text style={styles.emptyTitle}>추천 게시물이 없습니다</Text>
            <Text style={styles.emptySubtitle}>새로운 추천 게시물을 기다려주세요</Text>
          </View>
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: '#E1E8ED',
  },
  searchIcon: {
    marginRight: 12,
  },
  searchPlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#7F8C8D',
  },
  listContainer: {
    padding: 16,
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

export default RecommendListScreen;
