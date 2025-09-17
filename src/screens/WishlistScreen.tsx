import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import { useSelector } from 'react-redux';
import { RootState } from '../store';
import { UI_CONFIG } from '../constants';

const { width } = Dimensions.get('window');

const WishlistScreen = ({ navigation }: any) => {
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);
  const [wishlistItems, setWishlistItems] = useState([
    { 
      id: 1, 
      name: '제주 신라호텔', 
      location: '제주시', 
      rating: 4.8, 
      price: '₩200,000', 
      image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop',
      category: '호텔',
      isLiked: true
    },
    { 
      id: 2, 
      name: '부산 해운대', 
      location: '부산시', 
      rating: 4.6, 
      price: '무료', 
      image: 'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop',
      category: '관광지',
      isLiked: true
    },
    { 
      id: 3, 
      name: '강릉 커피거리', 
      location: '강릉시', 
      rating: 4.7, 
      price: '₩8,000', 
      image: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=400&h=300&fit=crop',
      category: '카페',
      isLiked: true
    },
    { 
      id: 4, 
      name: '전주 한옥마을', 
      location: '전주시', 
      rating: 4.5, 
      price: '₩3,000', 
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      category: '문화재',
      isLiked: true
    },
    { 
      id: 5, 
      name: '서울 한강공원', 
      location: '서울시', 
      rating: 4.4, 
      price: '무료', 
      image: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=300&fit=crop',
      category: '공원',
      isLiked: true
    },
    { 
      id: 6, 
      name: '경주 불국사', 
      location: '경주시', 
      rating: 4.9, 
      price: '₩5,000', 
      image: 'https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop',
      category: '문화재',
      isLiked: true
    },
  ]);

  const removeFromWishlist = (id: number) => {
    setWishlistItems(prev => prev.filter(item => item.id !== id));
  };

  const handleLogin = () => {
    navigation.navigate('Login');
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <View style={styles.headerContent}>
            <Text style={styles.title}>찜한 장소</Text>
            <Text style={styles.subtitle}>로그인이 필요한 서비스입니다</Text>
          </View>
        </View>
        <View style={styles.loginRequiredContainer}>
          <View style={styles.loginRequiredCard}>
            <Text style={styles.loginRequiredIcon}>🔒</Text>
            <Text style={styles.loginRequiredTitle}>로그인이 필요해요</Text>
            <Text style={styles.loginRequiredSubtitle}>
              마음에 드는 장소를 찜하려면{'\n'}로그인해주세요
            </Text>
            <TouchableOpacity style={styles.loginButton} onPress={handleLogin}>
              <Text style={styles.loginButtonText}>로그인하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Text style={styles.title}>찜한 장소</Text>
          <Text style={styles.subtitle}>{wishlistItems.length}개의 장소를 찜했어요</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {wishlistItems.length > 0 ? (
          <View style={styles.wishlistGrid}>
            {wishlistItems.map((item, index) => (
              <View key={item.id} style={styles.wishlistCard}>
                <TouchableOpacity style={styles.cardImageContainer} activeOpacity={0.8}>
                  <Image source={{ uri: item.image }} style={styles.cardImage} />
                  <View style={styles.categoryBadge}>
                    <Text style={styles.categoryText}>{item.category}</Text>
                  </View>
                </TouchableOpacity>
                <View style={styles.cardContent}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.name}</Text>
                    <TouchableOpacity 
                      style={styles.deleteButton}
                      onPress={() => removeFromWishlist(item.id)}
                    >
                      <Text style={styles.deleteIcon}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  <View style={styles.locationContainer}>
                    <Text style={styles.locationIcon}>📍</Text>
                    <Text style={styles.cardLocation} numberOfLines={1}>{item.location}</Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIconContainer}>
              <Text style={styles.emptyIcon}>💫</Text>
            </View>
            <Text style={styles.emptyTitle}>아직 찜한 장소가 없어요</Text>
            <Text style={styles.emptySubtitle}>
              마음에 드는 장소를 발견하면{'\n'}하트를 눌러 찜해보세요!
            </Text>
            <TouchableOpacity style={styles.exploreButton}>
              <Text style={styles.exploreButtonText}>장소 둘러보기</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: UI_CONFIG.SPACING.LG,
    paddingBottom: UI_CONFIG.SPACING.LG,
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  headerContent: {
    flex: 1,
  },
  title: {
    fontSize: UI_CONFIG.FONT_SIZES.TITLE,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  subtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.SM,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    fontWeight: '500',
  },
  content: {
    flex: 1,
    backgroundColor: UI_CONFIG.COLORS.BACKGROUND,
  },
  wishlistGrid: {
    padding: UI_CONFIG.SPACING.LG,
  },
  wishlistCard: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    flexDirection: 'row',
    alignItems: 'center',
    padding: UI_CONFIG.SPACING.MD,
    marginBottom: UI_CONFIG.SPACING.MD,
    ...UI_CONFIG.SHADOWS.SM,
  },
  cardImageContainer: {
    position: 'relative',
    width: 80,
    height: 80,
    borderRadius: UI_CONFIG.BORDER_RADIUS.MD,
    overflow: 'hidden',
    marginRight: UI_CONFIG.SPACING.MD,
  },
  cardImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  categoryBadge: {
    position: 'absolute',
    top: UI_CONFIG.SPACING.XS,
    left: UI_CONFIG.SPACING.XS,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: UI_CONFIG.SPACING.XS,
    paddingVertical: 2,
    borderRadius: UI_CONFIG.BORDER_RADIUS.SM,
  },
  categoryText: {
    fontSize: 10,
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    fontWeight: '600',
  },
  cardContent: {
    flex: 1,
    justifyContent: 'space-between',
    height: 80,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: UI_CONFIG.SPACING.XS,
  },
  deleteButton: {
    width: 24,
    height: 24,
    borderRadius: UI_CONFIG.BORDER_RADIUS.ROUND,
    backgroundColor: UI_CONFIG.COLORS.TEXT_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteIcon: {
    fontSize: 14,
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    fontWeight: 'bold',
  },
  cardName: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    flex: 1,
    marginRight: UI_CONFIG.SPACING.SM,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.SM,
  },
  locationIcon: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    marginRight: UI_CONFIG.SPACING.XS,
  },
  cardLocation: {
    fontSize: UI_CONFIG.FONT_SIZES.XS,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    flex: 1,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.XXL,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: UI_CONFIG.BORDER_RADIUS.ROUND,
    backgroundColor: UI_CONFIG.COLORS.SURFACE_LIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: UI_CONFIG.SPACING.XL,
    ...UI_CONFIG.SHADOWS.MD,
  },
  emptyIcon: {
    fontSize: 48,
  },
  emptyTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.XL,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.MD,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: UI_CONFIG.SPACING.XL,
  },
  exploreButton: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    paddingHorizontal: UI_CONFIG.SPACING.XL,
    paddingVertical: UI_CONFIG.SPACING.MD,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    ...UI_CONFIG.SHADOWS.SM,
  },
  exploreButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    fontWeight: '600',
  },
  loginRequiredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.SPACING.XXL,
  },
  loginRequiredCard: {
    backgroundColor: UI_CONFIG.COLORS.SURFACE,
    borderRadius: UI_CONFIG.BORDER_RADIUS.XL,
    padding: UI_CONFIG.SPACING.XXL,
    alignItems: 'center',
    ...UI_CONFIG.SHADOWS.MD,
    borderWidth: 1,
    borderColor: UI_CONFIG.COLORS.BORDER_LIGHT,
  },
  loginRequiredIcon: {
    fontSize: 48,
    marginBottom: UI_CONFIG.SPACING.LG,
  },
  loginRequiredTitle: {
    fontSize: UI_CONFIG.FONT_SIZES.XL,
    fontWeight: '700',
    color: UI_CONFIG.COLORS.TEXT_PRIMARY,
    marginBottom: UI_CONFIG.SPACING.MD,
    textAlign: 'center',
  },
  loginRequiredSubtitle: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_SECONDARY,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: UI_CONFIG.SPACING.XL,
  },
  loginButton: {
    backgroundColor: UI_CONFIG.COLORS.PRIMARY,
    paddingHorizontal: UI_CONFIG.SPACING.XL,
    paddingVertical: UI_CONFIG.SPACING.MD,
    borderRadius: UI_CONFIG.BORDER_RADIUS.LG,
    ...UI_CONFIG.SHADOWS.SM,
  },
  loginButtonText: {
    fontSize: UI_CONFIG.FONT_SIZES.MD,
    color: UI_CONFIG.COLORS.TEXT_WHITE,
    fontWeight: '600',
  },
});

export default WishlistScreen;

