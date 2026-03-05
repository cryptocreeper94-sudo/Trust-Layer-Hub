import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  ActivityIndicator,
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
import { EmptyState } from "@/components/EmptyState";
import { useLeaderboard } from "@/hooks/useLeaderboard";

type TabKey = "affiliates" | "stakers" | "active";

const TABS: { key: TabKey; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { key: "affiliates", label: "Top Affiliates", icon: "people" },
  { key: "stakers", label: "Top Stakers", icon: "lock-closed" },
  { key: "active", label: "Most Active", icon: "flash" },
];

function getRankColor(rank: number): string {
  if (rank === 1) return "#FFD700";
  if (rank === 2) return "#C0C0C0";
  if (rank === 3) return "#CD7F32";
  return Colors.textTertiary;
}

function getRankIcon(rank: number): keyof typeof Ionicons.glyphMap {
  if (rank <= 3) return "trophy";
  return "ellipse";
}

function getTierColor(tier: string): string {
  switch (tier?.toLowerCase()) {
    case "platinum": return "#E5E4E2";
    case "gold": return "#FFD700";
    case "silver": return "#C0C0C0";
    case "bronze": return "#CD7F32";
    default: return Colors.textTertiary;
  }
}

function getInitials(username: string): string {
  return username.slice(0, 2).toUpperCase();
}

function LeaderboardItem({
  rank,
  username,
  memberSince,
  rightLabel,
  rightValue,
  tier,
}: {
  rank: number;
  username: string;
  memberSince: string;
  rightLabel: string;
  rightValue: string | number;
  tier?: string;
}) {
  const rankColor = getRankColor(rank);
  const isTopThree = rank <= 3;
  const memberDate = new Date(memberSince).toLocaleDateString("en-US", {
    month: "short",
    year: "numeric",
  });

  return (
    <Pressable
      style={({ pressed }) => [
        styles.listItem,
        isTopThree && styles.listItemHighlighted,
        pressed && styles.listItemPressed,
      ]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/user-profile", params: { username } });
      }}
      testID={`leaderboard-item-${rank}`}
    >
      {isTopThree && (
        <LinearGradient
          colors={[`${rankColor}15`, "transparent"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
      <View style={[styles.rankBadge, isTopThree && styles.rankBadgeTop]}>
        <Ionicons
          name={getRankIcon(rank)}
          size={isTopThree ? 22 : 8}
          color={rankColor}
        />
        {!isTopThree && (
          <Text style={[styles.rankNumber, { color: Colors.textSecondary }]}>
            {rank}
          </Text>
        )}
      </View>

      <View style={styles.avatarWrap}>
        {isTopThree && (
          <LinearGradient
            colors={[rankColor, `${rankColor}40`]}
            style={styles.avatarGradientRing}
          />
        )}
        <View style={[styles.avatar, isTopThree && { borderColor: rankColor, borderWidth: 2 }]}>
          <Text style={[styles.avatarText, isTopThree && { color: rankColor }]}>{getInitials(username)}</Text>
        </View>
      </View>

      <View style={styles.userInfo}>
        <View style={styles.usernameRow}>
          <Text style={styles.username} numberOfLines={1}>{username}</Text>
          {tier && (
            <View style={[styles.tierBadge, { borderColor: getTierColor(tier), backgroundColor: `${getTierColor(tier)}10` }]}>
              <Text style={[styles.tierText, { color: getTierColor(tier) }]}>
                {tier}
              </Text>
            </View>
          )}
        </View>
        <Text style={styles.memberSince}>Since {memberDate}</Text>
      </View>

      <View style={styles.scoreContainer}>
        <Text style={[styles.scoreValue, isTopThree && { color: rankColor }]}>{rightValue}</Text>
        <Text style={styles.scoreLabel}>{rightLabel}</Text>
      </View>
    </Pressable>
  );
}

export default function LeaderboardScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [activeTab, setActiveTab] = useState<TabKey>("affiliates");
  const { data, isLoading } = useLeaderboard();

  const renderList = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    if (!data) {
      return <EmptyState icon="podium-outline" title="Loading leaderboard..." />;
    }

    if (activeTab === "affiliates") {
      const items = data.topAffiliates || [];
      if (items.length === 0) {
        return <EmptyState icon="people-outline" title="No affiliates yet" subtitle="Be the first to join the affiliate program" />;
      }
      return items.map((entry) => (
        <LeaderboardItem
          key={entry.rank}
          rank={entry.rank}
          username={entry.username}
          memberSince={entry.memberSince}
          rightLabel="referrals"
          rightValue={entry.convertedReferrals}
          tier={entry.tier}
        />
      ));
    }

    if (activeTab === "stakers") {
      const items = data.topStakers || [];
      if (items.length === 0) {
        return <EmptyState icon="lock-closed-outline" title="No stakers yet" subtitle="Stake SIG to appear on the leaderboard" />;
      }
      return items.map((entry) => (
        <LeaderboardItem
          key={entry.rank}
          rank={entry.rank}
          username={entry.username}
          memberSince={entry.memberSince}
          rightLabel="stakes"
          rightValue={entry.stakeActions}
        />
      ));
    }

    const items = data.mostActive || [];
    if (items.length === 0) {
      return <EmptyState icon="flash-outline" title="No activity yet" subtitle="Earn trust stamps to climb the ranks" />;
    }
    return items.map((entry) => (
      <LeaderboardItem
        key={entry.rank}
        rank={entry.rank}
        username={entry.username}
        memberSince={entry.memberSince}
        rightLabel="stamps"
        rightValue={entry.stampCount}
      />
    ));
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
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
            testID="leaderboard-back"
          >
            <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <GradientText text="Leaderboard" style={styles.headerTitle} />
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.tabContainer}>
          {TABS.map((tab) => (
            <Pressable
              key={tab.key}
              style={[
                styles.tab,
                activeTab === tab.key && styles.tabActive,
              ]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setActiveTab(tab.key);
              }}
              testID={`leaderboard-tab-${tab.key}`}
            >
              <Ionicons
                name={tab.icon}
                size={16}
                color={activeTab === tab.key ? Colors.primary : Colors.textTertiary}
              />
              <Text
                style={[
                  styles.tabLabel,
                  activeTab === tab.key && styles.tabLabelActive,
                ]}
                numberOfLines={1}
              >
                {tab.label}
              </Text>
            </Pressable>
          ))}
        </View>

        <GlassCard>
          <View style={styles.listContainer}>
            {renderList()}
          </View>
        </GlassCard>
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
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  tabContainer: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    paddingVertical: 11,
    paddingHorizontal: 8,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tabActive: {
    backgroundColor: "rgba(0,255,255,0.1)",
    borderColor: "rgba(0,255,255,0.25)",
  },
  tabLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
  },
  tabLabelActive: {
    color: Colors.primary,
  },
  listContainer: {
    gap: 2,
  },
  loadingContainer: {
    paddingVertical: 40,
    alignItems: "center" as const,
  },
  listItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 14,
    paddingHorizontal: 10,
    borderRadius: 14,
    gap: 12,
    overflow: "hidden" as const,
    borderWidth: 1,
    borderColor: "transparent",
    marginBottom: 4,
  },
  listItemHighlighted: {
    backgroundColor: "rgba(255,255,255,0.03)",
    borderColor: "rgba(255,255,255,0.06)",
  },
  listItemPressed: {
    backgroundColor: "rgba(0,255,255,0.04)",
  },
  rankBadge: {
    width: 32,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  rankBadgeTop: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  rankNumber: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  avatarWrap: {
    position: "relative" as const,
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarGradientRing: {
    position: "absolute" as const,
    top: -1,
    left: -1,
    right: -1,
    bottom: -1,
    borderRadius: 23,
    opacity: 0.5,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  userInfo: {
    flex: 1,
  },
  usernameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  username: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    flexShrink: 1,
  },
  tierBadge: {
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tierText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
  },
  memberSince: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  scoreContainer: {
    alignItems: "flex-end" as const,
  },
  scoreValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  scoreLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
});
