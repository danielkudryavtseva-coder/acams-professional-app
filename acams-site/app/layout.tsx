import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Providers from "@/components/Providers";
import { Header } from "@/components/Header";

import type { Session } from "next-auth";

import { auth } from "@/auth";

/** Next.js throws this during prerender when `auth()` opts the segment into dynamic rendering; must not be caught. */
function isDynamicServerUsageError(err: unknown): boolean {
  return (
    typeof err === "object" &&
    err !== null &&
    "digest" in err &&
    (err as { digest?: string }).digest === "DYNAMIC_SERVER_USAGE"
  );
}

/** RSC → client: ensure SessionProvider only receives a plain JSON tree (avoids Auth.js merge loops). */
function clientSession(session: Session | null): Session | null {
  if (!session) return null;
  try {
    return structuredClone(session) as Session;
  } catch {
    try {
      return JSON.parse(JSON.stringify(session)) as Session;
    } catch {
      return null;
    }
  }
}

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ACAMS — Crimson Member Hub",
  description: "Executive verification, onboarding, and member resources.",
};

export default async function RootLayout(props: Readonly<{ children: React.ReactNode }>) {
  let session: Session | null = null;
  try {
    session = await auth();
  } catch (err) {
    if (isDynamicServerUsageError(err)) throw err;
    console.error("[layout] auth() failed; rendering logged-out shell", err);
    session = null;
  }
  const sessionForUi = clientSession(session);

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} h-full`}>
      <body className="min-h-full bg-paper font-sans text-ink antialiased">
        <Providers session={sessionForUi}>
          <Header session={sessionForUi} />
          <main className="mx-auto w-full max-w-[1200px] px-5 py-8">{props.children}</main>
        </Providers>
      </body>
    </html>
  );
}
