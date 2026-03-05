import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { GradientButton } from "@/components/GradientButton";
import { useAuth } from "@/lib/auth-context";

export default function SmsOptInScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { updatePhone } = useAuth();

  const [phone, setPhone] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const phoneValid = /^\+\d{10,15}$/.test(phone.replace(/[\s\-()]/g, ""));
  const canSubmit = phoneValid && agreed && !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setError("");
    setLoading(true);
    try {
      await updatePhone(phone.replace(/[\s\-()]/g, ""));
      router.replace("/verify");
    } catch (err: any) {
      const msg = err?.message || "Failed to update phone number.";
      if (msg.includes("400")) {
        setError("Please enter a valid phone number with country code (e.g. +1...).");
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + webTopInset + 40,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20,
            maxWidth: isDesktop ? 480 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
        </View>

        <View style={styles.logoSection}>
          <View style={styles.iconContainer}>
            <Ionicons name="shield-checkmark" size={36} color={Colors.primary} />
          </View>
          <GradientText text="SMS Security" style={styles.title} />
          <Text style={styles.subtitle}>
            Enable SMS-based two-factor authentication to protect your account
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <GlassCard>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Phone Number</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="call-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="+1 (555) 000-0000"
                placeholderTextColor={Colors.textMuted}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setError("");
                }}
                keyboardType="phone-pad"
                autoComplete="tel"
                textContentType="telephoneNumber"
                returnKeyType="done"
              />
            </View>
            <Text style={styles.hint}>Include country code (e.g. +1 for US)</Text>
          </View>
        </GlassCard>

        <GlassCard>
          <Pressable
            style={styles.checkboxRow}
            onPress={() => setAgreed(!agreed)}
          >
            <View style={[styles.checkbox, agreed && styles.checkboxChecked]}>
              {agreed && (
                <Ionicons name="checkmark" size={14} color={Colors.background} />
              )}
            </View>
            <Text style={styles.consentText}>
              I agree to receive SMS messages from Trust Layer for account
              verification and security alerts. Message frequency varies. Message
              and data rates may apply. Consent is not a condition of purchase.
              Reply STOP to unsubscribe or HELP for help.{" "}
              <Text
                style={styles.legalLink}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push("/terms" as any);
                }}
              >
                Terms of Service
              </Text>
              {" & "}
              <Text
                style={styles.legalLink}
                onPress={(e) => {
                  e.stopPropagation();
                  router.push("/privacy" as any);
                }}
              >
                Privacy Policy
              </Text>
            </Text>
          </Pressable>
        </GlassCard>

        <GradientButton
          title="Enable SMS Security"
          onPress={handleSubmit}
          loading={loading}
          disabled={!canSubmit}
          style={styles.submitButton}
        />

        <View style={styles.infoSection}>
          <View style={styles.infoRow}>
            <Ionicons name="lock-closed" size={16} color={Colors.textTertiary} />
            <Text style={styles.infoText}>
              Your phone number is encrypted and only used for security verification
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="chatbubble" size={16} color={Colors.textTertiary} />
            <Text style={styles.infoText}>
              Standard message and data rates may apply. Frequency varies.
            </Text>
          </View>
          <View style={styles.infoRow}>
            <Ionicons name="close-circle" size={16} color={Colors.textTertiary} />
            <Text style={styles.infoText}>
              Reply STOP at any time to opt out of SMS messages
            </Text>
          </View>
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
  content: {
    flexGrow: 1,
    paddingHorizontal: 24,
    gap: 20,
    paddingBottom: 20,
  },
  headerRow: {
    flexDirection: "row" as const,
  },
  backButton: {
    width: 44,
    height: 44,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  logoSection: {
    alignItems: "center" as const,
    marginBottom: 4,
  },
  iconContainer: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 8,
    textAlign: "center" as const,
    paddingHorizontal: 16,
  },
  errorBox: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.1)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.2)",
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  inputWrapper: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
  },
  hint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  checkboxRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 12,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: Colors.textMuted,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginTop: 2,
    backgroundColor: "rgba(255,255,255,0.04)",
  },
  checkboxChecked: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  consentText: {
    flex: 1,
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  legalLink: {
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
    textDecorationLine: "underline" as const,
  },
  submitButton: {
    marginTop: 4,
  },
  infoSection: {
    gap: 14,
    paddingHorizontal: 4,
  },
  infoRow: {
    flexDirection: "row" as const,
    alignItems: "flex-start" as const,
    gap: 10,
  },
  infoText: {
    flex: 1,
    fontSize: 12,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
});
