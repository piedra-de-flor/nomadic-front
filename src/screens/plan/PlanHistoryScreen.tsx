import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { UI_CONFIG } from '../../constants';
import { useSelector } from 'react-redux';
import { RootState } from '../../store';
import { getPlanHistory, getChangesByType, getMyActivity } from '../../services/plan/planHistoryService';
import { PlanChangeHistoryResponseDto, ChangeType, PageResponse } from '../../types';

interface PlanHistoryScreenProps {
  route: any;
  navigation: any;
}

const PlanHistoryScreen: React.FC<PlanHistoryScreenProps> = ({ route, navigation }) => {
  const { planId } = route.params;
  const { user } = useSelector((state: RootState) => state.auth);
  
  const [historyData, setHistoryData] = useState<PlanChangeHistoryResponseDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [selectedFilter, setSelectedFilter] = useState<ChangeType | 'ALL'>('ALL');

  // 변경 이력 로드
  const loadHistory = useCallback(async (page: number = 0, filter: ChangeType | 'ALL' = 'ALL', append: boolean = false) => {
    if (!user?.email) {
      console.log('⚠️ 로그인이 필요합니다.');
      setIsLoading(false);
      return;
    }

    try {
      if (page === 0) {
        setIsLoading(true);
      }

      let response: PageResponse<PlanChangeHistoryResponseDto>;
      
      if (filter === 'ALL') {
        response = await getPlanHistory(planId, user.email, page, 10);
      } else {
        response = await getChangesByType(planId, filter, user.email, page, 10);
      }

      if (append) {
        setHistoryData(prev => [...prev, ...response.content]);
      } else {
        setHistoryData(response.content);
      }

      setCurrentPage(page);
      setHasMore(!response.last);
    } catch (error) {
      console.error('❌ 변경 이력 로드 실패:', error);
      Alert.alert('오류', '변경 이력을 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [planId, user?.email]);

  // 새로고침
  const onRefresh = useCallback(() => {
    setIsRefreshing(true);
    loadHistory(0, selectedFilter, false);
  }, [loadHistory, selectedFilter]);

  // 더 많은 데이터 로드
  const loadMore = useCallback(() => {
    if (!isLoading && hasMore) {
      loadHistory(currentPage + 1, selectedFilter, true);
    }
  }, [isLoading, hasMore, currentPage, loadHistory, selectedFilter]);

  // 필터 변경
  const changeFilter = useCallback((filter: ChangeType | 'ALL') => {
    setSelectedFilter(filter);
    loadHistory(0, filter, false);
  }, [loadHistory]);

  // 초기 로드
  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // 날짜 포맷 함수
  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('ko-KR', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
    } else if (diffDays === 1) {
      return '어제';
    } else if (diffDays < 7) {
      return `${diffDays}일 전`;
    } else {
      return date.toLocaleDateString('ko-KR', {
        month: 'short',
        day: 'numeric'
      });
    }
  };

  // 변경 타입별 아이콘
  const getChangeTypeIcon = (changeType: ChangeType) => {
    switch (changeType) {
      case ChangeType.CREATED:
        return 'add-circle';
      case ChangeType.UPDATED:
        return 'create';
      case ChangeType.DELETED:
        return 'trash';
      case ChangeType.MOVED:
        return 'swap-horizontal';
      case ChangeType.SHARED:
        return 'share';
      case ChangeType.UNSHARED:
        return 'share-outline';
      default:
        return 'help-circle';
    }
  };

  // 변경 타입별 색상
  const getChangeTypeColor = (changeType: ChangeType) => {
    switch (changeType) {
      case ChangeType.CREATED:
        return UI_CONFIG.COLORS.SUCCESS;
      case ChangeType.UPDATED:
        return UI_CONFIG.COLORS.PRIMARY;
      case ChangeType.DELETED:
        return UI_CONFIG.COLORS.ERROR;
      case ChangeType.MOVED:
        return UI_CONFIG.COLORS.WARNING;
      case ChangeType.SHARED:
        return UI_CONFIG.COLORS.INFO;
      case ChangeType.UNSHARED:
        return UI_CONFIG.COLORS.TEXT_SECONDARY;
      default:
        return UI_CONFIG.COLORS.TEXT_SECONDARY;
    }
  };

  // JSON 파싱 함수
  const parseChangeData = (changeData: string) => {
    try {
      return JSON.parse(changeData);
    } catch (error) {
      console.log('JSON 파싱 실패:', error);
      return null;
    }
  };

  // 변경 데이터 렌더링
  const renderChangeData = (changeData: string, changeType: ChangeType) => {
    const parsedData = parseChangeData(changeData);
    
    if (!parsedData) {
      return (
        <Text style={styles.historyItemData}>
          {changeData}
        </Text>
      );
    }

    // 변경 타입별로 다른 렌더링
    switch (changeType) {
      case ChangeType.CREATED:
        return renderCreatedData(parsedData);
      case ChangeType.UPDATED:
        return renderUpdatedData(parsedData);
      case ChangeType.DELETED:
        return renderDeletedData(parsedData);
      case ChangeType.MOVED:
        return renderMovedData(parsedData);
      case ChangeType.SHARED:
        return renderSharedData(parsedData);
      case ChangeType.UNSHARED:
        return renderUnsharedData(parsedData);
      default:
        return renderDefaultData(parsedData);
    }
  };

  // 생성 데이터 렌더링
  const renderCreatedData = (data: any) => (
    <View style={styles.changeDataContainer}>
      <Text style={styles.changeDataTitle}>새로 생성된 내용:</Text>
      {Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>{getFieldLabel(key)}:</Text>
          <Text style={styles.changeDataValue}>{formatValue(value)}</Text>
        </View>
      ))}
    </View>
  );

  // 수정 데이터 렌더링
  const renderUpdatedData = (data: any) => (
    <View style={styles.changeDataContainer}>
      <Text style={styles.changeDataTitle}>변경된 내용:</Text>
      {Object.entries(data).map(([key, value]) => {
        // old/new 패턴 처리
        if (key.startsWith('old') && data[key.replace('old', 'new')]) {
          const newKey = key.replace('old', 'new');
          const newValue = data[newKey];
          return (
            <View key={key} style={styles.changeDataRow}>
              <Text style={styles.changeDataKey}>{getFieldLabel(key.replace('old', ''))}:</Text>
              <View style={styles.changeDataNested}>
                <View style={styles.changeDataBeforeAfter}>
                  <Text style={styles.changeDataLabel}>이전:</Text>
                  <Text style={styles.changeDataBefore}>{formatValue(value)}</Text>
                </View>
                <View style={styles.changeDataBeforeAfter}>
                  <Text style={styles.changeDataLabel}>이후:</Text>
                  <Text style={styles.changeDataAfter}>{formatValue(newValue)}</Text>
                </View>
              </View>
            </View>
          );
        }
        
        // new 키는 old 키에서 이미 처리됨
        if (key.startsWith('new')) {
          return null;
        }
        
        // 일반 키-값 처리
        return (
          <View key={key} style={styles.changeDataRow}>
            <Text style={styles.changeDataKey}>{getFieldLabel(key)}:</Text>
            {typeof value === 'object' && value !== null ? (
              <View style={styles.changeDataNested}>
                {value.before && (
                  <View style={styles.changeDataBeforeAfter}>
                    <Text style={styles.changeDataLabel}>이전:</Text>
                    <Text style={styles.changeDataBefore}>{formatValue(value.before)}</Text>
                  </View>
                )}
                {value.after && (
                  <View style={styles.changeDataBeforeAfter}>
                    <Text style={styles.changeDataLabel}>이후:</Text>
                    <Text style={styles.changeDataAfter}>{formatValue(value.after)}</Text>
                  </View>
                )}
              </View>
            ) : (
              <Text style={styles.changeDataValue}>{formatValue(value)}</Text>
            )}
          </View>
        );
      })}
    </View>
  );

  // 삭제 데이터 렌더링
  const renderDeletedData = (data: any) => (
    <View style={styles.changeDataContainer}>
      <Text style={styles.changeDataTitle}>삭제된 내용:</Text>
      {Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>{getFieldLabel(key)}:</Text>
          <Text style={styles.changeDataDeleted}>{formatValue(value)}</Text>
        </View>
      ))}
    </View>
  );

  // 이동 데이터 렌더링
  const renderMovedData = (data: any) => (
    <View style={styles.changeDataContainer}>
      <Text style={styles.changeDataTitle}>이동된 내용:</Text>
      {Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>{getFieldLabel(key)}:</Text>
          <Text style={styles.changeDataValue}>{formatValue(value)}</Text>
        </View>
      ))}
    </View>
  );

  // 공유 데이터 렌더링
  const renderSharedData = (data: any) => (
    <View style={styles.changeDataContainer}>
      <Text style={styles.changeDataTitle}>공유된 내용:</Text>
      {data.sharedMemberName && (
        <View style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>공유 대상:</Text>
          <Text style={styles.changeDataValue}>{data.sharedMemberName}</Text>
        </View>
      )}
      {data.sharedMemberEmail && (
        <View style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>이메일:</Text>
          <Text style={styles.changeDataValue}>{data.sharedMemberEmail}</Text>
        </View>
      )}
      {data.role && (
        <View style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>역할:</Text>
          <Text style={styles.changeDataValue}>{data.role}</Text>
        </View>
      )}
    </View>
  );

  // 공유 해제 데이터 렌더링
  const renderUnsharedData = (data: any) => (
    <View style={styles.changeDataContainer}>
      <Text style={styles.changeDataTitle}>공유 해제된 내용:</Text>
      {data.sharedMemberName && (
        <View style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>공유 대상:</Text>
          <Text style={styles.changeDataValue}>{data.sharedMemberName}</Text>
        </View>
      )}
      {data.sharedMemberEmail && (
        <View style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>이메일:</Text>
          <Text style={styles.changeDataValue}>{data.sharedMemberEmail}</Text>
        </View>
      )}
    </View>
  );

  // 기본 데이터 렌더링
  const renderDefaultData = (data: any) => (
    <View style={styles.changeDataContainer}>
      {Object.entries(data).map(([key, value]) => (
        <View key={key} style={styles.changeDataRow}>
          <Text style={styles.changeDataKey}>{getFieldLabel(key)}:</Text>
          <Text style={styles.changeDataValue}>{formatValue(value)}</Text>
        </View>
      ))}
    </View>
  );

  // 값 포맷팅 함수
  const formatValue = (value: any) => {
    if (typeof value === 'object' && value !== null) {
      // location 객체 처리
      if (value.name && value.latitude && value.longitude) {
        return `${value.name} (${value.latitude}, ${value.longitude})`;
      }
      // 날짜 문자열 처리
      if (typeof value === 'string' && value.includes('T')) {
        const date = new Date(value);
        return date.toLocaleDateString('ko-KR', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      }
      return JSON.stringify(value);
    }
    
    // 날짜 문자열 처리
    if (typeof value === 'string' && value.includes('T')) {
      const date = new Date(value);
      return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    }
    
    return String(value);
  };

  // 필드명을 한국어로 변환
  const getFieldLabel = (key: string) => {
    const fieldLabels: { [key: string]: string } = {
      title: '제목',
      description: '설명',
      location: '위치',
      address: '주소',
      name: '이름',
      time: '시간',
      date: '날짜',
      latitude: '위도',
      longitude: '경도',
      partner: '파트너',
      style: '스타일',
      startDate: '시작일',
      endDate: '종료일',
      startDay: '시작일',
      endDay: '종료일',
      before: '이전',
      after: '이후',
      sharedMemberEmail: '공유 대상',
      sharedMemberName: '공유 대상명',
      role: '역할',
      oldStatus: '이전 상태',
      newStatus: '새 상태',
    };
    return fieldLabels[key] || key;
  };

  // 필터 버튼 렌더링
  const renderFilterButton = (filter: ChangeType | 'ALL', label: string) => (
    <TouchableOpacity
      key={filter}
      style={[
        styles.filterButton,
        selectedFilter === filter && styles.activeFilterButton
      ]}
      onPress={() => changeFilter(filter)}
    >
      <Text style={[
        styles.filterButtonText,
        selectedFilter === filter && styles.activeFilterButtonText
      ]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // 변경 이력 아이템 렌더링
  const renderHistoryItem = ({ item }: { item: PlanChangeHistoryResponseDto }) => (
    <View style={styles.historyItem}>
      <View style={styles.historyItemHeader}>
        <View style={styles.historyItemLeft}>
          <Ionicons
            name={getChangeTypeIcon(item.changeType)}
            size={20}
            color={getChangeTypeColor(item.changeType)}
          />
          <View style={styles.historyItemInfo}>
            <Text style={styles.historyItemTitle}>
              {item.changeTypeDescription}
            </Text>
            <Text style={styles.historyItemSubtitle}>
              {item.changedByName} • {formatDateTime(item.createdAt)}
            </Text>
          </View>
        </View>
      </View>
      
      {item.changeData && (
        <View style={styles.historyItemContent}>
          {renderChangeData(item.changeData, item.changeType)}
        </View>
      )}
    </View>
  );

  // 로딩 인디케이터
  const renderFooter = () => {
    if (!isLoading || currentPage === 0) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color={UI_CONFIG.COLORS.PRIMARY} />
      </View>
    );
  };

  // 빈 상태
  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Ionicons name="time-outline" size={48} color={UI_CONFIG.COLORS.TEXT_LIGHT} />
      <Text style={styles.emptyText}>변경 이력이 없습니다</Text>
      <Text style={styles.emptySubtext}>
        {selectedFilter === 'ALL' 
          ? '이 계획에 대한 변경 이력이 없습니다.'
          : `${selectedFilter} 타입의 변경 이력이 없습니다.`
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* 헤더 */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color={UI_CONFIG.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>변경 이력</Text>
        <View style={styles.headerRight} />
      </View>

      {/* 필터 버튼들 */}
      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {renderFilterButton('ALL', '전체')}
          {renderFilterButton(ChangeType.CREATED, '생성')}
          {renderFilterButton(ChangeType.UPDATED, '수정')}
          {renderFilterButton(ChangeType.DELETED, '삭제')}
          {renderFilterButton(ChangeType.MOVED, '이동')}
          {renderFilterButton(ChangeType.SHARED, '공유')}
        </ScrollView>
      </View>

      {/* 변경 이력 리스트 */}
      <FlatList
        data={historyData}
        renderItem={renderHistoryItem}
        keyExtractor={(item) => item.id.toString()}
        style={styles.historyList}
        contentContainerStyle={styles.historyListContent}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[UI_CONFIG.COLORS.PRIMARY]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListFooterComponent={renderFooter}
        ListEmptyComponent={!isLoading ? renderEmpty : null}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingTop: UI_CONFIG.SPACING.MD,
    paddingBottom: UI_CONFIG.SPACING.SM,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  backButton: {
    padding: UI_CONFIG.SPACING.SM,
  },
  headerTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  filterButton: {
    paddingHorizontal: UI_CONFIG.SPACING.MD,
    paddingVertical: UI_CONFIG.SPACING.SM,
    marginHorizontal: UI_CONFIG.SPACING.XS,
    marginVertical: UI_CONFIG.SPACING.SM,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  activeFilterButton: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
  },
  filterButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  activeFilterButtonText: {
    color: UI_CONFIG.COLORS.TEXT_WHITE,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    padding: UI_CONFIG.SPACING.MD,
  },
  historyItem: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
    ...UI_CONFIG.SHADOWS.SM,
  },
  historyItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  historyItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyItemInfo: {
    marginLeft: UI_CONFIG.SPACING.SM,
    flex: 1,
  },
  historyItemTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
    flexWrap: 'wrap',
  },
  historyItemSubtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    flexWrap: 'wrap',
  },
  historyItemContent: {
    marginTop: UI_CONFIG.SPACING.SM,
    paddingTop: UI_CONFIG.SPACING.SM,
    borderTopWidth: 1,
    borderTopColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  historyItemData: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    fontFamily: 'monospace',
  },
  changeDataContainer: {
    marginTop: UI_CONFIG.SPACING.SM,
  },
  changeDataTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  changeDataRow: {
    flexDirection: 'row',
    marginBottom: UI_CONFIG.SPACING.XS,
    alignItems: 'flex-start',
    flexWrap: 'wrap',
  },
  changeDataKey: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    fontWeight: '500',
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    minWidth: 60,
    marginRight: UI_CONFIG.SPACING.SM,
    flexWrap: 'wrap',
  },
  changeDataValue: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    flex: 1,
    flexWrap: 'wrap',
  },
  changeDataNested: {
    flex: 1,
  },
  changeDataBeforeAfter: {
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  changeDataLabel: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    fontWeight: '500',
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    marginBottom: 2,
  },
  changeDataBefore: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.ERROR,
    textDecorationLine: 'line-through',
    backgroundColor: UI_CONFIG.COLORS.ERROR + '10',
    padding: UI_CONFIG.SPACING.XS,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
    flex: 1,
    flexWrap: 'wrap',
  },
  changeDataAfter: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.SUCCESS,
    backgroundColor: UI_CONFIG.COLORS.SUCCESS + '10',
    padding: UI_CONFIG.SPACING.XS,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
    flex: 1,
    flexWrap: 'wrap',
  },
  changeDataDeleted: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.ERROR,
    textDecorationLine: 'line-through',
    backgroundColor: UI_CONFIG.COLORS.ERROR + '10',
    padding: UI_CONFIG.SPACING.XS,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
    flex: 1,
    flexWrap: 'wrap',
  },
  footerLoader: {
    padding: UI_CONFIG.SPACING.MD,
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.XL,
  },
  emptyText: {
    fontSize: UI_CONFIG.FONT_SIZES.LG,
    fontWeight: '600',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginTop: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  emptySubtext: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default PlanHistoryScreen;
