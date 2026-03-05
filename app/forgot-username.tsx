import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  ScrollView,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Haptics from "expo-haptics";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { GradientButton } from "@/components/GradientButton";
import { apiPost } from "@/lib/api";

export default function ForgotUsernameScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  const handleSend = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await apiPost<{ success: boolean; message: string }>(
        "/api/auth/forgot-username",
        { email: email.trim() },
        false
      );
      setSent(true);
    } catch (err: any) {
      setError(err?.message || "Failed to process request.");
    }
    setLoading(false);
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
            maxWidth: isDesktop ? 480 : undefined,
            alignSelf: isDesktop ? "center" as const : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
          style={styles.backButton}
          testID="forgot-username-back"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Ionicons name="person-circle" size={36} color={Colors.primary} />
          </View>
          <GradientText text="Recover Username" style={styles.title} />
          <Text style={styles.subtitle}>
            {sent
              ? "Check your email for your username"
              : "Enter the email associated with your account"}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {!sent ? (
          <>
            <GlassCard>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Email Address</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="you@example.com"
                    placeholderTextColor={Colors.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                    keyboardType="email-address"
                    returnKeyType="done"
                    onSubmitEditing={handleSend}
                    autoComplete="email"
                    textContentType="emailAddress"
                    testID="forgot-username-email"
                  />
                </View>
              </View>
            </GlassCard>

            <GradientButton
              title="Send My Username"
              onPress={handleSend}
              loading={loading}
              disabled={loading}
              style={styles.actionButton}
              testID="forgot-username-send"
            />
          </>
        ) : (
          <View style={styles.sentContainer}>
            <View style={styles.sentIconWrap}>
              <Ionicons name="mail" size={56} color={Colors.primary} />
            </View>
            <Text style={styles.sentTitle}>Email Sent</Text>
            <Text style={styles.sentSubtitle}>
              If an account exists with that email address, we've sent your username to it. Please check your inbox and spam folder.
            </Text>

            <GradientButton
              title="Back to Sign In"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.replace("/login");
              }}
              style={styles.actionButton}
              testID="forgot-username-back-login"
            />

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSent(false);
                setEmail("");
              }}
              style={styles.retryLink}
              testID="forgot-username-retry"
            >
              <Text style={styles.retryText}>Try a different email</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/forgot-password");
          }}
          style={styles.altLink}
          testID="forgot-username-to-password"
        >
          <Text style={styles.altLinkText}>Forgot your password instead?</Text>
        </Pressable>

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/login");
          }}
          style={styles.altLink}
          testID="forgot-username-to-login"
        >
          <Text style={styles.loginLinkText}>Back to Sign In</Text>
        </Pressable>
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
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  logoSection: {
    alignItems: "center" as const,
    marginBottom: 4,
  },
  logoIcon: {
    width: 68,
    height: 68,
    borderRadius: 20,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 6,
    textAlign: "center" as const,
    maxWidth: 300,
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
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
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
  actionButton: {
    marginTop: 4,
  },
  sentContainer: {
    alignItems: "center" as const,
    paddingVertical: 20,
    gap: 14,
  },
  sentIconWrap: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.12)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 8,
  },
  sentTitle: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  sentSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    maxWidth: 300,
    lineHeight: 20,
  },
  retryLink: {
    paddingVertical: 8,
  },
  retryText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  altLink: {
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  altLinkText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  loginLinkText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
});
