import Link from "next/link";
import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { Role, Status } from "@prisma/client";

export default async function ExecLayout(props: Readonly<{ children: React.ReactNode }>) {
  const session = await auth();
  const email = session?.user?.email?.toLowerCase();
  if (!email) redirect("/signin?callbackUrl=/exec/verifications");

  const exec = await prisma.user.findUnique({ where: { email } });
  if (!exec || exec.role !== Role.EXEC || exec.status !== Status.VERIFIED) redirect("/signin?error=forbidden");

  const tabCls = "rounded-md px-4 py-2 text-sm font-semibold text-ink hover:bg-crimson/10";

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-ink/10 bg-paper p-4 shadow-md">
        <p className="text-xs font-semibold uppercase tracking-widest text-crimson">Executive console</p>
        <nav className="mt-4 flex flex-wrap gap-3">
          <Link className={`${tabCls}`} href="/exec/verifications">
            Verifications
          </Link>
          <Link className={`${tabCls}`} href="/exec/invites">
            Invites
          </Link>
          <Link className={`${tabCls}`} href="/exec/members">
            Members
          </Link>
        </nav>
      </div>
      {props.children}
    </div>
  );
}
