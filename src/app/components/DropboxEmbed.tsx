import * as React from "react";
import { ExternalLink, FolderOpen, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { useAuth } from "../context/AuthContext";

declare global {
  interface Window {
    Dropbox?: {
      embed: (
        opts: { link: string; file?: HTMLElement; folder?: { view?: "list" | "grid"; headerSize?: "normal" | "small" } },
        target?: HTMLElement,
      ) => HTMLElement;
      unmount: (el: HTMLElement) => void;
      isBrowserSupported: () => boolean;
    };
  }
}

const SCRIPT_ID = "dropboxjs";
const SCRIPT_SRC = "https://www.dropbox.com/static/api/2/dropins.js";
const STORAGE_KEY = "cams.dropbox.shareLink";

/**
 * Idempotently inject the Dropbox dropins script. Resolves when window.Dropbox
 * is available. Re-uses the existing script tag if present.
 */
function loadDropboxScript(appKey: string): Promise<NonNullable<Window["Dropbox"]>> {
  return new Promise((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("Dropbox embed requires a browser environment"));
      return;
    }
    if (window.Dropbox) {
      resolve(window.Dropbox);
      return;
    }
    const existing = document.getElementById(SCRIPT_ID) as HTMLScriptElement | null;
    const onReady = () => {
      if (window.Dropbox) resolve(window.Dropbox);
      else reject(new Error("Dropbox SDK loaded but window.Dropbox is undefined"));
    };
    if (existing) {
      existing.addEventListener("load", onReady, { once: true });
      existing.addEventListener("error", () => reject(new Error("Failed to load Dropbox SDK")), { once: true });
      return;
    }
    const script = document.createElement("script");
    script.id = SCRIPT_ID;
    script.src = SCRIPT_SRC;
    script.async = true;
    script.setAttribute("data-app-key", appKey);
    script.addEventListener("load", onReady, { once: true });
    script.addEventListener("error", () => reject(new Error("Failed to load Dropbox SDK")), { once: true });
    document.head.appendChild(script);
  });
}

function isValidShareLink(link: string): boolean {
  if (!link) return false;
  try {
    const u = new URL(link);
    return u.hostname === "www.dropbox.com" || u.hostname.endsWith(".dropbox.com");
  } catch {
    return false;
  }
}

export function DropboxEmbed() {
  const { isExec } = useAuth();
  const appKey = import.meta.env.VITE_DROPBOX_APP_KEY as string | undefined;

  const [link, setLink] = React.useState<string>(() => {
    if (typeof window === "undefined") return "";
    return window.localStorage.getItem(STORAGE_KEY) ?? "";
  });
  const [draftLink, setDraftLink] = React.useState<string>(link);
  const [status, setStatus] = React.useState<"idle" | "loading" | "ready" | "error">("idle");
  const [error, setError] = React.useState<string | null>(null);

  const containerRef = React.useRef<HTMLDivElement | null>(null);
  const mountedNodeRef = React.useRef<HTMLElement | null>(null);

  const saveLink = () => {
    const trimmed = draftLink.trim();
    if (!isValidShareLink(trimmed)) {
      setError("Paste a full Dropbox share URL (https://www.dropbox.com/...)");
      return;
    }
    setError(null);
    setLink(trimmed);
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  };

  const clearLink = () => {
    setLink("");
    setDraftLink("");
    window.localStorage.removeItem(STORAGE_KEY);
  };

  React.useEffect(() => {
    if (!appKey || !link || !containerRef.current) return;

    let cancelled = false;
    setStatus("loading");
    setError(null);

    // Tear down any previously-mounted embed before re-rendering.
    if (mountedNodeRef.current && window.Dropbox) {
      try { window.Dropbox.unmount(mountedNodeRef.current); } catch { /* noop */ }
      mountedNodeRef.current = null;
    }
    containerRef.current.innerHTML = "";

    loadDropboxScript(appKey)
      .then((Dropbox) => {
        if (cancelled || !containerRef.current) return;
        if (!Dropbox.isBrowserSupported()) {
          setStatus("error");
          setError("This browser is not supported by Dropbox embeds.");
          return;
        }
        const node = Dropbox.embed(
          { link, folder: { view: "list", headerSize: "normal" } },
          containerRef.current,
        );
        mountedNodeRef.current = node;
        setStatus("ready");
      })
      .catch((e: Error) => {
        if (cancelled) return;
        setStatus("error");
        setError(e.message || "Failed to embed Dropbox folder");
      });

    return () => {
      cancelled = true;
      if (mountedNodeRef.current && window.Dropbox) {
        try { window.Dropbox.unmount(mountedNodeRef.current); } catch { /* noop */ }
        mountedNodeRef.current = null;
      }
    };
  }, [appKey, link]);

  if (!appKey) {
    return (
      <Card className="bg-white border-amber-300">
        <CardContent className="p-4 space-y-2 text-sm">
          <p className="font-semibold flex items-center gap-2">
            <FolderOpen className="h-4 w-4" /> Dropbox embed not configured
          </p>
          <p className="text-muted-foreground">
            Add <code className="px-1 py-0.5 rounded bg-muted text-xs">VITE_DROPBOX_APP_KEY</code> to
            <code className="px-1 py-0.5 rounded bg-muted text-xs ml-1">.env.local</code> and restart the dev server.
            Create an app at{" "}
            <a
              className="underline text-[#7a142e]"
              href="https://www.dropbox.com/developers/apps"
              target="_blank"
              rel="noreferrer"
            >
              dropbox.com/developers/apps
            </a>
            {" "}(Scoped access, Full Dropbox or App folder), then under <em>Chooser/Saver/Embedder domains</em> add your dev origin
            (e.g. <code className="px-1 py-0.5 rounded bg-muted text-xs">localhost</code>).
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {(isExec || !link) && (
        <Card className="bg-white">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" /> Shared folder link
            </p>
            <p className="text-xs text-muted-foreground">
              Paste a Dropbox shared folder URL (Share &rarr; Copy link). Saved locally so the same link loads next time.
            </p>
            <div className="flex gap-2">
              <Input
                value={draftLink}
                onChange={(e) => setDraftLink(e.target.value)}
                placeholder="https://www.dropbox.com/scl/fo/abc.../folder?rlkey=..."
                className="flex-1"
              />
              <Button onClick={saveLink} disabled={!draftLink.trim() || draftLink.trim() === link}>
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
              {link && (
                <Button variant="outline" onClick={clearLink}>Clear</Button>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      {link && (
        <Card className="bg-white">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground truncate">
                {status === "loading" && "Loading Dropbox folder..."}
                {status === "ready" && "Live Dropbox folder"}
                {status === "error" && (error ?? "Failed to load")}
                {status === "idle" && "Initializing..."}
              </p>
              <a
                href={link}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#7a142e] inline-flex items-center gap-1 hover:underline"
              >
                <ExternalLink className="h-3 w-3" /> Open in Dropbox
              </a>
            </div>
            <div
              ref={containerRef}
              className="w-full rounded-md border bg-muted/20"
              style={{ height: 600 }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
