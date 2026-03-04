import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Switch,
  Alert,
  Linking,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { GradientButton } from "@/components/GradientButton";
import { useAuth } from "@/lib/auth-context";
import { useMembership, useSubscriptionStatus } from "@/hooks/useMembership";
import { useHallmarkTimeline } from "@/hooks/useHallmarkTimeline";
import { EmptyState } from "@/components/EmptyState";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  toggle,
  toggleValue,
  onToggle,
  testID,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
  testID?: string;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingRow, !toggle && pressed && { opacity: 0.7 }]}
      onPress={toggle ? undefined : onPress}
      disabled={!!toggle}
      testID={testID}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(0,255,255,0.3)" }}
          thumbColor={toggleValue ? Colors.primary : Colors.textMuted}
        />
      ) : (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      )}
    </Pressable>
  );
}

function LinkedAppItem({ name, connected }: { name: string; connected: boolean }) {
  return (
    <View style={styles.linkedApp}>
      <Text style={styles.linkedAppName}>{name}</Text>
      <View style={[styles.linkedStatus, connected && styles.linkedStatusActive]}>
        <Ionicons
          name={connected ? "checkmark-circle" : "ellipse-outline"}
          size={16}
          color={connected ? Colors.success : Colors.textMuted}
        />
        <Text style={[styles.linkedStatusText, connected && { color: Colors.success }]}>
          {connected ? "Connected" : "Not linked"}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { user, isAuthenticated, logout } = useAuth();
  const { data: membership } = useMembership();
  const { data: subscription } = useSubscriptionStatus();
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);
  const { data: timelineData } = useHallmarkTimeline();
  const timeline = timelineData?.timeline || [];

  const displayName = user?.displayName || user?.username || "Trust User";
  const username = user?.username || "user";
  const email = user?.email || "";
  const trustLayerId = membership?.trustLayerId || user?.trustLayerId || "";
  const membershipStatus = membership?.membershipStatus || "active";
  const voidTier = membership?.voidTier || "Explorer";
  const guardianScore = membership?.guardianScore || 0;
  const avatarInitials = displayName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "TL";

  const scoreColor = guardianScore >= 90 ? Colors.success :
    guardianScore >= 70 ? Colors.warning : Colors.error;

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: async () => {
          await logout();
          router.replace("/login");
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: 100,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={isDesktop ? { maxWidth: 720, width: "100%", alignSelf: "center" as const } : undefined}>
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={["rgba(0,255,255,0.15)", "rgba(147,51,234,0.15)"]}
            style={styles.avatarGradient}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{avatarInitials}</Text>
            </View>
          </LinearGradient>
          <Text style={styles.displayName}>{displayName}</Text>
          <View style={styles.trustIdRow}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.trustId}>{trustLayerId}</Text>
          </View>
          {membershipStatus === "active" && (
            <View style={styles.activeBadge}>
              <Ionicons name="checkmark-circle" size={12} color={Colors.success} />
              <Text style={styles.activeBadgeText}>Active Member</Text>
            </View>
          )}
        </View>

        {!isAuthenticated && (
          <GradientButton
            title="Sign In to Your Account"
            onPress={() => router.push("/login")}
            style={{ marginBottom: 8 }}
          />
        )}

        <View style={styles.statsRow}>
          <GlassCard glow style={styles.statCard}>
            <Text style={styles.statLabel}>THE VOID</Text>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>{voidTier}</Text>
            <Text style={styles.statSub}>Membership Tier</Text>
          </GlassCard>
          <GlassCard glow style={styles.statCard}>
            <Text style={styles.statLabel}>Guardian Score</Text>
            <Text style={[styles.statValue, { color: scoreColor }]}>{guardianScore}</Text>
            <Text style={styles.statSub}>Security Rating</Text>
          </GlassCard>
        </View>

        {subscription && subscription.tier !== "free" && (
          <>
            <View style={styles.sectionHeader}>
              <GradientText text="Subscription" style={styles.sectionTitle} />
            </View>
            <GlassCard glow>
              <View style={styles.subscriptionRow}>
                <Ionicons name="diamond" size={20} color={Colors.primary} />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.subscriptionTier}>
                    {subscription.tier.replace(/_/g, " ").replace(/\b\w/g, (l: string) => l.toUpperCase())}
                  </Text>
                  <Text style={styles.subscriptionActive}>
                    {subscription.active ? "Active" : "Inactive"}
                  </Text>
                </View>
              </View>
            </GlassCard>
          </>
        )}

        <View style={styles.sectionHeader}>
          <GradientText text="Identity" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Trust Layer ID</Text>
            <Text style={styles.identityValue}>{trustLayerId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Username</Text>
            <Text style={styles.identityValue}>{username}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Email</Text>
            <Text style={styles.identityValue}>{email}</Text>
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Settings" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <SettingRow
            icon="notifications"
            label="Notifications"
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
            testID="setting-notifications"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="finger-print"
            label="Biometric Auth"
            toggle
            toggleValue={biometrics}
            onToggle={setBiometrics}
            testID="setting-biometrics"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="chatbubble-ellipses"
            label="SMS Security (2FA)"
            value={user?.twoFactorEnabled ? "Enabled" : "Set Up"}
            onPress={() => router.push("/sms-optin")}
            testID="setting-sms-2fa"
          />
          <View style={styles.divider} />
          <SettingRow icon="lock-closed" label="Security PIN" value="Set" onPress={() => {}} testID="setting-security-pin" />
          <View style={styles.divider} />
          <SettingRow icon="language" label="Language" value="English" onPress={() => {}} testID="setting-language" />
          <View style={styles.divider} />
          <SettingRow icon="moon" label="Display" value="Dark" onPress={() => {}} testID="setting-display" />
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Business & Affiliate" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <SettingRow
            icon="card"
            label="Stripe Dashboard"
            value="Business"
            onPress={() => router.push("/stripe-dashboard")}
            testID="setting-stripe"
          />
          <View style={styles.divider} />
          <SettingRow
            icon="people"
            label="Affiliate Program"
            value="Earn SIG"
            onPress={() => router.push("/affiliate")}
            testID="setting-affiliate"
          />
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Linked Apps" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <LinkedAppItem name="TrustVault" connected />
          <View style={styles.divider} />
          <LinkedAppItem name="THE VOID" connected />
          <View style={styles.divider} />
          <LinkedAppItem name="Guardian Scanner" connected />
          <View style={styles.divider} />
          <LinkedAppItem name="TradeWorks AI" connected={false} />
          <View style={styles.divider} />
          <LinkedAppItem name="Signal Chat" connected />
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Trust Timeline" style={styles.sectionTitle} />
          <Pressable onPress={() => router.push("/hallmark-detail")} hitSlop={8}>
            <Text style={styles.viewAllLink}>View All</Text>
          </Pressable>
        </View>
        <GlassCard>
          {timeline.length > 0 ? (
            <View style={styles.timelineContainer}>
              {timeline.slice(0, 5).map((entry, i) => {
                const isLast = i === Math.min(timeline.length, 5) - 1;
                const entryDate = new Date(entry.createdAt);
                const timeStr = entryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
                const iconName =
                  entry.type === "hallmark" ? "shield-checkmark" :
                  entry.category === "auth-register" ? "person-add" :
                  entry.category === "wallet-send" ? "arrow-up" :
                  entry.category === "staking-stake" ? "lock-closed" :
                  entry.category === "stripe-connect" ? "card" :
                  "checkmark-circle";
                return (
                  <View key={`tl-${i}`} style={styles.timelineRow}>
                    <View style={styles.timelineDotCol}>
                      <View style={[styles.timelineDot, entry.type === "hallmark" && styles.timelineDotHallmark]} />
                      {!isLast && <View style={styles.timelineLine} />}
                    </View>
                    <View style={styles.timelineContent}>
                      <View style={styles.timelineIconRow}>
                        <Ionicons name={iconName as any} size={14} color={entry.type === "hallmark" ? Colors.primary : Colors.secondary} />
                        <Text style={styles.timelineCategory}>
                          {entry.type === "hallmark" ? entry.identifier : entry.category.replace(/-/g, " ")}
                        </Text>
                        <Text style={styles.timelineDate}>{timeStr}</Text>
                      </View>
                      {entry.detail ? <Text style={styles.timelineDetail} numberOfLines={1}>{entry.detail}</Text> : null}
                      <Text style={styles.timelineHash}>{entry.dataHash.slice(0, 12)}...</Text>
                    </View>
                  </View>
                );
              })}
            </View>
          ) : (
            <EmptyState icon="time-outline" title="No trust records yet" subtitle="Your hallmarks and trust stamps will appear here" />
          )}
        </GlassCard>

        {isAuthenticated && (
          <Pressable
            style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.7 }]}
            onPress={handleSignOut}
            testID="sign-out-button"
          >
            <Ionicons name="log-out-outline" size={18} color={Colors.error} />
            <Text style={styles.signOutText}>Sign Out</Text>
          </Pressable>
        )}

        <View style={styles.footerSection}>
          <Pressable
            style={styles.hallmarkBadge}
            onPress={() => router.push("/hallmark-detail")}
            testID="genesis-hallmark-link"
          >
            <View style={styles.hallmarkIcon}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            </View>
            <View style={styles.hallmarkInfo}>
              <Text style={styles.hallmarkLabel}>Genesis Hallmark</Text>
              <Text style={styles.hallmarkId}>TH-00000001</Text>
            </View>
            <Ionicons name="chevron-forward" size={14} color={Colors.textTertiary} />
          </Pressable>
          <View style={styles.legalRow}>
            <Pressable onPress={() => router.push("/terms")}>
              <Text style={styles.footerLink}>Terms of Service</Text>
            </Pressable>
            <Text style={styles.legalDot}>{"\u00B7"}</Text>
            <Pressable onPress={() => router.push("/privacy")}>
              <Text style={styles.footerLink}>Privacy Policy</Text>
            </Pressable>
          </View>
          <Text style={styles.footer}>Trust Layer Hub v1.0.0</Text>
          <Pressable onPress={() => Linking.openURL("https://trusthub.tlid.io")}>
            <Text style={styles.footerLink}>DarkWave Studios LLC</Text>
          </Pressable>
          <Text style={styles.copyright}>&copy; 2026 DarkWave Studios LLC. All rights reserved.</Text>
          <Pressable
            style={styles.shieldRow}
            onPress={() => Linking.openURL("https://trustshield.tech")}
          >
            <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
            <Text style={styles.shieldText}>Protected by TrustShield.tech</Text>
          </Pressable>
        </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 12,
  },
  profileHeader: {
    alignItems: "center" as const,
    marginBottom: 12,
  },
  avatarGradient: {
    width: 92,
    height: 92,
    borderRadius: 46,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 14,
  },
  avatar: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: Colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarText: {
    fontSize: 30,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  displayName: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  trustIdRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginTop: 6,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  trustId: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  activeBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 8,
    backgroundColor: "rgba(16,185,129,0.08)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  activeBadgeText: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: "Inter_500Medium",
  },
  statsRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginVertical: 4,
  },
  statSub: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  subscriptionRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
  },
  subscriptionTier: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  subscriptionActive: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: "Inter_400Regular",
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  identityRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 4,
  },
  identityLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  identityValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  settingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 10,
    minHeight: 48,
  },
  settingIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  settingRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  settingValue: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  linkedApp: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
    minHeight: 44,
  },
  linkedAppName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
  },
  linkedStatus: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  linkedStatusActive: {},
  linkedStatusText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  signOutButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  signOutText: {
    fontSize: 16,
    color: Colors.error,
    fontFamily: "Inter_600SemiBold",
  },
  footerSection: {
    alignItems: "center" as const,
    marginTop: 24,
    gap: 6,
  },
  footer: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
    textAlign: "center" as const,
    textDecorationLine: "underline" as const,
  },
  copyright: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  shieldRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 2,
  },
  shieldText: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline" as const,
  },
  legalRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 8,
  },
  legalDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  hallmarkBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.12)",
    marginBottom: 16,
  },
  hallmarkIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  hallmarkInfo: {
    flex: 1,
  },
  hallmarkLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  hallmarkId: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    letterSpacing: 0.5,
  },
  viewAllLink: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  timelineContainer: {
    gap: 0,
  },
  timelineRow: {
    flexDirection: "row" as const,
    gap: 14,
  },
  timelineDotCol: {
    alignItems: "center" as const,
    width: 18,
  },
  timelineDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.secondary,
    marginTop: 4,
    borderWidth: 2,
    borderColor: "rgba(147,51,234,0.3)",
  },
  timelineDotHallmark: {
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "rgba(0,255,255,0.35)",
  },
  timelineLine: {
    flex: 1,
    width: 1.5,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 3,
  },
  timelineContent: {
    flex: 1,
    paddingBottom: 16,
  },
  timelineIconRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  timelineCategory: {
    flex: 1,
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "capitalize" as const,
    letterSpacing: 0.2,
  },
  timelineDate: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  timelineDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 3,
    lineHeight: 17,
  },
  timelineHash: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    marginTop: 3,
    letterSpacing: 0.5,
  },
});
