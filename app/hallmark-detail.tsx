import React from "react";
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
import { router } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";

function InfoRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, mono && styles.monoText]} numberOfLines={2} ellipsizeMode="middle">
        {value}
      </Text>
    </View>
  );
}

export default function HallmarkDetailScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  const { data: genesis } = useQuery({
    queryKey: ["/api/hallmark/genesis"],
  });

  const meta = (genesis as any)?.metadata || {};

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
          <Pressable onPress={() => router.back()} hitSlop={8} testID="hallmark-back">
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
          <GradientText text="Genesis Hallmark" style={styles.screenTitle} />
          <View style={{ width: 24 }} />
        </View>

        <GlassCard glow>
          <View style={styles.genesisHeader}>
            <View style={styles.shieldCircle}>
              <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
            </View>
            <Text style={styles.hallmarkId}>{(genesis as any)?.thId || "TH-00000001"}</Text>
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.verifiedText}>
                {(genesis as any)?.verified ? "Verified on Blockchain" : "Pending Verification"}
              </Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="information-circle" size={18} color={Colors.primary} />
          <GradientText text="Application Info" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <InfoRow label="App Name" value={(genesis as any)?.appName || "Trust Layer Hub"} />
          <View style={styles.divider} />
          <InfoRow label="Product" value={(genesis as any)?.productName || "Genesis Block"} />
          <View style={styles.divider} />
          <InfoRow label="Release Type" value={(genesis as any)?.releaseType || "genesis"} />
          <View style={styles.divider} />
          <InfoRow label="Created" value={(genesis as any)?.createdAt ? new Date((genesis as any).createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Pending"} />
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="cube" size={18} color={Colors.secondary} />
          <GradientText text="Blockchain Record" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <InfoRow label="Data Hash (SHA-256)" value={(genesis as any)?.dataHash || "pending"} mono />
          <View style={styles.divider} />
          <InfoRow label="Transaction Hash" value={(genesis as any)?.txHash || "pending"} mono />
          <View style={styles.divider} />
          <InfoRow label="Block Height" value={(genesis as any)?.blockHeight || "pending"} mono />
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="globe" size={18} color={Colors.success} />
          <GradientText text="Ecosystem Details" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <InfoRow label="Ecosystem" value={meta.ecosystem || "Trust Layer"} />
          <View style={styles.divider} />
          <InfoRow label="Version" value={meta.version || "1.0.0"} />
          <View style={styles.divider} />
          <InfoRow label="Domain" value={meta.domain || "trusthub.tlid.io"} />
          <View style={styles.divider} />
          <InfoRow label="Operator" value={meta.operator || "DarkWave Studios LLC"} />
          <View style={styles.divider} />
          <InfoRow label="Chain" value={meta.chain || "Trust Layer Blockchain"} />
          <View style={styles.divider} />
          <InfoRow label="Consensus" value={meta.consensus || "Proof of Trust"} />
          <View style={styles.divider} />
          <InfoRow label="Launch Date" value={meta.launchDate ? new Date(meta.launchDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" }) : "August 23, 2026"} />
          <View style={styles.divider} />
          <InfoRow label="Total Apps" value={String(meta.totalApps || 32)} />
          <View style={styles.divider} />
          <InfoRow label="Native Asset" value={meta.nativeAsset || "SIG"} />
          <View style={styles.divider} />
          <InfoRow label="Utility Token" value={meta.utilityToken || "Shells"} />
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="link" size={18} color={Colors.primary} />
          <GradientText text="Verification" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <Text style={styles.verifyDesc}>
            This hallmark is the genesis record for the Trust Layer Hub application.
            It is permanently recorded on the Trust Layer Blockchain and cannot be modified or deleted.
            All subsequent hallmarks in the ecosystem reference this genesis block.
          </Text>
          <View style={styles.divider} />
          <InfoRow label="Verification URL" value="/api/hallmark/TH-00000001/verify" mono />
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, gap: 12 },
  headerRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 8 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  genesisHeader: { alignItems: "center" as const, gap: 10, paddingVertical: 16 },
  shieldCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderWidth: 2,
    borderColor: "rgba(0,255,255,0.25)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  hallmarkId: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    letterSpacing: 1,
  },
  verifiedBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    backgroundColor: "rgba(16,185,129,0.1)",
    borderWidth: 1,
    borderColor: "rgba(16,185,129,0.2)",
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: { fontSize: 12, color: Colors.success, fontFamily: "Inter_600SemiBold" },
  sectionHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  infoRow: { paddingVertical: 10, minHeight: 48, justifyContent: "center" as const },
  infoLabel: { fontSize: 11, color: Colors.textTertiary, fontFamily: "Inter_500Medium", textTransform: "uppercase" as const, letterSpacing: 0.5, marginBottom: 3 },
  infoValue: { fontSize: 14, color: Colors.textPrimary, fontFamily: "Inter_500Medium" },
  monoText: { fontFamily: "Inter_400Regular", fontSize: 12, color: Colors.textSecondary, letterSpacing: 0.3 },
  divider: { height: 1, backgroundColor: Colors.border },
  verifyDesc: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", lineHeight: 20, paddingVertical: 8 },
});
