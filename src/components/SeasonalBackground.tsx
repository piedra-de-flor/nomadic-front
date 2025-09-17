import React from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width, height } = Dimensions.get('window');

interface SeasonalBackgroundProps {
  children: React.ReactNode;
}

const SeasonalBackground: React.FC<SeasonalBackgroundProps> = ({ children }) => {
  // 현재 월에 따른 계절별 그라데이션
  const getSeasonalGradient = () => {
    const month = new Date().getMonth();
    
    // 봄: 3-5월, 여름: 6-8월, 가을: 9-11월, 겨울: 12-2월
    if (month >= 2 && month <= 4) {
      // 봄 - 벚꽃 테마 (연분홍, 따뜻한 주황)
      return ['#ff9a9e', '#fecfef', '#fecfef'];
    } else if (month >= 5 && month <= 7) {
      // 여름 - 해변 테마 (에메랄드, 하늘색)
      return ['#21CBF3', '#2196F3', '#4A90E2'];
    } else if (month >= 8 && month <= 10) {
      // 가을 - 단풍 테마 (주황, 빨강, 황금)
      return ['#ff9a9e', '#fecfef', '#ff6b35'];
    } else {
      // 겨울 - 눈 테마 (보라, 파랑, 흰색)
      return ['#667eea', '#764ba2', '#e3f2fd'];
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={getSeasonalGradient()}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {children}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    width: width,
    height: height,
  },
});

export default SeasonalBackground;
















