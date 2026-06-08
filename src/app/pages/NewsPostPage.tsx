import * as React from "react";
import { Link, useParams } from "react-router-dom";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { sortNewsPosts, useNews } from "../context/NewsContext";
import { NewsArticleExcerptCard, NewsCategoryPill } from "../components/NewsBlogLayout";
import { estimateReadMinutes, formatNewsShortDate } from "../lib/newsDisplay";

export default function NewsPostPage() {
  const { postId } = useParams<{ postId: string }>();
  const { posts } = useNews();
  const post = React.useMemo(
    () => posts.find((p) => p.id === postId),
    [posts, postId],
  );

  if (!post) {
    return (
      <div className="min-h-[50vh] bg-paper px-6 py-12">
        <div className="mx-auto max-w-content">
          <p className="font-display text-xl font-semibold text-foreground">
            Post not found
          </p>
          <Button asChild variant="link" className="mt-2 h-auto px-0 text-crimson">
            <Link to="/news">Back to news</Link>
          </Button>
        </div>
      </div>
    );
  }

  const related = sortNewsPosts(posts)
    .filter((p) => p.id !== post.id)
    .slice(0, 3);

  const readMin = estimateReadMinutes(post.body);

  return (
    <div className="bg-paper px-6 py-10 dark:bg-background">
      <div className="mx-auto max-w-content">
        <Button asChild variant="ghost" className="mb-6 -ml-2 text-crimson hover:text-crimson">
          <Link to="/news">&larr; Back to news</Link>
        </Button>
        <article className="max-w-3xl">
          <div className="flex flex-wrap items-center gap-2">
            {post.pinned && <Badge>Pinned</Badge>}
            <NewsCategoryPill category={post.category} variant="light" />
            <span className="text-sm text-muted-foreground">
              {formatNewsShortDate(post.publishedAt)}
              {" \u2022 "}
              {readMin} min read
            </span>
          </div>
          <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight md:text-4xl">
            {post.title}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">By {post.author}</p>
          <div className="mt-8 whitespace-pre-wrap text-base leading-relaxed text-foreground">
            {post.body}
          </div>
        </article>

        {related.length > 0 && (
          <section className="mt-16 border-t border-border pt-10">
            <h2 className="font-display text-xl font-semibold md:text-2xl">More news</h2>
            <div className="mt-6 grid gap-4 md:grid-cols-3">
              {related.map((p) => (
                <NewsArticleExcerptCard key={p.id} post={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
