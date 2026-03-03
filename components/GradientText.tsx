import React from "react";
import { Text, TextStyle, Platform, View } from "react-native";
import MaskedView from "@react-native-masked-view/masked-view";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";

interface GradientTextProps {
  text: string;
  style?: TextStyle;
  colors?: readonly string[];
}

export function GradientText({ text, style, colors }: GradientTextProps) {
  const gradientColors = colors || Colors.gradientCyanPurple;

  if (Platform.OS === "web") {
    return (
      <View>
        <Text
          style={[
            style,
            {
              color: gradientColors[0] as string,
            },
          ]}
        >
          {text}
        </Text>
      </View>
    );
  }

  return (
    <MaskedView
      maskElement={
        <Text style={[style, { backgroundColor: "transparent" }]}>{text}</Text>
      }
    >
      <LinearGradient
        colors={gradientColors as unknown as readonly [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
}
