import React from "react";
import { View, StyleSheet, ViewStyle, Platform } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
import Animated, { FadeInDown } from "react-native-reanimated";
import { useThemeColors } from "@/constants/colors";

interface GlassCardProps {
  children: React.ReactNode;
  glow?: boolean;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
  animate?: boolean;
  delay?: number;
  intensity?: "low" | "medium" | "high";
  accentColor?: string;
}

export function GlassCard({
  children,
  glow = false,
  style,
  innerStyle,
  animate = true,
  delay = 0,
  intensity = "medium",
  accentColor,
}: GlassCardProps) {
  const hasFlex = style && (style as any).flex;
  const { colors, isDark } = useThemeColors();
  const blurIntensity = intensity === "low" ? 25 : intensity === "high" ? 60 : 40;

  const isAndroid = Platform.OS === "android";

  const GlassSurface = isAndroid ? View : BlurView;
  const surfaceProps = isAndroid ? {} : { intensity: blurIntensity, tint: (isDark ? "dark" : "light") as any };

  const glowColors = accentColor
    ? [`${accentColor}40`, "rgba(147,51,234,0.15)", `${accentColor}40`]
    : ["rgba(0,255,255,0.25)", "rgba(147,51,234,0.15)", "rgba(0,255,255,0.25)"];

  const content = (
    <View style={[styles.wrapper, style]}>
      {glow && (
        <LinearGradient
          colors={glowColors as any}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowBorder}
        />
      )}
      <GlassSurface {...surfaceProps} style={[
        styles.card,
        isAndroid && (isDark ? styles.androidCardFallBack : { backgroundColor: "rgba(255,255,255,0.92)" }),
        hasFlex && { flex: 1 },
        glow && styles.cardGlow,
        !isDark && { borderColor: "rgba(0,0,0,0.08)" },
        accentColor && { borderColor: `${accentColor}25` },
      ]}>
        <LinearGradient
          colors={isDark ? ["rgba(255,255,255,0.06)", "rgba(255,255,255,0.01)"] : ["rgba(255,255,255,0.6)", "rgba(255,255,255,0.3)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
        {/* Subtle accent color wash at the top edge */}
        {accentColor && isDark && (
          <LinearGradient
            colors={[`${accentColor}12`, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={{ position: "absolute" as const, top: 0, left: 0, right: 0, height: 80 }}
          />
        )}
        <View style={[
          styles.cardInner,
          hasFlex && { flex: 1 },
          !isDark && { backgroundColor: "rgba(255,255,255,0.75)" },
          innerStyle,
        ]}>
          {children}
        </View>
      </GlassSurface>
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
    opacity: 0.7,
  },
  card: {
    borderRadius: 16,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
  },
  androidCardFallBack: {
    backgroundColor: "rgba(10, 14, 26, 0.95)",
  },
  cardGlow: {
    borderColor: "rgba(0,255,255,0.15)",
  },
  cardInner: {
    backgroundColor: "rgba(10, 14, 26, 0.72)",
    padding: 16,
  },
});
