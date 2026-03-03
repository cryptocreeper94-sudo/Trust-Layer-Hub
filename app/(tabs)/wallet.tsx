import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Alert,
  Pressable,
  useWindowDimensions,
  Linking,
  Modal,
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
import { usePlaidAccounts, useUnlinkAccount, useCreateLinkToken, useExchangePlaidToken } from "@/hooks/usePlaidAccounts";
import { useExternalWallets, useConnectWallet, useDisconnectWallet } from "@/hooks/useExternalWallets";
import { useAuth } from "@/lib/auth-context";

type TxFilter = "all" | "trustlayer" | "banks" | "crypto";

function PortfolioBreakdownBar({ crypto, bank, external }: { crypto: number; bank: number; external: number }) {
  const total = crypto + bank + external;
  if (total <= 0) return null;
  return (
    <View style={styles.breakdownBar}>
      {crypto > 0 && (
        <View style={[styles.breakdownSegment, { flex: crypto / total, backgroundColor: Colors.primary }]} />
      )}
      {bank > 0 && (
        <View style={[styles.breakdownSegment, { flex: bank / total, backgroundColor: Colors.success }]} />
      )}
      {external > 0 && (
        <View style={[styles.breakdownSegment, { flex: external / total, backgroundColor: Colors.secondary }]} />
      )}
    </View>
  );
}

function BreakdownLegend({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={styles.legendRow}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
      <Text style={styles.legendValue}>{value}</Text>
    </View>
  );
}

function LinkedAccountCard({
  account,
  onUnlink,
}: {
  account: { id: number; institutionName: string; accountType: string; accountMask: string; balance: string };
  onUnlink: () => void;
}) {
  const iconName = account.accountType === "credit" ? "card" : "business";
  return (
    <View style={styles.linkedRow}>
      <View style={[styles.linkedIcon, { backgroundColor: "rgba(16,185,129,0.12)" }]}>
        <Ionicons name={iconName as any} size={18} color={Colors.success} />
      </View>
      <View style={styles.linkedInfo}>
        <Text style={styles.linkedName}>{account.institutionName || "Bank Account"}</Text>
        <Text style={styles.linkedMeta}>
          {account.accountType} {"\u00B7"} ****{account.accountMask}
        </Text>
      </View>
      <View style={styles.linkedRight}>
        <Text style={styles.linkedBalance}>${parseFloat(account.balance || "0").toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
        <Pressable onPress={onUnlink} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

function WalletCard({
  wallet,
  onDisconnect,
}: {
  wallet: { id: number; address: string; chain: string; walletType: string; label: string };
  onDisconnect: () => void;
}) {
  const chainIcon = wallet.chain === "solana" ? "planet" : "cube";
  const chainColor = wallet.chain === "solana" ? "#9945FF" : "#627EEA";
  const shortAddr = wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4);
  return (
    <View style={styles.linkedRow}>
      <View style={[styles.linkedIcon, { backgroundColor: `${chainColor}18` }]}>
        <Ionicons name={chainIcon as any} size={18} color={chainColor} />
      </View>
      <View style={styles.linkedInfo}>
        <Text style={styles.linkedName}>{wallet.label || wallet.walletType}</Text>
        <Text style={styles.linkedMeta}>
          {wallet.chain.toUpperCase()} {"\u00B7"} {shortAddr}
        </Text>
      </View>
      <View style={styles.linkedRight}>
        <Pressable onPress={onDisconnect} hitSlop={8}>
          <Ionicons name="close-circle-outline" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

function TransactionItem({ tx }: { tx: { id: string; type: string; amount: number; asset: string; from: string; txHash: string; createdAt: string; source?: string } }) {
  const iconName = tx.type === "received" ? "arrow-down" :
    tx.type === "sent" ? "arrow-up" :
    tx.type === "staked" ? "lock-closed" :
    tx.type === "deposit" ? "arrow-down" :
    tx.type === "withdrawal" ? "arrow-up" : "cart";
  const iconColor = tx.type === "received" || tx.type === "deposit" ? Colors.success :
    tx.type === "sent" || tx.type === "withdrawal" ? Colors.error :
    tx.type === "staked" ? Colors.secondary : Colors.primary;
  const prefix = tx.type === "received" || tx.type === "deposit" ? "+" :
    tx.type === "sent" || tx.type === "withdrawal" ? "-" : "";
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
        <Text style={styles.txMeta}>{tx.from || tx.txHash}</Text>
      </View>
      <View style={styles.txRight}>
        <Text style={[styles.txAmount, { color: iconColor }]}>
          {prefix}{typeof tx.amount === "number" ? tx.amount.toLocaleString() : tx.amount} {tx.asset}
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

function ConnectWalletModal({
  visible,
  onClose,
  onConnect,
}: {
  visible: boolean;
  onClose: () => void;
  onConnect: (type: "walletconnect" | "phantom") => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
          <Text style={styles.modalTitle}>Connect External Wallet</Text>
          <Pressable
            style={styles.walletOption}
            onPress={() => onConnect("walletconnect")}
            testID="connect-walletconnect"
          >
            <View style={[styles.walletOptionIcon, { backgroundColor: "rgba(98,126,234,0.12)" }]}>
              <Ionicons name="cube" size={24} color="#627EEA" />
            </View>
            <View style={styles.walletOptionInfo}>
              <Text style={styles.walletOptionTitle}>WalletConnect</Text>
              <Text style={styles.walletOptionDesc}>MetaMask, Trust Wallet, Rainbow & more</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>
          <Pressable
            style={styles.walletOption}
            onPress={() => onConnect("phantom")}
            testID="connect-phantom"
          >
            <View style={[styles.walletOptionIcon, { backgroundColor: "rgba(153,69,255,0.12)" }]}>
              <Ionicons name="planet" size={24} color="#9945FF" />
            </View>
            <View style={styles.walletOptionInfo}>
              <Text style={styles.walletOptionTitle}>Phantom</Text>
              <Text style={styles.walletOptionDesc}>Solana wallet via deeplink</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </Pressable>
          <Pressable style={styles.modalCancel} onPress={onClose}>
            <Text style={styles.modalCancelText}>Cancel</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { user } = useAuth();

  const { data: balance } = useBalance();
  const { data: shells } = useShellBalance();
  const { data: dwcBag } = useDwcBag();
  const { data: transactions } = useTransactions();
  const { data: plaidAccounts } = usePlaidAccounts();
  const { data: externalWallets } = useExternalWallets();
  const unlinkAccount = useUnlinkAccount();
  const disconnectWallet = useDisconnectWallet();
  const connectWallet = useConnectWallet();
  const createLinkToken = useCreateLinkToken();
  const exchangePlaidToken = useExchangePlaidToken();

  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [showWalletModal, setShowWalletModal] = useState(false);

  const sigBalance = balance?.sig || 0;
  const stSigBalance = balance?.stSig || 0;
  const shellBalance = shells || 0;
  const portfolioValue = dwcBag?.currentValue || 0;
  const allTxList = transactions || [];

  const filteredTxList = txFilter === "all" ? allTxList :
    txFilter === "trustlayer" ? allTxList.filter((tx: any) => !tx.source || tx.source === "trustlayer") :
    txFilter === "banks" ? allTxList.filter((tx: any) => tx.source === "bank") :
    txFilter === "crypto" ? allTxList.filter((tx: any) => tx.source === "crypto") :
    allTxList;

  const bankTotal = (plaidAccounts || []).reduce((sum: number, a: any) => sum + parseFloat(a.balance || "0"), 0);
  const cryptoTotal = portfolioValue;
  const externalTotal = (externalWallets || []).length * 0;
  const netWorth = cryptoTotal + bankTotal + externalTotal;

  const handlePurchase = (tierName: string) => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert(
      "Purchase Shells",
      `You're about to purchase the ${tierName} tier. This will use your platform's in-app purchase system.`,
      [{ text: "Cancel", style: "cancel" }, { text: "Continue", style: "default" }]
    );
  };

  const handleLinkBank = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Link Bank Account",
      "Connect your bank account securely through Plaid. Your credentials are never stored by Trust Layer.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          onPress: () => {
            createLinkToken.mutate(undefined, {
              onSuccess: (data) => {
                if (data?.linkToken) {
                  Alert.alert(
                    "Plaid Link Ready",
                    "Plaid Link token created successfully. In production, this opens the Plaid Link UI. For sandbox testing, a demo public token will be exchanged.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Connect Demo",
                        onPress: () => {
                          exchangePlaidToken.mutate("public-sandbox-demo-token");
                        },
                      },
                    ]
                  );
                } else {
                  Alert.alert("Plaid Not Configured", "Plaid API keys (PLAID_CLIENT_ID, PLAID_SECRET) need to be set up to link bank accounts.");
                }
              },
              onError: () => {
                Alert.alert("Plaid Not Available", "Plaid integration is not configured yet. Set PLAID_CLIENT_ID and PLAID_SECRET to enable bank linking.");
              },
            });
          },
        },
      ]
    );
  };

  const handleUnlinkAccount = (id: number, name: string) => {
    Alert.alert("Unlink Account", `Remove ${name} from your wallet?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Remove",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          unlinkAccount.mutate(id);
        },
      },
    ]);
  };

  const handleConnectExternalWallet = (type: "walletconnect" | "phantom") => {
    setShowWalletModal(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    if (type === "phantom") {
      const demoAddress = "7xKX" + "a3b9" + Date.now().toString(36).slice(-8) + "PhNt";
      connectWallet.mutate({
        address: demoAddress,
        chain: "solana",
        walletType: "phantom",
        label: "Phantom",
      });
      Alert.alert("Phantom Connected", "Demo Solana wallet connected. In production, this will deeplink to the Phantom app for approval.");
    } else {
      const demoAddress = "0x" + Date.now().toString(16).padStart(40, "a").slice(0, 40);
      connectWallet.mutate({
        address: demoAddress,
        chain: "ethereum",
        walletType: "walletconnect",
        label: "WalletConnect",
      });
      Alert.alert("WalletConnect", "Demo Ethereum wallet connected. In production, this will open WalletConnect to pair with your wallet.");
    }
  };

  const handleDisconnectWallet = (id: number, label: string) => {
    Alert.alert("Disconnect Wallet", `Remove ${label} from your wallet?`, [
      { text: "Cancel", style: "cancel" },
      {
        text: "Disconnect",
        style: "destructive",
        onPress: () => {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
          disconnectWallet.mutate(id);
        },
      },
    ]);
  };

  const filterButtons: { key: TxFilter; label: string }[] = [
    { key: "all", label: "All" },
    { key: "trustlayer", label: "Trust Layer" },
    { key: "banks", label: "Banks" },
    { key: "crypto", label: "Crypto" },
  ];

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
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <GradientText text="Wallet" style={styles.screenTitle} />

        <GlassCard glow>
          <Text style={styles.portfolioLabel}>Total Portfolio</Text>
          <Text style={styles.portfolioValue}>
            ${netWorth.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
          <PortfolioBreakdownBar crypto={cryptoTotal} bank={bankTotal} external={externalTotal} />
          <View style={styles.legendContainer}>
            <BreakdownLegend
              label="Trust Layer"
              value={`$${cryptoTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              color={Colors.primary}
            />
            <BreakdownLegend
              label="Bank Accounts"
              value={`$${bankTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              color={Colors.success}
            />
            {externalTotal > 0 && (
              <BreakdownLegend
                label="External Wallets"
                value={`$${externalTotal.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
                color={Colors.secondary}
              />
            )}
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="diamond" size={18} color={Colors.primary} />
          <GradientText text="Trust Layer Wallet" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <View style={styles.assetRow}>
            <View style={[styles.assetIcon, { backgroundColor: "rgba(0,255,255,0.1)" }]}>
              <Ionicons name="diamond" size={18} color={Colors.primary} />
            </View>
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>Signal (SIG)</Text>
              <Text style={styles.assetMeta}>Native Asset</Text>
            </View>
            <View style={styles.assetRight}>
              <Text style={styles.assetBalance}>{sigBalance.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
              <Text style={styles.assetFiat}>${portfolioValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.assetRow}>
            <View style={[styles.assetIcon, { backgroundColor: "rgba(147,51,234,0.1)" }]}>
              <Ionicons name="ellipse" size={18} color={Colors.secondary} />
            </View>
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>Shells</Text>
              <Text style={styles.assetMeta}>1 Shell = $0.001</Text>
            </View>
            <View style={styles.assetRight}>
              <Text style={styles.assetBalance}>{shellBalance.toLocaleString()}</Text>
              <Text style={styles.assetFiat}>${(shellBalance * 0.001).toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.assetRow}>
            <View style={[styles.assetIcon, { backgroundColor: "rgba(16,185,129,0.1)" }]}>
              <Ionicons name="lock-closed" size={18} color={Colors.success} />
            </View>
            <View style={styles.assetInfo}>
              <Text style={styles.assetName}>Staked SIG (stSIG)</Text>
              <Text style={styles.assetMeta}>Locked</Text>
            </View>
            <View style={styles.assetRight}>
              <Text style={styles.assetBalance}>{stSigBalance.toLocaleString()}</Text>
            </View>
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="business" size={18} color={Colors.success} />
          <GradientText text="Bank Accounts" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          {(plaidAccounts || []).length > 0 ? (
            (plaidAccounts || []).map((account, i) => (
              <React.Fragment key={account.id}>
                <LinkedAccountCard
                  account={account}
                  onUnlink={() => handleUnlinkAccount(account.id, account.institutionName || "Account")}
                />
                {i < (plaidAccounts || []).length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="business-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No bank accounts linked</Text>
              <Text style={styles.emptySubtext}>Connect your bank to see all balances in one place</Text>
            </View>
          )}
          <Pressable
            style={styles.connectButton}
            onPress={handleLinkBank}
            testID="link-bank-button"
          >
            <Ionicons name="add-circle" size={20} color={Colors.success} />
            <Text style={styles.connectButtonText}>Link Bank Account</Text>
          </Pressable>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="wallet" size={18} color={Colors.secondary} />
          <GradientText text="External Wallets" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          {(externalWallets || []).length > 0 ? (
            (externalWallets || []).map((wallet, i) => (
              <React.Fragment key={wallet.id}>
                <WalletCard
                  wallet={wallet}
                  onDisconnect={() => handleDisconnectWallet(wallet.id, wallet.label || wallet.walletType)}
                />
                {i < (externalWallets || []).length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="wallet-outline" size={28} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No external wallets connected</Text>
              <Text style={styles.emptySubtext}>Link MetaMask, Phantom, or other wallets</Text>
            </View>
          )}
          <Pressable
            style={styles.connectButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowWalletModal(true);
            }}
            testID="connect-wallet-button"
          >
            <Ionicons name="add-circle" size={20} color={Colors.secondary} />
            <Text style={[styles.connectButtonText, { color: Colors.secondary }]}>Connect Wallet</Text>
          </Pressable>
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
          {SHELL_TIERS.map((tier) => (
            <ShellTierCard
              key={tier.name}
              tier={tier}
              onPurchase={() => handlePurchase(tier.name)}
            />
          ))}
        </ScrollView>

        <View style={styles.sectionHeader}>
          <GradientText text="Transactions" style={styles.sectionTitle} />
        </View>
        <View style={styles.filterRow}>
          {filterButtons.map((f) => (
            <Pressable
              key={f.key}
              style={[styles.filterChip, txFilter === f.key && styles.filterChipActive]}
              onPress={() => {
                Haptics.selectionAsync();
                setTxFilter(f.key);
              }}
            >
              <Text style={[styles.filterChipText, txFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <GlassCard>
          {filteredTxList.length > 0 ? (
            filteredTxList.map((tx: any, i: number) => (
              <React.Fragment key={tx.id}>
                <TransactionItem tx={tx} />
                {i < filteredTxList.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))
          ) : (
            <View style={styles.emptySection}>
              <Ionicons name="receipt-outline" size={24} color={Colors.textMuted} />
              <Text style={styles.emptyText}>No transactions yet</Text>
            </View>
          )}
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark" size={18} color={Colors.primary} />
          <GradientText text="Identity" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <View style={styles.idRow}>
            <View style={[styles.idBadge, { backgroundColor: "rgba(0,255,255,0.1)" }]}>
              <Ionicons name="finger-print" size={22} color={Colors.primary} />
            </View>
            <View style={styles.idInfo}>
              <Text style={styles.idLabel}>Trust Layer ID</Text>
              <Text style={styles.idValue}>{user?.username || "Not set"}.tlid</Text>
            </View>
            <View style={[styles.idVerified, { backgroundColor: "rgba(16,185,129,0.1)" }]}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={styles.idVerifiedText}>Verified</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.idStatsRow}>
            <View style={styles.idStat}>
              <Ionicons name="ribbon" size={16} color={Colors.primary} />
              <Text style={styles.idStatLabel}>Hallmarks</Text>
              <Text style={styles.idStatValue}>Active</Text>
            </View>
            <View style={styles.idStatDivider} />
            <View style={styles.idStat}>
              <Ionicons name="shield-checkmark" size={16} color={Colors.success} />
              <Text style={styles.idStatLabel}>Guardian</Text>
              <Text style={styles.idStatValue}>Protected</Text>
            </View>
            <View style={styles.idStatDivider} />
            <View style={styles.idStat}>
              <Ionicons name="lock-closed" size={16} color={Colors.secondary} />
              <Text style={styles.idStatLabel}>2FA</Text>
              <Text style={styles.idStatValue}>{user?.twoFactorEnabled ? "On" : "Off"}</Text>
            </View>
          </View>
        </GlassCard>
      </ScrollView>

      <ConnectWalletModal
        visible={showWalletModal}
        onClose={() => setShowWalletModal(false)}
        onConnect={handleConnectExternalWallet}
      />
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
    gap: 10,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  portfolioLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  portfolioValue: {
    fontSize: 36,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginTop: 4,
    marginBottom: 12,
  },
  breakdownBar: {
    flexDirection: "row" as const,
    height: 6,
    borderRadius: 3,
    overflow: "hidden" as const,
    gap: 2,
    marginBottom: 12,
  },
  breakdownSegment: {
    borderRadius: 3,
  },
  legendContainer: {
    gap: 6,
  },
  legendRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  legendValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  sectionHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginTop: 8,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  assetRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 6,
  },
  assetIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  assetInfo: {
    flex: 1,
  },
  assetName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  assetMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  assetRight: {
    alignItems: "flex-end" as const,
  },
  assetBalance: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  assetFiat: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  linkedRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 6,
  },
  linkedIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  linkedInfo: {
    flex: 1,
  },
  linkedName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  linkedMeta: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  linkedRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  linkedBalance: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  connectButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 12,
    marginTop: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  connectButtonText: {
    fontSize: 14,
    color: Colors.success,
    fontFamily: "Inter_600SemiBold",
  },
  emptySection: {
    alignItems: "center" as const,
    paddingVertical: 16,
    gap: 6,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
  },
  emptySubtext: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
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
  filterRow: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 4,
  },
  filterChip: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: "rgba(0,255,255,0.1)",
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
  },
  filterChipTextActive: {
    color: Colors.primary,
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
  txMeta: {
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
    marginVertical: 6,
  },
  idRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
  },
  idBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  idInfo: {
    flex: 1,
  },
  idLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  idValue: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    marginTop: 1,
  },
  idVerified: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  idVerifiedText: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: "Inter_500Medium",
  },
  idStatsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    marginTop: 4,
  },
  idStat: {
    alignItems: "center" as const,
    gap: 4,
    flex: 1,
  },
  idStatLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  idStatValue: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  idStatDivider: {
    width: 1,
    backgroundColor: Colors.border,
    alignSelf: "stretch" as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.7)",
    justifyContent: "flex-end" as const,
  },
  modalContent: {
    backgroundColor: Colors.surfaceSolid,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    paddingBottom: 40,
  },
  modalTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginBottom: 20,
  },
  walletOption: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 14,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  walletOptionIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  walletOptionInfo: {
    flex: 1,
  },
  walletOptionTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  walletOptionDesc: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  modalCancel: {
    alignItems: "center" as const,
    paddingVertical: 14,
    marginTop: 8,
  },
  modalCancelText: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
});
