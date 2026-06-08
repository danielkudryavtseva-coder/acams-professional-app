import { auth, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { Status } from "@prisma/client";
import { redirect } from "next/navigation";

export default async function MemberLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();

  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/signin?callbackUrl=/member");

  const dbUser = await prisma.user.findUnique({ where: { email } });

  if (!dbUser) {
    redirect("/signin");
  }

  if (dbUser.status === Status.REJECTED) {
    await signOut({ redirect: false });
    redirect("/signin?error=rejected");
  }

  if (dbUser.status === Status.UNVERIFIED) {
    return (
      <div className="rounded-2xl border border-crimson/30 bg-paper p-10 shadow-xl">
        <p className="text-xs font-semibold uppercase tracking-widest text-crimson">Executive gate</p>
        <h1 className="mt-3 text-pretty text-3xl font-semibold tracking-tight text-ink">Pending Executive Verification</h1>
        <p className="mt-4 max-w-prose leading-relaxed text-ink/75">
          You&apos;re authenticated, but Crimson leadership still needs to bless your cohort access. Execs manage this queue inside{" "}
          <span className="font-mono text-xs">/exec/verifications</span>; expect an email ping once approvals land.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-ink/10 bg-paper p-6 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-crimson">Member hub</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink">Verified resources</h1>
        <p className="mt-3 max-w-prose leading-relaxed text-ink/70">
          This surface pairs with the Vite SPA. Authentication state now flows via Auth.js JWT sessions capped at seven days with live role/status hydration on every refresh.
        </p>
      </div>
      {children}
    </div>
  );
}
