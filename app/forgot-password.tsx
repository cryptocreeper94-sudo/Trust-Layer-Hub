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

type Step = "email" | "code" | "newPassword" | "done";

export default function ForgotPasswordScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  const [step, setStep] = useState<Step>("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const handleSendCode = async () => {
    if (!email.trim()) {
      setError("Please enter your email address.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiPost<{ success: boolean; message: string }>(
        "/api/auth/forgot-password",
        { email: email.trim() },
        false
      );
      setMessage(data.message || "Reset code sent to your email.");
      setStep("code");
    } catch (err: any) {
      setError(err?.message || "Failed to send reset code.");
    }
    setLoading(false);
  };

  const handleVerifyAndReset = async () => {
    if (!code.trim()) {
      setError("Please enter the reset code.");
      return;
    }
    if (code.trim().length !== 6) {
      setError("Reset code must be 6 digits.");
      return;
    }
    setError("");
    setStep("newPassword");
  };

  const handleResetPassword = async () => {
    if (!newPassword) {
      setError("Please enter a new password.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      const data = await apiPost<{ success: boolean; message: string; error?: string }>(
        "/api/auth/reset-password",
        { email: email.trim(), code: code.trim(), newPassword },
        false
      );
      if (data.error) {
        setError(data.error);
        if (data.error.includes("expired") || data.error.includes("Invalid")) {
          setStep("code");
        }
      } else {
        setMessage(data.message || "Password reset successfully.");
        setStep("done");
      }
    } catch (err: any) {
      const msg = err?.message || "Failed to reset password.";
      setError(msg);
      if (msg.includes("expired") || msg.includes("Invalid")) {
        setStep("code");
      }
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
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20,
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
          testID="forgot-password-back"
        >
          <Ionicons name="chevron-back" size={24} color={Colors.textPrimary} />
        </Pressable>

        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Ionicons name="key" size={36} color={Colors.primary} />
          </View>
          <GradientText text="Reset Password" style={styles.title} />
          <Text style={styles.subtitle}>
            {step === "email" && "Enter your email to receive a reset code"}
            {step === "code" && "Enter the 6-digit code sent to your email"}
            {step === "newPassword" && "Choose a new secure password"}
            {step === "done" && "Your password has been updated"}
          </Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {message && step === "code" ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.successText}>{message}</Text>
          </View>
        ) : null}

        {step === "email" && (
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
                    onSubmitEditing={handleSendCode}
                    autoComplete="email"
                    textContentType="emailAddress"
                    testID="forgot-password-email"
                  />
                </View>
              </View>
            </GlassCard>

            <GradientButton
              title="Send Reset Code"
              onPress={handleSendCode}
              loading={loading}
              disabled={loading}
              style={styles.actionButton}
              testID="forgot-password-send"
            />
          </>
        )}

        {step === "code" && (
          <>
            <GlassCard>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Reset Code</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="keypad-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={[styles.input, styles.codeInput]}
                    placeholder="000000"
                    placeholderTextColor={Colors.textMuted}
                    value={code}
                    onChangeText={(t) => setCode(t.replace(/[^0-9]/g, "").slice(0, 6))}
                    keyboardType="number-pad"
                    returnKeyType="done"
                    maxLength={6}
                    onSubmitEditing={handleVerifyAndReset}
                    testID="forgot-password-code"
                  />
                </View>
              </View>
            </GlassCard>

            <GradientButton
              title="Continue"
              onPress={handleVerifyAndReset}
              disabled={code.length !== 6}
              style={styles.actionButton}
              testID="forgot-password-verify"
            />

            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                handleSendCode();
              }}
              style={styles.resendButton}
              testID="forgot-password-resend"
            >
              <Text style={styles.resendText}>Resend Code</Text>
            </Pressable>
          </>
        )}

        {step === "newPassword" && (
          <>
            <GlassCard>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>New Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Create a strong password"
                    placeholderTextColor={Colors.textMuted}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    secureTextEntry={!showPassword}
                    autoComplete="new-password"
                    textContentType="newPassword"
                    testID="forgot-password-new"
                  />
                  <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Ionicons
                      name={showPassword ? "eye-off-outline" : "eye-outline"}
                      size={20}
                      color={Colors.textMuted}
                    />
                  </Pressable>
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    placeholder="Confirm your password"
                    placeholderTextColor={Colors.textMuted}
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleResetPassword}
                    testID="forgot-password-confirm"
                  />
                </View>
              </View>

              <View style={styles.requirementsList}>
                <Text style={styles.requirementTitle}>Password requirements:</Text>
                <Text style={[styles.requirement, newPassword.length >= 8 && styles.requirementMet]}>
                  {newPassword.length >= 8 ? "\u2713" : "\u2022"} At least 8 characters
                </Text>
                <Text style={[styles.requirement, /[A-Z]/.test(newPassword) && styles.requirementMet]}>
                  {/[A-Z]/.test(newPassword) ? "\u2713" : "\u2022"} One uppercase letter
                </Text>
                <Text style={[styles.requirement, /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) && styles.requirementMet]}>
                  {/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(newPassword) ? "\u2713" : "\u2022"} One special character
                </Text>
              </View>
            </GlassCard>

            <GradientButton
              title="Reset Password"
              onPress={handleResetPassword}
              loading={loading}
              disabled={loading}
              style={styles.actionButton}
              testID="forgot-password-reset"
            />
          </>
        )}

        {step === "done" && (
          <>
            <View style={styles.doneContainer}>
              <View style={styles.doneIconWrap}>
                <Ionicons name="checkmark-circle" size={64} color={Colors.success} />
              </View>
              <Text style={styles.doneTitle}>Password Updated</Text>
              <Text style={styles.doneSubtitle}>
                You can now sign in with your new password. All existing sessions have been signed out for security.
              </Text>
            </View>

            <GradientButton
              title="Go to Sign In"
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                router.replace("/login");
              }}
              style={styles.actionButton}
              testID="forgot-password-done"
            />
          </>
        )}

        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/forgot-username");
          }}
          style={styles.altLink}
          testID="forgot-password-to-username"
        >
          <Text style={styles.altLinkText}>Forgot your username instead?</Text>
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
    paddingBottom: 20,
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
  successBox: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: "rgba(34,197,94,0.1)",
    borderWidth: 1,
    borderColor: "rgba(34,197,94,0.2)",
    borderRadius: 10,
    padding: 12,
  },
  successText: {
    fontSize: 13,
    color: Colors.success,
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
  codeInput: {
    letterSpacing: 8,
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    textAlign: "center" as const,
  },
  actionButton: {
    marginTop: 4,
  },
  resendButton: {
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
  requirementsList: {
    gap: 4,
  },
  requirementTitle: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    marginBottom: 4,
  },
  requirement: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  requirementMet: {
    color: Colors.success,
  },
  doneContainer: {
    alignItems: "center" as const,
    paddingVertical: 20,
    gap: 12,
  },
  doneIconWrap: {
    marginBottom: 8,
  },
  doneTitle: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
  },
  doneSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    maxWidth: 300,
    lineHeight: 20,
  },
  altLink: {
    alignItems: "center" as const,
    paddingVertical: 10,
  },
  altLinkText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
});
