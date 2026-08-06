import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import camsLogo from "../../assets/cams-logo.png";

const STATS = [
  { label: "Active Members", value: "30+" },
  { label: "Committees", value: "4" },
  { label: "Alumni Placed", value: "50+" },
  { label: "Partner Firms", value: "20+" },
];

const PILLARS = [
  {
    title: "Investment Management",
    body: "Members manage a real-money portfolio, conducting equity research and presenting investment pitches to the full committee each semester.",
  },
  {
    title: "Recruiting Support",
    body: "We host firm info sessions, mock interviews, and resume workshops — and provide direct introductions to CAMS alumni at top institutions.",
  },
  {
    title: "Professional Development",
    body: "Weekly meetings, guest speakers from Wall Street, and case competitions build the technical and soft skills firms actually look for.",
  },
  {
    title: "Alumni Network",
    body: "Our alumni are placed at Goldman Sachs, BlackRock, J.P. Morgan, KKR, and beyond. Active mentorship connects current members with those paths.",
  },
];

export default function About() {
  return (
    <div className="flex flex-col">
      {/* Hero */}
      <section className="bg-gradient-to-br from-[#7d2c45] to-[#c63f60] text-white py-24 px-6 text-center">
        <img
          src={camsLogo}
          alt="CAMS"
          className="mx-auto h-16 w-16 rounded-xl object-cover shadow-lg mb-5"
        />
        <h1 className="text-4xl font-bold tracking-tight">
          Capstone Asset Management Society
        </h1>
        <p className="mt-3 text-lg text-white/80 max-w-xl mx-auto">
          University of Alabama's premier student-run investment and finance recruiting organization.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button size="lg" variant="secondary" asChild>
            <Link to="/apply">Apply to CAMS</Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="border-white text-white hover:bg-white/10"
            asChild
          >
            <Link to="/committees">Our Committees</Link>
          </Button>
        </div>
      </section>

      {/* Mission */}
      <section className="max-w-4xl mx-auto w-full py-16 px-6">
        <h2 className="text-2xl font-bold">Our Mission</h2>
        <p className="mt-4 text-lg text-muted-foreground leading-relaxed max-w-2xl">
          CAMS prepares University of Alabama students for careers in finance through hands-on
          investment management, structured recruiting mentorship, and a strong professional network.
          We believe the best way to learn finance is to do finance.
        </p>

        <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
          {STATS.map(({ label, value }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-[#c63f60]">{value}</div>
              <div className="text-sm text-muted-foreground mt-1">{label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* What we do */}
      <section className="bg-muted/30 py-16 px-6">
        <div className="max-w-4xl mx-auto w-full">
          <h2 className="text-2xl font-bold">What We Do</h2>
          <div className="mt-8 grid sm:grid-cols-2 gap-8">
            {PILLARS.map(({ title, body }) => (
              <div key={title}>
                <h3 className="font-semibold text-base">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Location + contact */}
      <section className="max-w-4xl mx-auto w-full py-16 px-6">
        <h2 className="text-2xl font-bold">Find Us</h2>
        <div className="mt-4 space-y-1 text-muted-foreground">
          <p>Culverhouse College of Business</p>
          <p>University of Alabama · Tuscaloosa, AL 35487</p>
          <p>
            <a
              href="mailto:contact@cams.ua.edu"
              className="text-[#c63f60] hover:underline"
            >
              contact@cams.ua.edu
            </a>
          </p>
        </div>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/apply">Apply Now</Link>
          </Button>
          <Button variant="outline" asChild>
            <Link to="/membership">Membership Info</Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
