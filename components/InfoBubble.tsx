import React from "react";
import { Pressable, Alert, StyleSheet } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";

interface InfoBubbleProps {
  title: string;
  message: string;
  size?: number;
  color?: string;
}

export function InfoBubble({ title, message, size = 16, color = Colors.textTertiary }: InfoBubbleProps) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        Alert.alert(title, message, [{ text: "Got it" }]);
      }}
      hitSlop={12}
      style={styles.bubble}
      accessibilityRole="button"
      accessibilityLabel={`Info about ${title}`}
      testID={`info-bubble-${title.toLowerCase().replace(/\s+/g, "-")}`}
    >
      <Ionicons name="information-circle-outline" size={size} color={color} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  bubble: {
    padding: 2,
    opacity: 0.8,
  },
});
