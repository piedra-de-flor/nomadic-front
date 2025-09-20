import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface LoadingDotsProps {
  size?: number;
  color?: string;
  duration?: number;
}

const LoadingDots: React.FC<LoadingDotsProps> = ({ 
  size = 8, 
  color = '#FF6B35', 
  duration = 600 
}) => {
  const dot1 = useRef(new Animated.Value(0)).current;
  const dot2 = useRef(new Animated.Value(0)).current;
  const dot3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const createAnimation = (animatedValue: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animatedValue, {
            toValue: 1,
            duration: duration / 2,
            useNativeDriver: true,
          }),
          Animated.timing(animatedValue, {
            toValue: 0,
            duration: duration / 2,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const animation1 = createAnimation(dot1, 0);
    const animation2 = createAnimation(dot2, duration / 3);
    const animation3 = createAnimation(dot3, (duration * 2) / 3);

    animation1.start();
    animation2.start();
    animation3.start();

    return () => {
      animation1.stop();
      animation2.stop();
      animation3.stop();
    };
  }, [dot1, dot2, dot3, duration]);

  const getDotStyle = (animatedValue: Animated.Value) => ({
    width: size,
    height: size,
    borderRadius: size / 2,
    backgroundColor: color,
    opacity: animatedValue,
    transform: [
      {
        scale: animatedValue.interpolate({
          inputRange: [0, 1],
          outputRange: [0.8, 1.2],
        }),
      },
    ],
  });

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.dot, getDotStyle(dot1)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot2)]} />
      <Animated.View style={[styles.dot, getDotStyle(dot3)]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    marginHorizontal: 4,
  },
});

export default LoadingDots;




















