import React from 'react';
import { View, StyleSheet, Dimensions, ImageBackground } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SeasonalImageBackgroundProps {
  children: React.ReactNode;
}

const SeasonalImageBackground: React.FC<SeasonalImageBackgroundProps> = ({ children }) => {
  // 4개 계절 이미지 중 랜덤으로 선택
  const getRandomSeasonalImage = () => {
    const seasonalImages = [
      require('../../assets/spring-bg.jpg'), // 봄 - 벚꽃 이미지
      require('../../assets/summer-bg.jpg'), // 여름 - 해변 이미지
      require('../../assets/autumn-bg.jpg'), // 가을 - 단풍 이미지
      require('../../assets/winter-bg.jpg'), // 겨울 - 눈 이미지
    ];
    
    // 랜덤 인덱스 생성 (0-3)
    const randomIndex = Math.floor(Math.random() * seasonalImages.length);
    return seasonalImages[randomIndex];
  };

  return (
    <View style={styles.container}>
      <ImageBackground
        source={getRandomSeasonalImage()}
        style={styles.backgroundImage}
        resizeMode="cover"
      >
        {/* 그라데이션 오버레이 */}
        <LinearGradient
          colors={['rgba(0,0,0,0.3)', 'rgba(0,0,0,0.6)']}
          style={styles.gradientOverlay}
        >
          {children}
        </LinearGradient>
      </ImageBackground>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    flex: 1,
    width: width,
    height: height,
  },
  gradientOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
});

export default SeasonalImageBackground;