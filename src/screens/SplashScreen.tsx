import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import SeasonalImageBackground from '../components/SeasonalImageBackground';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onFinish: () => void;
}

const SplashScreen: React.FC<SplashScreenProps> = ({ onFinish }) => {
  useEffect(() => {
    // 2.5초 후 애니메이션 시작
    const timer = setTimeout(() => {
      onFinish();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onFinish]);


  return (
    <SeasonalImageBackground>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* 간소화된 로고 영역 */}
      <View style={styles.logoContainer}>
        <Text style={styles.appName}>Nomadic</Text>
        <Text style={styles.tagline}>여행의 모든 순간을 함께</Text>
      </View>
    </SeasonalImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  appName: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 3 },
    textShadowRadius: 6,
  },
  tagline: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.95,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
});

export default SplashScreen;
