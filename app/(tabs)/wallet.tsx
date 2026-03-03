import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Alert,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { GradientButton } from "@/components/GradientButton";
import { SHELL_TIERS } from "@/constants/mock-data";
import { useBalance, useShellBalance, useDwcBag, useTransactions } from "@/hooks/useBalance";

function PortfolioSegment({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <View style={styles.segmentRow}>
      <View style={[styles.segmentDot, { backgroundColor: color }]} />
      <Text style={styles.segmentLabel}>{label}</Text>
      <Text style={styles.segmentPct}>{pct.toFixed(1)}%</Text>
      <Text style={styles.segmentValue}>{value.toLocaleString()}</Text>
    </View>
  );
}

function TransactionItem({ tx }: { tx: { id: string; type: string; amount: number; asset: string; from: string; txHash: string; createdAt: string } }) {
  const iconName = tx.type === "received" ? "arrow-down" :
    tx.type === "sent" ? "arrow-up" :
    tx.type === "staked" ? "lock-closed" : "cart";
  const iconColor = tx.type === "received" ? Colors.success :
    tx.type === "sent" ? Colors.error :
    tx.type === "staked" ? Colors.secondary : Colors.primary;
  const prefix = tx.type === "received" ? "+" : tx.type === "sent" ? "-" : "";
  const timeStr = new Date(tx.createdAt).toLocaleDateString("en-US", {
    month: "short", day: "numeric", hour: "2-digit", minute: "2-digit",
  });

  return (
    <View style={styles.txRow}>
      <View style={[styles.txIcon, { backgroundColor: `${iconColor}15` }]}>
        <Ionicons name={iconName as any} size={16} color={iconColor} />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txType}>{tx.type.charAt(0).toUpperCase() + tx.type.slice(1)}</Text>
        <Text style={styles.txHash}>{tx.txHash}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: iconColor }]}>
          {prefix}{tx.amount.toLocaleString()} {tx.asset}
        </Text>
        <Text style={styles.txTime}>{timeStr}</Text>
      </View>
    </View>
  );
}

function ShellTierCard({ tier, onPurchase }: { tier: typeof SHELL_TIERS[0]; onPurchase: () => void }) {
  const isWhale = tier.name === "Whale";
  return (
    <View style={styles.tierCardWrapper}>
      <GlassCard glow={isWhale}>
        <Text style={styles.tierName}>{tier.name}</Text>
        <Text style={styles.tierShells}>{tier.shells.toLocaleString()}</Text>
        <Text style={styles.tierShellsLabel}>Shells</Text>
        <GradientButton
          title={`$${tier.price.toFixed(2)}`}
          onPress={onPurchase}
          small
          colors={isWhale ? ["#9333ea", "#6366f1"] : Colors.gradientCyan}
        />
      </GlassCard>
    </View>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { data: balance } = useBalance();
  const { data: shells } = useShellBalance();
  const { data: dwcBag } = useDwcBag();
  const { data: transactions } = useTransactions();

  const sigBalance = balance?.sig || 0;
  const stSigBalance = balance?.stSig || 0;
  const shellBalance = shells || 0;
  const portfolioValue = dwcBag?.currentValue || 0;
  const txList = transactions || [];
  const totalAssets = sigBalance + shellBalance + stSigBalance;

  const handlePurchase = (tierName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Purchase Shells",
      `You're about to purchase the ${tierName} tier. This will use your platform's in-app purchase system.`,
      [{ text: "Cancel", style: "cancel" }, { text: "Continue", style: "default" }]
    );
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
            maxWidth: isDesktop ? 720 : undefined,
            alignSelf: isDesktop ? "center" as const : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GradientText text="Wallet" style={styles.screenTitle} />

        <GlassCard glow>
          <Text style={styles.heroLabel}>Signal Balance</Text>
          <Text style={styles.heroValue}>
            {sigBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
          <Text style={styles.heroUnit}>SIG</Text>
          <View style={styles.heroDivider} />
          <View style={styles.heroSubRow}>
            <View style={styles.heroSubItem}>
              <Text style={styles.heroSubLabel}>Fiat Estimate</Text>
              <Text style={styles.heroSubValue}>
                ${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </Text>
            </View>
            <View style={styles.heroSubItem}>
              <Text style={styles.heroSubLabel}>Staked</Text>
              <Text style={[styles.heroSubValue, { color: Colors.secondary }]}>
                {stSigBalance.toLocaleString()} stSIG
              </Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard>
          <View style={styles.shellHeader}>
            <View>
              <Text style={styles.shellLabel}>Shell Balance</Text>
              <Text style={styles.shellValue}>{shellBalance.toLocaleString()}</Text>
            </View>
            <View style={styles.shellConversion}>
              <Text style={styles.shellConversionText}>1 Shell = $0.001</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Buy Shells" style={styles.sectionTitle} />
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tiersRow}
          snapToInterval={148}
          decelerationRate="fast"
        >
          {SHELL_TIERS.map(tier => (
            <ShellTierCard
              key={tier.name}
              tier={tier}
              onPurchase={() => handlePurchase(tier.name)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <GradientText text="Portfolio" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <View style={styles.portfolioBar}>
            {totalAssets > 0 && (
              <>
                <View style={[styles.portfolioSegmentBar, { flex: sigBalance / totalAssets, backgroundColor: Colors.primary }]} />
                <View style={[styles.portfolioSegmentBar, { flex: shellBalance / totalAssets, backgroundColor: Colors.secondary }]} />
                <View style={[styles.portfolioSegmentBar, { flex: stSigBalance / totalAssets, backgroundColor: Colors.success }]} />
              </>
            )}
          </View>
          <View style={styles.segmentsContainer}>
            <PortfolioSegment label="SIG" value={sigBalance} total={totalAssets} color={Colors.primary} />
            <PortfolioSegment label="Shells" value={shellBalance} total={totalAssets} color={Colors.secondary} />
            <PortfolioSegment label="stSIG" value={stSigBalance} total={totalAssets} color={Colors.success} />
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Transaction History" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          {txList.length > 0 ? (
            txList.map((tx, i) => (
              <React.Fragment key={tx.id}>
                <TransactionItem tx={tx} />
                {i < txList.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptyTx}>
              <Ionicons name="receipt-outline" size={24} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
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
    gap: 12,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginBottom: 8,
  },
  heroLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  heroValue: {
    fontSize: 40,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginTop: 4,
  },
  heroUnit: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center" as const,
    marginTop: 2,
  },
  heroDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 14,
  },
  heroSubRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
  },
  heroSubItem: {
    alignItems: "center" as const,
  },
  heroSubLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  heroSubValue: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    marginTop: 2,
  },
  shellHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
  },
  shellLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  shellValue: {
    fontSize: 24,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  shellConversion: {
    backgroundColor: "rgba(147,51,234,0.1)",
    borderRadius: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  shellConversionText: {
    fontSize: 11,
    color: Colors.secondary,
    fontFamily: "Inter_500Medium",
  },
  sectionHeader: {
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  tiersRow: {
    gap: 12,
    paddingRight: 16,
  },
  tierCardWrapper: {
    width: 136,
  },
  tierName: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    textAlign: "center" as const,
    marginBottom: 4,
  },
  tierShells: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center" as const,
  },
  tierShellsLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    marginBottom: 10,
  },
  portfolioBar: {
    flexDirection: "row" as const,
    height: 8,
    borderRadius: 4,
    overflow: "hidden" as const,
    gap: 2,
    marginBottom: 14,
  },
  portfolioSegmentBar: {
    borderRadius: 4,
  },
  segmentsContainer: {
    gap: 8,
  },
  segmentRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  segmentDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  segmentLabel: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  segmentPct: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    width: 50,
    textAlign: "right" as const,
  },
  segmentValue: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    width: 80,
    textAlign: "right" as const,
  },
  txRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 4,
  },
  txIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  txInfo: {
    flex: 1,
  },
  txType: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
  },
  txHash: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  txRight: {
    alignItems: "flex-end" as const,
  },
  txAmount: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  txTime: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  emptyTx: {
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
});
