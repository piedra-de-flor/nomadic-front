import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const RecommendSearchScreen = ({ navigation, route }: any) => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const searchInputRef = useRef<TextInput>(null);

  // 화면이 포커스될 때마다 실행
  useFocusEffect(
    React.useCallback(() => {
      // route 파라미터에서 검색어를 받아온 경우
      if (route?.params?.preserveSearchQuery) {
        setSearchText(route.params.preserveSearchQuery);
        setIsSearching(true);
        setLastSearchQuery(route.params.preserveSearchQuery);
        // 파라미터 초기화
        navigation.setParams({ preserveSearchQuery: undefined });
      } else {
        // 검색어가 없으면 초기 상태로 설정
        setSearchText('');
        setIsSearching(false);
      }
    }, [route?.params?.preserveSearchQuery])
  );

  // 인기 검색어 데이터 (추천 장소 관련)
  const popularSearches = [
    { id: 1, keyword: '제주도', type: '지역' },
    { id: 2, keyword: '한라산', type: '명소' },
    { id: 3, keyword: '해운대', type: '지역' },
    { id: 4, keyword: '커피거리', type: '명소' },
    { id: 5, keyword: '한옥마을', type: '명소' },
  ];

  // 관련 검색어 데이터 (추천 장소 관련)
  const getRelatedSearches = (query: string) => {
    const relatedData: { [key: string]: string[] } = {
      '제주': ['제주도', '한라산', '성산일출봉', '중문관광단지', '제주 올레길'],
      '부산': ['해운대', '감천문화마을', '자갈치시장', '태종대', '광안리'],
      '강릉': ['커피거리', '안목해변', '경포대', '주문진', '정동진'],
      '전주': ['한옥마을', '전주비빔밥', '경기전', '풍남문', '덕진공원'],
      '여수': ['밤바다', '오동도', '돌산도', '향일암', '엑스포'],
      '한라산': ['등산', '정상', '관음사', '영실', '어리목'],
      '커피': ['카페', '로스터리', '원두', '라떼', '아메리카노'],
    };

    // 입력된 텍스트와 가장 유사한 키워드 찾기
    for (const key in relatedData) {
      if (query.toLowerCase().includes(key.toLowerCase()) || key.toLowerCase().includes(query.toLowerCase())) {
        return relatedData[key];
      }
    }

    // 기본 관련 검색어
    return ['제주도', '한라산', '해운대', '커피거리', '한옥마을'];
  };

  const handleSearchChange = (text: string) => {
    setSearchText(text);
    setIsSearching(text.length > 0);
  };

  const handleSearchSubmit = () => {
    // 검색어가 있으면 해당 검색어로, 없으면 기본값으로 검색 결과 페이지로 이동
    const query = searchText.trim() || '제주도';
    setLastSearchQuery(query); // 마지막 검색어 저장
    navigation.navigate('RecommendSearchResult', { searchQuery: query });
    Keyboard.dismiss();
  };

  const handlePopularSearch = (keyword: string) => {
    setSearchText(keyword);
    setLastSearchQuery(keyword); // 마지막 검색어 저장
    navigation.navigate('RecommendSearchResult', { searchQuery: keyword });
  };

  const handleRelatedSearch = (keyword: string) => {
    setSearchText(keyword);
    setLastSearchQuery(keyword); // 마지막 검색어 저장
    navigation.navigate('RecommendSearchResult', { searchQuery: keyword });
  };

  const handleClearSearch = () => {
    setSearchText('');
    setIsSearching(false);
    searchInputRef.current?.blur();
  };

  const relatedSearches = isSearching ? getRelatedSearches(searchText) : [];

  return (
    <View style={styles.container}>
      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="추천 장소를 검색해보세요"
            placeholderTextColor="#7F8C8D"
            value={searchText}
            onChangeText={handleSearchChange}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={20} color="#7F8C8D" />
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={handleSearchSubmit} style={styles.searchButton}>
            <Ionicons name="arrow-forward" size={20} color="#FF6B35" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 검색 결과 영역 */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {!isSearching ? (
          // 인기 검색어 표시
          <View style={styles.popularSection}>
            <Text style={styles.sectionTitle}>인기 검색어</Text>
            <View style={styles.popularList}>
              {popularSearches.map((item, index) => (
                <TouchableOpacity
                  key={item.id}
                  style={styles.popularItem}
                  onPress={() => handlePopularSearch(item.keyword)}
                >
                  <View style={styles.rankContainer}>
                    <Text style={[
                      styles.rankNumber,
                      index < 3 && styles.rankNumberTop
                    ]}>
                      {index + 1}
                    </Text>
                  </View>
                  <View style={styles.popularContent}>
                    <Text style={styles.popularKeyword}>{item.keyword}</Text>
                    <Text style={styles.popularType}>{item.type}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={16} color="#BDC3C7" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        ) : (
          // 관련 검색어 표시
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>
              '{searchText}' 관련 검색어
            </Text>
            <View style={styles.relatedList}>
              {relatedSearches.map((keyword, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.relatedItem}
                  onPress={() => handleRelatedSearch(keyword)}
                >
                  <Ionicons name="search" size={16} color="#7F8C8D" style={styles.relatedIcon} />
                  <Text style={styles.relatedKeyword}>{keyword}</Text>
                  <Ionicons name="chevron-forward" size={16} color="#BDC3C7" />
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  searchContainer: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
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
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
    paddingVertical: 0,
  },
  clearButton: {
    marginLeft: 8,
  },
  searchButton: {
    marginLeft: 8,
    padding: 4,
  },
  content: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  popularSection: {
    padding: 20,
  },
  relatedSection: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333333',
    marginBottom: 16,
  },
  popularList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  popularItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  rankContainer: {
    width: 24,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#7F8C8D',
  },
  rankNumberTop: {
    color: '#FF6B35',
  },
  popularContent: {
    flex: 1,
  },
  popularKeyword: {
    fontSize: 16,
    color: '#333333',
    marginBottom: 2,
  },
  popularType: {
    fontSize: 12,
    color: '#7F8C8D',
  },
  relatedList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  relatedItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F3F4',
  },
  relatedIcon: {
    marginRight: 12,
  },
  relatedKeyword: {
    flex: 1,
    fontSize: 16,
    color: '#333333',
  },
});

export default RecommendSearchScreen;




















