import React from "react";
import { View, StyleSheet } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

export function BackgroundGlow() {
  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <LinearGradient
        colors={["rgba(0,255,255,0.06)", "transparent"]}
        style={styles.orbTopLeft}
      />
      <LinearGradient
        colors={["rgba(147,51,234,0.05)", "transparent"]}
        style={styles.orbMiddleRight}
      />
      <LinearGradient
        colors={["rgba(0,255,255,0.03)", "transparent"]}
        style={styles.orbBottomLeft}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  orbTopLeft: {
    position: "absolute" as const,
    top: -100,
    left: -50,
    width: 400,
    height: 400,
    borderRadius: 200,
  },
  orbMiddleRight: {
    position: "absolute" as const,
    top: 200,
    right: -80,
    width: 500,
    height: 500,
    borderRadius: 250,
  },
  orbBottomLeft: {
    position: "absolute" as const,
    bottom: -50,
    left: -100,
    width: 350,
    height: 350,
    borderRadius: 175,
  },
});
