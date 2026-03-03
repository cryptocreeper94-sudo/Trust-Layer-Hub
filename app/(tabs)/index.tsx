import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
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
import { CountdownTimer } from "@/components/CountdownTimer";
import { MOCK_USER, MOCK_BALANCE, MOCK_NEWS, MOCK_TRANSACTIONS, FEATURED_APP_IDS } from "@/constants/mock-data";
import { ECOSYSTEM_APPS } from "@/constants/ecosystem-apps";

function QuickAction({ icon, label, onPress }: { icon: string; label: string; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.quickAction, pressed && { opacity: 0.7 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
    >
      <View style={styles.quickActionIcon}>
        <Ionicons name={icon as any} size={22} color={Colors.primary} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
  );
}

function NewsCard({ item }: { item: typeof MOCK_NEWS[0] }) {
  const categoryColor =
    item.category === "Milestone" ? Colors.primary :
    item.category === "Launch" ? Colors.secondary :
    item.category === "Presale" ? Colors.success :
    Colors.textSecondary;

  return (
    <View style={styles.newsCardWrapper}>
      <GlassCard>
        <View style={styles.newsCategoryBadge}>
          <Text style={[styles.newsCategoryText, { color: categoryColor }]}>
            {item.category}
          </Text>
        </View>
        <Text style={styles.newsTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.newsBody} numberOfLines={3}>{item.body}</Text>
      </GlassCard>
    </View>
  );
}

function FeaturedAppCard({ app }: { app: typeof ECOSYSTEM_APPS[0] }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.featuredAppWrapper, pressed && { opacity: 0.8 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/app-detail", params: { id: String(app.id) } });
      }}
    >
      <GlassCard>
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

function ActivityItem({ tx }: { tx: typeof MOCK_TRANSACTIONS[0] }) {
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

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const featuredApps = ECOSYSTEM_APPS.filter(a => FEATURED_APP_IDS.includes(a.id));

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + webTopInset + 16, paddingBottom: 100 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.username}>{MOCK_USER.displayName}</Text>
          </View>
          <View style={styles.trustIdBadge}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.trustIdText}>{MOCK_USER.trustLayerId}</Text>
          </View>
        </View>

        <GlassCard glow>
          <View style={styles.balanceHeader}>
            <Text style={styles.balanceLabel}>Portfolio Value</Text>
            <View style={styles.changeRow}>
              <Ionicons name="trending-up" size={14} color={Colors.success} />
              <Text style={styles.changeText}>+{MOCK_BALANCE.change24h}%</Text>
            </View>
          </View>
          <Text style={styles.balanceValue}>
            ${MOCK_BALANCE.portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>SIG</Text>
              <Text style={styles.balanceItemValue}>
                {MOCK_BALANCE.sig.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>Shells</Text>
              <Text style={styles.balanceItemValue}>
                {MOCK_BALANCE.shells.toLocaleString()}
              </Text>
            </View>
            <View style={styles.balanceDivider} />
            <View style={styles.balanceItem}>
              <Text style={styles.balanceItemLabel}>stSIG</Text>
              <Text style={styles.balanceItemValue}>
                {MOCK_BALANCE.stSig.toLocaleString()}
              </Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.quickActionsRow}>
          <QuickAction icon="cart" label="Buy Shells" onPress={() => router.push("/(tabs)/wallet")} />
          <QuickAction icon="send" label="Send SIG" onPress={() => {}} />
          <QuickAction icon="scan" label="Scan" onPress={() => {}} />
          <QuickAction icon="git-compare" label="Bridge" onPress={() => {}} />
        </View>

        <View style={styles.sectionHeader}>
          <GradientText text="Latest News" style={styles.sectionTitle} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          snapToInterval={268}
          decelerationRate="fast"
        >
          {MOCK_NEWS.map((item) => (
            <NewsCard key={item.id} item={item} />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <GradientText text="Featured Apps" style={styles.sectionTitle} />
          <Pressable onPress={() => router.push("/(tabs)/explore")}>
            <Text style={styles.seeAll}>See All</Text>
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.carouselContent}
          snapToInterval={168}
          decelerationRate="fast"
        >
          {featuredApps.map((app) => (
            <FeaturedAppCard key={app.id} app={app} />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <GradientText text="Recent Activity" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          {MOCK_TRANSACTIONS.slice(0, 5).map((tx, i) => (
            <React.Fragment key={tx.id}>
              <ActivityItem tx={tx} />
              {i < 4 && <View style={styles.divider} />}
            </React.Fragment>
          ))}
        </GlassCard>

        <View style={{ marginTop: 20 }}>
          <CountdownTimer />
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
    gap: 8,
  },
  header: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  greeting: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  username: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  trustIdBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
  },
  trustIdText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  balanceHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    marginBottom: 4,
  },
  balanceLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  changeRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  changeText: {
    fontSize: 13,
    color: Colors.success,
    fontFamily: "Inter_600SemiBold",
  },
  balanceValue: {
    fontSize: 36,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    marginBottom: 16,
  },
  balanceRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    alignItems: "center" as const,
  },
  balanceItem: {
    alignItems: "center" as const,
    flex: 1,
  },
  balanceItemLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginBottom: 2,
  },
  balanceItemValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  balanceDivider: {
    width: 1,
    height: 30,
    backgroundColor: Colors.border,
  },
  quickActionsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    marginVertical: 12,
  },
  quickAction: {
    alignItems: "center" as const,
    gap: 6,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.12)",
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
    marginTop: 12,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  seeAll: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  carouselContent: {
    paddingRight: 16,
    gap: 12,
  },
  newsCardWrapper: {
    width: 256,
  },
  newsCategoryBadge: {
    marginBottom: 8,
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
    marginBottom: 6,
  },
  newsBody: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  featuredAppWrapper: {
    width: 156,
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
});
