import React, { useState, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { CountdownTimer } from "@/components/CountdownTimer";
import { MOCK_NEWS, FEATURED_APP_IDS } from "@/constants/mock-data";
import { ECOSYSTEM_APPS } from "@/constants/ecosystem-apps";
import { useAuth } from "@/lib/auth-context";
import { useBalance, useShellBalance, useDwcBag, useTransactions } from "@/hooks/useBalance";
import { useWorldNews } from "@/hooks/useWorldNews";
import { useLeaderboard } from "@/hooks/useLeaderboard";
import { useActivityFeed } from "@/hooks/useActivityFeed";
import { EmptyState } from "@/components/EmptyState";
import { Carousel } from "@/components/Carousel";

function QuickAction({ icon, label, onPress, testID }: { icon: string; label: string; onPress: () => void; testID?: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7, transform: [{ scale: 0.95 }] }]}
      testID={testID}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon as any} size={20} color={Colors.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function NewsCard({ item, cardWidth }: { item: typeof MOCK_NEWS[0]; cardWidth?: number }) {
  const categoryColor =
    item.category === "Milestone" ? Colors.primary :
    item.category === "Launch" ? Colors.secondary :
    item.category === "Presale" ? Colors.success :
    Colors.textSecondary;

  return (
    <View style={[styles.newsCardWrapper, cardWidth ? { width: cardWidth } : undefined]}>
      <GlassCard style={{ flex: 1 }} animate={false}>
        {item.image && (
          <View style={styles.newsImageContainer}>
            <Image source={item.image} style={styles.newsImage} resizeMode="cover" />
            <View style={styles.newsImageOverlay} />
          </View>
        )}
        <View style={styles.newsCardBody}>
          <View style={styles.newsCategoryBadge}>
            <Text style={[styles.newsCategoryText, { color: categoryColor }]}>
              {item.category}
            </Text>
          </View>
          <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.newsBody} numberOfLines={2}>{item.body}</Text>
        </View>
      </GlassCard>
    </View>
  );
}

function WorldNewsCard({ item, cardWidth }: { item: { id: string; title: string; summary: string; category: string; source: string; imageUrl: string; publishedAt: string }; cardWidth?: number }) {
  const categoryColor =
    item.category === "Finance" ? Colors.success :
    item.category === "Technology" ? Colors.primary :
    item.category === "Blockchain" ? Colors.secondary :
    item.category === "Energy" ? "#f59e0b" :
    item.category === "Science" ? "#8b5cf6" :
    Colors.textSecondary;

  const timeAgo = getTimeAgo(item.publishedAt);

  return (
    <View style={[styles.worldNewsCardWrapper, cardWidth ? { width: cardWidth } : undefined]}>
      <GlassCard style={{ flex: 1 }} animate={false}>
        {item.imageUrl ? (
          <View style={styles.worldNewsImageContainer}>
            <Image source={{ uri: item.imageUrl }} style={styles.worldNewsImage} resizeMode="cover" />
            <View style={styles.newsImageOverlay} />
          </View>
        ) : null}
        <View style={styles.worldNewsBody}>
          <View style={styles.worldNewsSourceRow}>
            <View style={[styles.worldNewsCategoryDot, { backgroundColor: categoryColor }]} />
            <Text style={styles.worldNewsSource}>{item.source}</Text>
            <Text style={styles.worldNewsTime}>{timeAgo}</Text>
          </View>
          <Text style={styles.worldNewsTitle} numberOfLines={2}>{item.title}</Text>
          <Text style={styles.worldNewsSummary} numberOfLines={2}>{item.summary}</Text>
        </View>
      </GlassCard>
    </View>
  );
}

function FeaturedAppCard({ app, cardWidth }: { app: typeof ECOSYSTEM_APPS[0]; cardWidth?: number }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.featuredAppWrapper, cardWidth ? { width: cardWidth } : undefined, pressed && { opacity: 0.8 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/app-detail", params: { id: String(app.id) } });
      }}
    >
      <GlassCard animate={false}>
        <View style={styles.featuredAppContent}>
          <View style={styles.featuredAppIcon}>
            <Ionicons name={app.icon as any} size={28} color={Colors.primary} />
          </View>
          <Text style={styles.featuredAppName} numberOfLines={1}>{app.name}</Text>
          <Text style={styles.featuredAppHook} numberOfLines={2}>{app.hook}</Text>
          <View style={styles.featuredAppCategoryBadge}>
            <Text style={styles.featuredAppCategory}>{app.category}</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

function ActivityItem({ tx }: { tx: { id: string; type: string; amount: number; asset: string; from: string; txHash: string; createdAt: string } }) {
  const iconName = tx.type === "received" ? "arrow-down" :
    tx.type === "sent" ? "arrow-up" :
    tx.type === "staked" ? "lock-closed" : "cart";
  const iconColor = tx.type === "received" ? Colors.success :
    tx.type === "sent" ? Colors.error :
    tx.type === "staked" ? Colors.secondary : Colors.primary;
  const prefix = tx.type === "received" ? "+" :
    tx.type === "sent" ? "-" : "";
  const dateStr = new Date(tx.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return (
    <View style={styles.activityItem}>
      <View style={[styles.activityIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={iconName as any} size={16} color={iconColor} />
      </View>
      <View style={styles.activityInfo}>
        <Text style={styles.activityType}>
          {tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}
        </Text>
        <Text style={styles.activityFrom}>{tx.from}</Text>
      </View>
      <View style={styles.activityRight}>
        <Text style={[styles.activityAmount, { color: iconColor }]}>
          {prefix}{tx.amount.toLocaleString()} {tx.asset}
        </Text>
        <Text style={styles.activityDate}>{dateStr}</Text>
      </View>
    </View>
  );
}

function getTimeAgo(dateStr: string): string {
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHrs = Math.floor(diffMin / 60);
  if (diffHrs < 24) return `${diffHrs}h ago`;
  const diffDays = Math.floor(diffHrs / 24);
  return `${diffDays}d ago`;
}

function getCSTGreeting(): string {
  const now = new Date();
  const cstOffset = -6;
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const cstMs = utcMs + cstOffset * 3600000;
  const cstDate = new Date(cstMs);
  const hour = cstDate.getHours();
  if (hour >= 5 && hour < 12) return "Good morning";
  if (hour >= 12 && hour < 17) return "Good afternoon";
  return "Good evening";
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { user, isAuthenticated } = useAuth();
  const { data: balance } = useBalance();
  const { data: shells } = useShellBalance();
  const { data: dwcBag } = useDwcBag();
  const { data: transactions } = useTransactions();
  const { data: worldNews } = useWorldNews();
  const { data: leaderboardData } = useLeaderboard();
  const topThree = leaderboardData?.topAffiliates?.slice(0, 3) || [];
  const { data: activityData } = useActivityFeed();
  const feedEvents = activityData?.events || [];

  const featuredApps = ECOSYSTEM_APPS.filter(a => FEATURED_APP_IDS.includes(a.id));
  const contentWidth = isDesktop ? Math.min(width, 720) : width;
  const newsCardWidth = Math.round(contentWidth * 0.82);
  const worldNewsCardWidth = Math.round(contentWidth * 0.82);

  const firstName = user?.firstName || user?.displayName?.split(" ")[0] || user?.username || "Explorer";
  const trustLayerId = user?.trustLayerId || "guest.tlid";
  const sigBalance = balance?.sig || 0;
  const stSigBalance = balance?.stSig || 0;
  const shellBalance = shells || 0;
  const portfolioValue = dwcBag?.currentValue || 0;
  const recentTxs = transactions || [];

  const [greeting, setGreeting] = useState(getCSTGreeting);

  useEffect(() => {
    const interval = setInterval(() => {
      setGreeting(getCSTGreeting());
    }, 60000);
    return () => clearInterval(interval);
  }, []);

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
            maxWidth: isDesktop ? 720 : undefined,
            alignSelf: isDesktop ? "center" as const : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={styles.greeting} testID="home-greeting">{greeting},</Text>
            <GradientText text={firstName} style={styles.username} />
          </View>
          <Pressable
            style={({ pressed }) => [styles.trustIdBadge, pressed && { opacity: 0.7 }]}
            onPress={() => {
              if (!isAuthenticated) {
                router.push("/login");
              }
            }}
          >
            <View style={styles.trustIdIconWrap}>
              <Ionicons name="shield-checkmark" size={12} color={Colors.primary} />
            </View>
            <Text style={styles.trustIdText}>
              {isAuthenticated ? trustLayerId : "Sign In"}
            </Text>
          </Pressable>
        </View>

        <GlassCard glow delay={100}>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Portfolio Value</Text>
            <View style={styles.balanceLiveDot} />
          </View>
          <Text style={styles.balanceValue}>
            ${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={styles.balanceTokenIcon}>
                <Ionicons name="diamond-outline" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.balanceItemLabel}>SIG</Text>
              <Text style={styles.balanceItemValue}>
                {sigBalance.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <View style={styles.balanceTokenIcon}>
                <Ionicons name="ellipse-outline" size={14} color={Colors.secondary} />
              </View>
              <Text style={styles.balanceItemLabel}>Shells</Text>
              <Text style={styles.balanceItemValue}>
                {shellBalance.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <View style={styles.balanceTokenIcon}>
                <Ionicons name="lock-closed-outline" size={14} color={Colors.success} />
              </View>
              <Text style={styles.balanceItemLabel}>stSIG</Text>
              <Text style={styles.balanceItemValue}>
                {stSigBalance.toLocaleString()}
              </Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.quickActionsRow}>
          <QuickAction icon="cart" label="Buy Shells" onPress={() => router.push("/(tabs)/wallet")} testID="home-quick-buy" />
          <QuickAction icon="send" label="Send SIG" onPress={() => router.push("/(tabs)/wallet")} testID="home-quick-send" />
          <QuickAction icon="scan" label="Scan" onPress={() => {}} testID="home-quick-scan" />
          <QuickAction icon="git-compare" label="Bridge" onPress={() => {}} testID="home-quick-bridge" />
        </View>

        <View style={styles.sectionHeader}>
          <GradientText text="Latest News" style={styles.sectionTitle} />
        </View>
        <View style={styles.carouselBreakout}>
          <Carousel itemWidth={newsCardWidth} testID="news-carousel">
            {MOCK_NEWS.map((item) => (
              <NewsCard key={item.id} item={item} cardWidth={newsCardWidth} />
            ))}
          </Carousel>
        </View>

        <View style={styles.sectionHeader}>
          <Ionicons name="globe" size={18} color={Colors.primary} />
          <GradientText text="World News" style={styles.sectionTitle} />
        </View>
        <View style={styles.carouselBreakout}>
          <Carousel itemWidth={worldNewsCardWidth} testID="world-news-carousel">
            {(worldNews || []).map((item) => (
              <WorldNewsCard key={item.id} item={item} cardWidth={worldNewsCardWidth} />
            ))}
          </Carousel>
        </View>

        <View style={styles.sectionHeader}>
          <GradientText text="Featured Apps" style={styles.sectionTitle} />
          <Pressable onPress={() => router.push("/(tabs)/explore")} testID="home-see-all-apps">
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        <View style={styles.carouselBreakout}>
          <Carousel itemWidth={Math.round(contentWidth * 0.42)} testID="featured-apps-carousel">
            {featuredApps.map((app) => (
              <FeaturedAppCard key={app.id} app={app} cardWidth={Math.round(contentWidth * 0.42)} />
            ))}
          </Carousel>
        </View>

        <View style={styles.sectionHeader}>
          <GradientText text="Recent Activity" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          {recentTxs.length > 0 ? (
            recentTxs.slice(0, 5).map((tx, i) => (
              <React.Fragment key={tx.id}>
                <ActivityItem tx={tx} />
                {i < Math.min(recentTxs.length, 5) - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyActivity}>
              <Ionicons name="receipt-outline" size={24} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No recent activity</Text>
            </View>
          )}
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Ecosystem Activity" style={styles.sectionTitle} />
          <Pressable onPress={() => router.push("/leaderboard")} hitSlop={8} testID="home-view-leaderboard">
            <Text style={styles.viewAllText}>View All</Text>
          </Pressable>
        </View>
        <GlassCard>
          {feedEvents.length > 0 ? (
            feedEvents.slice(0, 5).map((event, i) => (
              <React.Fragment key={`feed-${i}`}>
                <View style={styles.feedEventRow}>
                  <View style={styles.feedEventIcon}>
                    <Ionicons
                      name={
                        event.category === "auth-register" ? "person-add" :
                        event.category === "wallet-send" ? "arrow-up" :
                        event.category === "wallet-swap" ? "swap-horizontal" :
                        event.category === "staking-stake" ? "lock-closed" :
                        event.category === "staking-unstake" ? "lock-open" :
                        event.category === "stripe-connect" ? "card" :
                        event.category === "purchase" ? "cart" :
                        "pulse" as any
                      }
                      size={16}
                      color={
                        event.category === "auth-register" ? Colors.success :
                        event.category.startsWith("staking") ? Colors.primary :
                        Colors.secondary
                      }
                    />
                  </View>
                  <View style={styles.feedEventInfo}>
                    <Text style={styles.feedEventText} numberOfLines={1}>
                      <Text style={styles.feedEventUser}>{event.user}</Text>{" "}
                      {event.description}
                    </Text>
                    <Text style={styles.feedEventTime}>{event.timeAgo}</Text>
                  </View>
                </View>
                {i < Math.min(feedEvents.length, 5) - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          ) : (
            <EmptyState icon="pulse-outline" title="No ecosystem activity yet" subtitle="Activity will appear here as users interact with the platform" />
          )}
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="people" size={18} color={Colors.primary} />
          <GradientText text="Community" style={styles.sectionTitle} />
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/leaderboard");
            }}
            testID="home-community-view-all"
          >
            <Text style={styles.seeAll}>View All</Text>
          </Pressable>
        </View>
        <GlassCard>
          {topThree.length > 0 ? (
            topThree.map((entry, i) => {
              const rankColor = entry.rank === 1 ? "#FFD700" : entry.rank === 2 ? "#C0C0C0" : "#CD7F32";
              return (
                <React.Fragment key={entry.rank}>
                  <Pressable
                    style={({ pressed }) => [styles.communityItem, pressed && { opacity: 0.7 }]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      router.push({ pathname: "/user-profile", params: { username: entry.username } });
                    }}
                    testID={`home-community-${entry.rank}`}
                  >
                    <View style={styles.communityRank}>
                      <Ionicons name="trophy" size={16} color={rankColor} />
                    </View>
                    <View style={styles.communityAvatar}>
                      <Text style={styles.communityAvatarText}>
                        {entry.username.slice(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.communityInfo}>
                      <Text style={styles.communityUsername} numberOfLines={1}>{entry.username}</Text>
                      <Text style={styles.communityTier}>{entry.tier}</Text>
                    </View>
                    <Text style={styles.communityScore}>{entry.convertedReferrals}</Text>
                  </Pressable>
                  {i < topThree.length - 1 && <View style={styles.divider} />}
                </React.Fragment>
              );
            })
          ) : (
            <EmptyState icon="people-outline" title="No community data yet" subtitle="Join the affiliate program to appear here" />
          )}
        </GlassCard>

        <View style={{ marginTop: 20 }}>
          <CountdownTimer />
        </View>
      </ScrollView>

      <Pressable
        style={({ pressed }) => [
          styles.aiFloatingButton,
          { bottom: 100 + (Platform.OS === "web" ? 34 : 0) },
          pressed && { opacity: 0.8, transform: [{ scale: 0.95 }] },
        ]}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          router.push("/ai-agent");
        }}
      >
        <View style={styles.aiFloatingInner}>
          <Ionicons name="sparkles" size={24} color={Colors.primary} />
        </View>
      </Pressable>
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
    gap: 8,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 20,
    paddingLeft: 44,
  },
  headerLeft: {
    flex: 1,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    marginBottom: 2,
  },
  username: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  trustIdBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.12)",
    marginTop: 4,
  },
  trustIdIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "rgba(0,255,255,0.12)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  trustIdText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  balanceHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 6,
  },
  balanceLabel: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.8,
    textTransform: "uppercase" as const,
  },
  balanceLiveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.success,
  },
  balanceValue: {
    fontSize: 38,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    marginBottom: 20,
    letterSpacing: -1,
  },
  balanceRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    paddingVertical: 14,
    marginHorizontal: -4,
  },
  balanceItem: {
    alignItems: "center" as const,
    flex: 1,
    gap: 2,
  },
  balanceTokenIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 4,
  },
  balanceItemLabel: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  balanceItemValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  balanceDivider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  quickActionsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    marginVertical: 16,
  },
  quickAction: {
    alignItems: "center" as const,
    gap: 8,
  },
  quickActionIcon: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  quickActionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  sectionHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginTop: 20,
    marginBottom: 10,
    gap: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    flex: 1,
    letterSpacing: 0.2,
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  carouselBreakout: {
    marginHorizontal: -16,
  },
  carouselContent: {
    paddingRight: 16,
    gap: 12,
  },
  newsCardWrapper: {
    width: 276,
    minHeight: 240,
  },
  newsImageContainer: {
    height: 120,
    borderRadius: 10,
    overflow: "hidden" as const,
    marginBottom: 10,
    marginHorizontal: -16,
    marginTop: -16,
  },
  newsImage: {
    width: "100%",
    height: "100%",
  },
  newsImageOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(12,18,36,0.25)",
  },
  newsCardBody: {
    gap: 4,
  },
  newsCategoryBadge: {
    marginBottom: 4,
  },
  newsCategoryText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  newsTitle: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 4,
  },
  newsBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  worldNewsCardWrapper: {
    width: 296,
    minHeight: 250,
  },
  worldNewsImageContainer: {
    height: 130,
    borderRadius: 10,
    overflow: "hidden" as const,
    marginBottom: 10,
    marginHorizontal: -16,
    marginTop: -16,
  },
  worldNewsImage: {
    width: "100%",
    height: "100%",
  },
  worldNewsBody: {
    gap: 4,
  },
  worldNewsSourceRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 4,
  },
  worldNewsCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  worldNewsSource: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    flex: 1,
  },
  worldNewsTime: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  worldNewsTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    lineHeight: 20,
  },
  worldNewsSummary: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
  },
  featuredAppWrapper: {
    width: 156,
    minHeight: 160,
  },
  featuredAppContent: {
    alignItems: "center" as const,
  },
  featuredAppIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.12)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 10,
  },
  featuredAppName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center" as const,
    marginBottom: 4,
  },
  featuredAppHook: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    marginBottom: 8,
  },
  featuredAppCategoryBadge: {
    backgroundColor: "rgba(147,51,234,0.12)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  featuredAppCategory: {
    fontSize: 10,
    color: Colors.secondary,
    fontFamily: "Inter_500Medium",
  },
  activityItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 4,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  activityInfo: {
    flex: 1,
  },
  activityType: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
  },
  activityFrom: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  activityRight: {
    alignItems: "flex-end" as const,
  },
  activityAmount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  activityDate: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  emptyActivity: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 20,
    gap: 8,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  viewAllText: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  feedEventRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 8,
  },
  feedEventIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  feedEventInfo: {
    flex: 1,
    gap: 2,
  },
  feedEventText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  feedEventUser: {
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  feedEventTime: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  communityItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    paddingVertical: 8,
  },
  communityRank: {
    width: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  communityAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(0,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  communityAvatarText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
  },
  communityInfo: {
    flex: 1,
  },
  communityUsername: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  communityTier: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  communityScore: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  aiFloatingButton: {
    position: "absolute" as const,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    zIndex: 100,
  },
  aiFloatingInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "rgba(0,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(0,255,255,0.3)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
});
