import React from "react";
import { View, StyleSheet, ViewStyle } from "react-native";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";

interface GlassCardProps {
  children: React.ReactNode;
  glow?: boolean;
  style?: ViewStyle;
  innerStyle?: ViewStyle;
}

export function GlassCard({ children, glow = false, style, innerStyle }: GlassCardProps) {
  return (
    <View style={[styles.wrapper, style]}>
      {glow && (
        <LinearGradient
          colors={["rgba(0,255,255,0.15)", "rgba(147,51,234,0.15)", "rgba(0,255,255,0.15)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.glowBorder}
        />
      )}
      <BlurView intensity={40} tint="dark" style={styles.card}>
        <View style={[styles.cardInner, innerStyle]}>
          {children}
        </View>
      </BlurView>
    </View>
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
    borderRadius: 13,
    opacity: 0.5,
  },
  card: {
    borderRadius: 12,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  cardInner: {
    backgroundColor: "rgba(12,18,36,0.65)",
    padding: 16,
  },
});
