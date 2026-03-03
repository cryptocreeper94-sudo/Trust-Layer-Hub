import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  Alert,
  Modal,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { GradientButton } from "@/components/GradientButton";
import { useStripeDashboard, useConnectStripe, useDisconnectStripe } from "@/hooks/useStripeBusiness";
import { useAuth } from "@/lib/auth-context";

function formatCurrency(amount: number, currency: string = "usd") {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(amount);
}

function StatusBadge({ status }: { status: string }) {
  const color = status === "succeeded" || status === "paid" ? Colors.success :
    status === "pending" || status === "in_transit" ? "#f59e0b" :
    status === "failed" || status === "canceled" ? Colors.error :
    Colors.textMuted;

  return (
    <View style={[styles.statusBadge, { borderColor: color }]}>
      <Text style={[styles.statusText, { color }]}>{status}</Text>
    </View>
  );
}

export default function StripeDashboardScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { isAuthenticated } = useAuth();
  const { data: dashboard, isLoading } = useStripeDashboard();
  const connectMutation = useConnectStripe();
  const disconnectMutation = useDisconnectStripe();
  const [showConnectModal, setShowConnectModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [businessNameInput, setBusinessNameInput] = useState("");

  const balance = dashboard?.balance || { available: 0, pending: 0, currency: "usd" };
  const stats = dashboard?.stats || { totalRevenue: 0, totalPayouts: 0, activeSubscriptions: 0, totalCustomers: 0 };
  const recentPayments = dashboard?.recentPayments || [];
  const recentPayouts = dashboard?.recentPayouts || [];

  if (!isAuthenticated) {
    return (
      <View style={styles.container}>
        <BackgroundGlow />
        <View style={[styles.centered, { paddingTop: insets.top + webTopInset + 80 }]}>
          <Ionicons name="card" size={48} color={Colors.primary} />
          <Text style={styles.emptyTitle}>Stripe Dashboard</Text>
          <Text style={styles.emptyText}>Sign in to connect your Stripe account</Text>
          <GradientButton title="Sign In" onPress={() => router.push("/login")} style={{ marginTop: 20 }} testID="stripe-sign-in" />
        </View>
      </View>
    );
  }

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
          <Pressable onPress={() => router.back()} hitSlop={8} testID="stripe-back">
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
          <GradientText text="Stripe Dashboard" style={styles.screenTitle} />
          <View style={{ width: 24 }} />
        </View>

        {!dashboard?.configured ? (
          <GlassCard glow>
            <View style={styles.setupSection}>
              <View style={styles.stripeIcon}>
                <Ionicons name="card" size={32} color="#635bff" />
              </View>
              <Text style={styles.setupTitle}>Connect Your Stripe Account</Text>
              <Text style={styles.setupDesc}>
                View your business transactions, balances, and payouts right from Trust Layer Hub.
                Add your Stripe API keys to get started.
              </Text>
              <GradientButton
                title="Connect Stripe"
                onPress={() => setShowConnectModal(true)}
                colors={["#635bff", "#7c3aed"]}
                testID="connect-stripe"
              />
            </View>
          </GlassCard>
        ) : (
          <>
            <GlassCard glow>
              <View style={styles.balanceHeader}>
                <View>
                  <Text style={styles.balanceLabel}>Available Balance</Text>
                  <Text style={styles.balanceValue}>
                    {formatCurrency(balance.available, balance.currency)}
                  </Text>
                </View>
                <View style={styles.stripeLogo}>
                  <Ionicons name="card" size={24} color="#635bff" />
                </View>
              </View>
              {balance.pending > 0 && (
                <Text style={styles.pendingBalance}>
                  {formatCurrency(balance.pending, balance.currency)} pending
                </Text>
              )}
            </GlassCard>

            <View style={styles.statsGrid}>
              <GlassCard style={styles.statCard}>
                <Ionicons name="trending-up" size={18} color={Colors.success} />
                <Text style={[styles.statValue, { color: Colors.success }]}>
                  {formatCurrency(stats.totalRevenue)}
                </Text>
                <Text style={styles.statLabel}>Revenue</Text>
              </GlassCard>
              <GlassCard style={styles.statCard}>
                <Ionicons name="arrow-up-circle" size={18} color={Colors.primary} />
                <Text style={styles.statValue}>
                  {formatCurrency(stats.totalPayouts)}
                </Text>
                <Text style={styles.statLabel}>Payouts</Text>
              </GlassCard>
            </View>

            {recentPayments.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="receipt" size={18} color={Colors.primary} />
                  <GradientText text="Recent Payments" style={styles.sectionTitle} />
                </View>
                <GlassCard>
                  {recentPayments.slice(0, 5).map((payment: any, i: number) => (
                    <View key={payment.id}>
                      {i > 0 && <View style={styles.divider} />}
                      <View style={styles.txRow}>
                        <View style={styles.txLeft}>
                          <Text style={styles.txDescription} numberOfLines={1}>
                            {payment.description || payment.customerEmail || "Payment"}
                          </Text>
                          <Text style={styles.txDate}>
                            {new Date(payment.createdAt).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.txRight}>
                          <Text style={styles.txAmount}>
                            {formatCurrency(payment.amount, payment.currency)}
                          </Text>
                          <StatusBadge status={payment.status} />
                        </View>
                      </View>
                    </View>
                  ))}
                </GlassCard>
              </>
            )}

            {recentPayouts.length > 0 && (
              <>
                <View style={styles.sectionHeader}>
                  <Ionicons name="arrow-up" size={18} color={Colors.success} />
                  <GradientText text="Recent Payouts" style={styles.sectionTitle} />
                </View>
                <GlassCard>
                  {recentPayouts.slice(0, 5).map((payout: any, i: number) => (
                    <View key={payout.id}>
                      {i > 0 && <View style={styles.divider} />}
                      <View style={styles.txRow}>
                        <View style={styles.txLeft}>
                          <Text style={styles.txDescription}>Payout</Text>
                          <Text style={styles.txDate}>
                            Arrives {new Date(payout.arrivalDate).toLocaleDateString()}
                          </Text>
                        </View>
                        <View style={styles.txRight}>
                          <Text style={[styles.txAmount, { color: Colors.success }]}>
                            {formatCurrency(payout.amount, payout.currency)}
                          </Text>
                          <StatusBadge status={payout.status} />
                        </View>
                      </View>
                    </View>
                  ))}
                </GlassCard>
              </>
            )}

            {recentPayments.length === 0 && recentPayouts.length === 0 && (
              <GlassCard>
                <View style={styles.emptyDash}>
                  <Ionicons name="analytics" size={32} color={Colors.textMuted} />
                  <Text style={styles.emptyDashTitle}>No Activity Yet</Text>
                  <Text style={styles.emptyDashText}>
                    Your Stripe transactions and payouts will appear here once you start processing payments.
                  </Text>
                </View>
              </GlassCard>
            )}

            <Pressable
              style={styles.disconnectRow}
              onPress={() => {
                Alert.alert("Disconnect Stripe", "Are you sure you want to disconnect your Stripe account?", [
                  { text: "Cancel", style: "cancel" },
                  { text: "Disconnect", style: "destructive", onPress: () => disconnectMutation.mutate() },
                ]);
              }}
              testID="disconnect-stripe"
            >
              <Ionicons name="unlink" size={16} color={Colors.error} />
              <Text style={styles.disconnectText}>Disconnect Stripe Account</Text>
            </Pressable>
          </>
        )}
      </ScrollView>

      <Modal visible={showConnectModal} transparent animationType="slide" onRequestClose={() => setShowConnectModal(false)}>
        <Pressable style={styles.modalOverlay} onPress={() => setShowConnectModal(false)}>
          <Pressable style={[styles.modalContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalGrabber} />
            <Text style={styles.modalTitle}>Connect Stripe Account</Text>
            <Text style={styles.modalDesc}>
              Enter your Stripe Secret Key to connect your business account. Your key is stored securely and only used to fetch your data.
            </Text>
            <Text style={styles.inputLabel}>Business Name</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your Business"
              placeholderTextColor={Colors.textMuted}
              value={businessNameInput}
              onChangeText={setBusinessNameInput}
              testID="stripe-business-name-input"
            />
            <Text style={styles.inputLabel}>Stripe Secret Key</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="sk_live_..."
              placeholderTextColor={Colors.textMuted}
              value={apiKeyInput}
              onChangeText={setApiKeyInput}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry
              testID="stripe-api-key-input"
            />
            <Text style={styles.keyHint}>
              Find your key at dashboard.stripe.com/apikeys
            </Text>
            <GradientButton
              title="Connect"
              onPress={() => {
                if (!apiKeyInput.startsWith("sk_")) {
                  Alert.alert("Invalid Key", "Please enter a valid Stripe secret key (starts with sk_).");
                  return;
                }
                connectMutation.mutate(
                  { businessName: businessNameInput || "My Business", stripeSecretKey: apiKeyInput },
                  {
                    onSuccess: () => {
                      setShowConnectModal(false);
                      setApiKeyInput("");
                      setBusinessNameInput("");
                      Alert.alert("Connected", "Your Stripe account has been connected.");
                    },
                    onError: () => {
                      Alert.alert("Error", "Failed to connect. Please check your API key and try again.");
                    },
                  }
                );
              }}
              colors={["#635bff", "#7c3aed"]}
              loading={connectMutation.isPending}
              testID="stripe-connect-confirm"
            />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, gap: 12 },
  centered: { flex: 1, alignItems: "center" as const, justifyContent: "center" as const, paddingHorizontal: 24, gap: 12 },
  emptyTitle: { fontSize: 22, color: Colors.textPrimary, fontFamily: "Inter_700Bold", fontWeight: "700" as const, marginTop: 12 },
  emptyText: { fontSize: 15, color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" as const },
  headerRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "space-between" as const, marginBottom: 8 },
  screenTitle: { fontSize: 22, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  setupSection: { alignItems: "center" as const, gap: 12, paddingVertical: 12 },
  stripeIcon: { width: 56, height: 56, borderRadius: 16, backgroundColor: "rgba(99,91,255,0.1)", borderWidth: 1, borderColor: "rgba(99,91,255,0.2)", alignItems: "center" as const, justifyContent: "center" as const },
  setupTitle: { fontSize: 18, color: Colors.textPrimary, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  setupDesc: { fontSize: 14, color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" as const, lineHeight: 20 },
  balanceHeader: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "flex-start" as const },
  balanceLabel: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular" },
  balanceValue: { fontSize: 28, color: Colors.textPrimary, fontFamily: "Inter_700Bold", fontWeight: "700" as const, marginTop: 2 },
  pendingBalance: { fontSize: 13, color: "#f59e0b", fontFamily: "Inter_500Medium", marginTop: 4 },
  stripeLogo: { width: 40, height: 40, borderRadius: 10, backgroundColor: "rgba(99,91,255,0.1)", alignItems: "center" as const, justifyContent: "center" as const },
  statsGrid: { flexDirection: "row" as const, gap: 8 },
  statCard: { flex: 1, alignItems: "center" as const, gap: 4, padding: 14 },
  statValue: { fontSize: 18, color: Colors.textPrimary, fontFamily: "Inter_700Bold", fontWeight: "700" as const },
  statLabel: { fontSize: 11, color: Colors.textTertiary, fontFamily: "Inter_500Medium", textTransform: "uppercase" as const, letterSpacing: 0.5 },
  sectionHeader: { flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginTop: 4 },
  sectionTitle: { fontSize: 17, fontFamily: "Inter_600SemiBold" },
  txRow: { flexDirection: "row" as const, justifyContent: "space-between" as const, alignItems: "center" as const, paddingVertical: 10, minHeight: 48 },
  txLeft: { flex: 1, marginRight: 12 },
  txDescription: { fontSize: 14, color: Colors.textPrimary, fontFamily: "Inter_500Medium" },
  txDate: { fontSize: 12, color: Colors.textTertiary, fontFamily: "Inter_400Regular", marginTop: 2 },
  txRight: { alignItems: "flex-end" as const, gap: 4 },
  txAmount: { fontSize: 15, color: Colors.textPrimary, fontFamily: "Inter_600SemiBold" },
  statusBadge: { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  statusText: { fontSize: 10, fontFamily: "Inter_600SemiBold", textTransform: "capitalize" as const },
  divider: { height: 1, backgroundColor: Colors.border },
  emptyDash: { alignItems: "center" as const, gap: 8, paddingVertical: 20 },
  emptyDashTitle: { fontSize: 16, color: Colors.textPrimary, fontFamily: "Inter_600SemiBold" },
  emptyDashText: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" as const, lineHeight: 19 },
  disconnectRow: { flexDirection: "row" as const, alignItems: "center" as const, justifyContent: "center" as const, gap: 6, paddingVertical: 14 },
  disconnectText: { fontSize: 14, color: Colors.error, fontFamily: "Inter_500Medium" },
  modalOverlay: { flex: 1, justifyContent: "flex-end" as const, backgroundColor: "rgba(0,0,0,0.6)" },
  modalContent: { backgroundColor: Colors.surfaceSolid, borderTopLeftRadius: 24, borderTopRightRadius: 24, paddingHorizontal: 20, paddingTop: 12, gap: 12 },
  modalGrabber: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.border, alignSelf: "center" as const, marginBottom: 8 },
  modalTitle: { fontSize: 20, color: Colors.textPrimary, fontFamily: "Inter_700Bold", fontWeight: "700" as const, textAlign: "center" as const },
  modalDesc: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_400Regular", textAlign: "center" as const, lineHeight: 19 },
  inputLabel: { fontSize: 13, color: Colors.textSecondary, fontFamily: "Inter_500Medium", marginTop: 4 },
  modalInput: { backgroundColor: "rgba(255,255,255,0.05)", borderWidth: 1, borderColor: Colors.border, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, color: Colors.textPrimary, fontFamily: "Inter_400Regular", fontSize: 15 },
  keyHint: { fontSize: 11, color: Colors.textMuted, fontFamily: "Inter_400Regular" },
});
