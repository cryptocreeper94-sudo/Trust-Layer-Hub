import React, { useState, useMemo } from "react";
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

function PasswordRule({ met, label }: { met: boolean; label: string }) {
  return (
    <View style={styles.ruleRow}>
      <Ionicons
        name={met ? "checkmark-circle" : "ellipse-outline"}
        size={14}
        color={met ? Colors.success : Colors.textMuted}
      />
      <Text style={[styles.ruleText, met && styles.ruleTextMet]}>{label}</Text>
    </View>
  );
}

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { register } = useAuth();
  const [firstName, setFirstName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const passwordRules = useMemo(() => ({
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasSpecial: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?`~]/.test(password),
  }), [password]);

  const passwordValid = passwordRules.minLength && passwordRules.hasUppercase && passwordRules.hasSpecial;

  const handleRegister = async () => {
    if (!firstName.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setError("Please fill in all fields.");
      return;
    }
    if (!passwordValid) {
      setError("Please meet all password requirements.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register(email.trim(), username.trim(), password, firstName.trim());
      const AsyncStorage = (await import("@react-native-async-storage/async-storage")).default;
      const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
      if (!hasSeenOnboarding) {
        router.replace("/onboarding");
      } else {
        router.replace("/verify");
      }
    } catch (err: any) {
      const msg = err?.message || "Registration failed. Please try again.";
      if (msg.includes("409") || msg.includes("exists") || msg.includes("already")) {
        setError("An account with this email or username already exists.");
      } else if (msg.includes("400")) {
        const parsed = msg.match(/: (.*)/)?.[1];
        try {
          const obj = JSON.parse(parsed || "{}");
          setError(obj.error || msg);
        } catch {
          setError(msg);
        }
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
      <ScrollView style={{ flex: 1 }} contentContainerStyle={[styles.content, { paddingTop: insets.top + webTopInset + 40, paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 0) + 20, maxWidth: isDesktop ? 480 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]} keyboardShouldPersistTaps="handled">
        <View style={styles.headerRow}>
          <Pressable onPress={() => router.back()} style={styles.backButton}>
            <Ionicons name="chevron-back" size={24} color={Colors.primary} />
          </Pressable>
        </View>

        <View style={styles.logoSection}>
          <GradientText text="Create Account" style={styles.title} />
          <Text style={styles.subtitle}>Join the Trust Layer ecosystem</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Ionicons name="alert-circle" size={16} color={Colors.error} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <GlassCard>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>First Name</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Your first name"
                placeholderTextColor={Colors.textMuted}
                value={firstName}
                onChangeText={setFirstName}
                autoCapitalize="words"
                returnKeyType="next"
                autoComplete="given-name"
                textContentType="givenName"
                testID="register-firstname-input"
              />
            </View>
          </View>

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
                testID="register-email-input"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Username</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="person-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Choose a username"
                placeholderTextColor={Colors.textMuted}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                returnKeyType="next"
                autoComplete="username"
                textContentType="username"
                testID="register-username-input"
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="lock-closed-outline" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.input}
                placeholder="Create a strong password"
                placeholderTextColor={Colors.textMuted}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleRegister}
                autoComplete="new-password"
                textContentType="newPassword"
                testID="register-password-input"
              />
              <Pressable onPress={() => setShowPassword(!showPassword)} hitSlop={8} testID="register-toggle-password">
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={20}
                  color={Colors.textMuted}
                />
              </Pressable>
            </View>
          </View>

          {password.length > 0 && (
            <View style={styles.rulesContainer}>
              <PasswordRule met={passwordRules.minLength} label="At least 8 characters" />
              <PasswordRule met={passwordRules.hasUppercase} label="At least one uppercase letter" />
              <PasswordRule met={passwordRules.hasSpecial} label="At least one special character" />
            </View>
          )}
        </GlassCard>

        <GradientButton
          title="Create Account"
          onPress={handleRegister}
          loading={loading}
          disabled={loading}
          style={styles.registerButton}
          testID="register-submit-button"
        />

        <View style={styles.legalRow}>
          <Text style={styles.legalText}>By creating an account, you agree to our </Text>
          <Pressable onPress={() => router.push("/terms")}>
            <Text style={styles.legalLink}>Terms of Service</Text>
          </Pressable>
          <Text style={styles.legalText}> and </Text>
          <Pressable onPress={() => router.push("/privacy")}>
            <Text style={styles.legalLink}>Privacy Policy</Text>
          </Pressable>
        </View>

        <View style={styles.loginRow}>
          <Text style={styles.loginText}>Already have an account?</Text>
          <Pressable onPress={() => router.back()}>
            <Text style={styles.loginLink}>Sign In</Text>
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
  title: {
    fontSize: 28,
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
  rulesContainer: {
    gap: 6,
    marginTop: 4,
  },
  ruleRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  ruleText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  ruleTextMet: {
    color: Colors.success,
  },
  registerButton: {
    marginTop: 4,
  },
  loginRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 6,
  },
  loginText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  loginLink: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: "Inter_600SemiBold",
  },
  legalRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
  },
  legalText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
  },
  legalLink: {
    fontSize: 12,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
  },
});
