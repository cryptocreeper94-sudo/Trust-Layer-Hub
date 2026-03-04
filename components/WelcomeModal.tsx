import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  Modal,
  Pressable,
  ScrollView,
  Platform,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { useRouter } from "expo-router";
import Colors from "@/constants/colors";
import { GradientButton } from "@/components/GradientButton";

const WELCOME_KEY = "hasSeenWelcome_v1";

interface FeatureRow {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  desc: string;
  color: string;
}

const FEATURES: FeatureRow[] = [
  {
    icon: "wallet",
    title: "Native Wallet",
    desc: "SIG tokens, Shells, staking pools up to 30% APY, and instant DEX swaps",
    color: Colors.primary,
  },
  {
    icon: "card",
    title: "Connect Accounts",
    desc: "Link your bank via Plaid or connect your Stripe business dashboard",
    color: Colors.success,
  },
  {
    icon: "people",
    title: "Affiliate Program",
    desc: "Share your referral link and earn up to 20% commission across 5 tiers",
    color: Colors.secondary,
  },
  {
    icon: "apps",
    title: "32-App Ecosystem",
    desc: "DeFi, governance, chat, scanning, and more — all under one Trust Layer ID",
    color: "#f59e0b",
  },
  {
    icon: "shield-checkmark",
    title: "Trust Stamps & Hallmarks",
    desc: "Build verifiable trust with blockchain-backed identity proofs",
    color: "#8b5cf6",
  },
];

export function WelcomeModal() {
  const [visible, setVisible] = useState(false);
  const router = useRouter();

  useEffect(() => {
    AsyncStorage.getItem(WELCOME_KEY).then((val) => {
      if (!val) setVisible(true);
    });
  }, []);

  const handleDismiss = () => {
    if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    AsyncStorage.setItem(WELCOME_KEY, "true");
    setVisible(false);
  };

  const handleCreateAccount = () => {
    if (Platform.OS !== "web") Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    AsyncStorage.setItem(WELCOME_KEY, "true");
    setVisible(false);
    setTimeout(() => router.push("/register"), 300);
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      testID="welcome-modal"
    >
      <View style={styles.overlay}>
        <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        <View style={styles.cardOuter}>
          <LinearGradient
            colors={["rgba(0,255,255,0.15)", "rgba(147,51,234,0.1)", "rgba(0,255,255,0.15)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.cardGlowBorder}
          />
          <View style={styles.card}>
            <LinearGradient
              colors={["rgba(255,255,255,0.04)", "transparent"]}
              start={{ x: 0, y: 0 }}
              end={{ x: 0, y: 1 }}
              style={StyleSheet.absoluteFill}
            />
            <Pressable
              style={styles.closeButton}
              onPress={handleDismiss}
              hitSlop={12}
              testID="welcome-close"
            >
              <Ionicons name="close" size={22} color={Colors.textTertiary} />
            </Pressable>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.heroSection}>
                <View style={styles.iconOuter}>
                  <LinearGradient
                    colors={[Colors.primary, Colors.secondary]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.iconGradientRing}
                  />
                  <View style={styles.iconInner}>
                    <View style={styles.iconGlow} />
                    <MaterialCommunityIcons name="shield-lock" size={36} color={Colors.primary} />
                  </View>
                </View>
                <Text style={styles.heroTitle}>Trust Layer Hub</Text>
                <Text style={styles.heroSubtitle}>Your Blockchain Ecosystem Command Center</Text>
              </View>

              <View style={styles.descSection}>
                <Text style={styles.descText}>
                  Welcome to the unified hub for the Trust Layer protocol ecosystem.
                  Create your free account to unlock your native wallet, DeFi staking,
                  affiliate rewards, and access to 32 integrated blockchain applications.
                </Text>
              </View>

              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>200K+</Text>
                  <Text style={styles.statLabel}>TPS</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>400ms</Text>
                  <Text style={styles.statLabel}>BLOCKS</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statNumber}>32</Text>
                  <Text style={styles.statLabel}>APPS</Text>
                </View>
              </View>

              <View style={styles.featuresSection}>
                <Text style={styles.featuresTitle}>WHAT YOU GET</Text>
                {FEATURES.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={[styles.featureIcon, { backgroundColor: `${f.color}12` }]}>
                      <Ionicons name={f.icon} size={18} color={f.color} />
                    </View>
                    <View style={styles.featureInfo}>
                      <Text style={styles.featureTitle}>{f.title}</Text>
                      <Text style={styles.featureDesc}>{f.desc}</Text>
                    </View>
                  </View>
                ))}
              </View>

              <View style={styles.ctaSection}>
                <GradientButton
                  title="Create Your Account"
                  onPress={handleCreateAccount}
                  testID="welcome-create-account"
                />
                <Pressable
                  onPress={handleDismiss}
                  style={styles.skipButton}
                  testID="welcome-skip"
                >
                  <Text style={styles.skipText}>Explore as Guest</Text>
                </Pressable>
              </View>

              <Text style={styles.footerNote}>
                No payment required. Free forever.
              </Text>
            </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center" as const,
    alignItems: "center" as const,
    padding: 20,
  },
  cardOuter: {
    width: "100%",
    maxWidth: 420,
    maxHeight: "90%",
    position: "relative" as const,
  },
  cardGlowBorder: {
    position: "absolute" as const,
    top: -1.5,
    left: -1.5,
    right: -1.5,
    bottom: -1.5,
    borderRadius: 25,
    opacity: 0.7,
  },
  card: {
    borderRadius: 24,
    backgroundColor: "rgba(12,18,36,0.95)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    overflow: "hidden" as const,
    maxHeight: "100%",
  },
  closeButton: {
    position: "absolute" as const,
    top: 14,
    right: 14,
    zIndex: 10,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  scrollContent: {
    padding: 28,
    paddingTop: 32,
  },
  heroSection: {
    alignItems: "center" as const,
    marginBottom: 20,
  },
  iconOuter: {
    width: 76,
    height: 76,
    borderRadius: 38,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  iconGradientRing: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 38,
    opacity: 0.5,
  },
  iconInner: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: "rgba(12,18,36,0.9)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  iconGlow: {
    position: "absolute" as const,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(0,255,255,0.06)",
  },
  heroTitle: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: Colors.textPrimary,
    textAlign: "center" as const,
    letterSpacing: -0.3,
    marginBottom: 6,
  },
  heroSubtitle: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    textAlign: "center" as const,
    letterSpacing: 0.3,
  },
  descSection: {
    marginBottom: 20,
  },
  descText: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    textAlign: "center" as const,
    lineHeight: 21,
  },
  statsRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 22,
  },
  statBox: {
    flex: 1,
    alignItems: "center" as const,
    gap: 2,
  },
  statNumber: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: Colors.primary,
    letterSpacing: -0.3,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
  },
  statDivider: {
    width: 1,
    height: 28,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginHorizontal: 8,
  },
  featuresSection: {
    marginBottom: 24,
  },
  featuresTitle: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    marginBottom: 14,
  },
  featureRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 14,
  },
  featureIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  featureInfo: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  featureDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    lineHeight: 17,
  },
  ctaSection: {
    gap: 12,
    marginBottom: 12,
  },
  skipButton: {
    alignItems: "center" as const,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  footerNote: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    color: Colors.textMuted,
    textAlign: "center" as const,
    letterSpacing: 0.3,
  },
});
