import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Platform,
  Alert,
  Pressable,
  useWindowDimensions,
  Modal,
  TextInput,
  RefreshControl,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import * as Clipboard from "expo-clipboard";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { GradientButton } from "@/components/GradientButton";
import { SHELL_TIERS } from "@/constants/mock-data";
import QRCode from "react-native-qrcode-svg";
import { useBalance, useShellBalance, useDwcBag, useTransactions } from "@/hooks/useBalance";
import { usePlaidAccounts, useUnlinkAccount, useCreateLinkToken, useExchangePlaidToken } from "@/hooks/usePlaidAccounts";
import { useExternalWallets, useConnectWallet, useDisconnectWallet, getExternalWalletsTotalUsd } from "@/hooks/useExternalWallets";
import { useStakingInfo, useStake, useUnstake, useClaimRewards, useLiquidStake, useLiquidUnstake } from "@/hooks/useStaking";
import { useSendTokens, useReceiveInfo, useSwapTokens } from "@/hooks/useWalletActions";
import { useAuth } from "@/lib/auth-context";
import { queryClient } from "@/lib/query-client";

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

function QuickActionButton({
  icon,
  label,
  color,
  onPress,
  testID,
}: {
  icon: string;
  label: string;
  color: string;
  onPress: () => void;
  testID: string;
}) {
  return (
    <Pressable
      style={styles.quickAction}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      testID={testID}
    >
      <View style={[styles.quickActionCircle, { backgroundColor: `${color}18`, borderColor: `${color}30` }]}>
        <Ionicons name={icon as any} size={22} color={color} />
      </View>
      <Text style={styles.quickActionLabel}>{label}</Text>
    </Pressable>
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
        <Pressable onPress={onUnlink} hitSlop={8} testID={`unlink-bank-${account.id}`}>
          <Ionicons name="close-circle-outline" size={18} color={Colors.textTertiary} />
        </Pressable>
      </View>
    </View>
  );
}

function WalletCard({
  wallet,
  onDisconnect,
  expanded,
  onToggle,
}: {
  wallet: any;
  onDisconnect: () => void;
  expanded: boolean;
  onToggle: () => void;
}) {
  const chainIcon = wallet.chain === "solana" ? "planet" : "cube";
  const chainColor = wallet.chain === "solana" ? "#9945FF" : "#627EEA";
  const shortAddr = wallet.address.slice(0, 6) + "..." + wallet.address.slice(-4);
  const nativeUsd = wallet.balances?.usd ? parseFloat(wallet.balances.usd.replace(/,/g, "")) : 0;
  const nativeBalance = wallet.balances?.native || "0.00";
  const tokens = wallet.balances?.tokens || [];

  return (
    <View>
      <Pressable style={styles.linkedRow} onPress={onToggle}>
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
          <Text style={styles.linkedBalance}>
            ${nativeUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}
          </Text>
          <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 6 }}>
            <Ionicons name={expanded ? "chevron-up" : "chevron-down"} size={14} color={Colors.textTertiary} />
            <Pressable onPress={(e) => { e.stopPropagation(); onDisconnect(); }} hitSlop={8} testID={`disconnect-wallet-${wallet.id}`}>
              <Ionicons name="close-circle-outline" size={18} color={Colors.textTertiary} />
            </Pressable>
          </View>
        </View>
      </Pressable>
      {expanded && (
        <View style={styles.tokenList}>
          <View style={styles.tokenRow}>
            <Text style={styles.tokenSymbol}>{wallet.chain === "solana" ? "SOL" : "ETH"}</Text>
            <Text style={styles.tokenBalance}>{nativeBalance}</Text>
            <Text style={styles.tokenUsd}>${nativeUsd.toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
          </View>
          {tokens.map((tok: any, i: number) => (
            <View key={i} style={styles.tokenRow}>
              <Text style={styles.tokenSymbol}>{tok.symbol}</Text>
              <Text style={styles.tokenBalance}>{tok.balance}</Text>
              <Text style={styles.tokenUsd}>${parseFloat(tok.usd.replace(/,/g, "")).toLocaleString("en-US", { minimumFractionDigits: 2 })}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

function TransactionItem({ tx }: { tx: any }) {
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

function BottomSheetModal({
  visible,
  onClose,
  title,
  children,
}: {
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, 20) + 20;
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable style={[styles.modalContent, { paddingBottom: bottomPad }]} onPress={(e) => e.stopPropagation()}>
          <View style={styles.modalGrabber} />
          <Text style={styles.modalTitle}>{title}</Text>
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function SendModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [recipient, setRecipient] = useState("");
  const [amount, setAmount] = useState("");
  const [asset, setAsset] = useState<"SIG" | "Shells">("SIG");
  const sendMutation = useSendTokens();

  const handleSend = () => {
    const numAmount = parseFloat(amount);
    if (!recipient || !numAmount || numAmount <= 0) {
      Alert.alert("Invalid Input", "Please enter a valid recipient and amount.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    sendMutation.mutate(
      { to: recipient, amount: numAmount, asset },
      {
        onSuccess: (data) => {
          Alert.alert("Sent", data.message || `${numAmount} ${asset} sent to ${recipient}`);
          setRecipient("");
          setAmount("");
          onClose();
        },
        onError: () => Alert.alert("Error", "Failed to send tokens. Please try again."),
      }
    );
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Send">
      <Text style={styles.inputLabel}>Recipient</Text>
      <TextInput
        style={styles.modalInput}
        placeholder="username.tlid"
        placeholderTextColor={Colors.textMuted}
        value={recipient}
        onChangeText={setRecipient}
        autoCapitalize="none"
        testID="send-recipient-input"
      />
      <Text style={styles.inputLabel}>Amount</Text>
      <TextInput
        style={styles.modalInput}
        placeholder="0.00"
        placeholderTextColor={Colors.textMuted}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        testID="send-amount-input"
      />
      <Text style={styles.inputLabel}>Asset</Text>
      <View style={styles.assetPicker}>
        {(["SIG", "Shells"] as const).map((a) => (
          <Pressable
            key={a}
            style={[styles.assetChip, asset === a && styles.assetChipActive]}
            onPress={() => setAsset(a)}
          >
            <Text style={[styles.assetChipText, asset === a && styles.assetChipTextActive]}>{a}</Text>
          </Pressable>
        ))}
      </View>
      <GradientButton
        title="Send"
        onPress={handleSend}
        testID="send-confirm-button"
      />
    </BottomSheetModal>
  );
}

function ReceiveModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const { data: receiveInfo } = useReceiveInfo();

  const handleCopy = async (text: string) => {
    if (!text) return;
    await Clipboard.setStringAsync(text);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    Alert.alert("Copied", "Address copied to clipboard");
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Receive">
      <View style={styles.receiveCenter}>
        <View style={styles.qrContainer}>
          <QRCode
            value={receiveInfo?.tlidAddress || "guest.tlid"}
            size={180}
            backgroundColor="transparent"
            color={Colors.primary}
          />
        </View>
        <Text style={styles.receiveLabel}>Trust Layer ID</Text>
        <Pressable
          style={styles.addressRow}
          onPress={() => handleCopy(receiveInfo?.tlidAddress || "")}
          testID="copy-tlid-address"
        >
          <Text style={styles.addressText}>{receiveInfo?.tlidAddress || "user.tlid"}</Text>
          <Ionicons name="copy-outline" size={18} color={Colors.primary} />
        </Pressable>
        <Text style={styles.receiveLabel}>Blockchain Address</Text>
        <Pressable
          style={styles.addressRow}
          onPress={() => handleCopy(receiveInfo?.hexAddress || "")}
          testID="copy-hex-address"
        >
          <Text style={styles.addressTextSmall} numberOfLines={1} ellipsizeMode="middle">
            {receiveInfo?.hexAddress || "0x..."}
          </Text>
          <Ionicons name="copy-outline" size={18} color={Colors.primary} />
        </Pressable>
        <Text style={styles.supportedAssets}>
          Accepts: {receiveInfo?.supportedAssets?.join(", ") || "SIG, Shells, stSIG"}
        </Text>
      </View>
    </BottomSheetModal>
  );
}

function SwapModal({ visible, onClose }: { visible: boolean; onClose: () => void }) {
  const [fromAsset, setFromAsset] = useState("SIG");
  const [toAsset, setToAsset] = useState("Shells");
  const [amount, setAmount] = useState("");
  const swapMutation = useSwapTokens();

  const SWAP_FEE_RATE = 0.003;
  const rates: Record<string, Record<string, number>> = {
    SIG: { Shells: 1000, stSIG: 1, USDC: 0.01, USDT: 0.01 },
    Shells: { SIG: 0.001, stSIG: 0.001 },
    stSIG: { SIG: 1, Shells: 1000 },
    USDC: { SIG: 100 },
    USDT: { SIG: 100 },
  };
  const rate = rates[fromAsset]?.[toAsset] || 0;
  const numAmount = parseFloat(amount) || 0;
  const fee = numAmount * SWAP_FEE_RATE;
  const outputPreview = (numAmount - fee) * rate;

  const assets = ["SIG", "Shells", "stSIG", "USDC", "USDT"];

  const handleSwap = () => {
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    swapMutation.mutate(
      { fromAsset, toAsset, amount: numAmount },
      {
        onSuccess: (data) => {
          Alert.alert("Swapped", data.message || `Swapped ${numAmount} ${fromAsset} for ${outputPreview} ${toAsset}`);
          setAmount("");
          onClose();
        },
        onError: () => Alert.alert("Error", "Swap failed. Please try again."),
      }
    );
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title="Swap">
      <Text style={styles.inputLabel}>From</Text>
      <View style={styles.assetPicker}>
        {assets.map((a) => (
          <Pressable
            key={a}
            style={[styles.assetChip, fromAsset === a && styles.assetChipActive]}
            onPress={() => {
              setFromAsset(a);
              const availableTo = assets.filter((x) => x !== a && rates[a]?.[x]);
              if (!rates[a]?.[toAsset]) setToAsset(availableTo[0] || "SIG");
            }}
          >
            <Text style={[styles.assetChipText, fromAsset === a && styles.assetChipTextActive]}>{a}</Text>
          </Pressable>
        ))}
      </View>
      <TextInput
        style={styles.modalInput}
        placeholder="0.00"
        placeholderTextColor={Colors.textMuted}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        testID="swap-amount-input"
      />
      <View style={styles.swapArrowContainer}>
        <Pressable
          style={styles.swapArrowButton}
          onPress={() => {
            const temp = fromAsset;
            setFromAsset(toAsset);
            setToAsset(temp);
            Haptics.selectionAsync();
          }}
        >
          <Ionicons name="swap-vertical" size={20} color={Colors.primary} />
        </Pressable>
      </View>
      <Text style={styles.inputLabel}>To</Text>
      <View style={styles.assetPicker}>
        {assets.filter((a) => a !== fromAsset && rates[fromAsset]?.[a]).map((a) => (
          <Pressable
            key={a}
            style={[styles.assetChip, toAsset === a && styles.assetChipActive]}
            onPress={() => setToAsset(a)}
          >
            <Text style={[styles.assetChipText, toAsset === a && styles.assetChipTextActive]}>{a}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.swapPreview}>
        <Text style={styles.swapRate}>1 {fromAsset} = {rate.toLocaleString()} {toAsset}</Text>
        <Text style={styles.swapFeeText}>DEX Fee: 0.3% (30 bps)</Text>
        {numAmount > 0 && (
          <>
            <Text style={styles.swapOutput}>You receive: ~{outputPreview.toLocaleString(undefined, { maximumFractionDigits: 6 })} {toAsset}</Text>
            <Text style={styles.swapFeeAmount}>Fee: {fee.toFixed(6)} {fromAsset}</Text>
          </>
        )}
      </View>
      <GradientButton
        title="Swap"
        onPress={handleSwap}
        testID="swap-confirm-button"
      />
    </BottomSheetModal>
  );
}

function StakeModal({ visible, onClose, initialMode }: { visible: boolean; onClose: () => void; initialMode?: "stake" | "unstake" }) {
  const [amount, setAmount] = useState("");
  const [mode, setMode] = useState<"stake" | "unstake">(initialMode || "stake");
  const [selectedPoolId, setSelectedPoolId] = useState("liquid-flex");
  const prevInitialMode = React.useRef(initialMode);
  React.useEffect(() => {
    if (initialMode && initialMode !== prevInitialMode.current) {
      setMode(initialMode);
      prevInitialMode.current = initialMode;
    }
  }, [initialMode]);
  const { data: stakingInfo } = useStakingInfo();
  const stakeMutation = useStake();
  const unstakeMutation = useUnstake();

  const pools = stakingInfo?.pools || [];
  const selectedPool = pools.find(p => p.id === selectedPoolId) || pools[0];
  const numAmount = parseFloat(amount) || 0;
  const apy = selectedPool ? (selectedPool.baseApy + (selectedPool.boostApy || 0)) : 10;
  const monthlyReward = (numAmount * apy / 100 / 12);
  const yearlyReward = (numAmount * apy / 100);

  const handleConfirm = () => {
    if (!numAmount || numAmount <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    if (mode === "stake" && selectedPool && numAmount < selectedPool.minStake) {
      Alert.alert("Below Minimum", `Minimum stake for ${selectedPool.name} is ${selectedPool.minStake.toLocaleString()} SIG`);
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    if (mode === "stake") {
      stakeMutation.mutate({ amount: numAmount, poolId: selectedPoolId }, {
        onSuccess: (data) => {
          Alert.alert("Staked", data.message || `Staked ${numAmount} SIG`);
          setAmount("");
          onClose();
        },
        onError: () => Alert.alert("Error", "Staking failed."),
      });
    } else {
      unstakeMutation.mutate({ amount: numAmount, poolId: selectedPoolId }, {
        onSuccess: (data) => {
          Alert.alert("Unstaking Initiated", data.message || `Unstaking ${numAmount} stSIG`);
          setAmount("");
          onClose();
        },
        onError: (err: any) => Alert.alert("Error", err?.message || "Unstaking failed."),
      });
    }
  };

  return (
    <BottomSheetModal visible={visible} onClose={onClose} title={mode === "stake" ? "Stake SIG" : "Unstake stSIG"}>
      <View style={styles.stakeModeTabs}>
        <Pressable
          style={[styles.stakeModeTab, mode === "stake" && styles.stakeModeTabActive]}
          onPress={() => setMode("stake")}
        >
          <Text style={[styles.stakeModeTabText, mode === "stake" && styles.stakeModeTabTextActive]}>Stake</Text>
        </Pressable>
        <Pressable
          style={[styles.stakeModeTab, mode === "unstake" && styles.stakeModeTabActive]}
          onPress={() => setMode("unstake")}
        >
          <Text style={[styles.stakeModeTabText, mode === "unstake" && styles.stakeModeTabTextActive]}>Unstake</Text>
        </Pressable>
      </View>
      {mode === "stake" && pools.length > 0 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.poolScroller}>
          {pools.map((pool) => (
            <Pressable
              key={pool.id}
              style={[styles.poolChip, selectedPoolId === pool.id && styles.poolChipActive]}
              onPress={() => { setSelectedPoolId(pool.id); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
              testID={`pool-${pool.id}`}
            >
              <Text style={[styles.poolChipName, selectedPoolId === pool.id && styles.poolChipNameActive]}>{pool.name}</Text>
              <Text style={[styles.poolChipApy, selectedPoolId === pool.id && styles.poolChipApyActive]}>{pool.baseApy}% APY</Text>
              {pool.lockDays > 0 && (
                <Text style={styles.poolChipLock}>{pool.lockDays}d lock</Text>
              )}
            </Pressable>
          ))}
        </ScrollView>
      )}
      <TextInput
        style={styles.modalInput}
        placeholder={mode === "stake" ? `Min ${selectedPool?.minStake?.toLocaleString() || 100} SIG` : "stSIG amount to unstake"}
        placeholderTextColor={Colors.textMuted}
        value={amount}
        onChangeText={setAmount}
        keyboardType="decimal-pad"
        testID="stake-amount-input"
      />
      <View style={styles.stakeInfoCard}>
        <View style={styles.stakeInfoRow}>
          <View style={[styles.apyBadge]}>
            <Text style={styles.apyBadgeText}>{apy}% APY</Text>
          </View>
          <Text style={styles.stakeInfoLabel}>
            {selectedPool?.lockDays ? `${selectedPool.lockDays}-day lock period` : "No lock period"}
          </Text>
        </View>
        {selectedPool?.boostApy ? (
          <Text style={styles.boostText}>+{selectedPool.boostApy}% boost available via Staking Quests</Text>
        ) : null}
        {numAmount > 0 && (
          <View style={styles.rewardPreview}>
            <View style={styles.rewardItem}>
              <Text style={styles.rewardLabel}>Monthly</Text>
              <Text style={styles.rewardValue}>+{monthlyReward.toFixed(2)} SIG</Text>
            </View>
            <View style={styles.rewardDivider} />
            <View style={styles.rewardItem}>
              <Text style={styles.rewardLabel}>Yearly</Text>
              <Text style={styles.rewardValue}>+{yearlyReward.toFixed(2)} SIG</Text>
            </View>
          </View>
        )}
      </View>
      {stakingInfo?.cooldownActive && (
        <View style={styles.cooldownBanner}>
          <Ionicons name="time-outline" size={16} color={Colors.warning} />
          <Text style={styles.cooldownText}>
            Cooldown active: {stakingInfo.cooldownRemaining} days remaining
          </Text>
        </View>
      )}
      <GradientButton
        title={mode === "stake" ? "Stake SIG" : "Unstake stSIG"}
        onPress={handleConfirm}
        colors={mode === "unstake" ? ["#ef4444", "#dc2626"] : Colors.gradientCyan}
        testID="stake-confirm-button"
      />
    </BottomSheetModal>
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
    <BottomSheetModal visible={visible} onClose={onClose} title="Connect External Wallet">
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
    </BottomSheetModal>
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
  const { data: stakingInfo } = useStakingInfo();
  const unlinkAccount = useUnlinkAccount();
  const disconnectWallet = useDisconnectWallet();
  const connectWallet = useConnectWallet();
  const createLinkToken = useCreateLinkToken();
  const exchangePlaidToken = useExchangePlaidToken();

  const [txFilter, setTxFilter] = useState<TxFilter>("all");
  const [showWalletModal, setShowWalletModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [showReceiveModal, setShowReceiveModal] = useState(false);
  const [showSwapModal, setShowSwapModal] = useState(false);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedWalletId, setExpandedWalletId] = useState<number | null>(null);
  const [stakeInitialMode, setStakeInitialMode] = useState<"stake" | "unstake">("stake");

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
  const externalTotal = getExternalWalletsTotalUsd(externalWallets || []);
  const netWorth = cryptoTotal + bankTotal + externalTotal;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["balance"] }),
      queryClient.invalidateQueries({ queryKey: ["shell-balance"] }),
      queryClient.invalidateQueries({ queryKey: ["dwc-bag"] }),
      queryClient.invalidateQueries({ queryKey: ["plaid-accounts"] }),
      queryClient.invalidateQueries({ queryKey: ["external-wallets"] }),
      queryClient.invalidateQueries({ queryKey: ["transactions"] }),
      queryClient.invalidateQueries({ queryKey: ["staking-info"] }),
    ]);
    setTimeout(() => setRefreshing(false), 800);
  }, []);

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
                    "Plaid Link token created. In production, this opens the Plaid Link UI.",
                    [
                      { text: "Cancel", style: "cancel" },
                      {
                        text: "Connect Demo",
                        onPress: () => exchangePlaidToken.mutate("public-sandbox-demo-token"),
                      },
                    ]
                  );
                } else {
                  Alert.alert("Plaid Not Configured", "Plaid API keys need to be set up to link bank accounts.");
                }
              },
              onError: () => {
                Alert.alert("Plaid Not Available", "Plaid integration is not configured yet.");
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
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);

    if (type === "phantom") {
      Alert.alert("Coming Soon", "Phantom wallet integration via Solana deep links is coming in a future update.");
    } else {
      Alert.alert("Coming Soon", "WalletConnect integration for MetaMask, Trust Wallet, and Rainbow is coming in a future update.");
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

  const stakingApy = stakingInfo?.apy || 10;
  const totalStaked = stakingInfo?.totalStaked || stSigBalance;
  const rewardsEarned = stakingInfo?.rewardsEarned || 0;
  const stakedRatio = sigBalance + stSigBalance > 0 ? stSigBalance / (sigBalance + stSigBalance) : 0;
  const activeStakes = stakingInfo?.activeStakes || [];
  const claimRewards = useClaimRewards();
  const liquidStakeMutation = useLiquidStake();
  const liquidUnstakeMutation = useLiquidUnstake();
  const [showLiquidModal, setShowLiquidModal] = useState(false);
  const [liquidMode, setLiquidMode] = useState<"mint" | "redeem">("mint");
  const [liquidAmount, setLiquidAmount] = useState("");

  const handleLiquidConfirm = () => {
    const num = parseFloat(liquidAmount);
    if (!num || num <= 0) {
      Alert.alert("Invalid Amount", "Please enter a valid amount.");
      return;
    }
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    if (liquidMode === "mint") {
      liquidStakeMutation.mutate({ amount: num }, {
        onSuccess: (data) => { Alert.alert("stSIG Minted", data.message); setLiquidAmount(""); setShowLiquidModal(false); },
        onError: () => Alert.alert("Error", "Failed to mint stSIG"),
      });
    } else {
      liquidUnstakeMutation.mutate({ amount: num }, {
        onSuccess: (data) => { Alert.alert("SIG Redeemed", data.message); setLiquidAmount(""); setShowLiquidModal(false); },
        onError: () => Alert.alert("Error", "Failed to redeem stSIG"),
      });
    }
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
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.primary}
            colors={[Colors.primary]}
            progressBackgroundColor={Colors.surfaceSolid}
          />
        }
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

        <View style={styles.quickActionsRow}>
          <QuickActionButton
            icon="arrow-up-outline"
            label="Send"
            color={Colors.primary}
            onPress={() => setShowSendModal(true)}
            testID="quick-send"
          />
          <QuickActionButton
            icon="arrow-down-outline"
            label="Receive"
            color={Colors.success}
            onPress={() => setShowReceiveModal(true)}
            testID="quick-receive"
          />
          <QuickActionButton
            icon="swap-horizontal-outline"
            label="Swap"
            color={Colors.secondary}
            onPress={() => setShowSwapModal(true)}
            testID="quick-swap"
          />
          <QuickActionButton
            icon="lock-closed-outline"
            label="Stake"
            color="#f59e0b"
            onPress={() => { setStakeInitialMode("stake"); setShowStakeModal(true); }}
            testID="quick-stake"
          />
        </View>

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
          <Ionicons name="trending-up" size={18} color="#f59e0b" />
          <GradientText text="Staking Pools" style={styles.sectionTitle} />
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.poolCarousel} contentContainerStyle={styles.poolCarouselContent}>
          {(stakingInfo?.pools || []).map((pool, i) => {
            const isTopTier = pool.baseApy >= 24;
            return (
              <Pressable
                key={pool.id}
                onPress={() => { setStakeInitialMode("stake"); setShowStakeModal(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); }}
                testID={`pool-card-${pool.id}`}
              >
                <GlassCard glow={isTopTier} animate delay={i * 80} style={styles.poolCard}>
                  <View style={styles.poolCardHeader}>
                    <View style={[styles.poolTierDot, { backgroundColor: isTopTier ? Colors.primary : pool.baseApy >= 14 ? Colors.secondary : "rgba(255,255,255,0.2)" }]} />
                    <Text style={styles.poolCardName}>{pool.name}</Text>
                  </View>
                  <Text style={[styles.poolCardApy, isTopTier && { color: Colors.primary }]}>{pool.baseApy + (pool.boostApy || 0)}%</Text>
                  <Text style={styles.poolCardApyLabel}>TOTAL APY</Text>
                  {pool.boostApy > 0 && (
                    <View style={styles.poolBoostPill}>
                      <Ionicons name="flash" size={10} color={Colors.secondary} />
                      <Text style={styles.poolBoostText}>+{pool.boostApy}% boost</Text>
                    </View>
                  )}
                  <View style={styles.poolCardDivider} />
                  <View style={styles.poolDetailRow}>
                    <Ionicons name={pool.lockDays > 0 ? "lock-closed" : "flash-outline"} size={11} color={Colors.textTertiary} />
                    <Text style={styles.poolDetailText}>{pool.lockDays > 0 ? `${pool.lockDays}-day lock` : "No lock"}</Text>
                  </View>
                  <View style={styles.poolDetailRow}>
                    <Ionicons name="diamond-outline" size={11} color={Colors.textTertiary} />
                    <Text style={styles.poolDetailText}>Min {pool.minStake.toLocaleString()} SIG</Text>
                  </View>
                </GlassCard>
              </Pressable>
            );
          })}
        </ScrollView>

        <GlassCard>
          <View style={styles.stakingStats}>
            <View style={styles.stakingStat}>
              <Text style={styles.stakingStatLabel}>TOTAL STAKED</Text>
              <Text style={styles.stakingStatValue}>{totalStaked.toLocaleString()}</Text>
              <Text style={styles.stakingStatUnit}>stSIG</Text>
            </View>
            <View style={styles.stakingStatDivider} />
            <View style={styles.stakingStat}>
              <Text style={styles.stakingStatLabel}>REWARDS</Text>
              <Text style={[styles.stakingStatValue, { color: Colors.success }]}>+{rewardsEarned.toLocaleString()}</Text>
              <Text style={[styles.stakingStatUnit, { color: Colors.success }]}>SIG earned</Text>
            </View>
          </View>
          {activeStakes.length > 0 && (
            <View style={styles.activeStakesContainer}>
              <Text style={styles.activeStakesTitle}>ACTIVE POSITIONS</Text>
              {activeStakes.map((stake) => (
                <View key={stake.poolId} style={styles.activeStakeRow}>
                  <View style={styles.activeStakeLeft}>
                    <View style={styles.activeStakeNameRow}>
                      <View style={[styles.activeStakeDot, { backgroundColor: stake.apy >= 24 ? Colors.primary : Colors.secondary }]} />
                      <Text style={styles.activeStakePool}>{stake.poolName}</Text>
                    </View>
                    <Text style={styles.activeStakeAmount}>{stake.amount.toLocaleString()} stSIG @ {stake.apy}% APY</Text>
                  </View>
                  <View style={styles.activeStakeRight}>
                    <Text style={styles.activeStakeRewards}>+{stake.rewards.toFixed(4)}</Text>
                    {stake.isLocked ? (
                      <View style={styles.lockedBadge}>
                        <Ionicons name="lock-closed" size={9} color={Colors.warning} />
                        <Text style={styles.lockedBadgeText}>LOCKED</Text>
                      </View>
                    ) : (
                      <View style={[styles.lockedBadge, { backgroundColor: "rgba(16,185,129,0.1)", borderColor: "rgba(16,185,129,0.2)" }]}>
                        <Text style={[styles.lockedBadgeText, { color: Colors.success }]}>FLEX</Text>
                      </View>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}
          <View style={styles.stakingProgressContainer}>
            <View style={styles.stakingProgressBg}>
              <LinearGradient
                colors={[Colors.primary, Colors.secondary]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={[styles.stakingProgressFill, { width: `${Math.min(stakedRatio * 100, 100)}%` }]}
              />
            </View>
            <Text style={styles.stakingProgressLabel}>
              {(stakedRatio * 100).toFixed(1)}% of portfolio staked
            </Text>
          </View>
          {stakingInfo?.cooldownActive && (
            <View style={styles.cooldownBanner}>
              <Ionicons name="time-outline" size={14} color={Colors.warning} />
              <Text style={styles.cooldownText}>{stakingInfo.cooldownRemaining} days remaining on cooldown</Text>
            </View>
          )}
          <View style={styles.stakingActions}>
            <Pressable
              style={styles.stakingActionBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setStakeInitialMode("stake"); setShowStakeModal(true); }}
              testID="stake-more-button"
            >
              <LinearGradient colors={["rgba(0,255,255,0.12)", "rgba(0,255,255,0.04)"]} style={styles.actionBtnGradient}>
                <Ionicons name="lock-closed" size={16} color={Colors.primary} />
                <Text style={[styles.stakingActionText, { color: Colors.primary }]}>Stake</Text>
              </LinearGradient>
            </Pressable>
            <Pressable
              style={styles.stakingActionBtn}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setStakeInitialMode("unstake"); setShowStakeModal(true); }}
              testID="unstake-button"
            >
              <LinearGradient colors={["rgba(147,51,234,0.12)", "rgba(147,51,234,0.04)"]} style={styles.actionBtnGradient}>
                <Ionicons name="lock-open" size={16} color={Colors.secondary} />
                <Text style={[styles.stakingActionText, { color: Colors.secondary }]}>Unstake</Text>
              </LinearGradient>
            </Pressable>
            {rewardsEarned > 0 && (
              <Pressable
                style={styles.stakingActionBtn}
                onPress={() => {
                  Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  claimRewards.mutate(undefined, {
                    onSuccess: (data) => Alert.alert("Rewards Claimed", data.message),
                    onError: () => Alert.alert("Error", "Failed to claim rewards"),
                  });
                }}
                testID="claim-rewards-button"
              >
                <LinearGradient colors={["rgba(16,185,129,0.12)", "rgba(16,185,129,0.04)"]} style={styles.actionBtnGradient}>
                  <Ionicons name="gift" size={16} color={Colors.success} />
                  <Text style={[styles.stakingActionText, { color: Colors.success }]}>Claim</Text>
                </LinearGradient>
              </Pressable>
            )}
          </View>
          <View style={styles.liquidStakingSection}>
            <Text style={styles.liquidSectionLabel}>LIQUID STAKING</Text>
            <View style={styles.stakingActions}>
              <Pressable
                style={styles.stakingActionBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLiquidMode("mint"); setShowLiquidModal(true); }}
                testID="liquid-mint-button"
              >
                <LinearGradient colors={["rgba(0,255,255,0.12)", "rgba(147,51,234,0.08)"]} style={styles.actionBtnGradient}>
                  <Ionicons name="flash" size={16} color={Colors.primary} />
                  <Text style={[styles.stakingActionText, { color: Colors.primary }]}>Mint stSIG</Text>
                </LinearGradient>
              </Pressable>
              <Pressable
                style={styles.stakingActionBtn}
                onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); setLiquidMode("redeem"); setShowLiquidModal(true); }}
                testID="liquid-redeem-button"
              >
                <LinearGradient colors={["rgba(245,158,11,0.12)", "rgba(245,158,11,0.04)"]} style={styles.actionBtnGradient}>
                  <Ionicons name="swap-horizontal" size={16} color="#f59e0b" />
                  <Text style={[styles.stakingActionText, { color: "#f59e0b" }]}>Redeem SIG</Text>
                </LinearGradient>
              </Pressable>
            </View>
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <Ionicons name="business" size={18} color={Colors.success} />
          <GradientText text="Bank Accounts" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          {(plaidAccounts || []).length > 0 ? (
            (plaidAccounts || []).map((account: any, i: number) => (
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
            (externalWallets || []).map((wallet: any, i: number) => (
              <React.Fragment key={wallet.id}>
                <WalletCard
                  wallet={wallet}
                  onDisconnect={() => handleDisconnectWallet(wallet.id, wallet.label || wallet.walletType)}
                  expanded={expandedWalletId === wallet.id}
                  onToggle={() => setExpandedWalletId(expandedWalletId === wallet.id ? null : wallet.id)}
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

        <GlassCard>
          <View style={styles.paymentHeader}>
            <Ionicons name="card" size={16} color={Colors.textSecondary} />
            <Text style={styles.paymentTitle}>Payment Methods</Text>
          </View>
          <View style={styles.divider} />
          <Pressable style={styles.paymentRow} testID="apple-pay-row">
            <View style={[styles.paymentIcon, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <Ionicons name="logo-apple" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.paymentLabel}>Apple Pay</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </Pressable>
          <View style={styles.divider} />
          <Pressable style={styles.paymentRow} testID="google-pay-row">
            <View style={[styles.paymentIcon, { backgroundColor: "rgba(255,255,255,0.08)" }]}>
              <Ionicons name="logo-google" size={20} color={Colors.textPrimary} />
            </View>
            <Text style={styles.paymentLabel}>Google Pay</Text>
            <View style={styles.comingSoonBadge}>
              <Text style={styles.comingSoonText}>Coming Soon</Text>
            </View>
          </Pressable>
          <View style={styles.divider} />
          <Pressable
            style={styles.paymentRow}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Alert.alert(
                "Add Card",
                "Credit and debit card payments for Shell purchases will be available at launch. Shell purchases currently use Apple In-App Purchase or Google Play Billing.",
                [{ text: "OK" }]
              );
            }}
            testID="add-card-button"
          >
            <View style={[styles.paymentIcon, { backgroundColor: "rgba(0,255,255,0.08)" }]}>
              <Ionicons name="card-outline" size={20} color={Colors.primary} />
            </View>
            <Text style={[styles.paymentLabel, { color: Colors.primary }]}>Add Credit/Debit Card</Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
          </Pressable>
        </GlassCard>

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
              testID={`tx-filter-${f.key}`}
            >
              <Text style={[styles.filterChipText, txFilter === f.key && styles.filterChipTextActive]}>
                {f.label}
              </Text>
            </Pressable>
          ))}
        </View>
        <GlassCard>
          {filteredTxList.length > 0 ? (
            filteredTxList.slice(0, 10).map((tx: any, i: number) => (
              <React.Fragment key={tx.id}>
                <TransactionItem tx={tx} />
                {i < Math.min(filteredTxList.length, 10) - 1 && <View style={styles.divider} />}
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

      <SendModal visible={showSendModal} onClose={() => setShowSendModal(false)} />
      <ReceiveModal visible={showReceiveModal} onClose={() => setShowReceiveModal(false)} />
      <SwapModal visible={showSwapModal} onClose={() => setShowSwapModal(false)} />
      <StakeModal visible={showStakeModal} onClose={() => setShowStakeModal(false)} initialMode={stakeInitialMode} />
      <BottomSheetModal visible={showLiquidModal} onClose={() => setShowLiquidModal(false)} title={liquidMode === "mint" ? "Mint stSIG" : "Redeem SIG"}>
        <View style={styles.liquidModalContent}>
          <View style={styles.liquidModeRow}>
            <Pressable
              style={[styles.liquidModeTab, liquidMode === "mint" && styles.liquidModeTabActive]}
              onPress={() => { setLiquidMode("mint"); setLiquidAmount(""); }}
              testID="liquid-mode-mint"
            >
              <Text style={[styles.liquidModeTabText, liquidMode === "mint" && styles.liquidModeTabTextActive]}>Mint stSIG</Text>
            </Pressable>
            <Pressable
              style={[styles.liquidModeTab, liquidMode === "redeem" && styles.liquidModeTabActive]}
              onPress={() => { setLiquidMode("redeem"); setLiquidAmount(""); }}
              testID="liquid-mode-redeem"
            >
              <Text style={[styles.liquidModeTabText, liquidMode === "redeem" && styles.liquidModeTabTextActive]}>Redeem SIG</Text>
            </Pressable>
          </View>
          <View style={styles.liquidRateRow}>
            <Ionicons name="swap-horizontal" size={14} color={Colors.textTertiary} />
            <Text style={styles.liquidRateText}>1 SIG = 1 stSIG (1:1 exchange rate)</Text>
          </View>
          <TextInput
            style={styles.stakeInput}
            value={liquidAmount}
            onChangeText={setLiquidAmount}
            keyboardType="numeric"
            placeholder={liquidMode === "mint" ? "SIG amount to convert" : "stSIG amount to redeem"}
            placeholderTextColor={Colors.textMuted}
            testID="liquid-amount-input"
          />
          {parseFloat(liquidAmount) > 0 && (
            <View style={styles.liquidPreviewRow}>
              <Text style={styles.liquidPreviewLabel}>You will receive:</Text>
              <Text style={styles.liquidPreviewValue}>{parseFloat(liquidAmount).toLocaleString()} {liquidMode === "mint" ? "stSIG" : "SIG"}</Text>
            </View>
          )}
          <Pressable onPress={handleLiquidConfirm} testID="liquid-confirm-button">
            <LinearGradient
              colors={[Colors.primary, Colors.secondary]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.confirmBtn}
            >
              <Text style={styles.confirmBtnText}>{liquidMode === "mint" ? "Mint stSIG" : "Redeem SIG"}</Text>
            </LinearGradient>
          </Pressable>
        </View>
      </BottomSheetModal>
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
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    textAlign: "center" as const,
    letterSpacing: 1,
    textTransform: "uppercase" as const,
  },
  portfolioValue: {
    fontSize: 40,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginTop: 6,
    marginBottom: 16,
    letterSpacing: -1,
  },
  breakdownBar: {
    flexDirection: "row" as const,
    height: 4,
    borderRadius: 2,
    overflow: "hidden" as const,
    gap: 2,
    marginBottom: 14,
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
  quickActionsRow: {
    flexDirection: "row" as const,
    justifyContent: "space-around" as const,
    paddingVertical: 12,
    marginTop: 4,
  },
  quickAction: {
    alignItems: "center" as const,
    gap: 8,
    minWidth: 64,
  },
  quickActionCircle: {
    width: 54,
    height: 54,
    borderRadius: 18,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    borderWidth: 1,
  },
  quickActionLabel: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
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
  tokenList: {
    marginLeft: 52,
    marginBottom: 4,
    gap: 4,
  },
  tokenRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingVertical: 3,
  },
  tokenSymbol: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    width: 50,
  },
  tokenBalance: {
    fontSize: 12,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  tokenUsd: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
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
  stakingHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 12,
  },
  stakingSubtext: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  stakingStats: {
    flexDirection: "row" as const,
    marginBottom: 14,
    paddingVertical: 4,
  },
  stakingStat: {
    flex: 1,
    alignItems: "center" as const,
    gap: 3,
  },
  stakingStatLabel: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  stakingStatValue: {
    fontSize: 20,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    letterSpacing: -0.3,
  },
  stakingStatDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignSelf: "stretch" as const,
    marginHorizontal: 12,
  },
  stakingProgressContainer: {
    gap: 6,
    marginBottom: 8,
  },
  stakingProgressBg: {
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.06)",
    overflow: "hidden" as const,
  },
  stakingProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  stakingProgressLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    textAlign: "right" as const,
    letterSpacing: 0.2,
  },
  stakingRewardProjection: {
    fontSize: 12,
    color: Colors.success,
    fontFamily: "Inter_500Medium",
    textAlign: "center" as const,
    marginBottom: 8,
  },
  stakingActions: {
    flexDirection: "row" as const,
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 14,
    marginTop: 4,
  },
  stakingActionBtn: {
    flex: 1,
    borderRadius: 12,
    overflow: "hidden" as const,
  },
  stakingActionText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.2,
  },
  liquidStakingSection: {
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 14,
    marginTop: 4,
  },
  liquidSectionLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    marginBottom: 10,
  },
  liquidModalContent: {
    gap: 16,
  },
  liquidModeRow: {
    flexDirection: "row" as const,
    gap: 8,
  },
  liquidModeTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    alignItems: "center" as const,
  },
  liquidModeTabActive: {
    backgroundColor: "rgba(0,255,255,0.08)",
    borderColor: "rgba(0,255,255,0.2)",
  },
  liquidModeTabText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
  liquidModeTabTextActive: {
    color: Colors.primary,
  },
  liquidRateRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  liquidRateText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  liquidPreviewRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    backgroundColor: "rgba(0,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.1)",
  },
  liquidPreviewLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
  },
  liquidPreviewValue: {
    fontSize: 14,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: Colors.primary,
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
  paymentHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingBottom: 4,
  },
  paymentTitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
  },
  paymentRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 10,
  },
  paymentIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  paymentLabel: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
    flex: 1,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(245,158,11,0.12)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.2)",
  },
  comingSoonText: {
    fontSize: 10,
    color: "#f59e0b",
    fontFamily: "Inter_500Medium",
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
    maxHeight: "80%",
  },
  modalGrabber: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: "rgba(255,255,255,0.2)",
    alignSelf: "center" as const,
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    marginTop: 8,
  },
  modalInput: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.3,
  },
  assetPicker: {
    flexDirection: "row" as const,
    gap: 8,
    marginBottom: 8,
  },
  assetChip: {
    paddingHorizontal: 16,
    paddingVertical: 9,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  assetChipActive: {
    backgroundColor: "rgba(0,255,255,0.1)",
    borderColor: "rgba(0,255,255,0.3)",
  },
  assetChipText: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.3,
  },
  assetChipTextActive: {
    color: Colors.primary,
  },
  receiveCenter: {
    alignItems: "center" as const,
    gap: 12,
  },
  qrContainer: {
    width: 200,
    height: 200,
    borderRadius: 20,
    backgroundColor: "rgba(0,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: "rgba(0,255,255,0.12)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  receiveLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  addressRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: Colors.border,
    width: "100%",
  },
  addressText: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  addressTextSmall: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  supportedAssets: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
  },
  swapArrowContainer: {
    alignItems: "center" as const,
    marginVertical: 6,
  },
  swapArrowButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderWidth: 1.5,
    borderColor: "rgba(0,255,255,0.2)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  swapPreview: {
    alignItems: "center" as const,
    gap: 6,
    marginVertical: 14,
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  swapRate: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  swapOutput: {
    fontSize: 18,
    color: Colors.success,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  stakeModeTabs: {
    flexDirection: "row" as const,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    padding: 3,
    marginBottom: 16,
  },
  stakeModeTab: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center" as const,
    borderRadius: 10,
  },
  stakeModeTabActive: {
    backgroundColor: "rgba(0,255,255,0.12)",
  },
  stakeModeTabText: {
    fontSize: 14,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
  },
  stakeModeTabTextActive: {
    color: Colors.primary,
  },
  stakeInfoCard: {
    marginTop: 12,
    marginBottom: 16,
    padding: 14,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  stakeInfoRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 8,
  },
  stakeInfoLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  apyBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    backgroundColor: "rgba(0,255,255,0.12)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.25)",
  },
  apyBadgeText: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  rewardPreview: {
    flexDirection: "row" as const,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 8,
  },
  rewardItem: {
    flex: 1,
    alignItems: "center" as const,
    gap: 2,
  },
  rewardLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  rewardValue: {
    fontSize: 14,
    color: Colors.success,
    fontFamily: "Inter_600SemiBold",
  },
  rewardDivider: {
    width: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    alignSelf: "stretch" as const,
  },
  cooldownBanner: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
    marginBottom: 12,
  },
  cooldownText: {
    fontSize: 12,
    color: "#f59e0b",
    fontFamily: "Inter_500Medium",
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
  swapFeeText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.2,
  },
  swapFeeAmount: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_500Medium",
  },
  poolScroller: {
    marginBottom: 12,
  },
  poolChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    marginRight: 8,
    alignItems: "center" as const,
    minWidth: 100,
  },
  poolChipActive: {
    backgroundColor: "rgba(0,255,255,0.08)",
    borderColor: "rgba(0,255,255,0.3)",
  },
  poolChipName: {
    fontSize: 11,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    marginBottom: 2,
  },
  poolChipNameActive: {
    color: Colors.primary,
  },
  poolChipApy: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  poolChipApyActive: {
    color: Colors.primary,
  },
  poolChipLock: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  boostText: {
    fontSize: 10,
    color: Colors.secondary,
    fontFamily: "Inter_400Regular",
    marginBottom: 8,
  },
  poolCarousel: {
    marginHorizontal: -16,
    marginBottom: 16,
  },
  poolCarouselContent: {
    paddingHorizontal: 16,
    gap: 10,
  },
  poolCard: {
    width: 150,
  },
  poolCardHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 10,
  },
  poolTierDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  poolCardName: {
    fontSize: 10,
    color: Colors.textSecondary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.8,
    flex: 1,
  },
  poolCardApy: {
    fontSize: 28,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    letterSpacing: -0.5,
  },
  poolCardApyLabel: {
    fontSize: 9,
    color: Colors.textMuted,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 1.2,
    marginBottom: 6,
  },
  poolBoostPill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(147,51,234,0.1)",
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.2)",
    alignSelf: "flex-start" as const,
    marginBottom: 6,
  },
  poolBoostText: {
    fontSize: 10,
    color: Colors.secondary,
    fontFamily: "Inter_600SemiBold",
  },
  poolCardDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginVertical: 8,
  },
  poolDetailRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 5,
    marginBottom: 3,
  },
  poolDetailText: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  stakingStatUnit: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    marginTop: 1,
  },
  activeStakesContainer: {
    marginTop: 12,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
    paddingTop: 12,
  },
  activeStakesTitle: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
    marginBottom: 10,
  },
  activeStakeRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.02)",
    marginBottom: 6,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.04)",
  },
  activeStakeLeft: {
    flex: 1,
  },
  activeStakeNameRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    marginBottom: 3,
  },
  activeStakeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  activeStakePool: {
    fontSize: 13,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  activeStakeAmount: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    paddingLeft: 12,
  },
  activeStakeRight: {
    alignItems: "flex-end" as const,
    gap: 4,
  },
  activeStakeRewards: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    color: Colors.success,
  },
  lockedBadge: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 3,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(245,158,11,0.08)",
    borderWidth: 1,
    borderColor: "rgba(245,158,11,0.15)",
  },
  lockedBadgeText: {
    fontSize: 9,
    color: Colors.warning,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  actionBtnGradient: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 12,
  },
});
