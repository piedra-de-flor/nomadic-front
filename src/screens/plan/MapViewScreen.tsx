import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { getPlanMapHTML } from '../../services/map/mapService';
import { UI_CONFIG } from '../../constants';

interface MapViewScreenProps {
  route: any;
  navigation: any;
}

const MapViewScreen: React.FC<MapViewScreenProps> = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { planId } = route.params as { planId: number };

  const [mapHTML, setMapHTML] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    loadMapData();
  }, [planId]);

  const loadMapData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      console.log('🗺️ 지도 HTML 로딩 시작:', planId);
      const html = await getPlanMapHTML(planId);
      
      console.log('🗺️ 지도 HTML 로딩 완료, 길이:', html.length);
      setMapHTML(html);
    } catch (err) {
      console.error('❌ 지도 HTML 로딩 에러:', err);
      setError('지도를 불러올 수 없습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleRefresh = () => {
    loadMapData();
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={UI_CONFIG.COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>지도 보기</Text>
          <View style={styles.placeholder} />
        </View>
        
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={UI_CONFIG.COLORS.PRIMARY} />
          <Text style={styles.loadingText}>지도 로딩 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color={UI_CONFIG.COLORS.TEXT_PRIMARY} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>지도 보기</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
            <Ionicons name="refresh" size={24} color={UI_CONFIG.COLORS.PRIMARY} />
          </TouchableOpacity>
        </View>
        
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={UI_CONFIG.COLORS.ERROR} />
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={handleRefresh} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>다시 시도</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={UI_CONFIG.COLORS.TEXT_PRIMARY} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>지도 보기</Text>
        <TouchableOpacity onPress={handleRefresh} style={styles.refreshButton}>
          <Ionicons name="refresh" size={24} color={UI_CONFIG.COLORS.PRIMARY} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.mapContainer}>
        <WebView
          source={{ html: mapHTML }}
          style={styles.webView}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          startInLoadingState={false}
          scalesPageToFit={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          mixedContentMode="compatibility"
          originWhitelist={['*']}
          onLoadStart={() => console.log('🗺️ WebView 로딩 시작')}
          onLoadEnd={() => console.log('🗺️ WebView 로딩 완료')}
          onError={(e) => {
            console.error('❌ WebView 에러:', e.nativeEvent);
            setError('지도 렌더링 중 오류가 발생했습니다.');
          }}
          onMessage={(e) => console.log('🗺️ WebView 메시지:', e.nativeEvent.data)}
        />
      </View>
      
      <View style={styles.footer}>
        <Text style={styles.footerText}>Plan ID: {planId}</Text>
        <Text style={styles.footerText}>HTML 길이: {mapHTML.length}자</Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E5E5',
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
  },
  refreshButton: {
    padding: 8,
  },
  placeholder: {
    width: 40,
  },
  mapContainer: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  webView: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    marginTop: 16,
    fontSize: 16,
    color: UI_CONFIG.COLORS.ERROR,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 20,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    padding: 12,
    backgroundColor: '#F8F9FA',
    borderTopWidth: 1,
    borderTopColor: '#E5E5E5',
  },
  footerText: {
    fontSize: 12,
    color: UI_CONFIG.COLORS.TEXT_LIGHT,
    textAlign: 'center',
  },
});

export default MapViewScreen;
