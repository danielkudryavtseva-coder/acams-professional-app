/**
 * Import graph (acyclic): `auth.ts` → `auth.config.ts` → `@/lib/*`, `@prisma/client` (leaf; no `./auth`).
 * Route/layout code imports `@/auth` only.
 */
import NextAuth from "next-auth";

import { authConfig, authProviders } from "./auth.config";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: authProviders,
});
