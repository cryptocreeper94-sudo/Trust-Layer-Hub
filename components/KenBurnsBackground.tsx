import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, Easing } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import Colors from '@/constants/colors';

interface Props {
  images: any[];
  duration?: number;
  overlayOpacity?: [number, number];
}

const KenBurnsImage = ({ 
  source, 
  index, 
  total, 
  duration 
}: { 
  source: any; 
  index: number; 
  total: number; 
  duration: number 
}) => {
  const opacity = useSharedValue(index === 0 ? 1 : 0);
  const scale = useSharedValue(1);

  useEffect(() => {
    // Determine when this image should become fully visible
    const startTime = index * duration;
    
    // Smooth cinematic zoom (scales up 15%)
    scale.value = withDelay(
      Math.max(0, startTime - 1000), // Start scaling right before fade in
      withTiming(1.15, { duration: duration + 3000, easing: Easing.linear })
    );

    // Fade IN
    if (index > 0) {
      opacity.value = withDelay(
        startTime,
        withTiming(1, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      );
    }
    
    // Fade OUT (unless it's the absolute last image, which user requested to hold)
    if (index < total - 1) {
      opacity.value = withDelay(
        startTime + duration,
        withTiming(0, { duration: 2500, easing: Easing.inOut(Easing.ease) })
      );
    }
  }, [index, total, duration]);

  const style = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
      transform: [{ scale: scale.value }],
    };
  });

  return (
    <Animated.Image 
      source={source}
      style={[StyleSheet.absoluteFill, style, { width: '100%', height: '100%' }]}
      resizeMode="cover"
    />
  );
};

export function KenBurnsBackground({ images, duration = 6500, overlayOpacity = [0.4, 1] }: Props) {
  if (!images || images.length === 0) return null;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} pointerEvents="none">
      {images.map((img, i) => (
        <KenBurnsImage 
          key={i} 
          source={img} 
          index={i} 
          total={images.length} 
          duration={duration} 
        />
      ))}
      <LinearGradient 
        colors={[`rgba(6,6,10,${overlayOpacity[0]})`, `rgba(6,6,10,${overlayOpacity[1]})`]} 
        style={StyleSheet.absoluteFill} 
        start={{x: 0, y: 0}} 
        end={{x: 0, y: 1}} 
      />
    </View>
  );
}
