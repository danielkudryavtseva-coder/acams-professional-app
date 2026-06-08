import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { DashboardShell } from "./components/DashboardShell";
import { PublicShell } from "./components/PublicShell";
import { RequireAuth } from "./components/RequireAuth";
import { RequireExec } from "./components/RequireExec";

// Existing pages
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Verify from "./pages/Verify";
import DashboardHome from "./pages/DashboardHome";
import RecruitingPage from "./pages/RecruitingPage";
import ContactsPage from "./pages/ContactsPage";
import Pipeline from "./pages/Pipeline";
import Portfolio from "./pages/Portfolio";
import Profile from "./pages/Profile";
import ComingSoon from "./pages/ComingSoon";
import ApplyPage from "./pages/ApplyPage";

// New pages — RosterPage and NewsPage are public-only
import RosterPage from "./pages/RosterPage";
import ConnectPage from "./pages/ConnectPage";
import JobsPage from "./pages/JobsPage";
import ResourcesPage from "./pages/ResourcesPage";
import NewsPage from "./pages/NewsPage";
import NewsPostPage from "./pages/NewsPostPage";
import EventsPage from "./pages/EventsPage";
import ClaudeCertifiedArchitectPage from "./pages/ClaudeCertifiedArchitectPage";
import ExecToolsPage from "./pages/ExecToolsPage";
import ExecNewPostPage from "./pages/ExecNewPostPage";
import AttendancePage from "./pages/AttendancePage";
import MemberReportPage from "./pages/MemberReportPage";
import ScoreboardPage from "./pages/ScoreboardPage";
import MemberProfilePage from "./pages/MemberProfilePage";

function DashboardLayout() {
  return (
    <DashboardShell>
      <Outlet />
    </DashboardShell>
  );
}

function PublicLayout() {
  return (
    <PublicShell>
      <Outlet />
    </PublicShell>
  );
}

export function AppRoutes() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/verify" element={<Verify />} />

      {/* Public showcase routes — Landing / Portfolio / News / Roster visible to anyone */}
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Landing />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/news" element={<NewsPage />} />
        <Route path="/news/:postId" element={<NewsPostPage />} />
        <Route path="/roster" element={<RosterPage />} />
        <Route path="/apply" element={<ApplyPage />} />
      </Route>

      {/* Protected dashboard routes */}
      <Route element={<RequireAuth />}>
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="recruiting" element={<RecruitingPage />} />
          <Route path="contacts" element={<ContactsPage />} />
          <Route path="pipeline" element={<Pipeline />} />
          <Route path="portfolio" element={<Portfolio />} />
          <Route path="profile" element={<Profile />} />
          <Route path="connect" element={<ConnectPage />} />
          <Route path="jobs" element={<JobsPage />} />
          <Route path="resources" element={<ResourcesPage />} />
          <Route path="events" element={<EventsPage />} />
          <Route path="claude-certified-architect" element={<ClaudeCertifiedArchitectPage />} />
          <Route path="scoreboard" element={<ScoreboardPage />} />
          <Route path="members/:memberId" element={<MemberProfilePage />} />
          <Route path="coming-soon" element={<ComingSoon />} />

          {/* Exec Tools: password gate on page; not globally RequireExec */}
          <Route path="exec" element={<ExecToolsPage />} />

          {/* Exec-only routes */}
          <Route element={<RequireExec />}>
            <Route path="exec/new-post" element={<ExecNewPostPage />} />
            <Route path="exec/attendance" element={<AttendancePage />} />
            <Route path="exec/member-report" element={<MemberReportPage />} />
          </Route>
        </Route>
      </Route>

      {/* Legacy flat URL redirects */}
      <Route path="/recruiting" element={<Navigate to="/dashboard/recruiting" replace />} />
      <Route path="/contacts" element={<Navigate to="/dashboard/contacts" replace />} />
      <Route path="/pipeline" element={<Navigate to="/dashboard/pipeline" replace />} />
      <Route path="/profile" element={<Navigate to="/dashboard/profile" replace />} />
      <Route path="/coming-soon" element={<Navigate to="/dashboard/coming-soon" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
