import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { GradientButton } from "@/components/GradientButton";
import { useAffiliateDashboard, useRequestPayout } from "@/hooks/useAffiliate";
import { useAuth } from "@/lib/auth-context";

const TIER_COLORS: Record<string, string> = {
  Base: Colors.textSecondary,
  Silver: "#94a3b8",
  Gold: "#f59e0b",
  Platinum: "#a78bfa",
  Diamond: Colors.primary,
};

export default function AffiliateScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { isAuthenticated } = useAuth();
  const { data: dashboard } = useAffiliateDashboard();
  const payoutMutation = useRequestPayout();

  const tier = dashboard?.tier || { name: "Base", commissionRate: 10 };
  const stats = dashboard?.stats || {
    totalReferrals: 0,
    convertedReferrals: 0,
    pendingReferrals: 0,
    totalEarnings: 0,
    pendingEarnings: 0,
    paidEarnings: 0,
  };
  const nextTier = dashboard?.nextTier;
  const referralLink = dashboard?.referralLink || "";
  const tiers = dashboard?.tiers || [];

  const handleCopyLink = async () => {
    if (!referralLink) return;
    await Clipboard.setStringAsync(referralLink);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Your referral link has been copied to clipboard.");
  };

  const handleRequestPayout = () => {
    if (stats.pendingEarnings < 10) {
      Alert.alert("Minimum Not Met", "You need at least 10 SIG in pending earnings to request a payout.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    payoutMutation.mutate();
  };

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <BackgroundGlow />
        <View style={[styles.centered, { paddingTop: insets.top + webTopInset + 80 }]}>
          <Ionicons name="people" size={48} color={Colors.primary} />
          <Text style={styles.emptyTitle}>Affiliate Program</Text>
          <Text style={styles.emptyText}>Sign in to access your affiliate dashboard</Text>
          <GradientButton title="Sign In" onPress={() => router.push("/login")} style={{ marginTop: 20 }} testID="affiliate-sign-in" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: 40 + (Platform.OS === "web" ? 34 : insets.bottom),
            maxWidth: isDesktop ? 720 : undefined,
            alignSelf: isDesktop ? "center" as const : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} hitSlop={8} testID="affiliate-back">
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
          <GradientText text="Affiliate Program" style={styles.screenTitle} />
          <View style={{ width: 24 }} />
        </View>

        <GlassCard glow>
          <View style={styles.tierHeader}>
            <View style={[styles.tierBadge, { borderColor: TIER_COLORS[tier.name] || Colors.primary }]}>
              <Ionicons name="diamond" size={20} color={TIER_COLORS[tier.name] || Colors.primary} />
              <Text style={[styles.tierName, { color: TIER_COLORS[tier.name] || Colors.primary }]}>{tier.name}</Text>
            </View>
            <Text style={styles.commissionRate}>{tier.commissionRate}% Commission</Text>
          </View>
          {nextTier && (
            <View style={styles.nextTierRow}>
              <View style={styles.progressBarBg}>
                <View
                  style={[
                    styles.progressBarFill,
                    {
                      width: `${Math.min(100, ((stats.convertedReferrals) / (stats.convertedReferrals + nextTier.referralsNeeded)) * 100)}%`,
                      backgroundColor: TIER_COLORS[nextTier.name] || Colors.primary,
                    },
                  ]}
                />
              </View>
              <Text style={styles.nextTierText}>
                {nextTier.referralsNeeded} more referrals to {nextTier.name} ({nextTier.commissionRate}%)
              </Text>
            </View>
          )}
        </GlassCard>

        <View style={styles.statsGrid}>
          <GlassCard style={styles.statCard}>
            <Ionicons name="people" size={20} color={Colors.primary} />
            <Text style={styles.statValue}>{stats.totalReferrals}</Text>
            <Text style={styles.statLabel}>Total Referrals</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="checkmark-circle" size={20} color={Colors.success} />
            <Text style={[styles.statValue, { color: Colors.success }]}>{stats.convertedReferrals}</Text>
            <Text style={styles.statLabel}>Converted</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="wallet" size={20} color="#f59e0b" />
            <Text style={[styles.statValue, { color: "#f59e0b" }]}>{stats.totalEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Total SIG</Text>
          </GlassCard>
          <GlassCard style={styles.statCard}>
            <Ionicons name="time" size={20} color={Colors.secondary} />
            <Text style={[styles.statValue, { color: Colors.secondary }]}>{stats.pendingEarnings.toFixed(2)}</Text>
            <Text style={styles.statLabel}>Pending SIG</Text>
          </GlassCard>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="link" size={18} color={Colors.primary} />
          <GradientText text="Your Referral Link" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <Text style={styles.linkLabel}>Share this link across all Trust Layer platforms:</Text>
          <Pressable style={styles.linkRow} onPress={handleCopyLink} testID="copy-referral-link">
            <Text style={styles.linkText} numberOfLines={1} ellipsizeMode="middle">
              {referralLink || "Sign in to get your link"}
            </Text>
            <Ionicons name="copy-outline" size={18} color={Colors.primary} />
          </Pressable>
          <Text style={styles.hashLabel}>
            Affiliate ID: <Text style={styles.hashValue}>{dashboard?.uniqueHash || "—"}</Text>
          </Text>
          <Text style={styles.hashNote}>This ID is recognized across all 32+ ecosystem apps</Text>
        </GlassCard>

        {stats.pendingEarnings > 0 && (
          <>
            <View style={styles.sectionHeader}>
              <Ionicons name="cash" size={18} color={Colors.success} />
              <GradientText text="Payouts" style={styles.sectionTitle} />
            </View>
            <GlassCard>
              <View style={styles.payoutRow}>
                <View>
                  <Text style={styles.payoutLabel}>Available for Payout</Text>
                  <Text style={styles.payoutAmount}>{stats.pendingEarnings.toFixed(2)} SIG</Text>
                </View>
                <GradientButton
                  title="Request Payout"
                  onPress={handleRequestPayout}
                  small
                  loading={payoutMutation.isPending}
                  disabled={stats.pendingEarnings < 10}
                  testID="request-payout"
                />
              </View>
              <Text style={styles.payoutNote}>Minimum payout: 10 SIG. Payouts processed within 48 hours.</Text>
            </GlassCard>
          </>
        )}

        <View style={styles.sectionHeader}>
          <Ionicons name="trophy" size={18} color="#f59e0b" />
          <GradientText text="Commission Tiers" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          {(tiers.length > 0 ? tiers : [
            { name: "Base", minReferrals: 0, commissionRate: 10 },
            { name: "Silver", minReferrals: 5, commissionRate: 12.5 },
            { name: "Gold", minReferrals: 15, commissionRate: 15 },
            { name: "Platinum", minReferrals: 30, commissionRate: 17.5 },
            { name: "Diamond", minReferrals: 50, commissionRate: 20 },
          ]).map((t: any, i: number) => (
            <View key={t.name}>
              {i > 0 && <View style={styles.divider} />}
              <View style={styles.tierRow}>
                <View style={styles.tierRowLeft}>
                  <Ionicons
                    name="diamond"
                    size={16}
                    color={TIER_COLORS[t.name] || Colors.textMuted}
                  />
                  <Text style={[styles.tierRowName, tier.name === t.name && { color: TIER_COLORS[t.name] }]}>
                    {t.name}
                  </Text>
                  {tier.name === t.name && (
                    <View style={styles.currentBadge}>
                      <Text style={styles.currentBadgeText}>Current</Text>
                    </View>
                  )}
                </View>
                <View style={styles.tierRowRight}>
                  <Text style={styles.tierRowRate}>{t.commissionRate}%</Text>
                  <Text style={styles.tierRowReq}>{t.minReferrals}+ referrals</Text>
                </View>
              </View>
            </View>
          ))}
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <GradientText text="How It Works" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <View style={styles.howItWorksItem}>
            <View style={styles.stepCircle}><Text style={styles.stepNum}>1</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.howTitle}>Share Your Link</Text>
              <Text style={styles.howDesc}>Share your unique referral link with friends, community, and social media</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.howItWorksItem}>
            <View style={styles.stepCircle}><Text style={styles.stepNum}>2</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.howTitle}>They Sign Up</Text>
              <Text style={styles.howDesc}>When someone signs up through your link on any Trust Layer platform, it's tracked</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.howItWorksItem}>
            <View style={styles.stepCircle}><Text style={styles.stepNum}>3</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={styles.howTitle}>Earn SIG Tokens</Text>
              <Text style={styles.howDesc}>Earn commission in SIG tokens for every converted referral. Higher tiers = higher rates</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, gap: 12 },
  centered: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: 22, color: Colors.textPrimary, fontFamily: "Inter_700Bold", fontWeight: "700" as const, marginTop: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" as const },
  headerRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 8 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  tierHeader: { alignItems: "center" as const, gap: 8 },
  tierBadge: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, borderWidth: 1, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8 },
  tierName: { fontSize: 18, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  commissionRate: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_500Medium" },
  nextTierRow: { marginTop: 12, gap: 6 },
  progressBarBg: { height: 6, borderRadius: 3, backgroundColor: "rgba(255,255,255,0.08)", overflow: "hidden" as const },
  progressBarFill: { height: "100%", borderRadius: 3 },
  nextTierText: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular", textAlign: "center" as const },
  statsGrid: { flexDirection: "row" as const, flexWrap: "wrap" as const, gap: 8 },
  statCard: { flex: 1, minWidth: "46%" as any, alignItems: "center" as const, gap: 4, padding: 14 },
  statValue: { fontSize: 22, color: Colors.textPrimary, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  statLabel: { fontSize: 11, color: Colors.textTertiary, fontFamily: "Inter_500Medium", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  sectionHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  linkLabel: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", marginBottom: 8 },
  linkRow: { flexDirection: "row" as const, alignItems: "center" as const, backgroundColor: "rgba(0,255,255,0.06)", borderWidth: 1, borderColor: "rgba(0,255,255,0.15)", borderRadius: 10, padding: 12, gap: 8 },
  linkText: { flex: 1, fontSize: 14, color: Colors.primary, fontFamily: "Inter_500Medium" },
  hashLabel: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginTop: 10 },
  hashValue: { color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  hashNote: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 2 },
  payoutRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const },
  payoutLabel: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  payoutAmount: { fontSize: 20, color: Colors.success, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  payoutNote: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular", marginTop: 8 },
  tierRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, paddingVertical: 8, minHeight: 44 },
  tierRowLeft: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8 },
  tierRowName: { fontSize: 15, color: Colors.textPrimary, fontFamily: "Inter_500Medium" },
  currentBadge: { backgroundColor: "rgba(0,255,255,0.12)", borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  currentBadgeText: { fontSize: 10, color: Colors.primary, fontFamily: "Inter_600SemiBold" },
  tierRowRight: { alignItems: "flex-end" as const },
  tierRowRate: { fontSize: 15, color: Colors.textPrimary, fontFamily: "Inter_600SemiBold" },
  tierRowReq: { fontSize: 11, color: Colors.textTertiary, fontFamily: "Inter_400Regular" },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },
  howItWorksItem: { flexDirection: "row" as const, gap: 12, paddingVertical: 8, alignItems: "flex-start" as const },
  stepCircle: { width: 28, height: 28, borderRadius: 14, backgroundColor: "rgba(0,255,255,0.12)", alignItems: "center" as const, justifyContent: "center" as const },
  stepNum: { fontSize: 13, color: Colors.primary, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  howTitle: { fontSize: 14, color: Colors.textPrimary, fontFamily: "Inter_600SemiBold" },
  howDesc: { fontSize: 12, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 18 },
});
