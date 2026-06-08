export default async function NewsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-4xl font-semibold tracking-tight text-ink">News</h1>
        <p className="mt-4 max-w-3xl text-pretty leading-relaxed text-ink/75">
          Wire this section to CMS blocks or SPA feeds when ingestion lands — for now navigation demonstrates public vs member surfaces.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-ink/20 bg-paper p-16 text-center text-sm font-semibold text-ink/60">
        No drafts yet — check the Vite `News` module for authoring flows.
      </div>
    </div>
  );
}
