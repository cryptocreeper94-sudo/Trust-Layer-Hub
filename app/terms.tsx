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
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GradientText } from "@/components/GradientText";

export default function TermsScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={styles.closeButton} hitSlop={8} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
        <GradientText text="Terms of Service" style={styles.headerTitle} />
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

        <Text style={styles.sectionTitle}>1. Acceptance of Terms</Text>
        <Text style={styles.body}>
          By accessing or using the Trust Layer Hub application ("App"), operated by DarkWave Studios LLC ("Company," "we," "us," or "our"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, you must not use the App.
        </Text>
        <Text style={styles.body}>
          These Terms constitute a legally binding agreement between you and DarkWave Studios LLC. We reserve the right to modify these Terms at any time, and such modifications will be effective upon posting within the App. Your continued use of the App after any changes constitutes acceptance of the revised Terms.
        </Text>

        <Text style={styles.sectionTitle}>2. Description of Service</Text>
        <Text style={styles.body}>
          Trust Layer Hub is a blockchain-integrated identity and security platform within the DarkWave Studios ecosystem. The App provides:
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Digital identity management through Trust Layer IDs
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Blockchain-verified security hallmarks (TrustHub Hallmark System)
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Multi-factor authentication including SMS-based 2FA
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Access to the DarkWave Studios ecosystem of applications
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} AI-powered assistant and chat features
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Wallet and token management
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Membership tiers and subscription services
        </Text>

        <Text style={styles.sectionTitle}>3. Eligibility</Text>
        <Text style={styles.body}>
          You must be at least 18 years old and have the legal capacity to enter into a binding agreement to use this App. By using the App, you represent and warrant that you meet these requirements. If you are using the App on behalf of an organization, you represent that you have authority to bind that organization to these Terms.
        </Text>

        <Text style={styles.sectionTitle}>4. Account Registration and Security</Text>
        <Text style={styles.body}>
          To access certain features of the App, you must create an account. You agree to provide accurate, current, and complete information during registration, and to update this information as necessary. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.
        </Text>
        <Text style={styles.body}>
          You must immediately notify us of any unauthorized use of your account or any other security breach. DarkWave Studios LLC will not be liable for any loss or damage arising from your failure to protect your account credentials.
        </Text>

        <Text style={styles.sectionTitle}>5. SMS Communications</Text>
        <Text style={styles.body}>
          By opting in to SMS communications, you consent to receive text messages from Trust Layer Hub for account verification, security alerts, and two-factor authentication purposes. Message and data rates may apply. Message frequency varies based on your account activity.
        </Text>
        <Text style={styles.body}>
          You may opt out of SMS communications at any time by replying STOP to any message received from us. For help, reply HELP. Your consent to receive SMS messages is not a condition of purchasing any goods or services from us. Standard messaging rates from your wireless carrier may apply.
        </Text>

        <Text style={styles.sectionTitle}>6. Blockchain Services</Text>
        <Text style={styles.body}>
          The App integrates with blockchain technology for identity verification and security hallmark generation. You acknowledge and agree that:
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Blockchain transactions are immutable and cannot be reversed once confirmed
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} We do not control blockchain networks and cannot guarantee transaction processing times
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Digital assets and tokens are subject to market volatility and regulatory changes
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} You are solely responsible for maintaining the security of your wallet and private keys
        </Text>

        <Text style={styles.sectionTitle}>7. Intellectual Property</Text>
        <Text style={styles.body}>
          All content, features, and functionality of the App, including but not limited to text, graphics, logos, icons, software, and the TrustHub Hallmark System, are the exclusive property of DarkWave Studios LLC and are protected by United States and international copyright, trademark, patent, trade secret, and other intellectual property laws.
        </Text>

        <Text style={styles.sectionTitle}>8. Third-Party Services</Text>
        <Text style={styles.body}>
          The App integrates with third-party services including but not limited to:
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} OpenAI for AI-powered features and natural language processing
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} ElevenLabs for voice synthesis and audio processing
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Twilio for SMS communications and verification
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Resend for email delivery services
        </Text>
        <Text style={styles.body}>
          Your use of these third-party services is subject to their respective terms and privacy policies. We are not responsible for the practices of third-party service providers.
        </Text>

        <Text style={styles.sectionTitle}>9. Prohibited Conduct</Text>
        <Text style={styles.body}>You agree not to:</Text>
        <Text style={styles.bullet}>
          {"\u2022"} Use the App for any unlawful purpose or in violation of any applicable laws
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Attempt to gain unauthorized access to the App's systems or other users' accounts
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Interfere with or disrupt the integrity or performance of the App
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Reverse engineer, decompile, or disassemble any portion of the App
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Forge or manipulate Trust Layer IDs, hallmarks, or trust stamps
        </Text>
        <Text style={styles.bullet}>
          {"\u2022"} Use the App to engage in fraud, money laundering, or terrorist financing
        </Text>

        <Text style={styles.sectionTitle}>10. Limitation of Liability</Text>
        <Text style={styles.body}>
          TO THE MAXIMUM EXTENT PERMITTED BY APPLICABLE LAW, DARKWAVE STUDIOS LLC SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS, DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES, RESULTING FROM YOUR ACCESS TO OR USE OF (OR INABILITY TO ACCESS OR USE) THE APP.
        </Text>

        <Text style={styles.sectionTitle}>11. Disclaimer of Warranties</Text>
        <Text style={styles.body}>
          THE APP IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, WHETHER EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT. WE DO NOT WARRANT THAT THE APP WILL BE UNINTERRUPTED, ERROR-FREE, OR SECURE.
        </Text>

        <Text style={styles.sectionTitle}>12. Indemnification</Text>
        <Text style={styles.body}>
          You agree to indemnify, defend, and hold harmless DarkWave Studios LLC, its officers, directors, employees, agents, and affiliates from and against any claims, liabilities, damages, losses, costs, and expenses arising from your use of the App or your violation of these Terms.
        </Text>

        <Text style={styles.sectionTitle}>13. Termination</Text>
        <Text style={styles.body}>
          We reserve the right to suspend or terminate your access to the App at any time, with or without cause, and with or without notice. Upon termination, your right to use the App will immediately cease. All provisions of these Terms that by their nature should survive termination shall survive.
        </Text>

        <Text style={styles.sectionTitle}>14. Governing Law</Text>
        <Text style={styles.body}>
          These Terms shall be governed by and construed in accordance with the laws of the United States, without regard to conflict of law principles. Any disputes arising under these Terms shall be resolved in the courts of competent jurisdiction.
        </Text>

        <Text style={styles.sectionTitle}>15. Contact Information</Text>
        <Text style={styles.body}>
          For questions about these Terms of Service, please contact:
        </Text>
        <Text style={styles.body}>
          DarkWave Studios LLC{"\n"}
          Email: legal@tlid.io{"\n"}
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
