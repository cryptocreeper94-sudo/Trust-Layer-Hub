import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

interface EmptyStateProps {
  icon: string;
  title: string;
  subtitle?: string;
}

export function EmptyState({ icon, title, subtitle }: EmptyStateProps) {
  return (
    <View style={styles.container}>
      <View style={styles.iconRing}>
        <LinearGradient
          colors={["rgba(0,255,255,0.15)", "rgba(147,51,234,0.1)", "rgba(0,255,255,0.15)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.iconRingGradient}
        />
        <View style={styles.iconCircle}>
          <View style={styles.iconGlow} />
          <Ionicons name={icon as any} size={28} color={Colors.textTertiary} />
        </View>
      </View>
      <Text style={styles.title}>{title}</Text>
      {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: "center" as const,
    paddingVertical: 32,
    gap: 10,
  },
  iconRing: {
    width: 68,
    height: 68,
    borderRadius: 34,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 6,
  },
  iconRingGradient: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 34,
    opacity: 0.5,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(12,18,36,0.8)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  iconGlow: {
    position: "absolute" as const,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,255,255,0.04)",
  },
  title: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    maxWidth: 260,
    lineHeight: 19,
  },
});
