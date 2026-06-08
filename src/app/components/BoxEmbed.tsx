import * as React from "react";
import { ExternalLink, FolderOpen, Save } from "lucide-react";
import { Button } from "./ui/button";
import { Card, CardContent } from "./ui/card";
import { Input } from "./ui/input";
import { useAuth } from "../context/AuthContext";

const STORAGE_KEY = "cams.box.shareLink";

/** Default folder shown when no override has been saved. */
const DEFAULT_BOX_LINK = "https://alabama.box.com/s/pl6oe8oj7bd7mg68m0c75rvaq79cnice";

/**
 * Convert a Box share URL into its embeddable form.
 *
 * Box exposes any shared file or folder for iframe embedding by inserting
 * "/embed" before the "/s/" segment. Works on app.box.com and tenant-specific
 * subdomains like alabama.box.com.
 *
 *   https://alabama.box.com/s/HASH        ->  https://alabama.box.com/embed/s/HASH
 *   https://app.box.com/s/HASH/file/123   ->  https://app.box.com/embed/s/HASH/file/123
 */
function toEmbedUrl(shareUrl: string): string | null {
  try {
    const u = new URL(shareUrl);
    if (!u.hostname.endsWith("box.com")) return null;
    if (u.pathname.startsWith("/embed/")) return shareUrl;
    if (!u.pathname.startsWith("/s/")) return null;
    u.pathname = "/embed" + u.pathname;
    return u.toString();
  } catch {
    return null;
  }
}

function isValidBoxUrl(url: string): boolean {
  return toEmbedUrl(url) !== null;
}

export function BoxEmbed() {
  const { isExec } = useAuth();

  const [link, setLink] = React.useState<string>(() => {
    if (typeof window === "undefined") return DEFAULT_BOX_LINK;
    return window.localStorage.getItem(STORAGE_KEY) ?? DEFAULT_BOX_LINK;
  });
  const [draftLink, setDraftLink] = React.useState<string>(link);
  const [error, setError] = React.useState<string | null>(null);

  const embedUrl = React.useMemo(() => toEmbedUrl(link), [link]);

  const saveLink = () => {
    const trimmed = draftLink.trim();
    if (!isValidBoxUrl(trimmed)) {
      setError("Paste a Box share URL (https://*.box.com/s/...)");
      return;
    }
    setError(null);
    setLink(trimmed);
    window.localStorage.setItem(STORAGE_KEY, trimmed);
  };

  const resetToDefault = () => {
    setLink(DEFAULT_BOX_LINK);
    setDraftLink(DEFAULT_BOX_LINK);
    window.localStorage.removeItem(STORAGE_KEY);
    setError(null);
  };

  return (
    <div className="space-y-3">
      {isExec && (
        <Card className="bg-white">
          <CardContent className="p-4 space-y-2">
            <p className="text-sm font-medium flex items-center gap-2">
              <FolderOpen className="h-4 w-4" /> Shared Box folder
            </p>
            <p className="text-xs text-muted-foreground">
              Paste a Box shared link (Share &rarr; Copy shared link). Saved locally so the same folder loads next time.
            </p>
            <div className="flex gap-2 flex-wrap">
              <Input
                value={draftLink}
                onChange={(e) => setDraftLink(e.target.value)}
                placeholder="https://alabama.box.com/s/..."
                className="flex-1 min-w-[260px]"
              />
              <Button onClick={saveLink} disabled={!draftLink.trim() || draftLink.trim() === link}>
                <Save className="h-4 w-4 mr-1.5" /> Save
              </Button>
              {link !== DEFAULT_BOX_LINK && (
                <Button variant="outline" onClick={resetToDefault}>Reset</Button>
              )}
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
          </CardContent>
        </Card>
      )}

      <Card className="bg-white">
        <CardContent className="p-3">
          <div className="flex items-center justify-between mb-2 gap-2 flex-wrap">
            <p className="text-xs text-muted-foreground truncate">
              {embedUrl ? "Live Box folder" : "Invalid Box share link"}
            </p>
            <a
              href={link}
              target="_blank"
              rel="noreferrer"
              className="text-xs text-[#7a142e] inline-flex items-center gap-1 hover:underline shrink-0"
            >
              <ExternalLink className="h-3 w-3" /> Open in Box
            </a>
          </div>
          {embedUrl ? (
            <iframe
              src={embedUrl}
              title="Box shared folder"
              className="w-full rounded-md border bg-white"
              style={{ height: 720 }}
              allow="autoplay; fullscreen"
              allowFullScreen
            />
          ) : (
            <div className="p-6 text-sm text-muted-foreground border border-dashed rounded-md">
              The configured link is not a valid Box share URL.
            </div>
          )}
          <p className="text-xs text-muted-foreground mt-2">
            UA Box folders require University of Alabama credentials. If you see a sign-in screen
            inside the embed, log in once and the folder contents will appear.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
