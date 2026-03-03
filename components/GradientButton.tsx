import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface GradientButtonProps {
  title: string;
  onPress: () => void;
  colors?: readonly string[];
  style?: ViewStyle;
  textStyle?: TextStyle;
  disabled?: boolean;
  loading?: boolean;
  small?: boolean;
  testID?: string;
}

export function GradientButton({
  title,
  onPress,
  colors,
  style,
  textStyle,
  disabled = false,
  loading = false,
  small = false,
  testID,
}: GradientButtonProps) {
  const gradientColors = colors || Colors.gradientCyan;

  const handlePress = () => {
    if (disabled || loading) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <LinearGradient
      colors={gradientColors as unknown as readonly [string, string, ...string[]]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[styles.gradient, small && styles.gradientSmall, style, disabled && styles.disabled]}
    >
      <Pressable
        onPress={handlePress}
        disabled={disabled || loading}
        style={({ pressed }) => [
          styles.pressable,
          small && styles.pressableSmall,
          pressed && styles.pressed,
        ]}
        android_ripple={{ color: "rgba(255,255,255,0.1)" }}
        testID={testID}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={[styles.text, small && styles.textSmall, textStyle]}>{title}</Text>
        )}
      </Pressable>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  gradientSmall: {
    borderRadius: 8,
  },
  pressable: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 48,
  },
  pressableSmall: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    minHeight: 36,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  textSmall: {
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
});
