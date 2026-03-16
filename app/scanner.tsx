import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";

interface ScanResult {
  address: string;
  trustScore: number;
  status: "verified" | "unverified" | "suspicious";
  hallmarks: number;
  lastSeen: string;
  chains: string[];
}

function TrustScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? Colors.success : score >= 50 ? "#f59e0b" : Colors.error;

  return (
    <View style={styles.scoreRing}>
      <LinearGradient
        colors={[`${color}40`, `${color}10`]}
        style={styles.scoreGradient}
      />
      <Text style={[styles.scoreValue, { color }]}>{score}</Text>
      <Text style={styles.scoreLabel}>Trust Score</Text>
    </View>
  );
}

function ResultCard({ result }: { result: ScanResult }) {
  const statusConfig = {
    verified: { color: Colors.success, icon: "checkmark-circle", label: "Verified" },
    unverified: { color: Colors.textTertiary, icon: "help-circle", label: "Unverified" },
    suspicious: { color: Colors.error, icon: "warning", label: "Suspicious" },
  };
  const cfg = statusConfig[result.status];

  return (
    <GlassCard glow>
      <View style={styles.resultHeader}>
        <TrustScoreRing score={result.trustScore} />
        <View style={styles.resultInfo}>
          <View style={styles.statusBadge}>
            <Ionicons name={cfg.icon as any} size={14} color={cfg.color} />
            <Text style={[styles.statusText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
          <Text style={styles.resultAddress} numberOfLines={1}>{result.address}</Text>
          <Text style={styles.resultLastSeen}>Last seen: {result.lastSeen}</Text>
        </View>
      </View>

      <View style={styles.resultDivider} />

      <View style={styles.resultStats}>
        <View style={styles.resultStat}>
          <Ionicons name="ribbon" size={16} color={Colors.primary} />
          <Text style={styles.resultStatValue}>{result.hallmarks}</Text>
          <Text style={styles.resultStatLabel}>Hallmarks</Text>
        </View>
        <View style={styles.resultStatDivider} />
        <View style={styles.resultStat}>
          <Ionicons name="git-network" size={16} color={Colors.secondary} />
          <Text style={styles.resultStatValue}>{result.chains.length}</Text>
          <Text style={styles.resultStatLabel}>Chains</Text>
        </View>
        <View style={styles.resultStatDivider} />
        <View style={styles.resultStat}>
          <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
          <Text style={styles.resultStatValue}>{result.trustScore >= 80 ? "Pass" : "Fail"}</Text>
          <Text style={styles.resultStatLabel}>Guardian</Text>
        </View>
      </View>

      <View style={styles.chainsRow}>
        <Text style={styles.chainsLabel}>Active Chains:</Text>
        <View style={styles.chainBadges}>
          {result.chains.map((chain) => (
            <View key={chain} style={styles.chainBadge}>
              <Text style={styles.chainText}>{chain}</Text>
            </View>
          ))}
        </View>
      </View>
    </GlassCard>
  );
}

export default function ScannerScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  const [query, setQuery] = useState("");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState("");

  const handleScan = useCallback(async () => {
    if (!query.trim()) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setScanning(true);
    setError("");
    setResult(null);

    // Simulate scan — in production, call /api/guardian/scan
    await new Promise((r) => setTimeout(r, 2000));

    const isAddress = query.startsWith("0x") || query.endsWith(".tlid");

    if (!isAddress && query.length < 3) {
      setError("Please enter a valid address, TLID, or wallet address.");
      setScanning(false);
      return;
    }

    // Mock result
    setResult({
      address: query,
      trustScore: Math.floor(Math.random() * 40) + 60,
      status: Math.random() > 0.2 ? "verified" : "unverified",
      hallmarks: Math.floor(Math.random() * 15) + 1,
      lastSeen: "2 hours ago",
      chains: ["Trust Layer", "Ethereum", "Solana"].slice(0, Math.floor(Math.random() * 3) + 1),
    });
    setScanning(false);
  }, [query]);

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
          <View>
            <GradientText text="Guardian Scanner" style={styles.title} />
            <Text style={styles.subtitle}>Verify any address or agent</Text>
          </View>
        </View>

        {/* Scanner Input */}
        <GlassCard glow>
          <View style={styles.scannerHeader}>
            <Ionicons name="scan" size={24} color={Colors.primary} />
            <Text style={styles.scannerTitle}>Trust Verification</Text>
          </View>
          <Text style={styles.scannerDesc}>
            Enter a wallet address, Trust Layer ID, or agent identifier to verify trust score,
            hallmark history, and security posture.
          </Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.scanInput}
              value={query}
              onChangeText={(text) => {
                setQuery(text);
                setError("");
              }}
              placeholder="0x... or username.tlid"
              placeholderTextColor={Colors.textMuted}
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={handleScan}
            />
            <Pressable
              style={({ pressed }) => [
                styles.scanBtn,
                (!query.trim() || scanning) && styles.scanBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleScan}
              disabled={!query.trim() || scanning}
            >
              {scanning ? (
                <ActivityIndicator size="small" color="#000" />
              ) : (
                <Ionicons name="search" size={20} color="#000" />
              )}
            </Pressable>
          </View>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </GlassCard>

        {/* Scanning Animation */}
        {scanning && (
          <View style={styles.scanningContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.scanningText}>Scanning across 13+ chains...</Text>
            <Text style={styles.scanningSubtext}>Analyzing trust history, hallmarks, and behavior</Text>
          </View>
        )}

        {/* Result */}
        {result && !scanning && (
          <View style={{ marginTop: 20 }}>
            <ResultCard result={result} />
          </View>
        )}

        {/* Info Cards */}
        {!result && !scanning && (
          <View style={styles.infoCards}>
            <GlassCard>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: "rgba(16,185,129,0.1)" }]}>
                  <Ionicons name="shield-checkmark" size={20} color={Colors.success} />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Multi-Chain Verification</Text>
                  <Text style={styles.infoDesc}>Scans across 13+ blockchains for comprehensive trust assessment</Text>
                </View>
              </View>
            </GlassCard>
            <GlassCard>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: "rgba(99,102,241,0.1)" }]}>
                  <Ionicons name="analytics" size={20} color="#6366f1" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Behavioral Analysis</Text>
                  <Text style={styles.infoDesc}>AI-powered analysis of transaction patterns and agent behavior</Text>
                </View>
              </View>
            </GlassCard>
            <GlassCard>
              <View style={styles.infoRow}>
                <View style={[styles.infoIcon, { backgroundColor: "rgba(245,158,11,0.1)" }]}>
                  <Ionicons name="ribbon" size={20} color="#f59e0b" />
                </View>
                <View style={styles.infoContent}>
                  <Text style={styles.infoTitle}>Hallmark History</Text>
                  <Text style={styles.infoDesc}>Full verification history with blockchain-certified timestamps</Text>
                </View>
              </View>
            </GlassCard>
          </View>
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
    gap: 12, marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  title: { fontSize: 26, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 2 },
  scannerHeader: {
    flexDirection: "row" as const, alignItems: "center" as const,
    gap: 10, marginBottom: 10,
  },
  scannerTitle: { fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary },
  scannerDesc: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
    lineHeight: 21, marginBottom: 16,
  },
  inputRow: {
    flexDirection: "row" as const, gap: 10,
  },
  scanInput: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
  },
  scanBtn: {
    width: 48, height: 48, borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  scanBtnDisabled: { opacity: 0.4 },
  errorText: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.error,
    marginTop: 8,
  },
  scanningContainer: {
    alignItems: "center" as const, paddingVertical: 40, gap: 12,
  },
  scanningText: {
    fontSize: 16, fontFamily: "Inter_500Medium", color: Colors.textPrimary,
  },
  scanningSubtext: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
  },
  resultHeader: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 20,
  },
  scoreRing: {
    width: 80, height: 80, borderRadius: 40,
    borderWidth: 3, borderColor: "rgba(0,255,255,0.2)",
    alignItems: "center" as const, justifyContent: "center" as const,
    overflow: "hidden" as const,
  },
  scoreGradient: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 40,
  },
  scoreValue: { fontSize: 28, fontFamily: "Inter_700Bold" },
  scoreLabel: { fontSize: 9, fontFamily: "Inter_500Medium", color: Colors.textTertiary },
  resultInfo: { flex: 1 },
  statusBadge: {
    flexDirection: "row" as const, alignItems: "center" as const,
    gap: 6, marginBottom: 6,
  },
  statusText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  resultAddress: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textPrimary, marginBottom: 4,
  },
  resultLastSeen: {
    fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted,
  },
  resultDivider: {
    height: 1, backgroundColor: "rgba(255,255,255,0.06)", marginVertical: 16,
  },
  resultStats: {
    flexDirection: "row" as const, alignItems: "center" as const,
    justifyContent: "space-around" as const,
  },
  resultStat: { alignItems: "center" as const, gap: 4 },
  resultStatValue: { fontSize: 16, fontFamily: "Inter_700Bold", color: Colors.textPrimary },
  resultStatLabel: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  resultStatDivider: { width: 1, height: 40, backgroundColor: "rgba(255,255,255,0.06)" },
  chainsRow: { marginTop: 16 },
  chainsLabel: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textTertiary, marginBottom: 8 },
  chainBadges: { flexDirection: "row" as const, gap: 8, flexWrap: "wrap" as const },
  chainBadge: {
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(0,255,255,0.12)",
  },
  chainText: { fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.primary },
  infoCards: { gap: 12, marginTop: 20 },
  infoRow: { flexDirection: "row" as const, alignItems: "center" as const, gap: 14 },
  infoIcon: {
    width: 44, height: 44, borderRadius: 14,
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  infoContent: { flex: 1 },
  infoTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary, marginBottom: 4 },
  infoDesc: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary, lineHeight: 19 },
});
