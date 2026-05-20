import React, { useState, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
  Platform,
  useWindowDimensions,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GlassCard } from "@/components/GlassCard";
import { GradientText } from "@/components/GradientText";
import { EmptyState } from "@/components/EmptyState";
import { useBlogPosts, type BlogPost } from "@/hooks/useBlog";

const CATEGORIES = ["All", "Ecosystem", "DeFi", "Security", "Technology", "Community"];

const CATEGORY_COLORS: Record<string, string> = {
  Ecosystem: Colors.primary,
  DeFi: Colors.success,
  Security: "#6366f1",
  Technology: "#f59e0b",
  Community: Colors.secondary,
};

function CategoryPill({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        onPress();
      }}
      style={[styles.pill, active && styles.pillActive]}
    >
      <Text style={[styles.pillText, active && styles.pillTextActive]}>{label}</Text>
    </Pressable>
  );
}

function FeaturedPostCard({ post }: { post: BlogPost }) {
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : "";
  const catColor = CATEGORY_COLORS[post.category] || Colors.textTertiary;

  return (
    <Pressable
      style={({ pressed }) => [styles.featuredCard, pressed && { opacity: 0.9 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        router.push({ pathname: "/blog-post", params: { slug: post.slug } });
      }}
    >
      <LinearGradient
        colors={["rgba(0,255,255,0.08)", "rgba(2,132,199,0.06)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featuredGradient}
      />
      <View style={styles.featuredBadgeRow}>
        <View style={[styles.categoryBadge, { backgroundColor: `${catColor}18` }]}>
          <View style={[styles.categoryDot, { backgroundColor: catColor }]} />
          <Text style={[styles.categoryText, { color: catColor }]}>{post.category}</Text>
        </View>
        <Ionicons name="star" size={14} color="#f59e0b" />
      </View>
      <Text style={styles.featuredTitle}>{post.title}</Text>
      <Text style={styles.featuredExcerpt} numberOfLines={3}>{post.excerpt}</Text>
      <View style={styles.featuredFooter}>
        <Text style={styles.featuredDate}>{dateStr}</Text>
        <View style={styles.readMore}>
          <Text style={styles.readMoreText}>Read Article</Text>
          <Ionicons name="arrow-forward" size={14} color={Colors.primary} />
        </View>
      </View>
    </Pressable>
  );
}

function PostCard({ post }: { post: BlogPost }) {
  const dateStr = post.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "";
  const catColor = CATEGORY_COLORS[post.category] || Colors.textTertiary;
  const readTime = Math.max(3, Math.ceil((post.content?.length || 0) / 1200));

  return (
    <Pressable
      style={({ pressed }) => [pressed && { opacity: 0.8 }]}
      onPress={() => {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        router.push({ pathname: "/blog-post", params: { slug: post.slug } });
      }}
    >
      <GlassCard>
        <View style={styles.postRow}>
          <View style={styles.postInfo}>
            <View style={styles.postMeta}>
              <View style={[styles.smallCatBadge, { backgroundColor: `${catColor}18` }]}>
                <Text style={[styles.smallCatText, { color: catColor }]}>{post.category}</Text>
              </View>
              <Text style={styles.postDate}>{dateStr}</Text>
              <Text style={styles.postReadTime}>{readTime} min read</Text>
            </View>
            <Text style={styles.postTitle} numberOfLines={2}>{post.title}</Text>
            <Text style={styles.postExcerpt} numberOfLines={2}>{post.excerpt}</Text>
          </View>
          <View style={styles.postArrow}>
            <Ionicons name="chevron-forward" size={18} color={Colors.textTertiary} />
          </View>
        </View>
      </GlassCard>
    </Pressable>
  );
}

export default function BlogScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const [selectedCategory, setSelectedCategory] = useState("All");

  const { data, isLoading } = useBlogPosts(selectedCategory !== "All" ? selectedCategory : undefined);
  const posts = data?.posts || [];

  const featured = useMemo(() => posts[0], [posts]);
  const rest = useMemo(() => posts.slice(1), [posts]);

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
            maxWidth: isDesktop ? 700 : undefined,
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
            <GradientText text="Blog" style={styles.title} />
            <Text style={styles.subtitle}>Insights from the Trust Layer ecosystem</Text>
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.pillRow}
        >
          {CATEGORIES.map((cat) => (
            <CategoryPill
              key={cat}
              label={cat}
              active={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
            />
          ))}
        </ScrollView>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
            <Text style={styles.loadingText}>Loading articles...</Text>
          </View>
        ) : posts.length === 0 ? (
          <EmptyState icon="newspaper-outline" title="No articles yet" subtitle="Check back soon for new content" />
        ) : (
          <>
            {featured && <FeaturedPostCard post={featured} />}

            {rest.length > 0 && (
              <View style={styles.restHeader}>
                <Text style={styles.restTitle}>Latest Articles</Text>
                <Text style={styles.restCount}>{data?.total || posts.length} total</Text>
              </View>
            )}

            {rest.map((post) => (
              <View key={post.id || post.slug} style={{ marginBottom: 12 }}>
                <PostCard post={post} />
              </View>
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16, gap: 4 },
  headerRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 12,
    marginBottom: 16,
  },
  backBtn: {
    width: 40, height: 40, borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.06)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.08)",
    alignItems: "center" as const, justifyContent: "center" as const,
  },
  title: { fontSize: 28, fontWeight: "700" as const, fontFamily: "Inter_700Bold" },
  subtitle: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary, marginTop: 2,
  },
  pillRow: { gap: 8, paddingRight: 16, marginBottom: 20 },
  pill: {
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: "rgba(255,255,255,0.06)",
  },
  pillActive: {
    backgroundColor: "rgba(0,255,255,0.1)", borderColor: "rgba(0,255,255,0.25)",
  },
  pillText: { fontSize: 13, fontFamily: "Inter_500Medium", color: Colors.textSecondary },
  pillTextActive: { color: Colors.primary },
  featuredCard: {
    borderRadius: 16, padding: 24,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderWidth: 1, borderColor: "rgba(0,255,255,0.12)",
    marginBottom: 24, overflow: "hidden" as const,
  },
  featuredGradient: { ...StyleSheet.absoluteFillObject, borderRadius: 16 },
  featuredBadgeRow: {
    flexDirection: "row" as const, alignItems: "center" as const,
    justifyContent: "space-between" as const, marginBottom: 14,
  },
  categoryBadge: {
    flexDirection: "row" as const, alignItems: "center" as const,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, gap: 6,
  },
  categoryDot: { width: 6, height: 6, borderRadius: 3 },
  categoryText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  featuredTitle: {
    fontSize: 22, fontFamily: "Inter_700Bold", color: Colors.textPrimary,
    lineHeight: 30, marginBottom: 10,
  },
  featuredExcerpt: {
    fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textSecondary,
    lineHeight: 22, marginBottom: 16,
  },
  featuredFooter: {
    flexDirection: "row" as const, alignItems: "center" as const,
    justifyContent: "space-between" as const,
  },
  featuredDate: { fontSize: 12, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  readMore: { flexDirection: "row" as const, alignItems: "center" as const, gap: 6 },
  readMoreText: { fontSize: 13, fontFamily: "Inter_600SemiBold", color: Colors.primary },
  restHeader: {
    flexDirection: "row" as const, alignItems: "center" as const,
    justifyContent: "space-between" as const, marginBottom: 12,
  },
  restTitle: {
    fontSize: 18, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary,
  },
  restCount: { fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  postRow: {
    flexDirection: "row" as const, alignItems: "center" as const,
  },
  postInfo: { flex: 1 },
  postMeta: {
    flexDirection: "row" as const, alignItems: "center" as const, gap: 8, marginBottom: 8,
  },
  smallCatBadge: {
    paddingHorizontal: 8, paddingVertical: 2, borderRadius: 6,
  },
  smallCatText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  postDate: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
  postReadTime: { fontSize: 11, fontFamily: "Inter_400Regular", color: Colors.textMuted },
  postTitle: {
    fontSize: 16, fontFamily: "Inter_600SemiBold", color: Colors.textPrimary,
    lineHeight: 22, marginBottom: 4,
  },
  postExcerpt: {
    fontSize: 13, fontFamily: "Inter_400Regular", color: Colors.textTertiary,
    lineHeight: 19,
  },
  postArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.04)",
    alignItems: "center" as const, justifyContent: "center" as const,
    marginLeft: 12,
  },
  loadingContainer: {
    alignItems: "center" as const, justifyContent: "center" as const,
    paddingVertical: 60, gap: 12,
  },
  loadingText: { fontSize: 14, fontFamily: "Inter_400Regular", color: Colors.textTertiary },
});
