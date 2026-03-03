import React, { useState, useRef } from "react";
import {
  StyleSheet,
  Text,
  View,
  Pressable,
  Platform,
  useWindowDimensions,
  FlatList,
  ViewToken,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GradientButton } from "@/components/GradientButton";

const ONBOARDING_KEY = "hasSeenOnboarding";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <Ionicons name="shield-checkmark" size={64} color={Colors.primary} />,
    title: "Welcome to Trust Layer Hub",
    subtitle: "Your gateway to 32 blockchain apps",
    description:
      "One identity, one ecosystem. Access decentralized finance, governance, communication, and more — all secured by the Trust Layer protocol.",
  },
  {
    icon: <Ionicons name="wallet" size={64} color={Colors.primary} />,
    title: "Your Wallet",
    subtitle: "SIG tokens, Shells & staking",
    description:
      "Manage your SIG tokens, earn Shells through daily engagement, and stake your holdings to earn rewards. Your assets, your control.",
  },
  {
    icon: <Ionicons name="people" size={64} color={Colors.primary} />,
    title: "Share & Earn",
    subtitle: "Earn up to 20% commission",
    description:
      "Invite friends to the ecosystem and earn commissions on their activity. Rise through affiliate tiers from Bronze to Diamond as your network grows.",
  },
  {
    icon: <MaterialCommunityIcons name="apps" size={64} color={Colors.primary} />,
    title: "Explore the Ecosystem",
    subtitle: "32 apps, one identity",
    description:
      "From SIGNiX DEX to Trust Mesh governance, explore a full suite of blockchain applications — all linked to your Trust Layer ID.",
  },
];

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const webBottomInset = Platform.OS === "web" ? 34 : 0;
  const { width } = useWindowDimensions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = currentIndex === steps.length - 1;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setCurrentIndex(viewableItems[0].index);
      }
    }
  ).current;

  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  async function completeOnboarding() {
    await AsyncStorage.setItem(ONBOARDING_KEY, "true");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.replace("/(tabs)");
  }

  function goNext() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (isLast) {
      completeOnboarding();
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1, animated: true });
    }
  }

  function skip() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    completeOnboarding();
  }

  function renderStep({ item }: { item: OnboardingStep }) {
    return (
      <View style={[styles.stepContainer, { width }]}>
        <View style={styles.stepCard}>
          <LinearGradient
            colors={["rgba(0,255,255,0.08)", "rgba(147,51,234,0.06)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGradient}
          />
          <View style={styles.iconContainer}>
            <View style={styles.iconGlow} />
            {item.icon}
          </View>
          <Text style={styles.stepTitle}>{item.title}</Text>
          <Text style={styles.stepSubtitle}>{item.subtitle}</Text>
          <Text style={styles.stepDescription}>{item.description}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundGlow />

      <View
        style={[
          styles.skipRow,
          {
            paddingTop: insets.top + webTopInset + 12,
          },
        ]}
      >
        {!isLast ? (
          <Pressable onPress={skip} style={styles.skipButton} testID="onboarding-skip">
            <Text style={styles.skipText}>Skip</Text>
          </Pressable>
        ) : (
          <View />
        )}
      </View>

      <FlatList
        ref={flatListRef}
        data={steps}
        renderItem={renderStep}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(_, i) => i.toString()}
        style={styles.flatList}
      />

      <View
        style={[
          styles.bottomSection,
          {
            paddingBottom: insets.bottom + webBottomInset + 20,
          },
        ]}
      >
        <View style={styles.dotsRow}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && styles.dotActive,
              ]}
            />
          ))}
        </View>

        {isLast ? (
          <GradientButton
            title="Get Started"
            onPress={goNext}
            style={styles.actionButton}
            testID="onboarding-get-started"
          />
        ) : (
          <Pressable onPress={goNext} style={styles.nextButton} testID="onboarding-next">
            <Text style={styles.nextText}>Next</Text>
            <Ionicons name="arrow-forward" size={18} color="#fff" />
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  skipRow: {
    flexDirection: "row" as const,
    justifyContent: "flex-end" as const,
    paddingHorizontal: 24,
  },
  skipButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  skipText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  flatList: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingHorizontal: 32,
  },
  stepCard: {
    width: "100%" as const,
    maxWidth: 400,
    alignItems: "center" as const,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    backgroundColor: "rgba(12,18,36,0.7)",
    padding: 36,
    overflow: "hidden" as const,
  },
  cardGradient: {
    ...StyleSheet.absoluteFillObject,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 28,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.12)",
  },
  iconGlow: {
    position: "absolute" as const,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: "rgba(0,255,255,0.08)",
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    textAlign: "center" as const,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center" as const,
    marginBottom: 16,
  },
  stepDescription: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    lineHeight: 22,
  },
  bottomSection: {
    paddingHorizontal: 32,
    gap: 24,
    alignItems: "center" as const,
  },
  dotsRow: {
    flexDirection: "row" as const,
    gap: 8,
    justifyContent: "center" as const,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.2)",
  },
  dotActive: {
    width: 24,
    backgroundColor: Colors.primary,
  },
  nextButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    backgroundColor: "rgba(0,255,255,0.12)",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    minWidth: 160,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.2)",
  },
  nextText: {
    fontSize: 16,
    fontWeight: "600" as const,
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  actionButton: {
    width: "100%" as const,
    maxWidth: 320,
  },
});
