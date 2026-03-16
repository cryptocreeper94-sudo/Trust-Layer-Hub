import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  TextInput,
  Linking,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";

const FAQ_ITEMS = [
  { q: "What is Trust Layer?", a: "Trust Layer is a unified blockchain ecosystem of 35 interconnected applications spanning DeFi, security, gaming, AI, enterprise, and more. All apps share a single identity through TrustLink SSO." },
  { q: "How do I get a Trust Layer ID?", a: "Sign up through the Hub app or any ecosystem app. Your Trust Layer ID (TLID) is created during registration and works across all 35 apps." },
  { q: "What is Signal (SIG)?", a: "SIG is the native asset of the Trust Layer ecosystem. It powers transactions, governance, staking, and access across all apps. 1 SIG = $0.01 at launch." },
  { q: "How do Shells work?", a: "Shells are micro-tokens (1 Shell = $0.001) earned through ecosystem activity: daily logins, completing quests, referrals, and app interactions. They cannot be purchased directly." },
  { q: "What is staking and how do I stake?", a: "Staking locks your SIG to earn rewards. Navigate to the Wallet tab, select Staking, choose your lock period (flexible to 180 days), and confirm. APY ranges from 8% to 30%." },
  { q: "How does the Hallmark system work?", a: "Hallmarks are blockchain-verified stamps that prove authenticity. Every identity verification, app release, and significant transaction can be hallmarked with a unique TH-ID." },
  { q: "Is my data secure?", a: "Yes. Trust Layer uses end-to-end encryption, blockchain-verified identities, and the Guardian Security Scanner for continuous monitoring. All sensitive data is encrypted at rest." },
  { q: "What is the affiliate program?", a: "Earn SIG rewards by referring new users to the ecosystem. Navigate to the Affiliate section from the hamburger menu to get your unique referral link." },
  { q: "When does Trust Layer launch?", a: "Trust Layer launches on August 23, 2026 (CST). Early access is available now through the Hub app." },
  { q: "How do I connect my bank for fiat?", a: "Navigate to Profile → Banking and connect through Plaid. This enables fiat on/off ramps and bank transfers within the ecosystem." },
  { q: "What wallets are supported?", a: "Trust Layer supports its native TrustVault wallet, plus external connections to MetaMask, Phantom, and other major wallets." },
  { q: "How do I report a bug?", a: "Use the contact form below, email support@trustlayer.io, or reach out through Signal Chat within the app." },
  { q: "Can I delete my account?", a: "Yes. Go to Settings → Danger Zone → Delete Account. Note that on-chain records (hallmarks, transactions) are immutable and cannot be deleted." },
  { q: "What are DW-STAMPs?", a: "DW-STAMPs (DarkWave Stamps) are premium hallmarks issued by DarkWave Studios for official ecosystem verifications and certifications." },
  { q: "Is there a mobile app?", a: "Yes! Trust Layer Hub is available as a web app and native mobile app for Android (Google Play) and iOS (App Store)." },
];

function FAQItem({ item }: { item: { q: string; a: string } }) {
  const [expanded, setExpanded] = useState(false);

  return (
    <Pressable
      style={styles.faqItem}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        setExpanded(!expanded);
      }}
    >
      <View style={styles.faqHeader}>
        <Text style={styles.faqQuestion}>{item.q}</Text>
        <Ionicons
          name={expanded ? "chevron-up" : "chevron-down"}
          size={18}
          color={Colors.textTertiary}
        />
      </View>
      {expanded && <Text style={styles.faqAnswer}>{item.a}</Text>}
    </Pressable>
  );
}

export default function SupportScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General");
  const [message, setMessage] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const categories = ["General", "Account", "Wallet", "Security", "Bug Report", "Feature Request"];

  const handleSubmit = useCallback(() => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSubmitted(true);
    // In production, POST to /api/support
  }, [name, email, message]);

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: insets.top + webTopInset + 16,
            paddingBottom: 100,
            maxWidth: isDesktop ? 640 : undefined,
            alignSelf: isDesktop ? ("center" as const) : undefined,
            width: isDesktop ? "100%" : undefined,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.headerRow}>
          <Pressable
            style={styles.backBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.back();
            }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.textPrimary} />
          </Pressable>
          <View>
            <GradientText text="Support" style={styles.title} />
            <Text style={styles.subtitle}>We're here to help</Text>
          </View>
        </View>

        {/* Quick Links */}
        <View style={styles.quickLinks}>
          <Pressable
            style={styles.quickLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              Linking.openURL("mailto:support@trustlayer.io");
            }}
          >
            <View style={styles.quickLinkIcon}>
              <Ionicons name="mail" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickLinkLabel}>Email</Text>
          </Pressable>
          <Pressable
            style={styles.quickLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/(tabs)/chat");
            }}
          >
            <View style={styles.quickLinkIcon}>
              <Ionicons name="chatbubbles" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickLinkLabel}>Signal Chat</Text>
          </Pressable>
          <Pressable
            style={styles.quickLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/terms");
            }}
          >
            <View style={styles.quickLinkIcon}>
              <Ionicons name="document-text" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickLinkLabel}>Terms</Text>
          </Pressable>
          <Pressable
            style={styles.quickLink}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push("/privacy");
            }}
          >
            <View style={styles.quickLinkIcon}>
              <Ionicons name="shield" size={20} color={Colors.primary} />
            </View>
            <Text style={styles.quickLinkLabel}>Privacy</Text>
          </Pressable>
        </View>

        {/* FAQ */}
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        <GlassCard>
          {FAQ_ITEMS.map((item, i) => (
            <React.Fragment key={i}>
              <FAQItem item={item} />
              {i < FAQ_ITEMS.length - 1 && <View style={styles.faqDivider} />}
            </React.Fragment>
          ))}
        </GlassCard>

        {/* Contact Form */}
        <Text style={[styles.sectionTitle, { marginTop: 28 }]}>Contact Us</Text>
        {submitted ? (
          <GlassCard>
            <View style={styles.successContainer}>
              <View style={styles.successIcon}>
                <Ionicons name="checkmark-circle" size={48} color={Colors.success} />
              </View>
              <Text style={styles.successTitle}>Message Sent!</Text>
              <Text style={styles.successText}>
                We'll get back to you within 24 hours at {email}
              </Text>
              <Pressable
                style={styles.resetBtn}
                onPress={() => {
                  setSubmitted(false);
                  setName("");
                  setEmail("");
                  setMessage("");
                  setCategory("General");
                }}
              >
                <Text style={styles.resetBtnText}>Send Another</Text>
              </Pressable>
            </View>
          </GlassCard>
        ) : (
          <GlassCard>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Name</Text>
              <TextInput
                style={styles.formInput}
                value={name}
                onChangeText={setName}
                placeholder="Your name"
                placeholderTextColor={Colors.textMuted}
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Email</Text>
              <TextInput
                style={styles.formInput}
                value={email}
                onChangeText={setEmail}
                placeholder="your@email.com"
                placeholderTextColor={Colors.textMuted}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                {categories.map((cat) => (
                  <Pressable
                    key={cat}
                    style={[styles.catPill, category === cat && styles.catPillActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setCategory(cat);
                    }}
                  >
                    <Text style={[styles.catPillText, category === cat && styles.catPillTextActive]}>{cat}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
            <View style={styles.formField}>
              <Text style={styles.formLabel}>Message</Text>
              <TextInput
                style={[styles.formInput, styles.formTextarea]}
                value={message}
                onChangeText={setMessage}
                placeholder="Describe your issue or question..."
                placeholderTextColor={Colors.textMuted}
                multiline
                numberOfLines={5}
                textAlignVertical="top"
              />
            </View>
            <Pressable
              style={({ pressed }) => [
                styles.submitBtn,
                (!name.trim() || !email.trim() || !message.trim()) && styles.submitBtnDisabled,
                pressed && { opacity: 0.8 },
              ]}
              onPress={handleSubmit}
              disabled={!name.trim() || !email.trim() || !message.trim()}
            >
              <Text style={styles.submitBtnText}>Send Message</Text>
              <Ionicons name="send" size={16} color="#000" />
            </Pressable>
          </GlassCard>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Trust Layer Hub v1.0.0</Text>
          <Text style={styles.footerText}>© {new Date().getFullYear()} DarkWave Studios LLC</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 4 },
  headerRow: {
    flexDirection: "row" as const, alignItems: "center" as const,
    gap: 12, marginBottom: 20,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  title: { fontSize: 28, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  subtitle: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 2 },
  quickLinks: {
    flexDirection: "row" as const, gap: 12, marginBottom: 28,
  },
  quickLink: {
    flex: 1, alignItems: "center" as const, gap: 6,
    paddingVertical: 16,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 14, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  quickLinkIcon: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(0,255,255,0.08)",
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  quickLinkLabel: {
    fontSize: 11, fontFamily: "Inter_500Medium", color: Colors.textSecondary,
  },
  sectionTitle: {
    fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary,
    marginBottom: 12,
  },
  faqItem: { paddingVertical: 14 },
  faqHeader: {
    flexDirection: "row" as const, alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  faqQuestion: {
    fontSize: 15, fontFamily: "Inter_500Medium", color: Colors.textPrimary,
    flex: 1, marginRight: 12,
  },
  faqAnswer: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
    lineHeight: 22, marginTop: 10,
  },
  faqDivider: { height: 1, backgroundColor: "rgba(255,255,255,0.06)" },
  formField: { marginBottom: 16 },
  formLabel: {
    fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary,
    marginBottom: 8,
  },
  formInput: {
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 12, borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
    paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, fontFamily: "Inter_400Regular",
    color: Colors.textPrimary,
  },
  formTextarea: {
    minHeight: 120, paddingTop: 12,
  },
  catPill: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  catPillActive: { backgroundColor: "rgba(0,255,255,0.1)", borderColor: "rgba(0,255,255,0.25)" },
  catPillText: { fontSize: 12, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  catPillTextActive: { color: Colors.primary },
  submitBtn: {
    flexDirection: "row" as const, alignItems: "center" as const,
    justifyContent: "center" as const, gap: 8,
    backgroundColor: Colors.primary, borderRadius: 12,
    paddingVertical: 14, marginTop: 4,
  },
  submitBtnDisabled: { opacity: 0.4 },
  submitBtnText: {
    fontSize: 15, fontFamily: "Inter_600SemiBold", color: "#000",
  },
  successContainer: { alignItems: "center" as const, paddingVertical: 24 },
  successIcon: { marginBottom: 16 },
  successTitle: {
    fontSize: 20, fontFamily: "Inter_700Bold", color: Colors.success, marginBottom: 8,
  },
  successText: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
    textAlign: "center" as const, marginBottom: 20,
  },
  resetBtn: {
    paddingHorizontal: 20, paddingVertical: 10, borderRadius: 10,
    backgroundColor: "rgba(0,255,255,0.08)",
    borderWidth: 1, borderColor: "rgba(0,255,255,0.15)",
  },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_500Medium", color: Colors.primary },
  footer: { alignItems: "center" as const, paddingVertical: 24, gap: 4, marginTop: 20 },
  footerText: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textMuted },
});
