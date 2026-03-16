import { useQuery } from "@tanstack/react-query";

export interface BlogPost {
  id: number;
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  author: string;
  publishedAt: string;
  updatedAt: string;
  metaTitle?: string;
  metaDescription?: string;
}

async function fetchBlogPosts(category?: string): Promise<{ posts: BlogPost[]; total: number }> {
  const params = new URLSearchParams({ limit: "50" });
  if (category && category !== "All") params.set("category", category);
  const res = await fetch(`/api/blog/posts?${params}`);
  if (!res.ok) throw new Error("Failed to fetch blog posts");
  return res.json();
}

async function fetchBlogPost(slug: string): Promise<BlogPost> {
  const res = await fetch(`/api/blog/posts/${slug}`);
  if (!res.ok) throw new Error("Post not found");
  return res.json();
}

export function useBlogPosts(category?: string) {
  return useQuery({
    queryKey: ["blog-posts", category || "all"],
    queryFn: () => fetchBlogPosts(category),
    staleTime: 5 * 60 * 1000,
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ["blog-post", slug],
    queryFn: () => fetchBlogPost(slug),
    enabled: !!slug,
    staleTime: 10 * 60 * 1000,
  });
}
