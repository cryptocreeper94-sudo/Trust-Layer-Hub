import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable } from "react-native";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { GlassCard } from "@/components/GlassCard";
import { GradientButton } from "@/components/GradientButton";
import { GradientText } from "@/components/GradientText";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import {
  useMultisigVault,
  useMultisigPending,
  useMultisigHistory,
  useApproveTransaction,
  useRejectTransaction,
  type MultisigTransaction,
} from "@/hooks/useMultisig";

function SignatureProgress({ signatures, threshold, coSignerCount }: { signatures: any[]; threshold: number; coSignerCount: number }) {
  const approvedCount = (signatures || []).filter((s: any) => s.action === "approve").length;
  const totalSlots = Math.max(coSignerCount, threshold);
  return (
    <View style={styles.sigProgress}>
      <Text style={styles.sigProgressText}>
        {approvedCount}/{threshold} Signatures
      </Text>
      <View style={styles.sigDots}>
        {Array.from({ length: totalSlots }).map((_, i) => (
          <View
            key={i}
            style={[
              styles.sigDot,
              i < approvedCount ? styles.sigDotSigned : styles.sigDotPending,
            ]}
          />
        ))}
      </View>
    </View>
  );
}

function PendingTxCard({ tx, threshold, coSignerCount }: { tx: MultisigTransaction; threshold: number; coSignerCount: number }) {
  const approve = useApproveTransaction();
  const reject = useRejectTransaction();

  const handleApprove = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    approve.mutate(tx.id);
  };

  const handleReject = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    reject.mutate(tx.id);
  };

  const sigs = tx.signatures || [];

  return (
    <GlassCard style={styles.txCard}>
      <View style={styles.txHeader}>
        <View style={styles.txInfo}>
          <Text style={styles.txAmount}>{tx.amount} SIG</Text>
          <Text style={styles.txDesc} numberOfLines={1}>
            {tx.description || "Transfer"}
          </Text>
        </View>
        <View style={styles.txStatusBadge}>
          <Text style={styles.txStatusText}>Pending</Text>
        </View>
      </View>

      <View style={styles.txDest}>
        <Ionicons name="arrow-forward-circle" size={14} color={Colors.textTertiary} />
        <Text style={styles.txDestText} numberOfLines={1}>
          {tx.destination}
        </Text>
      </View>

      <SignatureProgress signatures={sigs} threshold={threshold} coSignerCount={coSignerCount} />

      <View style={styles.signerList}>
        {sigs.map((sig: any, i: number) => (
          <View key={i} style={styles.signerRow}>
            <View
              style={[
                styles.signerIndicator,
                sig.action === "approve" ? styles.signerSigned : styles.signerPending,
              ]}
            />
            <Text style={styles.signerLabel}>Signer #{sig.userId}</Text>
            <Text style={styles.signerStatus}>
              {sig.action === "approve" ? "Approved" : sig.action === "reject" ? "Rejected" : "Pending"}
            </Text>
          </View>
        ))}
      </View>

      <View style={styles.txActions}>
        <View testID={`approve-tx-${tx.id}`} style={styles.approveBtn}>
          <GradientButton
            title="Approve"
            onPress={handleApprove}
            loading={approve.isPending}
            small
          />
        </View>
        <View testID={`reject-tx-${tx.id}`} style={styles.rejectBtn}>
          <GradientButton
            title="Reject"
            onPress={handleReject}
            loading={reject.isPending}
            small
            colors={["#ef4444", "#dc2626"]}
          />
        </View>
      </View>
    </GlassCard>
  );
}

function HistoryTxCard({ tx }: { tx: MultisigTransaction }) {
  const isCompleted = tx.status === "completed" || tx.status === "approved";
  return (
    <GlassCard style={styles.txCard}>
      <View style={styles.txHeader}>
        <View style={styles.txInfo}>
          <Text style={styles.txAmount}>{tx.amount} SIG</Text>
          <Text style={styles.txDesc} numberOfLines={1}>
            {tx.description || "Transfer"}
          </Text>
        </View>
        <View
          style={[
            styles.txStatusBadge,
            isCompleted ? styles.statusCompleted : styles.statusRejected,
          ]}
        >
          <Text
            style={[
              styles.txStatusText,
              isCompleted ? styles.statusCompletedText : styles.statusRejectedText,
            ]}
          >
            {tx.status}
          </Text>
        </View>
      </View>
      <View style={styles.txDest}>
        <Ionicons name="arrow-forward-circle" size={14} color={Colors.textTertiary} />
        <Text style={styles.txDestText} numberOfLines={1}>
          {tx.destination}
        </Text>
      </View>
      <View style={styles.signerList}>
        {(tx.signatures || []).map((sig: any, i: number) => (
          <View key={i} style={styles.signerRow}>
            <View
              style={[
                styles.signerIndicator,
                sig.action === "approve" ? styles.signerSigned : styles.signerPending,
              ]}
            />
            <Text style={styles.signerLabel}>Signer #{sig.userId}</Text>
          </View>
        ))}
      </View>
    </GlassCard>
  );
}

export default function MultisigScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const vault = useMultisigVault();
  const pending = useMultisigPending();
  const history = useMultisigHistory();

  const isLoading = vault.isLoading || pending.isLoading || history.isLoading;
  const vaultData = vault.data;
  const pendingTxs = pending.data || [];
  const historyTxs = history.data || [];

  const webTopInset = Platform.OS === "web" ? 67 : 0;

  return (
    <View style={styles.screen}>
      <BackgroundGlow />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 32,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} testID="multisig-back">
            <Ionicons name="arrow-back" size={24} color={Colors.textPrimary} />
          </Pressable>
          <GradientText
            text="Multi-Sig Vault"
            style={styles.headerTitle}
          />
          <View style={{ width: 24 }} />
        </View>

        {isLoading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !vaultData ? (
          <GlassCard style={styles.emptyCard}>
            <Ionicons name="shield-half" size={48} color={Colors.textTertiary} />
            <Text style={styles.emptyText}>
              No multi-sig vault found for your account
            </Text>
          </GlassCard>
        ) : (
          <>
            <GlassCard glow style={styles.vaultCard}>
              <View style={styles.vaultHeader}>
                <Ionicons name="shield-checkmark" size={28} color={Colors.primary} />
                <View style={styles.vaultHeaderText}>
                  <Text style={styles.vaultName}>{vaultData.vaultName}</Text>
                  <Text style={styles.vaultThreshold}>
                    {vaultData.threshold} of {(vaultData.coSigners || []).length} required
                  </Text>
                </View>
              </View>

              <View style={styles.cosignerSection}>
                <Text style={styles.sectionLabel}>Co-Signers</Text>
                {(vaultData.coSigners || []).map((signer: any, i: number) => (
                  <View key={i} style={styles.cosignerRow}>
                    <View
                      style={[
                        styles.cosignerDot,
                        styles.cosignerActive,
                      ]}
                    />
                    <Text style={styles.cosignerLabel}>{signer.label || signer.email || `Signer ${i + 1}`}</Text>
                    <Text style={styles.cosignerAddress} numberOfLines={1}>
                      {signer.address ? `${signer.address.slice(0, 6)}...${signer.address.slice(-4)}` : ""}
                    </Text>
                  </View>
                ))}
              </View>
            </GlassCard>

            <View style={styles.sectionHeader}>
              <Ionicons name="time" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Pending Transactions</Text>
              {pendingTxs.length > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingTxs.length}</Text>
                </View>
              )}
            </View>

            {pendingTxs.length === 0 ? (
              <GlassCard style={styles.emptySection}>
                <Ionicons name="checkmark-circle" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptySectionText}>
                  No pending transactions
                </Text>
              </GlassCard>
            ) : (
              pendingTxs.map((tx) => (
                <PendingTxCard
                  key={tx.id}
                  tx={tx}
                  threshold={vaultData.threshold}
                  coSignerCount={(vaultData.coSigners || []).length}
                />
              ))
            )}

            <View style={styles.sectionHeader}>
              <Ionicons name="receipt" size={20} color={Colors.primary} />
              <Text style={styles.sectionTitle}>Transaction History</Text>
            </View>

            {historyTxs.length === 0 ? (
              <GlassCard style={styles.emptySection}>
                <Ionicons name="document-text" size={32} color={Colors.textTertiary} />
                <Text style={styles.emptySectionText}>
                  No completed transactions yet
                </Text>
              </GlassCard>
            ) : (
              historyTxs.map((tx) => (
                <HistoryTxCard key={tx.id} tx={tx} />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    maxWidth: 720,
    width: "100%" as const,
    alignSelf: "center" as const,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 24,
  },
  headerTitle: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  loadingWrap: {
    paddingTop: 80,
    alignItems: "center" as const,
  },
  emptyCard: {
    marginTop: 40,
    alignItems: "center" as const,
  },
  emptyText: {
    color: Colors.textSecondary,
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    marginTop: 16,
    textAlign: "center" as const,
  },
  vaultCard: {
    marginBottom: 24,
  },
  vaultHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 16,
  },
  vaultHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  vaultName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  vaultThreshold: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
    marginTop: 2,
  },
  cosignerSection: {
    marginTop: 4,
  },
  sectionLabel: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 10,
  },
  cosignerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cosignerDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 10,
  },
  cosignerActive: {
    backgroundColor: Colors.success,
  },
  cosignerInactive: {
    backgroundColor: Colors.textTertiary,
  },
  cosignerLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  cosignerAddress: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    maxWidth: 120,
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 12,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginLeft: 8,
    flex: 1,
  },
  badge: {
    backgroundColor: Colors.primary,
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
    minWidth: 22,
    alignItems: "center" as const,
  },
  badgeText: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    color: Colors.background,
  },
  emptySection: {
    alignItems: "center" as const,
    paddingVertical: 24,
    marginBottom: 16,
  },
  emptySectionText: {
    color: Colors.textTertiary,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    marginTop: 8,
  },
  txCard: {
    marginBottom: 12,
  },
  txHeader: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
    marginBottom: 8,
  },
  txInfo: {
    flex: 1,
  },
  txAmount: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
  },
  txDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    marginTop: 2,
  },
  txStatusBadge: {
    backgroundColor: "rgba(245,158,11,0.15)",
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  statusCompleted: {
    backgroundColor: "rgba(16,185,129,0.15)",
  },
  statusRejected: {
    backgroundColor: "rgba(239,68,68,0.15)",
  },
  txStatusText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.warning,
    textTransform: "capitalize" as const,
  },
  statusCompletedText: {
    color: Colors.success,
  },
  statusRejectedText: {
    color: Colors.error,
  },
  txDest: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    marginBottom: 10,
  },
  txDestText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    marginLeft: 6,
    flex: 1,
  },
  sigProgress: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  sigProgressText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textSecondary,
  },
  sigDots: {
    flexDirection: "row" as const,
    gap: 4,
  },
  sigDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  sigDotSigned: {
    backgroundColor: Colors.success,
  },
  sigDotPending: {
    backgroundColor: Colors.textTertiary,
  },
  signerList: {
    marginTop: 4,
  },
  signerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 5,
  },
  signerIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 8,
  },
  signerSigned: {
    backgroundColor: Colors.success,
  },
  signerPending: {
    backgroundColor: Colors.textTertiary,
  },
  signerLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
    flex: 1,
  },
  signerStatus: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  txActions: {
    flexDirection: "row" as const,
    gap: 10,
    marginTop: 12,
  },
  approveBtn: {
    flex: 1,
  },
  rejectBtn: {
    flex: 1,
  },
});
