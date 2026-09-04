import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  MOCK_NEWS,
  type NewsAudience,
  type NewsCategory,
  type NewsPost,
} from "../data/mockData";
import { useAuth } from "./AuthContext";

export const NEWS_STORAGE_KEY = "cams.newsPosts.v2";

function loadJsonPosts(): NewsPost[] | null {
  try {
    const v = localStorage.getItem(NEWS_STORAGE_KEY);
    if (!v) return null;
    const parsed = JSON.parse(v) as unknown;
    if (!Array.isArray(parsed)) return null;
    /* treat empty array as no persisted data so we re-seed from MOCK_NEWS */
    if (parsed.length === 0) return null;
    return parsed as NewsPost[];
  } catch {
    return null;
  }
}

function savePosts(next: NewsPost[]) {
  try {
    localStorage.setItem(NEWS_STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* localStorage may be unavailable in some test contexts */
  }
}

export function sortNewsPosts(posts: NewsPost[]): NewsPost[] {
  return [...posts].sort(
    (a, b) =>
      Number(b.pinned) - Number(a.pinned) ||
      +new Date(b.publishedAt) - +new Date(a.publishedAt),
  );
}

const EXCERPT_MAX = 160;

export function getNewsExcerpt(p: NewsPost): string {
  const manual = p.excerpt?.trim();
  if (manual) return manual;
  const body = p.body.trim();
  if (body.length <= EXCERPT_MAX) return body;
  return `${body.slice(0, EXCERPT_MAX).trimEnd()}\u2026`;
}

function newPostId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `n-${Date.now()}`;
}

export interface AddNewsPostInput {
  title: string;
  body: string;
  category: NewsCategory;
  excerpt?: string;
  /** Defaults to "all" (public) when omitted. */
  audience?: NewsAudience;
}

interface NewsContextValue {
  posts: NewsPost[];
  addPost: (input: AddNewsPostInput) => NewsPost | null;
  /**
   * Posts a given viewer is actually allowed to see, honoring `audience`.
   * `viewer: null` (or omitted) is the anonymous/public case — only "all".
   */
  visiblePosts: (viewer?: { isExec: boolean } | null) => NewsPost[];
}

const NewsContext = createContext<NewsContextValue | null>(null);

export function NewsProvider({ children }: { children: React.ReactNode }) {
  const { currentUser, isExec } = useAuth();
  const [posts, setPosts] = useState<NewsPost[]>(() => {
    const stored = loadJsonPosts();
    if (stored) return stored;
    return MOCK_NEWS.map((p) => ({ ...p }));
  });

  useEffect(() => {
    savePosts(posts);
  }, [posts]);

  const addPost = useCallback(
    (input: AddNewsPostInput): NewsPost | null => {
      if (!currentUser || !isExec) return null;
      const title = input.title.trim();
      const body = input.body.trim();
      if (!title || !body) return null;

      const excerptRaw = input.excerpt?.trim();
      const excerpt =
        excerptRaw ||
        (() => {
          if (body.length <= EXCERPT_MAX) return undefined;
          return `${body.slice(0, EXCERPT_MAX).trimEnd()}\u2026`;
        })();

      const post: NewsPost = {
        id: newPostId(),
        title,
        body,
        ...(excerpt !== undefined && excerpt !== "" ? { excerpt } : {}),
        category: input.category,
        author: `${currentUser.firstName} ${currentUser.lastName}`,
        publishedAt: new Date().toISOString(),
        pinned: false,
        audience: input.audience ?? "all",
      };
      setPosts((prev) => [...prev, post]);
      return post;
    },
    [currentUser, isExec],
  );

  const visiblePosts = useCallback(
    (viewer?: { isExec: boolean } | null) =>
      posts.filter((p) => {
        const audience = p.audience ?? "all";
        if (audience === "all") return true;
        if (!viewer) return false; // anonymous/public visitor
        if (audience === "members") return true; // any signed-in viewer
        return viewer.isExec; // audience === "exec"
      }),
    [posts],
  );

  const value = useMemo<NewsContextValue>(
    () => ({ posts, addPost, visiblePosts }),
    [posts, addPost, visiblePosts],
  );

  return (
    <NewsContext.Provider value={value}>{children}</NewsContext.Provider>
  );
}

export function useNews() {
  const c = useContext(NewsContext);
  if (!c) throw new Error("useNews must be used inside NewsProvider");
  return c;
}
