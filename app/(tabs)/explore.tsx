import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TextInput,
  Pressable,
  Platform,
  useWindowDimensions,
  ImageBackground,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { InfoBubble } from "@/components/InfoBubble";
import { ECOSYSTEM_APPS, CATEGORIES, CATEGORY_ICONS, CATEGORY_COLORS, type Category, type EcosystemApp } from "@/constants/ecosystem-apps";

function CategoryPill({ label, active, color, icon, onPress }: { label: string; active: boolean; color: string; icon: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[
        styles.categoryPill,
        active && { backgroundColor: `${color}18`, borderColor: `${color}50` },
      ]}
    >
      <View style={[styles.categoryPillIcon, { backgroundColor: active ? `${color}20` : "rgba(255,255,255,0.04)" }]}>
        <Ionicons name={icon as any} size={14} color={active ? color : Colors.textTertiary} />
      </View>
      <Text style={[styles.categoryPillText, active && { color }]}>
        {label}
      </Text>
    </Pressable>
  );
}

function AppCard({ app, cardWidth }: { app: EcosystemApp; cardWidth: number }) {
  const catColor = CATEGORY_COLORS[app.category] || Colors.primary;
  const hasImage = !!(app as any).image;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.appCardWrapper,
        { width: cardWidth },
        pressed && { opacity: 0.85, transform: [{ scale: 0.98 }] },
      ]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/app-detail", params: { id: String(app.id) } });
      }}
    >
      <View style={styles.appCard}>
        {/* Background image or gradient fallback */}
        {hasImage ? (
          <ImageBackground
            source={(app as any).image}
            style={StyleSheet.absoluteFill}
            imageStyle={{ borderRadius: 16, opacity: 0.35 }}
          />
        ) : null}

        {/* Always overlay a category-tinted gradient */}
        <LinearGradient
          colors={[`${catColor}10`, `${catColor}06`, "rgba(6,6,10,0.92)"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 0, y: 1 }}
          style={[StyleSheet.absoluteFill, { borderRadius: 16 }]}
        />

        {/* Bottom accent bar */}
        <View style={[styles.accentBar, { backgroundColor: catColor }]} />

        {/* Card Content */}
        <View style={styles.appCardContent}>
          {/* Top row: icon + category */}
          <View style={styles.appCardTopRow}>
            <View style={[styles.appIconBubble, { backgroundColor: `${catColor}15`, borderColor: `${catColor}30` }]}>
              <Ionicons name={app.icon as any} size={22} color={catColor} />
            </View>
            <View style={[styles.appCatPill, { backgroundColor: `${catColor}12`, borderColor: `${catColor}25` }]}>
              <Text style={[styles.appCatText, { color: catColor }]}>{app.category}</Text>
            </View>
          </View>

          {/* Bottom: name + hook */}
          <View style={styles.appCardBottom}>
            <Text style={styles.appCardName} numberOfLines={1}>{app.name}</Text>
            <Text style={styles.appCardHook} numberOfLines={2}>{app.hook}</Text>

            {/* Tags */}
            <View style={styles.appTagRow}>
              {app.tags.slice(0, 3).map(tag => (
                <View key={tag} style={styles.appTag}>
                  <Text style={styles.appTagText}>{tag}</Text>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const isWide = Platform.OS === "web" && width >= 1024;

  // Responsive card width: 2 cols mobile, 3 cols tablet, 4 cols desktop
  const contentWidth = isDesktop ? Math.min(width - 32, 1080) : width - 32;
  const gap = 12;
  const cols = isWide ? 4 : isDesktop ? 3 : 2;
  const cardWidth = Math.floor((contentWidth - gap * (cols - 1)) / cols);

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

  // Group apps by category for "All" view
  const categoriesToRender = useMemo(() => {
    if (search.trim()) {
      return [{ category: "Search Results", apps: filteredApps }];
    }
    if (selectedCategory !== "All") {
      return [{ category: selectedCategory, apps: filteredApps }];
    }
    return CATEGORIES.filter(c => c !== "All").map(c => ({
      category: c,
      apps: ECOSYSTEM_APPS.filter(a => a.category === c)
    })).filter(g => g.apps.length > 0);
  }, [filteredApps, search, selectedCategory]);

  return (
    <View style={styles.container}>
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Hero Header */}
        <View style={[styles.heroSection, { paddingTop: insets.top + webTopInset + 20 }]}>
          <LinearGradient
            colors={["rgba(0,255,255,0.06)", "rgba(147,51,234,0.04)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <View style={[styles.heroContent, { maxWidth: isDesktop ? 1080 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}>
            <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 8 }}>
              <GradientText text="Explore" style={styles.screenTitle} />
              <InfoBubble title="Explore" message={`Browse the complete Trust Layer ecosystem of ${ECOSYSTEM_APPS.length} interconnected apps.`} size={18} />
            </View>

            {/* Stats row */}
            <View style={styles.statsRow}>
              {[
                { value: String(ECOSYSTEM_APPS.length), label: "Apps" },
                { value: String(CATEGORIES.length - 1), label: "Categories" },
                { value: "1", label: "Ecosystem" },
              ].map(s => (
                <View key={s.label} style={styles.statItem}>
                  <Text style={styles.statValue}>{s.value}</Text>
                  <Text style={styles.statLabel}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Search */}
            <View style={styles.searchContainer}>
              <Ionicons name="search" size={18} color={Colors.textMuted} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search apps, categories, tags..."
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

            {/* Category pills */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesRow}
            >
              {CATEGORIES.map(cat => (
                <CategoryPill
                  key={cat}
                  label={cat}
                  active={selectedCategory === cat}
                  color={CATEGORY_COLORS[cat] || Colors.primary}
                  icon={CATEGORY_ICONS[cat] || "apps"}
                  onPress={() => setSelectedCategory(cat)}
                />
              ))}
            </ScrollView>
          </View>
        </View>

        {/* App Grid */}
        <View style={[styles.gridContainer, { maxWidth: isDesktop ? 1080 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}>
          {categoriesToRender.length === 0 ? (
            <EmptyState icon="search" title="No apps found" subtitle="Try a different search term" />
          ) : (
            categoriesToRender.map((group) => {
              const catColor = CATEGORY_COLORS[group.category] || Colors.primary;
              const catIcon = CATEGORY_ICONS[group.category] || "apps";

              return (
                <View key={group.category} style={styles.categorySection}>
                  {/* Category header */}
                  <View style={styles.categoryHeader}>
                    <View style={[styles.categoryHeaderIcon, { backgroundColor: `${catColor}15` }]}>
                      <Ionicons name={catIcon as any} size={16} color={catColor} />
                    </View>
                    <Text style={styles.categoryTitle}>{group.category}</Text>
                    <View style={[styles.categoryCount, { backgroundColor: `${catColor}12` }]}>
                      <Text style={[styles.categoryCountText, { color: catColor }]}>{group.apps.length}</Text>
                    </View>
                    <View style={[styles.categoryLine, { backgroundColor: `${catColor}15` }]} />
                  </View>

                  {/* Grid of cards */}
                  <View style={[styles.appGrid, { gap }]}>
                    {group.apps.map(app => (
                      <AppCard key={app.id} app={app} cardWidth={cardWidth} />
                    ))}
                  </View>
                </View>
              );
            })
          )}
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
  heroSection: {
    paddingBottom: 8,
    position: "relative" as const,
    overflow: "hidden" as const,
  },
  heroContent: {
    paddingHorizontal: 16,
  },
  screenTitle: {
    fontSize: 32,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
  },
  statsRow: {
    flexDirection: "row" as const,
    gap: 24,
    marginTop: 12,
    marginBottom: 20,
  },
  statItem: {
    alignItems: "center" as const,
  },
  statValue: {
    fontSize: 22,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    color: Colors.primary,
  },
  statLabel: {
    fontSize: 10,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
    marginTop: 2,
  },
  searchContainer: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
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
    paddingBottom: 16,
  },
  categoryPill: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  categoryPillIcon: {
    width: 24,
    height: 24,
    borderRadius: 8,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  categoryPillText: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
  },
  gridContainer: {
    paddingHorizontal: 16,
    paddingBottom: 120,
  },
  categorySection: {
    marginBottom: 28,
  },
  categoryHeader: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 14,
  },
  categoryHeaderIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  categoryTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  categoryCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  categoryCountText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  categoryLine: {
    flex: 1,
    height: 1,
  },
  appGrid: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
  },
  appCardWrapper: {
    marginBottom: 4,
  },
  appCard: {
    borderRadius: 16,
    overflow: "hidden" as const,
    backgroundColor: "rgba(12, 18, 36, 0.85)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.10)",
    minHeight: 200,
    position: "relative" as const,
  },
  accentBar: {
    position: "absolute" as const,
    bottom: 0,
    left: 16,
    right: 16,
    height: 2,
    borderRadius: 1,
    opacity: 0.6,
  },
  appCardContent: {
    flex: 1,
    padding: 16,
    justifyContent: "space-between" as const,
  },
  appCardTopRow: {
    flexDirection: "row" as const,
    justifyContent: "space-between" as const,
    alignItems: "flex-start" as const,
  },
  appIconBubble: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  appCatPill: {
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderWidth: 1,
  },
  appCatText: {
    fontSize: 9,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 0.5,
    textTransform: "uppercase" as const,
  },
  appCardBottom: {
    paddingTop: 12,
  },
  appCardName: {
    fontSize: 17,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
  },
  appCardHook: {
    fontSize: 12,
    color: Colors.textSecondary,
    fontFamily: "Inter_400Regular",
    lineHeight: 17,
    marginBottom: 10,
  },
  appTagRow: {
    flexDirection: "row" as const,
    gap: 4,
    flexWrap: "wrap" as const,
  },
  appTag: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 6,
    paddingHorizontal: 7,
    paddingVertical: 2,
  },
  appTagText: {
    fontSize: 9,
    color: Colors.textTertiary,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase" as const,
    letterSpacing: 0.3,
  },
});
