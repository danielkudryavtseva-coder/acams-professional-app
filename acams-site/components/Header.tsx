import Link from "next/link";
import type { Session } from "next-auth";

import { StatusPill } from "@/components/StatusPill";

const navClasses = "text-sm font-semibold text-ink/85 hover:text-ink";

export function Header(props: Readonly<{ session: Session | null }>) {
  const u = props.session?.user;

  return (
    <header className="sticky top-0 z-40 border-b border-ink/10 bg-paper/90 backdrop-blur">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-5 py-3">
        <Link href="/" className="text-sm font-semibold tracking-tight text-crimson">
          ACAMS
        </Link>
        <nav className="hidden items-center gap-5 md:flex">
          <Link className={navClasses} href="/portfolio">
            Portfolio
          </Link>
          <Link className={navClasses} href="/leadership">
            Leadership
          </Link>
          <Link className={navClasses} href="/news">
            News
          </Link>
          <Link className={navClasses} href="/member">
            Member Hub
          </Link>
          {u?.role === "EXEC" ? (
            <Link className={navClasses} href="/exec/verifications">
              Exec Tools
            </Link>
          ) : null}
        </nav>

        <div className="ml-auto flex items-center gap-3">
          {u ? (
            <div className="flex items-center gap-3 rounded-xl border border-ink/15 bg-paper px-3 py-2 ring-2 ring-transparent">
              <div className="leading-tight">
                <div className="sr-only">{u.email}</div>
                <div className="text-sm font-semibold text-ink">{u.email}</div>
                <div className="mt-1 flex flex-wrap items-center gap-2">
                  {u.role ? <StatusPill variant="role" value={u.role as never} /> : null}
                  {u.status === "UNVERIFIED" ? <StatusPill variant="status" value={u.status} /> : null}
                </div>
              </div>
              <form action="/signout" method="post">
                <button
                  type="submit"
                  className="rounded-md border border-crimson/35 bg-paper px-3 py-1 text-xs font-semibold text-ink hover:bg-crimson/10"
                >
                  Sign out
                </button>
              </form>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/signin"
                className="rounded-md border border-ink/20 bg-paper px-3 py-2 text-xs font-semibold text-ink hover:bg-crimson/10"
              >
                Sign in
              </Link>
              <Link href="/signup" className="rounded-md bg-crimson px-3 py-2 text-xs font-semibold text-paper hover:bg-[var(--crimson-dark)]">
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
