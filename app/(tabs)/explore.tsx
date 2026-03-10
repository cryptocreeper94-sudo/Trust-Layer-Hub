import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  FlatList,
  useWindowDimensions,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { InfoBubble } from "@/components/InfoBubble";
import { ECOSYSTEM_APPS, CATEGORIES, type Category, type EcosystemApp } from "@/constants/ecosystem-apps";

function CategoryTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.categoryTab, active && styles.categoryTabActive]}
    >
      <Text style={[styles.categoryTabText, active && styles.categoryTabTextActive]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AppGridCard({ app }: { app: EcosystemApp }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.appGridItem, pressed && { opacity: 0.8 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/app-detail", params: { id: String(app.id) } });
      }}
    >
      <GlassCard innerStyle={styles.appCardInner}>
        <View style={styles.appIconContainer}>
          <Ionicons name={app.icon as any} size={26} color={Colors.primary} />
        </View>
        <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
        <Text style={styles.appHook} numberOfLines={2}>{app.hook}</Text>
        <View style={styles.appCategoryBadge}>
          <Text style={styles.appCategoryText}>{app.category}</Text>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const numColumns = isDesktop && width >= 1024 ? 3 : 2;
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<Category>("All");

  const filteredApps = useMemo(() => {
    let apps = ECOSYSTEM_APPS;
    if (selectedCategory !== "All") {
      apps = apps.filter(a => a.category === selectedCategory);
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      apps = apps.filter(a =>
        a.name.toLowerCase().includes(q) ||
        a.hook.toLowerCase().includes(q) ||
        a.tags.some(t => t.toLowerCase().includes(q))
      );
    }
    return apps;
  }, [search, selectedCategory]);

  return (
    <View style={styles.container}>
      <BackgroundGlow />
      <View style={[styles.headerSection, { paddingTop: insets.top + webTopInset + 12, maxWidth: isDesktop ? 960 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}>
        <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 8 }}>
          <GradientText text="Explore" style={styles.screenTitle} />
          <InfoBubble title="Explore" message="Browse the complete Trust Layer ecosystem of 35 interconnected apps spanning DeFi, governance, identity, social, gaming, AI, and more. Each app uses your Trust Layer ID for seamless cross-app identity. Use the search bar or category tabs to find apps." size={18} />
        </View>
        <Text style={styles.subtitle}>35 Apps. One Ecosystem.</Text>

        <View style={styles.searchContainer}>
          <Ionicons name="search" size={18} color={Colors.textMuted} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search apps..."
            placeholderTextColor={Colors.textMuted}
            value={search}
            onChangeText={setSearch}
            returnKeyType="search"
          />
          {search.length > 0 && (
            <Pressable onPress={() => setSearch("")}>
              <Ionicons name="close-circle" size={18} color={Colors.textMuted} />
            </Pressable>
          )}
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesRow}
        >
          {CATEGORIES.map(cat => (
            <CategoryTab
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>
      </View>

      <FlatList
        key={numColumns}
        data={filteredApps}
        keyExtractor={item => String(item.id)}
        numColumns={numColumns}
        contentContainerStyle={[styles.gridContent, { maxWidth: isDesktop ? 960 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}
        columnWrapperStyle={styles.gridRow}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => <AppGridCard app={item} />}
        ListEmptyComponent={
          <EmptyState icon="search" title="No apps found" subtitle="Try a different search term" />
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  headerSection: {
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  screenTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
    marginBottom: 12,
  },
  searchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
    marginBottom: 14,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: Colors.textPrimary,
    fontFamily: "Inter_400Regular",
  },
  categoriesRow: {
    gap: 8,
    paddingRight: 16,
  },
  categoryTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  categoryTabActive: {
    backgroundColor: "rgba(0,255,255,0.1)",
    borderColor: "rgba(0,255,255,0.25)",
  },
  categoryTabText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  categoryTabTextActive: {
    color: Colors.primary,
  },
  gridContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 100,
  },
  gridRow: {
    gap: 12,
    marginBottom: 12,
  },
  appGridItem: {
    flex: 1,
  },
  appCardInner: {
    alignItems: "center" as const,
    paddingVertical: 20,
    paddingHorizontal: 12,
  },
  appIconContainer: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "rgba(0,255,255,0.06)",
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
    marginBottom: 10,
  },
  appName: {
    fontSize: 14,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center" as const,
    marginBottom: 4,
  },
  appHook: {
    fontSize: 11,
    color: Colors.textTertiary,
    fontFamily: "Inter_400Regular",
    textAlign: "center" as const,
    marginBottom: 8,
    lineHeight: 16,
  },
  appCategoryBadge: {
    backgroundColor: "rgba(147,51,234,0.12)",
    borderRadius: 4,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  appCategoryText: {
    fontSize: 10,
    color: Colors.secondary,
    fontFamily: "Inter_500Medium",
  },
});
