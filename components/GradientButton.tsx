import React from "react";
import { Pressable, Text, StyleSheet, ViewStyle, TextStyle, ActivityIndicator, View, Platform } from "react-native";
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
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  return (
    <View style={[styles.shadowWrap, disabled && styles.disabled, style]}>
      <LinearGradient
        colors={gradientColors as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={[styles.gradient, small && styles.gradientSmall]}
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
    </View>
  );
}

const styles = StyleSheet.create({
  shadowWrap: {
    borderRadius: 14,
    ...(Platform.OS === "web" ? {
      boxShadow: "0px 4px 12px rgba(6,182,212,0.3)",
    } : {
      shadowColor: "#06b6d4",
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.25,
      shadowRadius: 10,
      elevation: 8,
    }),
  },
  gradient: {
    borderRadius: 14,
    overflow: "hidden" as const,
  },
  gradientSmall: {
    borderRadius: 10,
  },
  pressable: {
    paddingVertical: 15,
    paddingHorizontal: 24,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    minHeight: 50,
  },
  pressableSmall: {
    paddingVertical: 9,
    paddingHorizontal: 16,
    minHeight: 38,
  },
  pressed: {
    opacity: 0.85,
  },
  text: {
    color: "#fff",
    fontWeight: "700" as const,
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  textSmall: {
    fontSize: 13,
  },
  disabled: {
    opacity: 0.5,
  },
});
