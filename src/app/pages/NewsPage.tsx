import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { useEvents } from "../context/EventsContext";
import { sortNewsPosts, useNews } from "../context/NewsContext";
import {
  NewsFeaturedCard,
  NewsFoundersCarousel,
  NewsLatestListItem,
  NewsPaginationBar,
} from "../components/NewsBlogLayout";

const TOP_SLOTS = 5;

export default function NewsPage() {
  const { events } = useEvents();
  const { posts } = useNews();
  const sorted = React.useMemo(() => sortNewsPosts(posts), [posts]);

  const totalPages = React.useMemo(
    () => Math.max(1, Math.ceil(sorted.length / TOP_SLOTS)),
    [sorted.length],
  );

  const [page, setPage] = React.useState(0);

  React.useEffect(() => {
    setPage((p) => Math.min(p, Math.max(0, totalPages - 1)));
  }, [totalPages]);

  const windowPosts = React.useMemo(
    () => sorted.slice(page * TOP_SLOTS, page * TOP_SLOTS + TOP_SLOTS),
    [sorted, page],
  );

  const featured = windowPosts[0];
  const latestList = windowPosts.slice(1, TOP_SLOTS);

  return (
    <div className="bg-paper px-6 py-10 dark:bg-background">
      <div className="mx-auto max-w-content">
        {sorted.length === 0 ? (
          <p className="font-display text-xl font-semibold text-foreground">
            No news yet.
          </p>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-3 lg:gap-10 lg:items-start">
              <div className="lg:col-span-2">
                {featured ? <NewsFeaturedCard post={featured} /> : null}
              </div>
              <div>
                <h2 className="font-display text-xl font-semibold tracking-tight text-foreground md:text-2xl">
                  Latest post
                </h2>
                {latestList.length > 0 ? (
                  <ul className="mt-4 space-y-1 border-t border-border/60 pt-2">
                    {latestList.map((p) => (
                      <NewsLatestListItem key={p.id} post={p} />
                    ))}
                  </ul>
                ) : (
                  <p className="mt-4 text-sm text-muted-foreground">
                    No additional posts on this page.
                  </p>
                )}
              </div>
            </div>

            <NewsFoundersCarousel
              posts={sorted}
              excludePostId={featured?.id}
            />

            <NewsPaginationBar
              page={page}
              totalPages={totalPages}
              onPageChange={setPage}
            />
          </>
        )}

        <div className="mt-14 grid gap-4 border-t border-border pt-10 md:grid-cols-2">
          <Card className="rounded-[1.25rem] bg-card shadow-soft ring-1 ring-border/35 md:rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm">Portfolio Widget</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">$811,594</p>
              <p className="text-sm text-crimson">+10.13% YTD</p>
            </CardContent>
          </Card>
          <Card className="rounded-[1.25rem] bg-card shadow-soft ring-1 ring-border/35 md:rounded-3xl">
            <CardHeader>
              <CardTitle className="text-sm">Upcoming Events</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {events.slice(0, 3).map((e) => (
                <div key={e.id}>
                  <p className="text-sm font-medium">{e.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(e.date).toLocaleString()}
                  </p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
