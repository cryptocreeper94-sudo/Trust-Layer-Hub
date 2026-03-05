import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";
import * as LocalAuthentication from "expo-local-authentication";
import {
  apiPost,
  apiGet,
  getSessionToken,
  setSessionToken,
  clearSessionToken,
  clearChatToken,
} from "@/lib/api";

interface User {
  id: string;
  email: string;
  username: string;
  firstName?: string;
  displayName?: string;
  trustLayerId?: string;
  membershipStatus?: string;
  membershipType?: string;
  emailVerified?: boolean;
  phoneVerified?: boolean;
  twoFactorEnabled?: boolean;
  isMultisig?: boolean;
  [key: string]: unknown;
}

type AuthStep = "idle" | "email_verify" | "sms_2fa";

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  authStep: AuthStep;
  phoneHint: string;
  isNewRegistration: boolean;
  isDevMode: boolean;
  biometricsAvailable: boolean;
  biometricsEnabled: boolean;
  login: (email: string, password: string, rememberMe?: boolean) => Promise<void>;
  loginWithSSO: (ssoToken: string) => Promise<boolean>;
  loginWithBiometrics: () => Promise<boolean>;
  enableBiometrics: () => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  register: (email: string, username: string, password: string, firstName?: string) => Promise<void>;
  verifyEmail: (code: string) => Promise<void>;
  verify2FA: (code: string) => Promise<void>;
  resendCode: (type: "email_verify" | "sms_2fa") => Promise<void>;
  updatePhone: (phone: string) => Promise<void>;
  verifyPhone: (code: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  clearAuthStep: () => void;
  clearNewRegistration: () => void;
  activateDevMode: (pin: string) => boolean;
  deactivateDevMode: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [authStep, setAuthStep] = useState<AuthStep>("idle");
  const [phoneHint, setPhoneHint] = useState("");
  const [isNewRegistration, setIsNewRegistration] = useState(false);
  const [isDevMode, setIsDevMode] = useState(false);
  const [biometricsAvailable, setBiometricsAvailable] = useState(false);
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    checkSession();
    AsyncStorage.getItem("devModeActive").then(val => {
      if (val === "true") setIsDevMode(true);
    });
    AsyncStorage.getItem("biometricsEnabled").then(val => {
      if (val === "true") setBiometricsEnabled(true);
    });
    if (Platform.OS !== "web") {
      LocalAuthentication.hasHardwareAsync().then(has => {
        if (has) {
          LocalAuthentication.isEnrolledAsync().then(enrolled => {
            setBiometricsAvailable(enrolled);
          });
        }
      });
    }
  }, []);

  async function checkSession() {
    try {
      const token = await getSessionToken();
      if (token) {
        const data = await apiGet<{ user: User }>("/api/auth/me");
        setUser(data.user);
      }
    } catch {
      await clearSessionToken();
    } finally {
      setIsLoading(false);
    }
  }

  async function login(email: string, password: string, rememberMe?: boolean) {
    const data = await apiPost<{
      user: User;
      sessionToken: string;
      requiresEmailVerification?: boolean;
      requires2FA?: boolean;
      phoneHint?: string;
    }>("/api/auth/login", { email, password, rememberMe: rememberMe ?? false }, false);

    await setSessionToken(data.sessionToken);
    setUser(data.user);

    if (rememberMe && Platform.OS !== "web") {
      await SecureStore.setItemAsync("biometricEmail", email);
      await SecureStore.setItemAsync("biometricPassword", password);
    }

    if (data.requiresEmailVerification) {
      setAuthStep("email_verify");
    } else if (data.requires2FA) {
      setAuthStep("sms_2fa");
      setPhoneHint(data.phoneHint || "");
    } else {
      setAuthStep("idle");
    }
  }

  async function loginWithSSO(ssoToken: string): Promise<boolean> {
    try {
      const data = await apiPost<{
        user: User;
        sessionToken: string;
        ssoLinked: boolean;
      }>("/api/auth/sso/verify", { sso_token: ssoToken }, false);

      await setSessionToken(data.sessionToken);
      setUser(data.user);
      return true;
    } catch {
      return false;
    }
  }

  async function loginWithBiometrics(): Promise<boolean> {
    if (Platform.OS === "web") return false;
    try {
      const enabled = await AsyncStorage.getItem("biometricsEnabled");
      if (enabled !== "true") return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Sign in to Trust Layer Hub",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (!result.success) return false;

      const savedEmail = await SecureStore.getItemAsync("biometricEmail");
      const savedPassword = await SecureStore.getItemAsync("biometricPassword");

      if (!savedEmail || !savedPassword) return false;

      await login(savedEmail, savedPassword, true);
      return true;
    } catch {
      return false;
    }
  }

  async function enableBiometrics(): Promise<boolean> {
    if (Platform.OS === "web") return false;
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      if (!hasHardware) return false;

      const isEnrolled = await LocalAuthentication.isEnrolledAsync();
      if (!isEnrolled) return false;

      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: "Enable biometric login",
        cancelLabel: "Cancel",
        disableDeviceFallback: false,
      });

      if (!result.success) return false;

      await AsyncStorage.setItem("biometricsEnabled", "true");
      setBiometricsEnabled(true);
      setBiometricsAvailable(true);
      return true;
    } catch {
      return false;
    }
  }

  async function disableBiometrics() {
    await AsyncStorage.removeItem("biometricsEnabled");
    if (Platform.OS !== "web") {
      await SecureStore.deleteItemAsync("biometricEmail");
      await SecureStore.deleteItemAsync("biometricPassword");
    }
    setBiometricsEnabled(false);
  }

  async function register(email: string, username: string, password: string, firstName?: string) {
    const data = await apiPost<{
      user: User;
      sessionToken: string;
      requiresEmailVerification?: boolean;
    }>("/api/auth/register", { email, username, password, firstName }, false);

    await setSessionToken(data.sessionToken);
    setUser(data.user);

    const hasSeenOnboarding = await AsyncStorage.getItem("hasSeenOnboarding");
    if (!hasSeenOnboarding) {
      setIsNewRegistration(true);
    }

    if (data.requiresEmailVerification) {
      setAuthStep("email_verify");
    }
  }

  async function verifyEmail(code: string) {
    const data = await apiPost<{ success: boolean; user: User }>(
      "/api/auth/verify-email",
      { code },
      true
    );
    setUser(data.user);
    setAuthStep("idle");
  }

  async function verify2FA(code: string) {
    const data = await apiPost<{ user: User; sessionToken: string }>(
      "/api/auth/phone/verify",
      { code },
      true
    );
    await setSessionToken(data.sessionToken);
    setUser(data.user);
    setAuthStep("idle");
  }

  async function resendCode(type: "email_verify" | "sms_2fa") {
    await apiPost("/api/auth/resend-verification", { type }, true);
  }

  async function updatePhone(phone: string) {
    const data = await apiPost<{ success: boolean; requiresVerification?: boolean }>(
      "/api/user/phone-settings",
      { phone },
      true
    );
    if (data.requiresVerification) {
      setAuthStep("sms_2fa");
      setPhoneHint(phone.slice(0, 4) + "****" + phone.slice(-2));
    }
  }

  async function verifyPhone(code: string) {
    await apiPost("/api/auth/phone/verify-setup", { code }, true);
    await refreshUser();
    setAuthStep("idle");
  }

  async function logout() {
    try {
      await apiPost("/api/auth/logout", undefined, true);
    } catch {}
    await clearSessionToken();
    await clearChatToken();
    setUser(null);
    setAuthStep("idle");
    setPhoneHint("");
    setIsDevMode(false);
    AsyncStorage.removeItem("devModeActive");
    AsyncStorage.removeItem("biometricsEnabled");
    if (Platform.OS !== "web") {
      SecureStore.deleteItemAsync("biometricEmail").catch(() => {});
      SecureStore.deleteItemAsync("biometricPassword").catch(() => {});
    }
    setBiometricsEnabled(false);
  }

  async function refreshUser() {
    try {
      const data = await apiGet<{ user: User }>("/api/auth/me");
      setUser(data.user);
    } catch {}
  }

  function clearAuthStep() {
    setAuthStep("idle");
  }

  function clearNewRegistration() {
    setIsNewRegistration(false);
  }

  function activateDevMode(pin: string): boolean {
    if (pin === "0424") {
      setIsDevMode(true);
      AsyncStorage.setItem("devModeActive", "true");
      return true;
    }
    return false;
  }

  function deactivateDevMode() {
    setIsDevMode(false);
    AsyncStorage.removeItem("devModeActive");
  }

  const value = useMemo(
    () => ({
      user,
      isLoading,
      isAuthenticated: !!user && authStep === "idle",
      authStep,
      phoneHint,
      isNewRegistration,
      isDevMode,
      biometricsAvailable,
      biometricsEnabled,
      login,
      loginWithSSO,
      loginWithBiometrics,
      enableBiometrics,
      disableBiometrics,
      register,
      verifyEmail,
      verify2FA,
      resendCode,
      updatePhone,
      verifyPhone,
      logout,
      refreshUser,
      clearAuthStep,
      clearNewRegistration,
      activateDevMode,
      deactivateDevMode,
    }),
    [user, isLoading, authStep, phoneHint, isNewRegistration, isDevMode, biometricsAvailable, biometricsEnabled]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
