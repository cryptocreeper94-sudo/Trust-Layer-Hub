import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { EmptyState } from "@/components/EmptyState";

interface Notification {
  id: string;
  type: "transaction" | "security" | "social" | "system" | "news";
  title: string;
  message: string;
  time: string;
  read: boolean;
}

const MOCK_NOTIFICATIONS: Notification[] = [
  { id: "1", type: "system", title: "Welcome to Trust Layer Hub!", message: "Your account is set up and ready. Explore 35 ecosystem apps.", time: "Just now", read: false },
  { id: "2", type: "security", title: "Login from new device", message: "A new login was detected from Windows 11 · Chrome.", time: "2m ago", read: false },
  { id: "3", type: "transaction", title: "Staking Rewards", message: "You earned 12.5 SIG from staking rewards.", time: "1h ago", read: false },
  { id: "4", type: "social", title: "New Follower", message: "darkwave_builder started following you.", time: "3h ago", read: true },
  { id: "5", type: "news", title: "New Blog Post", message: "Understanding Signal (SIG): Tokenomics, Staking, and the Path to $0.01", time: "5h ago", read: true },
  { id: "6", type: "transaction", title: "SIG Received", message: "You received 50.0 SIG from affiliate rewards.", time: "1d ago", read: true },
  { id: "7", type: "system", title: "App Update Available", message: "Trust Layer Hub v1.1.0 is now available with new features.", time: "2d ago", read: true },
  { id: "8", type: "security", title: "Password Changed", message: "Your password was successfully changed.", time: "3d ago", read: true },
];

const TYPE_CONFIG: Record<string, { icon: string; color: string; label: string }> = {
  transaction: { icon: "swap-horizontal", color: Colors.success, label: "Transactions" },
  security: { icon: "shield-checkmark", color: "#6366f1", label: "Security" },
  social: { icon: "people", color: Colors.secondary, label: "Social" },
  system: { icon: "settings", color: Colors.primary, label: "System" },
  news: { icon: "newspaper", color: "#f59e0b", label: "News" },
};

const FILTER_TABS = ["All", "Transactions", "Security", "Social", "System", "News"];

function NotificationCard({ notification, onMarkRead }: { notification: Notification; onMarkRead: (id: string) => void }) {
  const config = TYPE_CONFIG[notification.type];

  return (
    <Pressable
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onMarkRead(notification.id);
      }}
    >
      <GlassCard>
        <View style={styles.notifRow}>
          <View style={[styles.notifIcon, { backgroundColor: `${config.color}15` }]}>
            <Ionicons name={config.icon as any} size={18} color={config.color} />
          </View>
          <View style={styles.notifContent}>
            <View style={styles.notifHeader}>
              <Text style={[styles.notifTitle, !notification.read && styles.notifUnread]}>
                {notification.title}
              </Text>
              {!notification.read && <View style={styles.unreadDot} />}
            </View>
            <Text style={styles.notifMessage} numberOfLines={2}>{notification.message}</Text>
            <Text style={styles.notifTime}>{notification.time}</Text>
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function NotificationsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const [filter, setFilter] = useState("All");
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const filtered = useMemo(() => {
    if (filter === "All") return notifications;
    const typeKey = filter.toLowerCase().replace("transactions", "transaction");
    return notifications.filter((n) => n.type === typeKey);
  }, [filter, notifications]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  const markRead = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
  };

  const markAllRead = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
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
            maxWidth: isDesktop ? 600 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <View style={{ flex: 1 }}>
            <GradientText text="Notifications" style={styles.title} />
            {unreadCount > 0 && (
              <Text style={styles.unreadLabel}>{unreadCount} unread</Text>
            )}
          </View>
          {unreadCount > 0 && (
            <Pressable style={styles.markAllBtn} onPress={markAllRead}>
              <Text style={styles.markAllText}>Mark all read</Text>
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}
        >
          {FILTER_TABS.map((tab) => (
            <Pressable
              key={tab}
              style={[styles.filterPill, filter === tab && styles.filterPillActive]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(tab);
              }}
            >
              <Text style={[styles.filterText, filter === tab && styles.filterTextActive]}>{tab}</Text>
            </Pressable>
          ))}
        </ScrollView>

        {filtered.length === 0 ? (
          <EmptyState icon="notifications-off-outline" title="No notifications" subtitle="You're all caught up!" />
        ) : (
          filtered.map((n) => (
            <View key={n.id} style={{ marginBottom: 10 }}>
              <NotificationCard notification={n} onMarkRead={markRead} />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 4 },
  headerRow: {
    flexDirection: "row" as const, alignItems: "center" as const,
    gap: 12, marginBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  title: { fontSize: 28, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  unreadLabel: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.primary, marginTop: 2 },
  markAllBtn: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(0,255,255,0.15)",
  },
  markAllText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.primary },
  filterRow: { gap: 8, paddingRight: 16, marginBottom: 20 },
  filterPill: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 18,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  filterPillActive: { backgroundColor: "rgba(0,255,255,0.1)", borderColor: "rgba(0,255,255,0.25)" },
  filterText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  filterTextActive: { color: Colors.primary },
  notifRow: { flexDirection: "row" as const, alignItems: "flex-start" as const },
  notifIcon: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center" as const, justifyContent: "center" as const,
    marginRight: 14,
  },
  notifContent: { flex: 1 },
  notifHeader: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 8,
  },
  notifTitle: {
    fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.textPrimary,
    flex: 1,
  },
  notifUnread: { fontFamily: "Inter_600SemiBold" },
  unreadDot: {
    width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary,
  },
  notifMessage: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
    lineHeight: 19, marginTop: 4,
  },
  notifTime: {
    fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted, marginTop: 6,
  },
});
