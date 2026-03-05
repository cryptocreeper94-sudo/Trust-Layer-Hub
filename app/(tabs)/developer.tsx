import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  RefreshControl,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { useAuth } from "@/lib/auth-context";
import { useDeveloperStats, useDeveloperHealth } from "@/hooks/useDeveloperStats";

function HealthDot({ status }: { status: string }) {
  const color =
    status === "healthy" ? Colors.success :
    status === "degraded" ? Colors.warning :
    status === "unreachable" || status === "unhealthy" ? Colors.error :
    Colors.textMuted;
  return <View style={[styles.healthDot, { backgroundColor: color, shadowColor: color }]} />;
}

function StatBox({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <View style={styles.statBox}>
      <Text style={[styles.statValue, color ? { color } : null]}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

function InfoRow({ label, value, valueColor }: { label: string; value: string | number; valueColor?: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoKey}>{label}</Text>
      <Text style={[styles.infoVal, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

function EndpointRow({ method, path, auth, desc }: { method: string; path: string; auth: boolean; desc: string }) {
  const methodColor =
    method === "GET" ? Colors.success :
    method === "POST" ? "#3b82f6" :
    method === "PUT" ? Colors.warning :
    Colors.error;
  return (
    <View style={styles.endpointRow}>
      <View style={styles.endpointLeft}>
        <View style={[styles.methodBadge, { backgroundColor: `${methodColor}20` }]}>
          <Text style={[styles.methodText, { color: methodColor }]}>{method}</Text>
        </View>
        <Text style={styles.endpointPath} numberOfLines={1}>{path}</Text>
      </View>
      <View style={styles.endpointRight}>
        <View style={[styles.authBadge, auth ? styles.authRequired : styles.authPublic]}>
          <Text style={[styles.authText, { color: auth ? Colors.secondary : Colors.textMuted }]}>
            {auth ? "Auth" : "Public"}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function DeveloperScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { deactivateDevMode } = useAuth();
  const { data: stats, refetch: refetchStats, isRefetching: isRefetchingStats } = useDeveloperStats();
  const { data: health, refetch: refetchHealth } = useDeveloperHealth();
  const [endpointFilter, setEndpointFilter] = useState<string>("all");
  const [showEndpoints, setShowEndpoints] = useState(false);

  const checks = health?.checks || {};
  const sys = stats?.system;
  const db = stats?.database;
  const chain = stats?.blockchain;
  const pulse = stats?.pulse;
  const endpoints = stats?.endpoints;

  const filteredEndpoints = (endpoints?.list || []).filter(ep => {
    if (endpointFilter === "all") return true;
    if (endpointFilter === "GET") return ep.method === "GET";
    if (endpointFilter === "POST") return ep.method === "POST";
    if (endpointFilter === "public") return !ep.auth;
    if (endpointFilter === "auth") return ep.auth;
    return true;
  });

  const onRefresh = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    refetchStats();
    refetchHealth();
  };

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
        refreshControl={
          <RefreshControl refreshing={isRefetchingStats} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        <View style={isDesktop ? { maxWidth: 720, width: "100%", alignSelf: "center" as const } : undefined}>
          <View style={styles.headerRow}>
            <GradientText text="Developer Portal" style={styles.pageTitle} />
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); deactivateDevMode(); }}
              style={styles.exitBtn}
              testID="exit-dev-mode"
            >
              <Ionicons name="close-circle-outline" size={16} color={Colors.textMuted} />
              <Text style={styles.exitText}>Exit</Text>
            </Pressable>
          </View>

          <GlassCard>
            <View style={styles.healthBar}>
              <View style={styles.healthItem}>
                <HealthDot status={checks.server || "unknown"} />
                <Text style={styles.healthLabel}>Server</Text>
              </View>
              <View style={styles.healthItem}>
                <HealthDot status={checks.database || "unknown"} />
                <Text style={styles.healthLabel}>Database</Text>
              </View>
              <View style={styles.healthItem}>
                <HealthDot status={checks.blockchain || "unknown"} />
                <Text style={styles.healthLabel}>Chain</Text>
              </View>
              <View style={styles.healthItem}>
                <HealthDot status={checks.pulse || "unknown"} />
                <Text style={styles.healthLabel}>Pulse</Text>
              </View>
              <View style={[styles.healthItem, { marginLeft: "auto" }]}>
                <View style={[styles.overallBadge, { backgroundColor: health?.status === "healthy" ? "rgba(16,185,129,0.12)" : "rgba(245,158,11,0.12)" }]}>
                  <Text style={[styles.overallText, { color: health?.status === "healthy" ? Colors.success : Colors.warning }]}>
                    {health?.status === "healthy" ? "All Systems Go" : "Degraded"}
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>

          <View style={styles.sectionHeader}>
            <GradientText text="System Overview" style={styles.sectionTitle} />
          </View>
          <View style={styles.statsGrid}>
            <StatBox label="Users" value={db?.users ?? "--"} color={Colors.primary} />
            <StatBox label="Sessions" value={db?.activeSessions ?? "--"} color={Colors.success} />
            <StatBox label="Hallmarks" value={db?.hallmarks ?? "--"} color={Colors.secondary} />
            <StatBox label="Stamps" value={db?.trustStamps ?? "--"} color="#3b82f6" />
          </View>
          <View style={styles.statsGrid}>
            <StatBox label="Channels" value={db?.chatChannels ?? "--"} />
            <StatBox label="Messages" value={db?.chatMessages ?? "--"} />
            <StatBox label="Linked Accts" value={db?.linkedAccounts ?? "--"} />
            <StatBox label="Stripe" value={db?.stripeConnections ?? "--"} />
          </View>

          <View style={styles.sectionHeader}>
            <GradientText text="Server" style={styles.sectionTitle} />
          </View>
          <GlassCard>
            <InfoRow label="Uptime" value={sys?.uptime || "--"} />
            <InfoRow label="Node.js" value={sys?.nodeVersion || "--"} />
            <InfoRow label="Environment" value={sys?.env || "--"} />
            <InfoRow label="Memory (Heap)" value={sys?.memoryMB ? `${sys.memoryMB} MB` : "--"} />
            <InfoRow label="Boot Time" value={sys?.bootTime ? new Date(sys.bootTime).toLocaleString() : "--"} />
          </GlassCard>

          <View style={styles.sectionHeader}>
            <GradientText text="Blockchain" style={styles.sectionTitle} />
          </View>
          <GlassCard>
            <InfoRow label="Status" value={chain?.status === "connected" ? "Connected" : "Unreachable"} valueColor={chain?.status === "connected" ? Colors.success : Colors.error} />
            <InfoRow label="Block Time" value={chain?.blockTime || "--"} />
            <InfoRow label="TPS" value={chain?.tps ? chain.tps.toLocaleString() : "--"} valueColor={Colors.primary} />
            <InfoRow label="Last Block" value={chain?.lastBlock ? Number(chain.lastBlock).toLocaleString() : "--"} />
            <InfoRow label="Chain ID" value={chain?.chainId || "--"} />
            <InfoRow label="Consensus" value={chain?.consensus || "--"} />
            <InfoRow label="Accounts" value={chain?.totalAccounts?.toString() || "--"} />
          </GlassCard>

          <View style={styles.sectionHeader}>
            <GradientText text="DarkWave Pulse" style={styles.sectionTitle} />
          </View>
          <GlassCard>
            <InfoRow label="Status" value={pulse?.status === "connected" ? "Connected" : "Unreachable"} valueColor={pulse?.status === "connected" ? Colors.success : Colors.error} />
            <InfoRow label="Active Signals" value={pulse?.activeSignals?.toString() || "--"} />
            <InfoRow label="Sentiment" value={pulse?.sentiment ? `${pulse.sentiment} (${pulse.sentimentScore})` : "--"} />
            <InfoRow label="Accuracy" value={pulse?.accuracy ? `${pulse.accuracy}%` : "--"} valueColor={Colors.success} />
            <InfoRow label="Total Predictions" value={pulse?.totalPredictions ? pulse.totalPredictions.toLocaleString() : "--"} />
          </GlassCard>

          <View style={styles.sectionHeader}>
            <GradientText text="Integrations" style={styles.sectionTitle} />
          </View>
          <GlassCard>
            <InfoRow label="OpenAI (AI Agent)" value="Configured" valueColor={Colors.success} />
            <InfoRow label="ElevenLabs (TTS)" value="Configured" valueColor={Colors.success} />
            <InfoRow label="Resend (Email)" value="Configured" valueColor={Colors.success} />
            <InfoRow label="Twilio (SMS 2FA)" value="Configured" valueColor={Colors.success} />
            <InfoRow label="Stripe" value="Configured" valueColor={Colors.success} />
            <InfoRow label="Plaid" value="Configured" valueColor={Colors.success} />
          </GlassCard>

          <View style={styles.sectionHeader}>
            <GradientText
              text={`API Endpoints (${endpoints?.total || 0})`}
              style={styles.sectionTitle}
            />
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setShowEndpoints(!showEndpoints); }}
              testID="toggle-endpoints"
            >
              <Ionicons name={showEndpoints ? "chevron-up" : "chevron-down"} size={18} color={Colors.primary} />
            </Pressable>
          </View>

          {showEndpoints && (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterRow}>
                {["all", "GET", "POST", "public", "auth"].map(f => (
                  <Pressable
                    key={f}
                    style={[styles.filterBtn, endpointFilter === f && styles.filterBtnActive]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setEndpointFilter(f); }}
                    testID={`filter-${f}`}
                  >
                    <Text style={[styles.filterText, endpointFilter === f && styles.filterTextActive]}>
                      {f === "all" ? "All" : f === "auth" ? "Auth" : f === "public" ? "Public" : f}
                    </Text>
                  </Pressable>
                ))}
              </ScrollView>
              <GlassCard>
                {filteredEndpoints.map((ep, i) => (
                  <React.Fragment key={i}>
                    <EndpointRow method={ep.method} path={ep.path} auth={ep.auth} desc={ep.desc} />
                    {i < filteredEndpoints.length - 1 && <View style={styles.divider} />}
                  </React.Fragment>
                ))}
                {filteredEndpoints.length === 0 && (
                  <Text style={styles.noResults}>No endpoints match filter</Text>
                )}
              </GlassCard>
            </>
          )}

          <View style={styles.sectionHeader}>
            <GradientText text="Quick Links" style={styles.sectionTitle} />
          </View>
          <GlassCard>
            <InfoRow label="Production" value="trusthub.tlid.io" valueColor={Colors.primary} />
            <InfoRow label="Trust Layer Chain" value="dwtl.io" valueColor={Colors.primary} />
            <InfoRow label="DarkWave Pulse" value="darkwavepulse.com" valueColor={Colors.primary} />
            <InfoRow label="TrustShield" value="trustshield.tech" valueColor={Colors.primary} />
            <InfoRow label="TLID Registry" value="tlid.io" valueColor={Colors.primary} />
            <InfoRow label="Contact" value="team@dwsc.io" valueColor={Colors.primary} />
          </GlassCard>

          <View style={styles.footerInfo}>
            <Text style={styles.footerText}>Developer Portal v1.0.0</Text>
            <Text style={styles.footerText}>DarkWave Studios LLC</Text>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 8 },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 12,
  },
  pageTitle: { fontSize: 24, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  exitBtn: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  exitText: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_500Medium" },
  healthBar: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    flexWrap: "wrap" as const,
    gap: 14,
  },
  healthItem: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  healthDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  healthLabel: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
  },
  overallBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
  },
  overallText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginTop: 12,
    marginBottom: 4,
    paddingLeft: 2,
  },
  sectionTitle: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  statsGrid: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 4,
  },
  statBox: {
    flex: 1,
    backgroundColor: "rgba(12,18,36,0.7)",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: 14,
    paddingHorizontal: 10,
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
    color: Colors.textMuted,
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
    marginTop: 2,
  },
  infoRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 7,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  infoKey: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  infoVal: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    textAlign: "right" as const,
    flexShrink: 1,
    maxWidth: "60%" as any,
  },
  filterRow: {
    flexGrow: 0,
    marginBottom: 4,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 6,
  },
  filterBtnActive: {
    backgroundColor: "rgba(0,255,255,0.1)",
    borderColor: "rgba(0,255,255,0.3)",
  },
  filterText: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
  },
  filterTextActive: {
    color: Colors.primary,
  },
  endpointRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 6,
  },
  endpointLeft: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    flex: 1,
  },
  methodBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    minWidth: 40,
    alignItems: "center" as const,
  },
  methodText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    letterSpacing: 0.3,
  },
  endpointPath: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  endpointRight: {
    marginLeft: 8,
  },
  authBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  authRequired: {
    backgroundColor: "rgba(147,51,234,0.12)",
  },
  authPublic: {
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  authText: {
    fontSize: 9,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  noResults: {
    textAlign: "center" as const,
    color: Colors.textMuted,
    fontSize: 12,
    paddingVertical: 16,
  },
  footerInfo: {
    alignItems: "center" as const,
    marginTop: 16,
    gap: 4,
  },
  footerText: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
});
