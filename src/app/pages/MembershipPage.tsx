import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import { Image } from "lucide-react";
import { PlacementsMap } from "../components/PlacementsMap";
import { APPLY_URL } from "../components/PublicShell";

const STATS = [
  { label: "Active Members", value: "30+" },
  { label: "Committees", value: "4" },
  { label: "Alumni Placed", value: "50+" },
  { label: "Partner Firms", value: "20+" },
];

const BENEFITS = [
  {
    title: "Real Portfolio Management",
    body: "Investment committee members manage a real-money portfolio and present pitches that go live.",
  },
  {
    title: "Direct Firm Access",
    body: "Exclusive info sessions with Goldman Sachs, J.P. Morgan, BlackRock, and more — reserved for CAMS members.",
  },
  {
    title: "Alumni Mentorship",
    body: "1-on-1 coffee chats and referrals from CAMS alumni now working at top banks, funds, and PE firms.",
  },
  {
    title: "Recruiting Tools",
    body: "Our member portal tracks deadlines, provides application templates, and gives you an edge during recruiting season.",
  },
  {
    title: "Professional Network",
    body: "Build real relationships with peers who are heading to the same firms, same programs, and same cities.",
  },
  {
    title: "Resume Signal",
    body: "CAMS membership — especially Investment or Recruiting committee — is recognized by finance recruiters at UA-target firms.",
  },
];

const TIMELINE = [
  { step: "01", label: "Applications Open", detail: "Each semester, applications open to all Culverhouse students." },
  { step: "02", label: "Interview Round", detail: "Competitive interview covering finance knowledge and fit." },
  { step: "03", label: "Committee Placement", detail: "New members are placed on a committee based on interest and fit." },
  { step: "04", label: "Semester Kickoff", detail: "Onboarding, committee assignments, and semester goals are set." },
];

// ─── GROUP PHOTOS ────────────────────────────────────────────────────────────
// To add real photos: replace the placeholder array below with objects like:
//   { src: "/photos/spring2026.jpg", caption: "Spring 2026 Class" }
// Place photo files in /public/photos/ and reference them as "/photos/filename.jpg"
const GROUP_PHOTOS: { src: string; caption: string }[] = [];
// ─────────────────────────────────────────────────────────────────────────────

function PhotoPlaceholder({ caption }: { caption: string }) {
  return (
    <div className="aspect-[4/3] rounded-xl border-2 border-dashed border-border bg-muted/40 flex flex-col items-center justify-center gap-2 text-muted-foreground">
      <Image className="h-8 w-8 opacity-40" />
      <span className="text-xs">{caption}</span>
    </div>
  );
}

export default function MembershipPage() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#7d2c45] to-[#c63f60] text-white py-10 px-6 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Life as a CAMS Member</h1>
        <p className="mt-2 text-base text-white/80 max-w-xl mx-auto">
          What membership actually looks like — week to week, semester to semester.
        </p>
      </section>

      {/* Stats — kept compact so the map shows up front */}
      <section className="max-w-5xl mx-auto w-full pt-6 pb-2 px-6">
        <div className="flex flex-wrap gap-x-8 gap-y-2 border-b border-border pb-4">
          {STATS.map(({ label, value }) => (
            <div key={label} className="flex items-baseline gap-1.5">
              <span className="text-xl font-bold text-[#c63f60]">{value}</span>
              <span className="text-xs text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Placements map */}
      <section className="max-w-5xl mx-auto w-full pt-6 pb-16 px-6">
        <h2 className="text-2xl font-bold">Where Our Alumni Landed</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Placements pulled from the CAMS alumni rolodex.
        </p>
        <div className="mt-6">
          <PlacementsMap />
        </div>
      </section>

      {/* What membership looks like */}
      <section className="max-w-4xl mx-auto w-full py-16 px-6">
        <h2 className="text-2xl font-bold">What You'll Do</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-2xl">
          CAMS meets weekly during the semester. Attendance is expected — this is a professional
          organization, not a club. Outside of meetings, members do committee work, attend firm
          events, and use recruiting season to land internships and full-time offers.
        </p>

        <div className="mt-10 grid sm:grid-cols-2 gap-6">
          {BENEFITS.map(({ title, body }) => (
            <Card key={title} className="bg-card">
              <CardContent className="p-5">
                <p className="font-semibold text-sm">{title}</p>
                <p className="mt-1 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Group photos */}
      <section className="bg-muted/30 py-16 px-6">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold">Gallery</h2>
          <p className="mt-2 text-sm text-muted-foreground">Group outings, firm visits, and events.</p>

          {GROUP_PHOTOS.length > 0 ? (
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {GROUP_PHOTOS.map(({ src, caption }) => (
                <div key={src} className="space-y-1.5">
                  <img
                    src={src}
                    alt={caption}
                    className="w-full aspect-[4/3] object-cover rounded-xl border"
                  />
                  <p className="text-xs text-muted-foreground text-center">{caption}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <PhotoPlaceholder caption="Group photo coming soon" />
              <PhotoPlaceholder caption="Group photo coming soon" />
              <PhotoPlaceholder caption="Group photo coming soon" />
            </div>
          )}
        </div>
      </section>

      {/* Application timeline */}
      <section className="max-w-4xl mx-auto w-full py-16 px-6">
        <h2 className="text-2xl font-bold">How to Join</h2>
        <div className="mt-8 space-y-6">
          {TIMELINE.map(({ step, label, detail }) => (
            <div key={step} className="flex gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#c63f60] text-white text-sm font-bold">
                {step}
              </div>
              <div className="pt-1.5">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-sm text-muted-foreground">{detail}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-wrap gap-3">
          <Button asChild>
            <a href={APPLY_URL} target="_blank" rel="noopener noreferrer">
              Start Your Application
            </a>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/committees">View Committees</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
