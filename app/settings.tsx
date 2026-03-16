import React, { useState, useCallback, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  Switch,
  useWindowDimensions,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { useAuth } from "@/lib/auth-context";
import { ECOSYSTEM_APPS } from "@/constants/ecosystem-apps";

interface SettingRowProps {
  icon: string;
  label: string;
  value?: string;
  showChevron?: boolean;
  onPress?: () => void;
  danger?: boolean;
  trailing?: React.ReactNode;
}

function SettingRow({ icon, label, value, showChevron = true, onPress, danger, trailing }: SettingRowProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingRow, pressed && onPress && { opacity: 0.7 }]}
      onPress={() => {
        if (onPress) {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          onPress();
        }
      }}
      disabled={!onPress}
    >
      <View style={[styles.settingIcon, danger && { backgroundColor: "rgba(239,68,68,0.1)" }]}>
        <Ionicons name={icon as any} size={18} color={danger ? Colors.error : Colors.primary} />
      </View>
      <View style={styles.settingInfo}>
        <Text style={[styles.settingLabel, danger && { color: Colors.error }]}>{label}</Text>
        {value ? <Text style={styles.settingValue}>{value}</Text> : null}
      </View>
      {trailing || (showChevron && onPress ? (
        <Ionicons name="chevron-forward" size={16} color={Colors.textTertiary} />
      ) : null)}
    </Pressable>
  );
}

function SectionHeader({ title }: { title: string }) {
  return <Text style={styles.sectionHeader}>{title}</Text>;
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { user, logout } = useAuth();

  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [smsNotifications, setSmsNotifications] = useState(false);
  const [biometricAuth, setBiometricAuth] = useState(false);
  const [autoStake, setAutoStake] = useState(false);

  useEffect(() => {
    AsyncStorage.multiGet([
      "pref_push", "pref_email", "pref_sms", "pref_biometric", "pref_autostake",
    ]).then((vals) => {
      const map = Object.fromEntries(vals);
      if (map.pref_push !== null) setPushNotifications(map.pref_push !== "false");
      if (map.pref_email !== null) setEmailNotifications(map.pref_email !== "false");
      if (map.pref_sms !== null) setSmsNotifications(map.pref_sms === "true");
      if (map.pref_biometric !== null) setBiometricAuth(map.pref_biometric === "true");
      if (map.pref_autostake !== null) setAutoStake(map.pref_autostake === "true");
    });
  }, []);

  const togglePref = useCallback((key: string, value: boolean, setter: (v: boolean) => void) => {
    setter(value);
    AsyncStorage.setItem(key, String(value));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  }, []);

  const handleSignOut = useCallback(() => {
    if (Platform.OS === "web") {
      if (confirm("Are you sure you want to sign out?")) {
        logout();
        router.replace("/login");
      }
    } else {
      Alert.alert("Sign Out", "Are you sure you want to sign out?", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Sign Out",
          style: "destructive",
          onPress: () => {
            logout();
            router.replace("/login");
          },
        },
      ]);
    }
  }, [logout]);

  const handleDeleteAccount = useCallback(() => {
    const msg = "This will permanently delete your account and all associated data. This action cannot be undone.";
    if (Platform.OS === "web") {
      if (confirm(msg)) {
        Alert.alert("Contact Support", "Please contact support@trustlayer.io to complete account deletion.");
      }
    } else {
      Alert.alert("Delete Account", msg, [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: () => {
            Alert.alert("Contact Support", "Please contact support@trustlayer.io to complete account deletion.");
          },
        },
      ]);
    }
  }, []);

  const displayName = user?.displayName || user?.username || "Guest";
  const email = (user as any)?.email || "Not set";
  const trustLayerId = user?.trustLayerId || "Not verified";

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
          <GradientText text="Settings" style={styles.title} />
        </View>

        {/* Account */}
        <SectionHeader title="ACCOUNT" />
        <GlassCard>
          <SettingRow icon="person" label="Display Name" value={displayName} onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="mail" label="Email" value={email} onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="shield-checkmark" label="Trust Layer ID" value={trustLayerId} showChevron={false} />
        </GlassCard>

        {/* Notifications */}
        <SectionHeader title="NOTIFICATIONS" />
        <GlassCard>
          <SettingRow
            icon="notifications"
            label="Push Notifications"
            showChevron={false}
            trailing={
              <Switch
                value={pushNotifications}
                onValueChange={(v) => togglePref("pref_push", v, setPushNotifications)}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(0,255,255,0.3)" }}
                thumbColor={pushNotifications ? Colors.primary : Colors.textTertiary}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="mail-open"
            label="Email Notifications"
            showChevron={false}
            trailing={
              <Switch
                value={emailNotifications}
                onValueChange={(v) => togglePref("pref_email", v, setEmailNotifications)}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(0,255,255,0.3)" }}
                thumbColor={emailNotifications ? Colors.primary : Colors.textTertiary}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow
            icon="chatbox"
            label="SMS Alerts"
            showChevron={false}
            trailing={
              <Switch
                value={smsNotifications}
                onValueChange={(v) => togglePref("pref_sms", v, setSmsNotifications)}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(0,255,255,0.3)" }}
                thumbColor={smsNotifications ? Colors.primary : Colors.textTertiary}
              />
            }
          />
        </GlassCard>

        {/* Security */}
        <SectionHeader title="SECURITY" />
        <GlassCard>
          <SettingRow icon="lock-closed" label="Change Password" onPress={() => router.push("/forgot-password")} />
          <View style={styles.divider} />
          <SettingRow
            icon="finger-print"
            label="Biometric Authentication"
            showChevron={false}
            trailing={
              <Switch
                value={biometricAuth}
                onValueChange={(v) => togglePref("pref_biometric", v, setBiometricAuth)}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(0,255,255,0.3)" }}
                thumbColor={biometricAuth ? Colors.primary : Colors.textTertiary}
              />
            }
          />
          <View style={styles.divider} />
          <SettingRow icon="key" label="Two-Factor Auth" value="Not enabled" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow icon="phone-portrait" label="Active Sessions" value="1 device" onPress={() => {}} />
        </GlassCard>

        {/* Wallet */}
        <SectionHeader title="WALLET" />
        <GlassCard>
          <SettingRow icon="cash" label="Default Currency" value="USD" onPress={() => {}} />
          <View style={styles.divider} />
          <SettingRow
            icon="trending-up"
            label="Auto-Stake Rewards"
            showChevron={false}
            trailing={
              <Switch
                value={autoStake}
                onValueChange={(v) => togglePref("pref_autostake", v, setAutoStake)}
                trackColor={{ false: "rgba(255,255,255,0.1)", true: "rgba(0,255,255,0.3)" }}
                thumbColor={autoStake ? Colors.primary : Colors.textTertiary}
              />
            }
          />
        </GlassCard>

        {/* About */}
        <SectionHeader title="ABOUT" />
        <GlassCard>
          <SettingRow icon="apps" label="Ecosystem Apps" value={`${ECOSYSTEM_APPS.length} apps`} showChevron={false} />
          <View style={styles.divider} />
          <SettingRow icon="information-circle" label="App Version" value="1.0.0" showChevron={false} />
          <View style={styles.divider} />
          <SettingRow icon="document-text" label="Terms of Service" onPress={() => router.push("/terms")} />
          <View style={styles.divider} />
          <SettingRow icon="shield" label="Privacy Policy" onPress={() => router.push("/privacy")} />
          <View style={styles.divider} />
          <SettingRow icon="help-circle" label="Support" onPress={() => router.push("/support")} />
        </GlassCard>

        {/* Danger Zone */}
        <SectionHeader title="DANGER ZONE" />
        <GlassCard>
          <SettingRow icon="log-out" label="Sign Out" danger onPress={handleSignOut} />
          <View style={styles.divider} />
          <SettingRow icon="trash" label="Delete Account" danger onPress={handleDeleteAccount} />
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
    gap: 4,
  },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 24,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  sectionHeader: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginTop: 20,
    marginBottom: 8,
    marginLeft: 4,
  },
  settingRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    paddingVertical: 14,
    paddingHorizontal: 4,
    minHeight: 52,
  },
  settingIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginRight: 14,
  },
  settingInfo: {
    flex: 1,
  },
  settingLabel: {
    fontSize: 15,
    fontFamily: "Inter_500Medium",
    color: Colors.textPrimary,
  },
  settingValue: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginLeft: 52,
  },
});
