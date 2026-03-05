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
import { useLocalSearchParams, router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import * as WebBrowser from "expo-web-browser";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { GradientButton } from "@/components/GradientButton";
import { ECOSYSTEM_APPS } from "@/constants/ecosystem-apps";
import { getSessionToken, buildAppLaunchUrl } from "@/lib/api";

export default function AppDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;

  const app = ECOSYSTEM_APPS.find(a => String(a.id) === id);

  if (!app) {
    return (
      <View style={[styles.container, { paddingTop: insets.top + webTopInset }]}>
        <Text style={styles.errorText}>App not found</Text>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} hitSlop={8}>
          <Text style={styles.backLink}>Go back</Text>
        </Pressable>
      </View>
    );
  }

  const handleLaunch = async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (app.url) {
      const token = await getSessionToken();
      const launchUrl = buildAppLaunchUrl(app.url, token);
      await WebBrowser.openBrowserAsync(launchUrl);
    }
  };

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <View style={[styles.header, { paddingTop: insets.top + webTopInset + 8 }]}>
        <Pressable onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }} style={styles.closeButton} hitSlop={8} accessibilityLabel="Close">
          <Ionicons name="close" size={24} color={Colors.textPrimary} />
        </Pressable>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.content, { maxWidth: isDesktop ? 640 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.iconSection}>
          <LinearGradient
            colors={["rgba(0,255,255,0.12)", "rgba(147,51,234,0.12)"]}
            style={styles.iconGradient}
          >
            <View style={styles.iconInner}>
              <Ionicons name={app.icon as any} size={48} color={Colors.primary} />
            </View>
          </LinearGradient>
        </View>

        <GradientText text={app.name} style={styles.appTitle} />
        <Text style={styles.appHook}>{app.hook}</Text>

        <View style={styles.metaRow}>
          <View style={styles.categoryBadge}>
            <Text style={styles.categoryText}>{app.category}</Text>
          </View>
          <View style={styles.tagRow}>
            {app.tags.slice(0, 3).map(tag => (
              <View key={tag} style={styles.tag}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        <GlassCard>
          <Text style={styles.descriptionTitle}>About</Text>
          <Text style={styles.description}>{app.description}</Text>
        </GlassCard>

        {app.url ? (
          <GradientButton
            title="Launch App"
            onPress={handleLaunch}
            style={styles.launchButton}
          />
        ) : (
          <GlassCard>
            <View style={styles.comingSoon}>
              <Ionicons name="time-outline" size={20} color={Colors.textSecondary} />
              <Text style={styles.comingSoonText}>Available within the ecosystem portal</Text>
            </View>
          </GlassCard>
        )}

        <GlassCard>
          <Text style={styles.detailsTitle}>Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>App ID</Text>
            <Text style={styles.detailValue}>#{app.id}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Category</Text>
            <Text style={styles.detailValue}>{app.category}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Platform</Text>
            <Text style={styles.detailValue}>Web / Mobile</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SSO</Text>
            <View style={styles.ssoEnabled}>
              <Ionicons name="checkmark-circle" size={14} color={Colors.success} />
              <Text style={[styles.detailValue, { color: Colors.success }]}>Enabled</Text>
            </View>
          </View>
        </GlassCard>

        <View style={{ height: 40 }} />
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
    justifyContent: "flex-end" as const,
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.08)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    gap: 16,
  },
  iconSection: {
    alignItems: "center" as const,
    marginTop: 8,
  },
  iconGradient: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  iconInner: {
    width: 88,
    height: 88,
    borderRadius: 24,
    backgroundColor: Colors.background,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  appTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    textAlign: "center" as const,
  },
  appHook: {
    fontSize: 15,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
  },
  metaRow: {
    alignItems: "center" as const,
    gap: 10,
  },
  categoryBadge: {
    backgroundColor: "rgba(147,51,234,0.15)",
    borderRadius: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  categoryText: {
    fontSize: 12,
    color: Colors.secondary,
    fontFamily: "Inter_600SemiBold",
  },
  tagRow: {
    flexDirection: "row" as const,
    gap: 6,
    flexWrap: "wrap" as const,
    justifyContent: "center" as const,
  },
  tag: {
    backgroundColor: "rgba(0,255,255,0.08)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tagText: {
    fontSize: 11,
    color: Colors.primary,
    fontFamily: "Inter_400Regular",
  },
  descriptionTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 22,
  },
  launchButton: {
    marginTop: 4,
  },
  comingSoon: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    justifyContent: "center" as const,
    gap: 8,
    paddingVertical: 4,
  },
  comingSoonText: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  detailsTitle: {
    fontSize: 16,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "center" as const,
    paddingVertical: 2,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
  },
  detailValue: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_500Medium",
  },
  ssoEnabled: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 4,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: 8,
  },
  errorText: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center" as const,
    marginTop: 60,
  },
  backLink: {
    fontSize: 16,
    color: Colors.primary,
    fontFamily: "Inter_500Medium",
    textAlign: "center" as const,
    marginTop: 12,
  },
});
