import React from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GradientText } from "@/components/GradientText";

export default function PrivacyScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => router.back()} style={styles.closeButton}>
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <GradientText text="Privacy Policy" style={styles.headerTitle} />
        <View style={{ width: 40 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            maxWidth: isDesktop ? 720 : undefined,
            alignSelf: isDesktop ? "center" as const : undefined,
            width: isDesktop ? "100%" : undefined,
            paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 40),
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.effective}>Effective Date: March 3, 2026</Text>

        <Text style={styles.sectionTitle}>1. Introduction</Text>
        <Text style={styles.body}>
          DarkWave Studios LLC ("Company," "we," "us," or "our") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use the Trust Layer Hub application ("App"). Please read this policy carefully. By using the App, you consent to the data practices described in this policy.
        </Text>

        <Text style={styles.sectionTitle}>2. Information We Collect</Text>
        <Text style={styles.subTitle}>2.1 Personal Information</Text>
        <Text style={styles.body}>
          We collect the following personal information when you create an account or use our services:
        </Text>
        <Text style={styles.bullet}>{"\u2022"} Name and display name</Text>
        <Text style={styles.bullet}>{"\u2022"} Email address</Text>
        <Text style={styles.bullet}>{"\u2022"} Username</Text>
        <Text style={styles.bullet}>{"\u2022"} Phone number (when opting into SMS services)</Text>
        <Text style={styles.bullet}>{"\u2022"} Account credentials (passwords are encrypted and hashed)</Text>
        <Text style={styles.bullet}>{"\u2022"} Trust Layer ID and membership information</Text>

        <Text style={styles.subTitle}>2.2 Usage Data</Text>
        <Text style={styles.body}>We automatically collect certain information when you use the App:</Text>
        <Text style={styles.bullet}>{"\u2022"} Device information (type, operating system, unique identifiers)</Text>
        <Text style={styles.bullet}>{"\u2022"} IP address and approximate location</Text>
        <Text style={styles.bullet}>{"\u2022"} App usage patterns, session duration, and feature interactions</Text>
        <Text style={styles.bullet}>{"\u2022"} Error logs and performance data</Text>

        <Text style={styles.subTitle}>2.3 Blockchain Data</Text>
        <Text style={styles.body}>
          When you use blockchain-related features, we collect and store transaction hashes, block heights, hallmark identifiers, trust stamps, and associated metadata. Blockchain transactions are inherently public and immutable.
        </Text>

        <Text style={styles.subTitle}>2.4 Communication Data</Text>
        <Text style={styles.body}>
          If you opt into SMS communications, we collect your phone number and records of messages sent for verification and security purposes. If you use the AI chat feature, we collect conversation content to provide and improve the service.
        </Text>

        <Text style={styles.sectionTitle}>3. How We Use Your Information</Text>
        <Text style={styles.body}>We use the information we collect for the following purposes:</Text>
        <Text style={styles.bullet}>{"\u2022"} To create and manage your account and Trust Layer identity</Text>
        <Text style={styles.bullet}>{"\u2022"} To verify your identity through email and SMS verification</Text>
        <Text style={styles.bullet}>{"\u2022"} To provide two-factor authentication for enhanced security</Text>
        <Text style={styles.bullet}>{"\u2022"} To generate blockchain-verified hallmarks and trust stamps</Text>
        <Text style={styles.bullet}>{"\u2022"} To send security alerts and account notifications</Text>
        <Text style={styles.bullet}>{"\u2022"} To process transactions and manage wallet features</Text>
        <Text style={styles.bullet}>{"\u2022"} To provide AI-powered assistant and chat features</Text>
        <Text style={styles.bullet}>{"\u2022"} To improve the App, develop new features, and fix bugs</Text>
        <Text style={styles.bullet}>{"\u2022"} To comply with legal obligations and enforce our Terms</Text>

        <Text style={styles.sectionTitle}>4. Data Sharing and Third-Party Services</Text>
        <Text style={styles.body}>
          We share your data with the following third-party service providers who assist us in operating the App:
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} OpenAI — Processes AI chat interactions and natural language queries. Conversation data is sent to OpenAI's API for processing.
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} ElevenLabs — Provides voice synthesis and audio processing capabilities. Audio data may be transmitted for processing.
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Twilio — Handles SMS message delivery for verification codes and security alerts. Your phone number and message content are shared with Twilio.
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Resend — Manages transactional email delivery for account verification and notifications. Your email address is shared with Resend.
        </Text>
        <Text style={styles.body}>
          We do not sell your personal information to third parties. We may disclose your information if required by law, court order, or governmental authority.
        </Text>

        <Text style={styles.sectionTitle}>5. Data Storage and Security</Text>
        <Text style={styles.body}>
          Your data is stored on secure servers using industry-standard encryption. Passwords are hashed using bcrypt and are never stored in plain text. We implement administrative, technical, and physical safeguards to protect your information. However, no method of transmission over the Internet or electronic storage is 100% secure.
        </Text>
        <Text style={styles.body}>
          Blockchain data, including hallmarks and trust stamps, is stored both in our database and on distributed ledger networks. Data written to the blockchain is permanent and cannot be deleted.
        </Text>

        <Text style={styles.sectionTitle}>6. Cookies and Tracking</Text>
        <Text style={styles.body}>
          The App may use session tokens, local storage, and similar technologies to maintain your authentication state and preferences. We use analytics to understand how users interact with the App. You can manage cookie preferences through your device settings.
        </Text>

        <Text style={styles.sectionTitle}>7. Your Rights</Text>
        <Text style={styles.body}>Depending on your jurisdiction, you may have the following rights:</Text>
        <Text style={styles.bullet}>{"\u2022"} Access — Request a copy of your personal data</Text>
        <Text style={styles.bullet}>{"\u2022"} Correction — Request correction of inaccurate data</Text>
        <Text style={styles.bullet}>{"\u2022"} Deletion — Request deletion of your personal data (excluding blockchain records)</Text>
        <Text style={styles.bullet}>{"\u2022"} Portability — Request transfer of your data in a machine-readable format</Text>
        <Text style={styles.bullet}>{"\u2022"} Opt-out — Opt out of SMS communications by replying STOP at any time</Text>
        <Text style={styles.bullet}>{"\u2022"} Withdraw consent — Withdraw consent for data processing where applicable</Text>
        <Text style={styles.body}>
          To exercise any of these rights, please contact us at privacy@tlid.io.
        </Text>

        <Text style={styles.sectionTitle}>8. Data Retention</Text>
        <Text style={styles.body}>
          We retain your personal information for as long as your account is active or as needed to provide services. If you delete your account, we will remove your personal data within 30 days, except where retention is required by law or for legitimate business purposes. Blockchain records are permanent and cannot be removed.
        </Text>

        <Text style={styles.sectionTitle}>9. Children's Privacy</Text>
        <Text style={styles.body}>
          The App is not intended for individuals under the age of 18. We do not knowingly collect personal information from children. If we become aware that we have collected data from a child, we will take steps to delete that information promptly.
        </Text>

        <Text style={styles.sectionTitle}>10. International Data Transfers</Text>
        <Text style={styles.body}>
          Your information may be transferred to and processed in countries other than your country of residence. By using the App, you consent to the transfer of your data to the United States and other jurisdictions where we or our service providers operate.
        </Text>

        <Text style={styles.sectionTitle}>11. Changes to This Policy</Text>
        <Text style={styles.body}>
          We may update this Privacy Policy from time to time. We will notify you of any material changes by posting the updated policy within the App and updating the "Effective Date." Your continued use of the App after changes are posted constitutes acceptance of the revised policy.
        </Text>

        <Text style={styles.sectionTitle}>12. Contact Us</Text>
        <Text style={styles.body}>
          If you have questions or concerns about this Privacy Policy, please contact:
        </Text>
        <Text style={styles.body}>
          DarkWave Studios LLC{"\n"}
          Email: privacy@tlid.io{"\n"}
          Website: https://trusthub.tlid.io
        </Text>

        <View style={styles.footerDivider} />
        <Text style={styles.footerText}>
          &copy; 2026 DarkWave Studios LLC. All rights reserved.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "space-between" as const,
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  effective: {
    fontSize: 13,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    fontWeight: "700" as const,
    marginTop: 24,
    marginBottom: 10,
  },
  subTitle: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    fontWeight: "600" as const,
    marginTop: 14,
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 10,
  },
  bullet: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
    marginBottom: 4,
    paddingLeft: 12,
  },
  footerDivider: {
    height: 1,
    backgroundColor: Colors.border,
    marginTop: 32,
    marginBottom: 16,
  },
  footerText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
});
