import { createHash, randomBytes } from "crypto";

/** Return raw hex token for one-time embedding in URLs (never persisted). */
export function createInviteTokenRaw(): string {
  return randomBytes(32).toString("hex");
}

export function hashInviteToken(raw: string): string {
  return createHash("sha256").update(raw, "utf8").digest("hex");
}
