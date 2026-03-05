import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function BackgroundGlow() {
  return (
    <View style={[StyleSheet.absoluteFill, { pointerEvents: "none" }]}>
      <LinearGradient
        colors={["rgba(0,255,255,0.08)", "rgba(0,255,255,0.02)", "transparent"]}
        style={styles.orbTopLeft}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(147,51,234,0.07)", "rgba(99,102,241,0.03)", "transparent"]}
        style={styles.orbTopRight}
        start={{ x: 0.8, y: 0 }}
        end={{ x: 0.2, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(147,51,234,0.06)", "transparent"]}
        style={styles.orbMiddleRight}
      />
      <LinearGradient
        colors={["rgba(6,182,212,0.05)", "rgba(37,99,235,0.02)", "transparent"]}
        style={styles.orbBottomCenter}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 1 }}
      />
      <LinearGradient
        colors={["rgba(0,255,255,0.04)", "transparent"]}
        style={styles.orbBottomLeft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orbTopLeft: {
    position: "absolute" as const,
    top: -120,
    left: -80,
    width: 450,
    height: 450,
    borderRadius: 225,
  },
  orbTopRight: {
    position: "absolute" as const,
    top: -60,
    right: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
  },
  orbMiddleRight: {
    position: "absolute" as const,
    top: 280,
    right: -120,
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  orbBottomCenter: {
    position: "absolute" as const,
    bottom: 50,
    left: "20%",
    width: 400,
    height: 300,
    borderRadius: 200,
  },
  orbBottomLeft: {
    position: "absolute" as const,
    bottom: -80,
    left: -120,
    width: 380,
    height: 380,
    borderRadius: 190,
  },
});
