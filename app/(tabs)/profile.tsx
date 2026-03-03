import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Switch,
  Alert,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { MOCK_USER, MOCK_BALANCE } from "@/constants/mock-data";

function SettingRow({
  icon,
  label,
  value,
  onPress,
  toggle,
  toggleValue,
  onToggle,
}: {
  icon: string;
  label: string;
  value?: string;
  onPress?: () => void;
  toggle?: boolean;
  toggleValue?: boolean;
  onToggle?: (val: boolean) => void;
}) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingRow, !toggle && pressed && { opacity: 0.7 }]}
      onPress={toggle ? undefined : onPress}
      disabled={!!toggle}
    >
      <View style={styles.settingIcon}>
        <Ionicons name={icon as any} size={18} color={Colors.primary} />
      </View>
      <Text style={styles.settingLabel}>{label}</Text>
      {toggle ? (
        <Switch
          value={toggleValue}
          onValueChange={onToggle}
          trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(0,255,255,0.3)" }}
          thumbColor={toggleValue ? Colors.primary : Colors.textMuted}
        />
      ) : (
        <View style={styles.settingRight}>
          {value && <Text style={styles.settingValue}>{value}</Text>}
          <Ionicons name="chevron-forward" size={16} color={Colors.textMuted} />
        </View>
      )}
    </Pressable>
  );
}

function LinkedAppItem({ name, connected }: { name: string; connected: boolean }) {
  return (
    <View style={styles.linkedApp}>
      <Text style={styles.linkedAppName}>{name}</Text>
      <View style={[styles.linkedStatus, connected && styles.linkedStatusActive]}>
        <Ionicons
          name={connected ? "checkmark-circle" : "ellipse-outline"}
          size={16}
          color={connected ? Colors.success : Colors.textMuted}
        />
        <Text style={[styles.linkedStatusText, connected && { color: Colors.success }]}>
          {connected ? "Connected" : "Not linked"}
        </Text>
      </View>
    </View>
  );
}

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const [notifications, setNotifications] = useState(true);
  const [biometrics, setBiometrics] = useState(false);

  const scoreColor = MOCK_USER.guardianScore >= 90 ? Colors.success :
    MOCK_USER.guardianScore >= 70 ? Colors.warning : Colors.error;

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
        <View style={styles.profileHeader}>
          <LinearGradient
            colors={["rgba(0,255,255,0.15)", "rgba(147,51,234,0.15)"]}
            style={styles.avatarGradient}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{MOCK_USER.avatarInitials}</Text>
            </View>
          </LinearGradient>
          <Text style={styles.displayName}>{MOCK_USER.displayName}</Text>
          <View style={styles.trustIdRow}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.primary} />
            <Text style={styles.trustId}>{MOCK_USER.trustLayerId}</Text>
          </View>
          <Text style={styles.memberNumber}>Member {MOCK_USER.memberNumber}</Text>
        </View>

        <View style={styles.statsRow}>
          <GlassCard glow style={styles.statCard}>
            <Text style={styles.statLabel}>THE VOID</Text>
            <Text style={[styles.statValue, { color: Colors.secondary }]}>{MOCK_USER.voidTier}</Text>
            <Text style={styles.statSub}>Membership Tier</Text>
          </GlassCard>
          <GlassCard glow style={styles.statCard}>
            <Text style={styles.statLabel}>Guardian Score</Text>
            <Text style={[styles.statValue, { color: scoreColor }]}>{MOCK_USER.guardianScore}</Text>
            <Text style={styles.statSub}>Security Rating</Text>
          </GlassCard>
        </View>

        <View style={styles.sectionHeader}>
          <GradientText text="Identity" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Trust Layer ID</Text>
            <Text style={styles.identityValue}>{MOCK_USER.trustLayerId}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Username</Text>
            <Text style={styles.identityValue}>{MOCK_USER.username}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Email</Text>
            <Text style={styles.identityValue}>{MOCK_USER.email}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.identityRow}>
            <Text style={styles.identityLabel}>Member Since</Text>
            <Text style={styles.identityValue}>
              {new Date(MOCK_USER.joinedDate).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </Text>
          </View>
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Settings" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <SettingRow
            icon="notifications"
            label="Notifications"
            toggle
            toggleValue={notifications}
            onToggle={setNotifications}
          />
          <View style={styles.divider} />
          <SettingRow
            icon="finger-print"
            label="Biometric Auth"
            toggle
            toggleValue={biometrics}
            onToggle={setBiometrics}
          />
          <View style={styles.divider} />
          <SettingRow icon="lock-closed" label="Security PIN" value="Set" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="language" label="Language" value="English" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="moon" label="Display" value="Dark" onPress={() => {}} />
        </GlassCard>

        <View style={styles.sectionHeader}>
          <GradientText text="Linked Apps" style={styles.sectionTitle} />
        </View>
        <GlassCard>
          <LinkedAppItem name="TrustVault" connected />
          <View style={styles.divider} />
          <LinkedAppItem name="THE VOID" connected />
          <View style={styles.divider} />
          <LinkedAppItem name="Guardian Scanner" connected />
          <View style={styles.divider} />
          <LinkedAppItem name="TradeWorks AI" connected={false} />
          <View style={styles.divider} />
          <LinkedAppItem name="Signal Chat" connected />
        </GlassCard>

        <Pressable
          style={({ pressed }) => [styles.signOutButton, pressed && { opacity: 0.7 }]}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            Alert.alert("Sign Out", "Are you sure you want to sign out?", [
              { text: "Cancel", style: "cancel" },
              { text: "Sign Out", style: "destructive" },
            ]);
          }}
        >
          <Ionicons name="log-out-outline" size={18} color={Colors.error} />
          <Text style={styles.signOutText}>Sign Out</Text>
        </Pressable>

        <View style={styles.footerSection}>
          <Text style={styles.footer}>Trust Layer Hub v1.0.0</Text>
          <Pressable onPress={() => Linking.openURL("https://darkwavestudios.io")}>
            <Text style={styles.footerLink}>DarkWave Studios LLC</Text>
          </Pressable>
          <Text style={styles.copyright}>&copy; 2026 DarkWave Studios LLC. All rights reserved.</Text>
          <Pressable
            style={styles.shieldRow}
            onPress={() => Linking.openURL("https://trustshield.tech")}
          >
            <Ionicons name="shield-checkmark" size={12} color={Colors.success} />
            <Text style={styles.shieldText}>Protected by TrustShield.tech</Text>
          </Pressable>
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
    gap: 12,
  },
  profileHeader: {
    alignItems: "center" as const,
    marginBottom: 8,
  },
  avatarGradient: {
    width: 84,
    height: 84,
    borderRadius: 42,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 12,
  },
  avatar: {
    width: 78,
    height: 78,
    borderRadius: 39,
    backgroundColor: Colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  avatarText: {
    fontSize: 28,
    color: Colors.primary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  displayName: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
  },
  trustIdRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 4,
  },
  trustId: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  memberNumber: {
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  statsRow: {
    flexDirection: "row" as const,
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
    textAlign: "center" as const,
  },
  statValue: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    textAlign: "center" as const,
    marginVertical: 4,
  },
  statSub: {
    fontSize: 10,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  sectionHeader: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  identityRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 4,
  },
  identityLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  identityValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  settingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    paddingVertical: 4,
  },
  settingIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  settingLabel: {
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  settingRight: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  settingValue: {
    fontSize: 13,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
  },
  linkedApp: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 4,
  },
  linkedAppName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
  },
  linkedStatus: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  linkedStatusActive: {},
  linkedStatusText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  signOutButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    marginTop: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    backgroundColor: "rgba(239,68,68,0.06)",
  },
  signOutText: {
    fontSize: 16,
    color: Colors.error,
    fontFamily: "Inter_600SemiBold",
  },
  footerSection: {
    alignItems: "center" as const,
    marginTop: 24,
    gap: 6,
  },
  footer: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  footerLink: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
    textAlign: "center" as const,
    textDecorationLine: "underline" as const,
  },
  copyright: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  shieldRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
    marginTop: 2,
  },
  shieldText: {
    fontSize: 11,
    color: Colors.success,
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline" as const,
  },
});
