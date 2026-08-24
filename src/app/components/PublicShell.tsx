import type { ReactNode } from "react";
import { Link, NavLink } from "react-router-dom";
import { Button } from "./ui/button";
import { ThemeToggle } from "./ThemeToggle";
import { cn } from "./ui/utils";
import camsLogo from "../../assets/cams-logo.png";

export const APPLY_URL =
  "https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=jnIAKtDwtECk6M5DPz-8p-dm6BAHXZ5FpC2yR0M_VpJUNktCRjRJRDRFVk9ZVkFNT0tUSjdPN1FTUC4u";

const PUBLIC_NAV = [
  { label: "Home", href: "/", end: true },
  { label: "Membership", href: "/membership", end: false },
  { label: "Committees", href: "/committees", end: false },
  { label: "News", href: "/news", end: false },
];

const footerLinkClass =
  "text-muted-foreground transition-colors duration-base ease-smooth hover:text-crimson focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-paper rounded-sm dark:focus-visible:ring-offset-card";

interface PublicShellProps {
  children: ReactNode;
}

export function PublicShell({ children }: PublicShellProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 border-b border-border/80 bg-card/95 shadow-header backdrop-blur-md supports-[backdrop-filter]:bg-card/80">
        <div className="mx-auto flex h-16 max-w-content items-center justify-between gap-4 px-6">
          <Link
            to="/"
            className="flex items-center gap-2 shrink-0 rounded-md transition-opacity duration-base ease-smooth hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background"
          >
            <img
              src={camsLogo}
              alt="CAMS logo"
              className="h-9 w-9 rounded-md object-cover shadow-xs ring-1 ring-border/60"
            />
            <span className="font-display text-xl font-semibold tracking-tight text-foreground">
              CAMS
            </span>
          </Link>

          <nav className="hidden items-center gap-1 md:flex" aria-label="Main">
            {PUBLIC_NAV.map(({ label, href, end }) => (
              <NavLink
                key={href}
                to={href}
                end={end}
                className={({ isActive }) =>
                  cn(
                    "rounded-md px-3 py-2 text-sm transition-colors duration-base ease-smooth",
                    isActive
                      ? "font-medium text-crimson"
                      : "text-ink/80 hover:bg-muted/80 hover:text-crimson dark:text-foreground/80 dark:hover:bg-muted/50",
                  )
                }
              >
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-2 shrink-0">
            <ThemeToggle />
            <Button variant="ghost" size="sm" className="hidden sm:inline-flex" asChild>
              <Link to="/login">Log in</Link>
            </Button>
            <Button size="sm" className="hidden md:inline-flex shadow-soft" asChild>
              <a href={APPLY_URL} target="_blank" rel="noopener noreferrer">
                Apply
              </a>
            </Button>
            <Button size="sm" className="md:hidden shadow-soft" asChild>
              <a href={APPLY_URL} target="_blank" rel="noopener noreferrer">
                Apply
              </a>
            </Button>
          </div>
        </div>

        <nav
          className="flex items-center justify-center gap-1 overflow-x-auto border-t border-border/60 px-4 py-2 md:hidden"
          aria-label="Main mobile"
        >
          {PUBLIC_NAV.map(({ label, href, end }) => (
            <NavLink
              key={href}
              to={href}
              end={end}
              className={({ isActive }) =>
                cn(
                  "shrink-0 rounded-md px-3 py-1.5 text-sm transition-colors duration-base ease-smooth",
                  isActive
                    ? "font-medium text-crimson"
                    : "text-ink/80 hover:bg-muted/80 hover:text-crimson dark:text-foreground/80 dark:hover:bg-muted/50",
                )
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-paper dark:bg-card">
        <div className="mx-auto grid max-w-content gap-10 px-6 py-14 md:grid-cols-3">
          <div>
            <div className="flex items-center gap-2">
              <img
                src={camsLogo}
                alt="CAMS logo"
                className="h-9 w-9 rounded-md object-cover shadow-xs ring-1 ring-border/60"
              />
              <span className="font-display text-xl font-semibold text-foreground">
                CAMS
              </span>
            </div>
            <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Capstone Asset Management Society. A student-run investment and
              recruiting organization at The University of Alabama.
            </p>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/90">
              Contact
            </h4>
            <ul className="mt-4 space-y-2 text-sm text-muted-foreground">
              <li>Tuscaloosa, AL</li>
              <li>
                <a
                  href="mailto:contact@cams.ua.edu"
                  className={cn(footerLinkClass, "underline-offset-4 hover:underline")}
                >
                  contact@cams.ua.edu
                </a>
              </li>
              <li>Culverhouse College of Business</li>
            </ul>
          </div>
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-widest text-foreground/90">
              Links
            </h4>
            <ul className="mt-4 space-y-2 text-sm">
              <li>
                <Link to="/membership" className={footerLinkClass}>
                  Membership
                </Link>
              </li>
              <li>
                <Link to="/committees" className={footerLinkClass}>
                  Committees
                </Link>
              </li>
              <li>
                <Link to="/news" className={footerLinkClass}>
                  News
                </Link>
              </li>
              <li>
                <a
                  href={APPLY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                >
                  Apply
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div className="border-t border-border/80 bg-paper/80 py-5 text-center text-xs text-muted-foreground dark:bg-card/80">
          &copy; {new Date().getFullYear()} CAMS · Capstone Asset Management
          Society · University of Alabama
        </div>
      </footer>
    </div>
  );
}
