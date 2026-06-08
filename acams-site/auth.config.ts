/**
 * Auth leaf module — no imports from `./auth` (avoids `auth` ↔ `auth.config` cycles).
 * Graph: `auth.config` → `@/lib/*`, Prisma, provider packages only.
 */
import type { NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Credentials from "next-auth/providers/credentials";
import Nodemailer from "next-auth/providers/nodemailer";
import nodemailer from "nodemailer";
import { Role, Status } from "@prisma/client";

import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { signInFormSchema } from "@/lib/schemas";
import { sendMail } from "@/lib/email";

function mailTransport(): nodemailer.Transporter {
  if (!process.env.SMTP_HOST) {
    return nodemailer.createTransport({ jsonTransport: true });
  }
  const port = Number(process.env.SMTP_PORT ?? "587");
  const secure = process.env.SMTP_SECURE === "true" || port === 465;
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth:
      process.env.SMTP_USER && process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
  });
}

export const authProviders = [
  Credentials({
    name: "Credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Password", type: "password" },
    },
    async authorize(raw) {
      const parsed = signInFormSchema.safeParse(raw);
      if (!parsed.success) return null;
      const email = parsed.data.email.trim().toLowerCase();
      const user = await prisma.user.findUnique({ where: { email } });
      if (!user?.hashedPassword) return null;
      if (user.status === Status.REJECTED) return null;
      const ok = await verifyPassword(parsed.data.password, user.hashedPassword);
      if (!ok) return null;
      return {
        id: user.id,
        email: user.email,
        name: user.name ?? undefined,
        role: user.role,
        status: user.status,
      };
    },
  }),
  Nodemailer({
    server: mailTransport(),
    from: process.env.MAIL_FROM ?? '"ACAMS" <noreply@localhost>',
    async sendVerificationRequest({ identifier, url }) {
      await sendMail({
        to: identifier,
        subject: "Sign in to ACAMS",
        text: `Use this link to sign in (expires soon):\n\n${url}\n`,
      });
    },
  }),
] satisfies NextAuthConfig["providers"];

export const authConfig = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  session: {
    strategy: "jwt",
    maxAge: 60 * 60 * 24 * 7,
  },
  pages: {
    signIn: "/signin",
  },
  callbacks: {
    async signIn({ user, account }) {
      const provider = account?.provider;
      if (provider === "nodemailer" || provider === "email") {
        const email = user.email?.toLowerCase();
        if (!email) return false;
        const db = await prisma.user.findUnique({ where: { email } });
        if (!db || db.status === Status.REJECTED) return false;
      }
      return true;
    },
    async jwt({ token, user }) {
      // Return a plain JWT payload only. Spreading or retaining the full token object
      // under Turbopack/Auth.js can produce deep-merge loops (RangeError in merge()).
      const sub =
        typeof user?.id === "string" ? user.id : typeof token.sub === "string" ? token.sub : undefined;

      let role: Role | undefined;
      let status: Status | undefined;
      let email = typeof token.email === "string" ? token.email : undefined;
      let name = typeof token.name === "string" ? token.name : undefined;

      if (user) {
        email = user.email ?? email;
        name = user.name ?? name;
        if ("role" in user && user.role) role = user.role;
        if ("status" in user && user.status) status = user.status;
      }

      if (sub) {
        const fresh = await prisma.user.findUnique({ where: { id: sub } });
        if (fresh) {
          role = fresh.role;
          status = fresh.status;
          email = fresh.email ?? email;
          name = fresh.name ?? name;
        }
      }

      const next: {
        sub?: string;
        email?: string;
        name?: string;
        role?: Role;
        status?: Status;
        iat?: number;
        exp?: number;
        jti?: string;
      } = {
        sub,
        email,
        name,
        role,
        status,
      };

      if (typeof token.iat === "number") next.iat = token.iat;
      if (typeof token.exp === "number") next.exp = token.exp;
      if (typeof token.jti === "string") next.jti = token.jti;

      return next;
    },
    async session({ session, token }) {
      const sub = typeof token.sub === "string" ? token.sub : undefined;
      if (!sub) {
        return {
          expires: session.expires,
          user: session.user,
        };
      }

      const role = (token.role as Role | undefined) ?? Role.MEMBER;
      const status = (token.status as Status | undefined) ?? Status.UNVERIFIED;

      return {
        expires: session.expires,
        user: {
          id: sub,
          email: session.user?.email ?? (typeof token.email === "string" ? token.email : ""),
          name: session.user?.name ?? (typeof token.name === "string" ? token.name : null),
          image: session.user?.image ?? null,
          role,
          status,
        },
      };
    },
  },
} satisfies Omit<NextAuthConfig, "providers">;
