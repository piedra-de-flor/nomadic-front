import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Keyboard,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import { 
  getAutocompleteSuggestions, 
  checkTypoCorrection, 
  getPopularSearches,
  searchAccommodations 
} from '../services/accommodation/accommodationService';
import { AutocompleteResponse, TypoCorrectionResponse } from '../types';
import { SEARCH_CONFIG } from '../constants';

const SearchScreen = ({ navigation, route }: any) => {
  const [searchText, setSearchText] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [lastSearchQuery, setLastSearchQuery] = useState('');
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [isLoadingAutocomplete, setIsLoadingAutocomplete] = useState(false);
  const [popularSearches, setPopularSearches] = useState<string[]>([]);
  const [isLoadingPopular, setIsLoadingPopular] = useState(false);
  const searchInputRef = useRef<TextInput>(null);

  // 인기 검색어 로드
  const loadPopularSearches = useCallback(async () => {
    try {
      setIsLoadingPopular(true);
      const popular = await getPopularSearches();
      setPopularSearches(popular);
    } catch (error) {
      console.error('인기 검색어 로드 실패:', error);
      // 기본값 사용
      setPopularSearches(['제주도', '부산 해운대', '강릉 커피거리', '전주 한옥마을', '여수 밤바다']);
    } finally {
      setIsLoadingPopular(false);
    }
  }, []);

  // 자동완성 검색 - 타이핑할 때마다 바로 호출
  const searchAutocomplete = useCallback(async (query: string) => {
    if (query.length < 2) {
      setAutocompleteSuggestions([]);
      return;
    }

    try {
      setIsLoadingAutocomplete(true);
      console.log('🔍 자동완성 API 호출:', query);
      
      const response = await getAutocompleteSuggestions({ 
        query, 
        limit: SEARCH_CONFIG.MAX_AUTOCOMPLETE_RESULTS 
      });
      
      console.log('✅ 자동완성 API 응답:', response);
      console.log('📝 자동완성 suggestions:', response.suggestions);
      setAutocompleteSuggestions(response.suggestions || []);
    } catch (error) {
      console.error('❌ 자동완성 검색 실패:', error);
      setAutocompleteSuggestions([]);
    } finally {
      setIsLoadingAutocomplete(false);
    }
  }, []);


  // 화면이 포커스될 때마다 실행
  useFocusEffect(
    React.useCallback(() => {
      // 인기 검색어 로드
      loadPopularSearches();
      
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
        setAutocompleteSuggestions([]);
      }
    }, [route?.params?.preserveSearchQuery, loadPopularSearches])
  );


  // 자동완성 상태 디버깅
  useEffect(() => {
    console.log('📊 자동완성 상태:', {
      isSearching,
      searchText,
      autocompleteSuggestions: autocompleteSuggestions?.length || 0,
      isLoadingAutocomplete
    });
  }, [isSearching, searchText, autocompleteSuggestions, isLoadingAutocomplete]);

  const handleSearchChange = (text: string) => {
    console.log('🔤 검색어 변경:', text, '길이:', text.length);
    setSearchText(text);
    setIsSearching(text.length > 0);
    
    // 자동완성 검색 - 2글자 이상일 때마다 바로 API 호출
    if (text.length >= 2) {
      console.log('🚀 자동완성 API 바로 호출:', text);
      searchAutocomplete(text);
    } else {
      console.log('🧹 자동완성 초기화 (2글자 미만)');
      setAutocompleteSuggestions([]);
    }
  };

  const handleSearchSubmit = async () => {
    const query = searchText.trim();
    console.log('🔍 검색 시작:', query);
    
    if (!query) {
      Alert.alert('알림', '검색어를 입력해주세요.');
      return;
    }

    try {
      console.log('🔍 오타 검증 시작:', query);
      // 오타 검증
      const typoResult = await checkTypoCorrection({ query });
      console.log('✅ 오타 검증 결과:', typoResult);
      
      if (typoResult.hasTypo && typoResult.correctedQuery) {
        // 오타가 있는 경우 사용자에게 확인
        Alert.alert(
          '검색어 확인',
          `'${typoResult.originalQuery}'를 '${typoResult.correctedQuery}'로 검색하시겠습니까?`,
          [
            { text: '취소', style: 'cancel' },
            { 
              text: '수정하여 검색', 
              onPress: () => {
                console.log('🔍 수정된 검색어로 검색:', typoResult.correctedQuery);
                setSearchText(typoResult.correctedQuery!);
                setLastSearchQuery(typoResult.correctedQuery!);
                console.log('🚀 SearchResult로 네비게이션:', { searchQuery: typoResult.correctedQuery });
                navigation.navigate('SearchResult', { searchQuery: typoResult.correctedQuery });
                Keyboard.dismiss();
              }
            },
            { 
              text: '그대로 검색', 
              onPress: () => {
                console.log('🔍 원래 검색어로 검색:', query);
                setLastSearchQuery(query);
                console.log('🚀 SearchResult로 네비게이션:', { searchQuery: query });
                navigation.navigate('SearchResult', { searchQuery: query });
                Keyboard.dismiss();
              }
            }
          ]
        );
      } else {
        // 오타가 없는 경우 바로 검색
        console.log('🔍 오타 없음, 바로 검색:', query);
        setLastSearchQuery(query);
        console.log('🚀 SearchResult로 네비게이션:', { searchQuery: query });
        navigation.navigate('SearchResult', { searchQuery: query });
        Keyboard.dismiss();
      }
    } catch (error) {
      console.error('오타 검증 실패:', error);
      // 오타 검증 실패 시 그대로 검색
      setLastSearchQuery(query);
      console.log('🚀 오타 검증 실패, SearchResult로 네비게이션:', { searchQuery: query });
      navigation.navigate('SearchResult', { searchQuery: query });
      Keyboard.dismiss();
    }
  };

  const handlePopularSearch = (keyword: string) => {
    console.log('🔍 인기 검색어 클릭:', keyword);
    setSearchText(keyword);
    setLastSearchQuery(keyword);
    setAutocompleteSuggestions([]);
    console.log('🚀 SearchResult로 네비게이션 (인기검색어):', { searchQuery: keyword });
    navigation.navigate('SearchResult', { searchQuery: keyword });
  };

  const handleAutocompleteSearch = (keyword: string) => {
    console.log('🔍 자동완성 검색어 클릭:', keyword);
    setSearchText(keyword);
    setLastSearchQuery(keyword);
    setAutocompleteSuggestions([]);
    console.log('🚀 SearchResult로 네비게이션 (자동완성):', { searchQuery: keyword });
    navigation.navigate('SearchResult', { searchQuery: keyword });
  };

  const handleClearSearch = () => {
    setSearchText('');
    setIsSearching(false);
    setAutocompleteSuggestions([]);
    searchInputRef.current?.blur();
  };

  return (
    <View style={styles.container}>
      {/* 검색창 */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#7F8C8D" style={styles.searchIcon} />
          <TextInput
            ref={searchInputRef}
            style={styles.searchInput}
            placeholder="어디로 여행가고 싶으세요?"
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
              {isLoadingPopular ? (
                <Text style={styles.loadingText}>인기 검색어를 불러오는 중...</Text>
              ) : (
                popularSearches.map((keyword, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.popularItem}
                    onPress={() => handlePopularSearch(keyword)}
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
                      <Text style={styles.popularKeyword}>{keyword}</Text>
                      <Text style={styles.popularType}>지역</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={16} color="#BDC3C7" />
                  </TouchableOpacity>
                ))
              )}
            </View>
          </View>
        ) : (
          // 자동완성 검색어 표시
          <View style={styles.relatedSection}>
            <Text style={styles.sectionTitle}>
              '{searchText}' 관련 검색어
            </Text>
            <View style={styles.relatedList}>
              {isLoadingAutocomplete ? (
                <Text style={styles.loadingText}>검색어를 찾는 중...</Text>
              ) : autocompleteSuggestions && autocompleteSuggestions.length > 0 ? (
                autocompleteSuggestions.map((keyword, index) => {
                  // keyword가 문자열인지 확인
                  const displayText = typeof keyword === 'string' ? keyword : String(keyword);
                  return (
                    <TouchableOpacity
                      key={index}
                      style={styles.relatedItem}
                      onPress={() => handleAutocompleteSearch(displayText)}
                    >
                      <Ionicons name="search" size={16} color="#7F8C8D" style={styles.relatedIcon} />
                      <Text style={styles.relatedKeyword}>{displayText}</Text>
                      <Ionicons name="chevron-forward" size={16} color="#BDC3C7" />
                    </TouchableOpacity>
                  );
                })
              ) : searchText.length >= 2 ? (
                <Text style={styles.noResultsText}>관련 검색어가 없습니다.</Text>
              ) : (
                <Text style={styles.noResultsText}>2글자 이상 입력하면 관련 검색어를 보여드립니다.</Text>
              )}
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
  header: {
    paddingTop: 50,
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333333',
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
  loadingText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingVertical: 20,
  },
  noResultsText: {
    fontSize: 14,
    color: '#7F8C8D',
    textAlign: 'center',
    paddingVertical: 20,
  },
});

export default SearchScreen;