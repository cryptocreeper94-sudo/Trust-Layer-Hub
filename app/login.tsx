import React, { useState, useEffect } from "react";
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
import * as WebBrowser from "expo-web-browser";
import * as AuthSession from "expo-auth-session";
import Colors from "@/constants/colors";
import { useAuth } from "@/lib/auth-context";
import { apiPost } from "@/lib/api";

// Required for web OAuth redirect
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { login, loginWithSSO, loginWithBiometrics, biometricsAvailable, biometricsEnabled, authStep } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [ssoLoading, setSsoLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  // Google OAuth configuration
  const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID || "";
  const redirectUri = AuthSession.makeRedirectUri({ scheme: "trustlayer" });
  const discovery = AuthSession.useAutoDiscovery("https://accounts.google.com");

  const [googleRequest, googleResponse, promptGoogleAsync] = AuthSession.useAuthRequest(
    {
      clientId: GOOGLE_CLIENT_ID,
      scopes: ["openid", "profile", "email"],
      redirectUri,
      responseType: "id_token",
    },
    discovery
  );

  // Handle Google OAuth response
  useEffect(() => {
    if (googleResponse?.type === "success") {
      const idToken = googleResponse.params?.id_token;
      if (idToken) {
        handleGoogleToken(idToken);
      } else {
        setGoogleLoading(false);
        setError("Google sign-in did not return a token.");
      }
    } else if (googleResponse?.type === "error" || googleResponse?.type === "dismiss") {
      setGoogleLoading(false);
    }
  }, [googleResponse]);

  const handleGoogleToken = async (idToken: string) => {
    try {
      const data = await apiPost<{
        user: any;
        sessionToken: string;
      }>("/api/auth/firebase/verify", { idToken }, false);

      if (data.sessionToken) {
        await loginWithSSO(data.sessionToken);
      } else {
        setError("Google sign-in failed. Please try again.");
      }
    } catch (err: any) {
      setError(err?.message || "Google sign-in failed.");
    }
    setGoogleLoading(false);
  };

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
      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + (Platform.OS === "web" ? 80 : 60),
            paddingBottom: insets.bottom + 40,
          },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Centered card wrapper */}
        <View style={[styles.cardWrapper, isDesktop && { maxWidth: 400 }]}>
          {/* Logo */}
          <View style={styles.logoSection}>
            <View style={styles.logoIcon}>
              <Ionicons name="shield-checkmark" size={32} color="#06b6d4" />
            </View>
            <Text style={styles.title}>Trust Layer</Text>
            <Text style={styles.subtitle}>Sign in to continue</Text>
          </View>

          {/* Error */}
          {error ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={16} color={Colors.error} />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Email */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="you@example.com"
                placeholderTextColor="rgba(255,255,255,0.25)"
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

          {/* Password */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Password</Text>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.input}
                placeholder="Enter your password"
                placeholderTextColor="rgba(255,255,255,0.25)"
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
                  color="rgba(255,255,255,0.3)"
                />
              </Pressable>
            </View>
          </View>

          {/* Remember + Forgot */}
          <View style={styles.optionsRow}>
            <Pressable
              style={styles.rememberToggle}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setRememberMe(!rememberMe);
              }}
              testID="login-remember-me"
            >
              <View style={[styles.checkbox, rememberMe && styles.checkboxActive]}>
                {rememberMe && <Ionicons name="checkmark" size={12} color="#fff" />}
              </View>
              <Text style={styles.optionText}>Remember me</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.push("/forgot-password");
              }}
              hitSlop={8}
              testID="login-forgot-password"
            >
              <Text style={styles.linkText}>Forgot password?</Text>
            </Pressable>
          </View>

          {/* Sign In Button */}
          <Pressable
            style={[styles.signInButton, loading && styles.signInButtonDisabled]}
            onPress={handleLogin}
            disabled={loading}
            testID="login-submit-button"
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.signInButtonText}>Sign In</Text>
            )}
          </Pressable>

          {/* Biometrics (native only) */}
          {biometricsAvailable && biometricsEnabled && Platform.OS !== "web" && (
            <Pressable
              style={styles.biometricButton}
              onPress={handleBiometricLogin}
              disabled={biometricLoading}
              testID="login-biometric-button"
            >
              {biometricLoading ? (
                <ActivityIndicator size="small" color="#06b6d4" />
              ) : (
                <>
                  <Ionicons name="finger-print" size={22} color="#06b6d4" />
                  <Text style={styles.biometricText}>Sign in with biometrics</Text>
                </>
              )}
            </Pressable>
          )}

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>OR</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Google Sign In — Firebase style */}
          <Pressable
            style={styles.googleButton}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setError("");
              setGoogleLoading(true);
              try {
                await promptGoogleAsync();
              } catch {
                setError("Google sign-in unavailable.");
                setGoogleLoading(false);
              }
            }}
            disabled={googleLoading || !googleRequest}
            testID="login-google-button"
          >
            {googleLoading ? (
              <ActivityIndicator size="small" color="#4285F4" />
            ) : (
              <>
                <View style={styles.googleIconWrap}>
                  <Text style={styles.googleG}>G</Text>
                </View>
                <Text style={styles.googleButtonText}>Continue with Google</Text>
              </>
            )}
          </Pressable>

          {/* TrustLink SSO */}
          <Pressable
            style={styles.ssoButton}
            onPress={async () => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
              setError("");
              setSsoLoading(true);
              const ssoEmail = email.trim();
              if (!ssoEmail) {
                setError("Enter your email above, then tap TrustLink.");
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
                setError("No Trust Layer account found for this email.");
              } catch {
                setError("TrustLink is temporarily unavailable.");
              }
              setSsoLoading(false);
            }}
            disabled={ssoLoading}
            testID="login-trustlink-button"
          >
            {ssoLoading ? (
              <ActivityIndicator size="small" color="#06b6d4" />
            ) : (
              <>
                <Ionicons name="link" size={18} color="#06b6d4" />
                <Text style={styles.ssoButtonText}>Continue with TrustLink</Text>
              </>
            )}
          </Pressable>

          {/* Footer links */}
          <View style={styles.footerSection}>
            <View style={styles.footerRow}>
              <Text style={styles.footerText}>New to Trust Layer?</Text>
              <Pressable onPress={() => router.push("/register")} hitSlop={8} testID="login-create-account">
                <Text style={styles.linkText}>Create Account</Text>
              </Pressable>
            </View>

            <Pressable
              style={styles.guestButton}
              onPress={() => router.replace("/(tabs)")}
              testID="login-continue-guest"
            >
              <Text style={styles.guestText}>Continue as Guest</Text>
            </Pressable>

            <View style={styles.legalRow}>
              <Pressable onPress={() => router.push("/terms")}>
                <Text style={styles.legalLink}>Terms</Text>
              </Pressable>
              <Text style={styles.legalDot}>·</Text>
              <Pressable onPress={() => router.push("/privacy")}>
                <Text style={styles.legalLink}>Privacy</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a0c",
  },
  content: {
    flexGrow: 1,
    alignItems: "center",
    paddingHorizontal: 20,
  },
  cardWrapper: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    borderRadius: 16,
    padding: 28,
  },
  logoSection: {
    alignItems: "center" as const,
    marginBottom: 28,
  },
  logoIcon: {
    width: 56,
    height: 56,
    borderRadius: 14,
    backgroundColor: "rgba(6,182,212,0.08)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.15)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 14,
  },
  title: {
    fontSize: 22,
    fontWeight: "700" as const,
    color: "#fff",
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: "rgba(255,255,255,0.45)",
    fontFamily: "Inter_400Regular",
  },
  errorBox: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    backgroundColor: "rgba(239,68,68,0.08)",
    borderWidth: 1,
    borderColor: "rgba(239,68,68,0.15)",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_500Medium",
    marginBottom: 6,
    textTransform: "uppercase" as const,
    letterSpacing: 0.5,
  },
  inputWrapper: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: "#fff",
    fontFamily: "Inter_400Regular",
  },
  optionsRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    marginBottom: 20,
  },
  rememberToggle: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.15)",
    backgroundColor: "rgba(255,255,255,0.03)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  checkboxActive: {
    backgroundColor: "#06b6d4",
    borderColor: "#06b6d4",
  },
  optionText: {
    fontSize: 12,
    color: "rgba(255,255,255,0.5)",
    fontFamily: "Inter_400Regular",
  },
  linkText: {
    fontSize: 12,
    color: "#06b6d4",
    fontFamily: "Inter_500Medium",
  },
  signInButton: {
    backgroundColor: "#06b6d4",
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 12,
  },
  signInButtonDisabled: {
    opacity: 0.6,
  },
  signInButtonText: {
    fontSize: 15,
    fontWeight: "600" as const,
    color: "#fff",
    fontFamily: "Inter_600SemiBold",
  },
  biometricButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    backgroundColor: "rgba(6,182,212,0.06)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.12)",
    marginBottom: 12,
  },
  biometricText: {
    fontSize: 13,
    color: "#06b6d4",
    fontFamily: "Inter_500Medium",
  },
  divider: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginVertical: 16,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  dividerText: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    fontFamily: "Inter_500Medium",
    letterSpacing: 1,
  },
  googleButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 10,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: "#fff",
    marginBottom: 10,
  },
  googleIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 3,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  googleG: {
    fontSize: 16,
    fontWeight: "700" as const,
    color: "#4285F4",
    fontFamily: "Inter_700Bold",
  },
  googleButtonText: {
    fontSize: 14,
    color: "#333",
    fontFamily: "Inter_600SemiBold",
  },
  ssoButton: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 13,
    borderRadius: 10,
    backgroundColor: "rgba(6,182,212,0.06)",
    borderWidth: 1,
    borderColor: "rgba(6,182,212,0.12)",
    marginBottom: 4,
  },
  ssoButtonText: {
    fontSize: 14,
    color: "#06b6d4",
    fontFamily: "Inter_500Medium",
  },
  footerSection: {
    marginTop: 24,
    gap: 14,
    alignItems: "center" as const,
  },
  footerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
  },
  footerText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.4)",
    fontFamily: "Inter_400Regular",
  },
  guestButton: {
    paddingVertical: 6,
  },
  guestText: {
    fontSize: 13,
    color: "rgba(255,255,255,0.3)",
    fontFamily: "Inter_400Regular",
  },
  legalRow: {
    flexDirection: "row" as const,
    justifyContent: "center" as const,
    alignItems: "center" as const,
    gap: 8,
  },
  legalLink: {
    fontSize: 11,
    color: "rgba(255,255,255,0.2)",
    fontFamily: "Inter_400Regular",
  },
  legalDot: {
    fontSize: 11,
    color: "rgba(255,255,255,0.15)",
  },
});
