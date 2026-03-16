import React from "react";
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
import { router, useLocalSearchParams } from "expo-router";
import Colors from "@/constants/colors";
import { BackgroundGlow } from "@/components/BackgroundGlow";
import { GradientText } from "@/components/GradientText";
import { useBlogPost } from "@/hooks/useBlog";

/**
 * Minimal HTML-to-RN-Text renderer.
 * The blog content comes as simple HTML (h2, h3, p, a, strong, em).
 * We parse and render natively for the premium feel.
 */
function renderHTML(html: string) {
  if (!html) return null;

  // Split HTML into blocks by tags
  const blocks: { tag: string; content: string }[] = [];
  const blockRegex = /<(h[23]|p|li)>([\s\S]*?)<\/\1>/gi;
  let match;
  while ((match = blockRegex.exec(html)) !== null) {
    blocks.push({ tag: match[1].toLowerCase(), content: match[2] });
  }

  if (blocks.length === 0) {
    // Fallback: just show as plain text
    const plainText = html.replace(/<[^>]+>/g, "").trim();
    return <Text style={styles.bodyText}>{plainText}</Text>;
  }

  return blocks.map((block, i) => {
    const text = block.content
      .replace(/<strong>(.*?)<\/strong>/gi, "$1")
      .replace(/<em>(.*?)<\/em>/gi, "$1")
      .replace(/<a[^>]*>(.*?)<\/a>/gi, "$1")
      .replace(/<[^>]+>/g, "")
      .trim();

    if (!text) return null;

    switch (block.tag) {
      case "h2":
        return <Text key={i} style={styles.heading2}>{text}</Text>;
      case "h3":
        return <Text key={i} style={styles.heading3}>{text}</Text>;
      case "li":
        return (
          <View key={i} style={styles.listItem}>
            <Text style={styles.listBullet}>•</Text>
            <Text style={styles.bodyText}>{text}</Text>
          </View>
        );
      default:
        return <Text key={i} style={styles.bodyText}>{text}</Text>;
    }
  });
}

export default function BlogPostScreen() {
  const insets = useSafeAreaInsets();
  const webTopInset = Platform.OS === "web" ? 67 : 0;
  const { width } = useWindowDimensions();
  const isDesktop = Platform.OS === "web" && width >= 768;
  const { slug } = useLocalSearchParams<{ slug: string }>();

  const { data: post, isLoading } = useBlogPost(slug || "");

  const dateStr = post?.publishedAt
    ? new Date(post.publishedAt).toLocaleDateString("en-US", {
        month: "long",
        day: "numeric",
        year: "numeric",
      })
    : "";

  const readTime = Math.max(3, Math.ceil((post?.content?.length || 0) / 1200));

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
        <Pressable
          style={styles.backRow}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.back();
          }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.primary} />
          <Text style={styles.backText}>Back to Blog</Text>
        </Pressable>

        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.primary} />
          </View>
        ) : !post ? (
          <View style={styles.loadingContainer}>
            <Ionicons name="alert-circle-outline" size={48} color={Colors.textTertiary} />
            <Text style={styles.errorText}>Article not found</Text>
          </View>
        ) : (
          <>
            <View style={styles.metaRow}>
              {post.category ? (
                <View style={styles.catBadge}>
                  <Text style={styles.catText}>{post.category}</Text>
                </View>
              ) : null}
              <Text style={styles.metaDate}>{dateStr}</Text>
              <Text style={styles.metaDot}>·</Text>
              <Text style={styles.metaRead}>{readTime} min read</Text>
            </View>

            <GradientText text={post.title} style={styles.articleTitle} />

            {post.excerpt ? (
              <Text style={styles.excerpt}>{post.excerpt}</Text>
            ) : null}

            <View style={styles.authorRow}>
              <View style={styles.authorAvatar}>
                <Ionicons name="person" size={14} color={Colors.primary} />
              </View>
              <Text style={styles.authorName}>{post.author || "Trust Layer"}</Text>
            </View>

            <View style={styles.articleDivider} />

            <View style={styles.articleBody}>{renderHTML(post.content)}</View>

            {post.tags && post.tags.length > 0 ? (
              <View style={styles.tagsSection}>
                <Text style={styles.tagsLabel}>Tags</Text>
                <View style={styles.tagsRow}>
                  {post.tags.map((tag: string) => (
                    <View key={tag} style={styles.tagBadge}>
                      <Text style={styles.tagText}>{tag}</Text>
                    </View>
                  ))}
                </View>
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.background },
  scrollView: { flex: 1 },
  content: { paddingHorizontal: 16 },
  backRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 24,
  },
  backText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.primary,
  },
  metaRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 8,
    marginBottom: 12,
  },
  catBadge: {
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 8,
    backgroundColor: "rgba(0,255,255,0.1)",
  },
  catText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    color: Colors.primary,
  },
  metaDate: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  metaDot: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  metaRead: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    color: Colors.textTertiary,
  },
  articleTitle: {
    fontSize: 28,
    fontWeight: "700" as const,
    fontFamily: "Inter_700Bold",
    lineHeight: 36,
    marginBottom: 12,
  },
  excerpt: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 24,
    marginBottom: 16,
    borderLeftWidth: 3,
    borderLeftColor: Colors.primary,
    paddingLeft: 14,
  },
  authorRow: {
    flexDirection: "row" as const,
    alignItems: "center" as const,
    gap: 10,
    marginBottom: 20,
  },
  authorAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "rgba(0,255,255,0.1)",
    alignItems: "center" as const,
    justifyContent: "center" as const,
  },
  authorName: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
    color: Colors.textSecondary,
  },
  articleDivider: {
    height: 1,
    backgroundColor: "rgba(255,255,255,0.06)",
    marginBottom: 24,
  },
  articleBody: {
    gap: 4,
  },
  heading2: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    color: Colors.textPrimary,
    marginTop: 28,
    marginBottom: 12,
    lineHeight: 30,
  },
  heading3: {
    fontSize: 18,
    fontFamily: "Inter_600SemiBold",
    color: Colors.textPrimary,
    marginTop: 20,
    marginBottom: 8,
    lineHeight: 26,
  },
  bodyText: {
    fontSize: 15,
    fontFamily: "Inter_400Regular",
    color: Colors.textSecondary,
    lineHeight: 26,
    marginBottom: 12,
  },
  listItem: {
    flexDirection: "row" as const,
    gap: 8,
    paddingLeft: 8,
    marginBottom: 8,
  },
  listBullet: {
    fontSize: 15,
    color: Colors.primary,
    lineHeight: 26,
  },
  tagsSection: {
    marginTop: 32,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.06)",
  },
  tagsLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
    marginBottom: 10,
  },
  tagsRow: {
    flexDirection: "row" as const,
    flexWrap: "wrap" as const,
    gap: 8,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.06)",
  },
  tagText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    color: Colors.secondary,
  },
  loadingContainer: {
    alignItems: "center" as const,
    justifyContent: "center" as const,
    paddingVertical: 80,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    fontFamily: "Inter_500Medium",
    color: Colors.textTertiary,
  },
});
