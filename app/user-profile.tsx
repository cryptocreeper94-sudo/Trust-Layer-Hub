import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Ionicons, MaterialCommunityIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { usePublicProfile } from "@/hooks/usePublicProfile";
import Colors from "@/constants/colors";

const TIER_COLORS: Record<string, string> = {
  bronze: "#cd7f32",
  silver: "#c0c0c0",
  gold: "#ffd700",
  platinum: "#e5e4e2",
  diamond: "#b9f2ff",
};

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function formatDate(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

export default function UserProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { data: profile, isLoading } = usePublicProfile(username || "");

  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const topInset = insets.top + webTopInset;

  const tierColor =
    TIER_COLORS[(profile?.affiliateTier || "").toLowerCase()] || Colors.primary;

  return (
    <View style={styles.container}>
      <BackgroundGlow />

      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <Pressable
          testID="user-profile-back"
          onPress={() => router.back()}
          hitSlop={12}
        >
          <Ionicons name="close" size={26} color={Colors.textPrimary} />
        </Pressable>
        <Text style={styles.headerTitle}>Trust Profile</Text>
        <View style={{ width: 26 }} />
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : !profile ? (
        <View style={styles.loadingContainer}>
          <Ionicons
            name="person-outline"
            size={48}
            color={Colors.textTertiary}
          />
          <Text style={styles.notFoundText}>Profile not found</Text>
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + 40 },
          ]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.avatarSection}>
            <View style={styles.avatarOuter}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary, Colors.primary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.avatarGradientRing}
              />
              <View style={styles.avatarRing}>
                <View style={styles.avatar}>
                  <View style={styles.avatarGlow} />
                  <Text style={styles.avatarText}>
                    {getInitials(profile.username)}
                  </Text>
                </View>
              </View>
            </View>

            <GradientText
              text={profile.username}
              style={styles.username}
            />

            <View style={styles.tlidBadge} testID="user-profile-tlid">
              <LinearGradient
                colors={["rgba(0,255,255,0.12)", "rgba(147,51,234,0.08)"]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={StyleSheet.absoluteFill}
              />
              <MaterialCommunityIcons
                name="shield-check"
                size={14}
                color={Colors.primary}
              />
              <Text style={styles.tlidText}>{profile.tlid}</Text>
            </View>

            <Text style={styles.memberSince}>
              Member since {formatDate(profile.memberSince)}
            </Text>
          </View>

          <GlassCard style={styles.statsCard}>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.hallmarkCount}</Text>
                <Text style={styles.statLabel}>Hallmarks</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <Text style={styles.statValue}>{profile.stampCount}</Text>
                <Text style={styles.statLabel}>Trust Stamps</Text>
              </View>
              <View style={styles.statDivider} />
              <View style={styles.statItem}>
                <View style={styles.verifiedRow}>
                  <Ionicons
                    name={
                      profile.emailVerified
                        ? "checkmark-circle"
                        : "close-circle"
                    }
                    size={18}
                    color={
                      profile.emailVerified ? Colors.success : Colors.error
                    }
                  />
                </View>
                <Text style={styles.statLabel}>
                  {profile.emailVerified ? "Verified" : "Unverified"}
                </Text>
              </View>
            </View>
          </GlassCard>

          <GlassCard style={styles.tierCard}>
            <View style={styles.tierRow}>
              <View style={styles.tierIconWrap}>
                <MaterialCommunityIcons
                  name="medal"
                  size={28}
                  color={tierColor}
                />
              </View>
              <View style={styles.tierInfo}>
                <Text style={styles.tierLabel}>Affiliate Tier</Text>
                <Text style={[styles.tierValue, { color: tierColor }]}>
                  {(profile.affiliateTier || "None").toUpperCase()}
                </Text>
              </View>
              <View style={styles.referralBadge}>
                <Text style={styles.referralCount}>
                  {profile.referralCount}
                </Text>
                <Text style={styles.referralLabel}>Referrals</Text>
              </View>
            </View>
          </GlassCard>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  headerTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 16,
  },
  notFoundText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  avatarSection: {
    alignItems: "center" as const,
    marginBottom: 28,
  },
  avatarOuter: {
    width: 104,
    height: 104,
    borderRadius: 52,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  avatarGradientRing: {
    position: "absolute" as const,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 52,
    opacity: 0.6,
  },
  avatarRing: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: Colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarGlow: {
    position: "absolute" as const,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "rgba(0,255,255,0.06)",
  },
  avatarText: {
    fontSize: 32,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  username: {
    fontSize: 26,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  tlidBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    overflow: "hidden" as const,
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 20,
    gap: 6,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
  },
  tlidText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    letterSpacing: 0.5,
  },
  memberSince: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  statsCard: {
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-around" as const,
  },
  statItem: {
    alignItems: "center" as const,
    flex: 1,
    gap: 4,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  verifiedRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  tierCard: {
    marginBottom: 16,
  },
  tierRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
  },
  tierIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  tierInfo: {
    flex: 1,
    gap: 2,
  },
  tierLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  tierValue: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  referralBadge: {
    alignItems: "center" as const,
    backgroundColor: "rgba(0,255,255,0.06)",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.12)",
  },
  referralCount: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  referralLabel: {
    fontSize: 10,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
});
