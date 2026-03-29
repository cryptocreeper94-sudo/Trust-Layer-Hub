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
import Colors from "@/constants/colors";
import { EmptyState } from "@/components/EmptyState";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { InfoBubble } from "@/components/InfoBubble";
import { Carousel } from "@/components/Carousel";
import { ECOSYSTEM_APPS, CATEGORIES, type Category, type EcosystemApp } from "@/constants/ecosystem-apps";
import { KenBurnsBackground } from "@/components/KenBurnsBackground";

function CategoryTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
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

function CinematicAppCard({ app, cardWidth }: { app: EcosystemApp; cardWidth: number }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.appGridItem, { width: cardWidth }, pressed && { opacity: 0.8 }]}
      onPress={() => {
        if (Platform.OS !== "web") Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/app-detail", params: { id: String(app.id) } });
      }}
    >
      <View style={styles.cardContainer}>
        {/* The photorealistic Image properly loaded through the bundle */}
        <ImageBackground 
          source={app.image} 
          style={styles.imageBackground}
          imageStyle={styles.imageBackgroundStyle}
        >
          {/* A gradient overlay so the text pops perfectly over the complex image */}
          <View style={styles.darkGradientOverlay} />
          
          <View style={styles.appCardInner}>
            <View style={styles.topRow}>
              <View style={styles.appIconContainer}>
                <Ionicons name={app.icon as any} size={22} color={Colors.primary} />
              </View>
              <View style={styles.appCategoryBadge}>
                <Text style={styles.appCategoryText}>{app.category}</Text>
              </View>
            </View>

            <View style={styles.bottomInfo}>
              <Text style={styles.appName} numberOfLines={1}>{app.name}</Text>
              <Text style={styles.appHook} numberOfLines={2}>{app.hook}</Text>
            </View>
          </View>
        </ImageBackground>
      </View>
    </Pressable>
  );
}

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  
  // Carousel width optimization
  const contentWidth = isDesktop ? Math.min(width, 960) : width;
  const cardWidth = Math.round(contentWidth * 0.85);

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

  // Group apps by category for rendering the breathtaking carousels
  const categoriesToRender = useMemo(() => {
    if (search.trim()) {
      return [{ category: "Search Results", apps: filteredApps }];
    }
    if (selectedCategory !== "All") {
      return [{ category: selectedCategory, apps: filteredApps }];
    }
    // "All" view: generate isolated carousels per category
    return CATEGORIES.filter(c => c !== "All").map(c => ({
      category: c,
      apps: ECOSYSTEM_APPS.filter(a => a.category === c)
    })).filter(g => g.apps.length > 0);
  }, [filteredApps, search, selectedCategory]);

  return (
    <View style={styles.container}>
      {/* 
        User requested the slideshow run ONLY locally behind the landing (index.tsx),
        so we leave Explore as a gorgeous pure Void Black background. 
        It isolates the stunning images on the cards itself. 
      */}
      <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.background }]} />
      
      <ScrollView
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.headerSection, { paddingTop: insets.top + webTopInset + 12, maxWidth: isDesktop ? 960 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}>
          <View style={{ flexDirection: "row" as const, alignItems: "center" as const, gap: 8 }}>
            <GradientText text="Explore" style={styles.screenTitle} />
            <InfoBubble title="Explore" message="Browse the complete Trust Layer ecosystem of 37 interconnected apps spanning DeFi, governance, identity, social, gaming, AI, and more." size={18} />
          </View>
          <Text style={styles.subtitle}>37 Apps. One Ecosystem.</Text>

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

        <View style={[styles.contentLayout, { maxWidth: isDesktop ? 960 : undefined, alignSelf: isDesktop ? "center" as const : undefined, width: isDesktop ? "100%" : undefined }]}>
          {categoriesToRender.length === 0 ? (
             <EmptyState icon="search" title="No apps found" subtitle="Try a different search term" />
          ) : (
            categoriesToRender.map((group, idx) => (
              <View key={group.category} style={styles.categoryBlock}>
                <View style={styles.categoryHeader}>
                  <Text style={styles.categoryTitle}>{group.category}</Text>
                  <View style={styles.categoryLine} />
                </View>
                
                <View style={styles.carouselBreakout}>
                  <Carousel itemWidth={cardWidth}>
                    {group.apps.map(app => (
                      <CinematicAppCard key={app.id} app={app} cardWidth={cardWidth} />
                    ))}
                  </Carousel>
                </View>
              </View>
            ))
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
    marginBottom: 16,
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
    marginBottom: 16,
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
  contentLayout: {
    paddingBottom: 100,
  },
  categoryBlock: {
    marginBottom: 24,
  },
  categoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 12,
  },
  categoryTitle: {
    fontSize: 18,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
  },
  categoryLine: {
    flex: 1,
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  carouselBreakout: {
    marginLeft: 16, // Indent for the carousel scroll boundary
  },
  appGridItem: {
    height: 220,
  },
  cardContainer: {
    flex: 1,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: "rgba(12,18,36,0.6)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.08)",
  },
  imageBackground: {
    flex: 1,
    justifyContent: 'space-between',
  },
  imageBackgroundStyle: {
    borderRadius: 20, // Match container exactly
    opacity: 0.85,    // Mute the image very slightly so it doesn't overpower UI
  },
  darkGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(6, 6, 10, 0.55)', // Custom dimming overlay for Void Black adherence
  },
  appCardInner: {
    flex: 1,
    padding: 16,
    justifyContent: 'space-between',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  appIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "rgba(0,0,0,0.6)", // Deep glass background behind the icon
    borderWidth: 1,
    borderColor: "rgba(0,255,255,0.25)", // Heavy cyan border for the icon container
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  appCategoryBadge: {
    backgroundColor: "rgba(255,255,255,0.1)", // Semi-transparent pill
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
    backdropFilter: 'blur(10px)',
  },
  appCategoryText: {
    fontSize: 10,
    color: Colors.textPrimary,
    fontFamily: "Inter_600SemiBold",
    textTransform: 'uppercase',
  },
  bottomInfo: {
    marginTop: 'auto',
  },
  appName: {
    fontSize: 22,
    color: Colors.textPrimary,
    fontFamily: "Inter_700Bold",
    marginBottom: 4,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 2},
    textShadowRadius: 4,
  },
  appHook: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontFamily: "Inter_500Medium",
    lineHeight: 18,
    textShadowColor: 'rgba(0,0,0,0.7)',
    textShadowOffset: {width: 0, height: 1},
    textShadowRadius: 2,
  },
});
