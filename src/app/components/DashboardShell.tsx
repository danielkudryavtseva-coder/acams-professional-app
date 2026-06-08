import type { ReactNode } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard, Users, GitBranch, TrendingUp, Briefcase,
  ChevronRight, Lock, Handshake, BookOpen,
  Calendar, ClipboardList, BarChart2, Wrench,
  BriefcaseBusiness, LogOut, Award, Trophy, PenLine,
} from "lucide-react";
import { cn } from "./ui/utils";
import { ThemeToggle } from "./ThemeToggle";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { Separator } from "./ui/separator";
import { Button } from "./ui/button";
import { useAuth } from "../context/AuthContext";
import camsLogo from "../../assets/cams-logo.png";

const MAIN_NAV = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Recruiting", href: "/dashboard/recruiting", icon: Briefcase },
  { label: "Contacts", href: "/dashboard/contacts", icon: Users },
  { label: "Pipeline", href: "/dashboard/pipeline", icon: GitBranch },
  { label: "Portfolio", href: "/dashboard/portfolio", icon: TrendingUp },
];

interface NavItemConfig {
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const COMMUNITY_NAV: NavItemConfig[] = [
  { label: "Connect", href: "/dashboard/connect", icon: Handshake },
  { label: "Scoreboard", href: "/dashboard/scoreboard", icon: Trophy },
  { label: "Jobs", href: "/dashboard/jobs", icon: BriefcaseBusiness },
  { label: "Resources", href: "/dashboard/resources", icon: BookOpen },
  { label: "Events", href: "/dashboard/events", icon: Calendar },
  {
    label: "Claude Certified Architect",
    href: "/dashboard/claude-certified-architect",
    icon: Award,
    badge: "CAMS Exclusive",
  },
];

const EXEC_NAV = [
  { label: "Exec Tools", href: "/dashboard/exec", icon: Wrench },
  { label: "New post", href: "/dashboard/exec/new-post", icon: PenLine },
  { label: "Attendance", href: "/dashboard/exec/attendance", icon: ClipboardList },
  { label: "Member Reports", href: "/dashboard/exec/member-report", icon: BarChart2 },
];

interface DashboardShellProps {
  children: ReactNode;
}

export function DashboardShell({ children }: DashboardShellProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, isExec, logout } = useAuth();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const renderNavItem = ({ label, href, icon: Icon, badge }: NavItemConfig) => {
    const isActive =
      href === "/dashboard"
        ? location.pathname === "/dashboard" || location.pathname === "/dashboard/"
        : location.pathname === href;
    return (
      <Link
        key={href}
        to={href}
        className={cn(
          "flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors",
          isActive
            ? "bg-primary text-primary-foreground font-medium"
            : "text-muted-foreground hover:text-foreground hover:bg-muted"
        )}
      >
        <Icon className="h-4 w-4 flex-shrink-0" />
        <div className="flex min-w-0 flex-1 flex-col items-start gap-0.5">
          <span className="truncate">{label}</span>
          {badge && (
            <span className="text-[9px] font-semibold uppercase tracking-wider text-white bg-crimson rounded-full px-1.5 py-0.5 leading-none">
              {badge}
            </span>
          )}
        </div>
        {isActive && <ChevronRight className="ml-auto h-3 w-3 flex-shrink-0" />}
      </Link>
    );
  };

  const initials = currentUser
    ? `${currentUser.firstName[0]}${currentUser.lastName[0]}`
    : "DK";
  const classBadge = currentUser?.graduationYear
    ? `${String(currentUser.graduationYear).slice(-2)}'`
    : "XX'";

  return (
    <div className="flex h-screen bg-background overflow-hidden">
      {/* Sidebar */}
      <aside className="w-60 flex-shrink-0 border-r bg-card flex flex-col">
        <Link to="/" className="px-4 py-5 flex items-center gap-2 hover:bg-muted/40 transition-colors">
          <img src={camsLogo} alt="CAMS logo" className="h-9 w-9 rounded-md object-cover" />
          <span className="font-semibold text-sm">CAMS</span>
          <span className="text-xs text-muted-foreground">{classBadge}</span>
        </Link>

        <Separator />

        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-4">
          {/* Main nav */}
          <div className="space-y-0.5">
            {MAIN_NAV.map(renderNavItem)}
          </div>

          <Separator />

          {/* Community nav */}
          <div>
            <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Community
            </p>
            <div className="space-y-0.5">
              {COMMUNITY_NAV.map(renderNavItem)}
            </div>
          </div>

          {/* Exec nav — only shown to exec users */}
          {isExec && (
            <>
              <Separator />
              <div>
                <p className="px-3 mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                  <Lock className="h-3 w-3" /> Exec
                </p>
                <div className="space-y-0.5">
                  {EXEC_NAV.map(renderNavItem)}
                </div>
              </div>
            </>
          )}
        </nav>

        <Separator />

        <div className="p-2 pb-3 flex flex-col gap-2 bg-card/30">
          <Link
            to="/dashboard/profile"
            className={cn(
              "group flex min-w-0 items-center gap-2 rounded-md px-2 py-1.5",
              "text-left transition-colors hover:bg-muted/80",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
            )}
            aria-label={
              currentUser
                ? `Edit profile: ${currentUser.firstName} ${currentUser.lastName}`
                : "Edit profile"
            }
          >
            <Avatar className="h-8 w-8 ring-offset-background group-hover:ring-2 group-hover:ring-muted">
              <AvatarFallback className="text-xs">{initials}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate leading-tight">
                {currentUser ? `${currentUser.firstName} ${currentUser.lastName}` : "Demo User"}
              </p>
              <p className="text-xs text-muted-foreground truncate leading-tight">
                {currentUser?.email ?? "user@school.edu"}
              </p>
            </div>
            <span className="hidden min-w-0 max-w-[5.5rem] text-right text-[10px] font-medium text-muted-foreground group-hover:text-crimson sm:inline">
              Edit profile
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-muted-foreground transition-colors group-hover:text-crimson"
              aria-hidden
            />
          </Link>
          <div className="flex items-center justify-end gap-1 px-1">
            <ThemeToggle />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={handleLogout}
              aria-label="Log out"
            >
              <LogOut className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
