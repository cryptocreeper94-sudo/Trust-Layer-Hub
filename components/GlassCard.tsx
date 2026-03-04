import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";

interface GlassCardProps {
  children: React.ReactNode;
  glow?: boolean;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  animate?: boolean;
  delay?: number;
  intensity?: "low" | "medium" | "high";
}

export function GlassCard({
  children,
  glow = false,
  style,
  innerStyle,
  animate = true,
  delay = 0,
  intensity = "medium",
}: GlassCardProps) {
  const hasFlex = style && (style as any).flex;
  const blurIntensity = intensity === "low" ? 25 : intensity === "high" ? 60 : 40;

  const content = (
    <View style={[styles.wrapper, style]}>
      {glow && (
        <LinearGradient
          colors={["rgba(0,255,255,0.2)", "rgba(147,51,234,0.12)", "rgba(0,255,255,0.2)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowBorder}
        />
      )}
      <BlurView intensity={blurIntensity} tint="dark" style={[styles.card, hasFlex && { flex: 1 }, glow && styles.cardGlow]}>
        <LinearGradient
          colors={["rgba(255,255,255,0.03)", "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        <View style={[styles.cardInner, hasFlex && { flex: 1 }, innerStyle]}>
          {children}
        </View>
      </BlurView>
    </View>
  );

  if (!animate) return content;

  return (
    <Animated.View entering={FadeInDown.duration(500).delay(delay).springify().damping(18)}>
      {content}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "relative" as const,
  },
  glowBorder: {
    position: "absolute" as const,
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 17,
    opacity: 0.6,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.07)",
  },
  cardGlow: {
    borderColor: "rgba(0,255,255,0.12)",
  },
  cardInner: {
    backgroundColor: "rgba(12,18,36,0.6)",
    padding: 16,
  },
});
