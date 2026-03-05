import React, { useState, useRef, useEffect } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  useWindowDimensions,
  ScrollView,
  ActivityIndicator,
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

export default function VerifyScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { authStep, phoneHint, verifyEmail, verify2FA, resendCode, user, logout } = useAuth();

  const [digits, setDigits] = useState(["", "", "", "", "", ""]);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const inputRefs = useRef<(TextInput | null)[]>([]);

  const isEmail = authStep === "email_verify";
  const title = isEmail ? "Verify Your Email" : "Two-Factor Authentication";
  const subtitle = isEmail
    ? `Enter the 6-digit code sent to ${user?.email || "your email"}`
    : `Enter the code sent to ${phoneHint || "your phone"}`;
  const icon = isEmail ? "mail" : "phone-portrait";

  useEffect(() => {
    if (authStep === "idle") {
      router.replace("/(tabs)");
    }
  }, [authStep]);

  const handleDigitChange = (text: string, index: number) => {
    const digit = text.replace(/[^0-9]/g, "").slice(-1);
    const newDigits = [...digits];
    newDigits[index] = digit;
    setDigits(newDigits);
    setError("");

    if (digit && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === "Backspace" && !digits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
      const newDigits = [...digits];
      newDigits[index - 1] = "";
      setDigits(newDigits);
    }
  };

  const handleVerify = async () => {
    const code = digits.join("");
    if (code.length !== 6) {
      setError("Please enter all 6 digits.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      if (isEmail) {
        await verifyEmail(code);
      } else {
        await verify2FA(code);
      }
    } catch (err: any) {
      const msg = err?.message || "Verification failed.";
      if (msg.includes("400")) {
        setError("Invalid or expired code. Please try again.");
      } else {
        setError(msg);
      }
      setDigits(["", "", "", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResending(true);
    setError("");
    try {
      await resendCode(isEmail ? "email_verify" : "sms_2fa");
      setSuccess("New code sent!");
      setTimeout(() => setSuccess(""), 3000);
    } catch {
      setError("Failed to resend code. Please try again.");
    } finally {
      setResending(false);
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
            paddingTop: insets.top + webTopInset + 60,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20,
            maxWidth: isDesktop ? 480 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.logoSection}>
          <View style={styles.iconContainer}>
            <Ionicons name={icon as any} size={36} color={Colors.primary} />
          </View>
          <GradientText text={title} style={styles.title} />
          <Text style={styles.subtitle}>{subtitle}</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {success ? (
          <View style={styles.successBox}>
            <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
            <Text style={styles.successText}>{success}</Text>
          </View>
        ) : null}

        <GlassCard>
          <View style={styles.codeRow}>
            {digits.map((digit, i) => (
              <TextInput
                key={i}
                ref={(ref) => {
                  inputRefs.current[i] = ref;
                }}
                style={[styles.codeInput, digit ? styles.codeInputFilled : null]}
                value={digit}
                onChangeText={(text) => handleDigitChange(text, i)}
                onKeyPress={(e) => handleKeyPress(e, i)}
                keyboardType="number-pad"
                maxLength={1}
                selectTextOnFocus
                autoFocus={i === 0}
              />
            ))}
          </View>
        </GlassCard>

        <GradientButton
          title="Verify"
          onPress={handleVerify}
          loading={loading}
          disabled={loading || digits.join("").length !== 6}
          style={styles.verifyButton}
        />

        <Pressable onPress={handleResend} disabled={resending} style={styles.resendButton}>
          {resending ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <Text style={styles.resendText}>
              Didn't receive a code? <Text style={styles.resendLink}>Resend</Text>
            </Text>
          )}
        </Pressable>

        <Pressable onPress={logout} style={styles.cancelButton}>
          <Text style={styles.cancelText}>Cancel and sign out</Text>
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
  logoSection: {
    alignItems: "center" as const,
    marginBottom: 12,
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
    fontSize: 24,
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
  codeRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingVertical: 8,
  },
  codeInput: {
    width: 44,
    height: 52,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1.5,
    borderColor: Colors.border,
    textAlign: "center" as const,
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  codeInputFilled: {
    borderColor: "rgba(0,255,255,0.3)",
    backgroundColor: "rgba(0,255,255,0.05)",
  },
  verifyButton: {
    marginTop: 4,
  },
  resendButton: {
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  resendText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  resendLink: {
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  cancelButton: {
    alignItems: "center" as const,
    paddingVertical: 8,
  },
  cancelText: {
    fontSize: 13,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
});
