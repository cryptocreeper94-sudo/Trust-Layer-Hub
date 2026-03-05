import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  Platform,
  ActivityIndicator,
  useWindowDimensions,
  ScrollView,
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
import { useAuth } from "@/lib/auth-context";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { login, loginWithSSO, loginWithBiometrics, biometricsAvailable, biometricsEnabled, authStep } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [showSecurityInfo, setShowSecurityInfo] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter your email and password.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email.trim(), password, rememberMe);
    } catch (err: any) {
      const msg = err?.message || "Login failed. Please try again.";
      if (msg.includes("401") || msg.includes("403") || msg.includes("Invalid")) {
        setError("Invalid email or password.");
      } else {
        setError(msg);
      }
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  const handleBiometricLogin = async () => {
    setError("");
    setBiometricLoading(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      const success = await loginWithBiometrics();
      if (!success) {
        setError("Biometric login failed. Please sign in with your credentials.");
      }
    } catch {
      setError("Biometric authentication unavailable.");
    }
    setBiometricLoading(false);
  };

  React.useEffect(() => {
    if (authStep === "email_verify" || authStep === "sms_2fa") {
      router.replace("/verify");
    }
  }, [authStep]);

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 60, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20, maxWidth: isDesktop ? 480 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]} keyboardShouldPersistTaps="handled">
        <View style={styles.logoSection}>
          <View style={styles.logoIcon}>
            <Ionicons name="shield-checkmark" size={40} color={Colors.primary} />
          </View>
          <GradientText text="Trust Layer" style={styles.title} />
          <Text style={styles.subtitle}>Sign in to your account</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <GlassCard>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
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
                returnKeyType="next"
                autoComplete="email"
                textContentType="emailAddress"
                testID="login-email-input"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
                autoComplete="password"
                textContentType="password"
                testID="login-password-input"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8} testID="login-toggle-password">
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          </View>
        </GlassCard>

        <View style={styles.rememberRow}>
          <Pressable
            style={styles.rememberToggle}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setRememberMe(!rememberMe);
            }}
            testID="login-remember-me"
          >
            <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
              {rememberMe && <Ionicons name="checkmark" size={14} color="#fff" />}
            </View>
            <Text style={styles.rememberText}>Remember me for 30 days</Text>
          </Pressable>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setShowSecurityInfo(!showSecurityInfo);
            }}
            hitSlop={8}
            testID="login-security-info"
          >
            <Ionicons name="information-circle-outline" size={20} color={Colors.textMuted} />
          </Pressable>
        </View>

        {showSecurityInfo && (
          <View style={styles.securityInfoBox}>
            <Ionicons name="shield-checkmark" size={16} color={Colors.primary} />
            <Text style={styles.securityInfoText}>
              When disabled, your session expires after 24 hours. Enabling "Remember me" extends your session to 30 days. Your credentials are stored securely on this device only and are never shared.
            </Text>
          </View>
        )}

        <GradientButton
          title="Sign In"
          onPress={handleLogin}
          loading={loading}
          disabled={loading}
          style={styles.loginButton}
          testID="login-submit-button"
        />

        {biometricsAvailable && biometricsEnabled && Platform.OS !== "web" && (
          <Pressable
            style={styles.biometricButton}
            onPress={handleBiometricLogin}
            disabled={biometricLoading}
            testID="login-biometric-button"
          >
            {biometricLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <>
                <Ionicons name="finger-print" size={28} color={Colors.primary} />
                <Text style={styles.biometricText}>Sign in with biometrics</Text>
              </>
            )}
          </Pressable>
        )}

        <View style={styles.ssoDivider}>
          <View style={styles.ssoDividerLine} />
          <Text style={styles.ssoDividerText}>or</Text>
          <View style={styles.ssoDividerLine} />
        </View>

        <Pressable
          style={styles.ssoButton}
          onPress={async () => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setError("");
            setSsoLoading(true);
            const ssoEmail = email.trim();
            if (!ssoEmail) {
              setError("Enter your Trust Layer email above, then tap this button.");
              setSsoLoading(false);
              return;
            }
            try {
              const res = await fetch(
                `https://dwtl.io/api/auth/lookup`,
                {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ email: ssoEmail }),
                }
              );
              if (res.ok) {
                const data = await res.json();
                if (data.sessionToken || data.token) {
                  const success = await loginWithSSO(data.sessionToken || data.token);
                  if (success) {
                    setSsoLoading(false);
                    return;
                  }
                }
              }
              setError("Could not find an existing Trust Layer account. Please sign in with your credentials or create an account.");
            } catch {
              setError("Trust Layer ecosystem is temporarily unavailable. Please sign in with your credentials.");
            }
            setSsoLoading(false);
          }}
          disabled={ssoLoading}
          testID="login-sso-button"
        >
          {ssoLoading ? (
            <ActivityIndicator size="small" color={Colors.primary} />
          ) : (
            <>
              <Ionicons name="shield-checkmark" size={22} color={Colors.primary} />
              <Text style={styles.ssoButtonText}>Sign in with Trust Layer</Text>
            </>
          )}
        </Pressable>
        <Text style={styles.ssoHint}>Already a Trust Layer ecosystem member? Enter your email above and use this button.</Text>

        <View style={styles.forgotRow}>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/forgot-password");
            }}
            hitSlop={8}
            testID="login-forgot-password"
          >
            <Text style={styles.forgotLink}>Forgot password?</Text>
          </Pressable>
          <Text style={styles.forgotDot}>{"\u00B7"}</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/forgot-username");
            }}
            hitSlop={8}
            testID="login-forgot-username"
          >
            <Text style={styles.forgotLink}>Forgot username?</Text>
          </Pressable>
        </View>

        <View style={styles.registerRow}>
          <Text style={styles.registerText}>New to Trust Layer?</Text>
          <Pressable onPress={() => router.push("/register")} hitSlop={8} testID="login-create-account">
            <Text style={styles.registerLink}>Create Account</Text>
          </Pressable>
        </View>

        <Pressable
          style={styles.skipButton}
          onPress={() => router.replace("/(tabs)")}
          testID="login-continue-guest"
        >
          <Text style={styles.skipText}>Continue as Guest</Text>
        </Pressable>

        <View style={styles.legalRow}>
          <Pressable onPress={() => router.push("/terms")}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.legalDot}>{"\u00B7"}</Text>
          <Pressable onPress={() => router.push("/privacy")}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
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
  logoIcon: {
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
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 4,
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
  rememberRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  rememberToggle: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  checkboxActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  rememberText: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  securityInfoBox: {
    flexDirection: "row" as const,
    gap: 10,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.12)",
    borderRadius: 10,
    padding: 12,
  },
  securityInfoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    flex: 1,
    lineHeight: 18,
  },
  biometricButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.15)",
  },
  biometricText: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  ssoDivider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginVertical: 4,
  },
  ssoDividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
  },
  ssoDividerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textTransform: "uppercase" as const,
    letterSpacing: 1,
  },
  ssoButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    backgroundColor: "rgba(147,51,234,0.08)",
    borderWidth: 1,
    borderColor: "rgba(147,51,234,0.2)",
  },
  ssoButtonText: {
    fontSize: 15,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  ssoHint: {
    fontSize: 11,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    lineHeight: 16,
  },
  loginButton: {
    marginTop: 4,
  },
  forgotRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
  },
  forgotLink: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  forgotDot: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  registerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
  },
  registerText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  registerLink: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  skipButton: {
    alignItems: "center" as const,
    paddingVertical: 10,
  },
  skipText: {
    fontSize: 14,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  legalRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  legalLink: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  legalDot: {
    fontSize: 12,
    color: Colors.textMuted,
  },
});
