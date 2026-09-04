import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string | undefined;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined;

/** True once real Supabase credentials are configured. Auth/member features are disabled until then. */
export const supabaseConfigured = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);

// Preference flag for where the next sign-in's session gets stored — set by Login.tsx's
// "Keep me logged in" checkbox before calling signInWithPassword(). Lives in localStorage
// itself since it's just a preference, never the session token.
const REMEMBER_KEY = "cams_remember_me";

/** Call before signing in to control whether the resulting session survives a browser restart. */
export function setRememberMePreference(remember: boolean) {
  try {
    localStorage.setItem(REMEMBER_KEY, remember ? "1" : "0");
  } catch {
    // Storage unavailable (private browsing, etc.) — falls back to the default (remembered).
  }
}

function rememberMePreference(): boolean {
  try {
    return localStorage.getItem(REMEMBER_KEY) !== "0"; // default true, matches the checkbox's default-checked state
  } catch {
    return true;
  }
}

/**
 * Supabase's client only supports one storage backend per instance, but "Keep me logged
 * in" needs to switch between localStorage (persists across browser restarts) and
 * sessionStorage (cleared when the tab/browser closes) per sign-in. This adapter checks
 * the preference at call time instead. Previously the checkbox was pure decoration —
 * every session persisted to localStorage regardless of it.
 */
const hybridStorage = {
  getItem(key: string) {
    return localStorage.getItem(key) ?? sessionStorage.getItem(key);
  },
  setItem(key: string, value: string) {
    if (rememberMePreference()) {
      localStorage.setItem(key, value);
      sessionStorage.removeItem(key);
    } else {
      sessionStorage.setItem(key, value);
      localStorage.removeItem(key);
    }
  },
  removeItem(key: string) {
    localStorage.removeItem(key);
    sessionStorage.removeItem(key);
  },
};

export const supabase = createClient(
  SUPABASE_URL || "https://placeholder.supabase.co",
  SUPABASE_ANON_KEY || "placeholder-anon-key",
  { auth: { storage: hybridStorage } },
);
