import * as React from "react";
import { User, Mail, Phone, MapPin, Edit, Save } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import { Avatar, AvatarFallback } from "../components/ui/avatar";
import { Badge } from "../components/ui/badge";
import { useAuth } from "../context/AuthContext";
import { FINANCE_TRACKS } from "../data/constants";
import { MemberTagsCard } from "../components/MemberTagsCard";
import { MemberDecisionsCard } from "../components/MemberDecisionsCard";
import type { Member } from "../data/mockData";

interface ProfileData {
  name: string;
  email: string;
  phone: string;
  location: string;
  school: string;
  major: string;
  graduationYear: string;
  gpa: string;
  bio: string;
  linkedin: string;
  targetRoles: string[];
}

const DEFAULT_PROFILE: ProfileData = {
  name: "Demo User",
  email: "demo@university.edu",
  phone: "+1 (555) 000-0000",
  location: "New York, NY",
  school: "Target University",
  major: "Finance & Economics",
  graduationYear: "2027",
  gpa: "3.85",
  bio: "Junior at Target University studying Finance and Economics. Interested in investment banking, private equity, and asset management. Seeking summer analyst opportunities for 2026.",
  linkedin: "https://linkedin.com/in/demo-user",
  targetRoles: ["Investment Banking", "Private Equity", "Asset Management"],
};

function profileDataFromMember(user: Member): ProfileData {
  return {
    ...DEFAULT_PROFILE,
    name: `${user.firstName} ${user.lastName}`,
    email: user.email,
    phone: user.phone,
    linkedin: user.linkedin || DEFAULT_PROFILE.linkedin,
    school: "University of Alabama",
    graduationYear: String(user.graduationYear),
    bio: user.personalStatement || DEFAULT_PROFILE.bio,
    targetRoles: (user.interests?.length ? user.interests : DEFAULT_PROFILE.targetRoles) as string[],
    location: user.location || DEFAULT_PROFILE.location,
    major: user.major || DEFAULT_PROFILE.major,
    gpa: user.gpa || DEFAULT_PROFILE.gpa,
  };
}

export default function Profile() {
  const { currentUser, updateProfile } = useAuth();
  const [profile, setProfile] = React.useState<ProfileData>(() =>
    currentUser ? profileDataFromMember(currentUser) : DEFAULT_PROFILE,
  );
  const [isEditing, setIsEditing] = React.useState(false);
  const [draft, setDraft] = React.useState<ProfileData>(() =>
    currentUser ? profileDataFromMember(currentUser) : DEFAULT_PROFILE,
  );

  React.useEffect(() => {
    if (!currentUser || isEditing) return;
    const next = profileDataFromMember(currentUser);
    setProfile(next);
    setDraft(next);
  }, [currentUser, isEditing]);

  const handleSave = () => {
    setProfile(draft);
    if (currentUser) {
      const [firstName, ...rest] = draft.name.split(" ");
      updateProfile({
        firstName,
        lastName: rest.join(" ") || "",
        phone: draft.phone,
        linkedin: draft.linkedin,
        personalStatement: draft.bio,
        interests: draft.targetRoles as never,
        location: draft.location,
        major: draft.major,
        gpa: draft.gpa,
      });
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setDraft(profile);
    setIsEditing(false);
  };

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="font-display text-2xl font-semibold text-crimson tracking-tight">Profile</h1>
        {!isEditing ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setDraft(profile);
              setIsEditing(true);
            }}
          >
            <Edit className="h-4 w-4 mr-1.5" />
            Edit Profile
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancel}>Cancel</Button>
            <Button size="sm" onClick={handleSave}>
              <Save className="h-4 w-4 mr-1.5" />
              Save
            </Button>
          </div>
        )}
      </div>

      <Card className="bg-white">
        <CardContent className="pt-6">
          <div className="flex items-start gap-6">
            <Avatar className="h-20 w-20 flex-shrink-0">
              <AvatarFallback className="text-2xl">
                {profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 space-y-1">
              {isEditing ? (
                <Input
                  value={draft.name}
                  onChange={(e) => setDraft({ ...draft, name: e.target.value })}
                  className="text-xl font-bold h-auto py-1"
                />
              ) : (
                <h2 className="font-display text-xl font-semibold">{profile.name}</h2>
              )}
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.targetRoles.map((role) => (
                  <Badge key={role} variant="secondary">{role}</Badge>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="bg-white">
          <CardHeader><CardTitle className="font-display text-base">Personal Info</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {([
              { icon: Mail, label: "Email", key: "email" as const },
              { icon: Phone, label: "Phone", key: "phone" as const },
              { icon: MapPin, label: "Location", key: "location" as const },
              { icon: User, label: "LinkedIn", key: "linkedin" as const },
            ]).map(({ icon: Icon, label, key }) => (
              <div key={key} className="flex items-start gap-3">
                <Icon className="h-4 w-4 text-muted-foreground mt-1 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  {isEditing ? (
                    <Input
                      value={draft[key]}
                      onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                      className="mt-0.5 h-8 text-sm"
                    />
                  ) : (
                    <p className="text-sm truncate">{profile[key]}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="bg-white">
          <CardHeader><CardTitle className="font-display text-base">Education</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {([
              { label: "School", key: "school" as const },
              { label: "Major", key: "major" as const },
              { label: "Expected Graduation", key: "graduationYear" as const },
              { label: "GPA", key: "gpa" as const },
            ]).map(({ label, key }) => (
              <div key={key}>
                <p className="text-xs text-muted-foreground">{label}</p>
                {isEditing ? (
                  <Input
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                    className="mt-0.5 h-8 text-sm"
                  />
                ) : (
                  <p className="text-sm font-medium mt-0.5">{profile[key]}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white">
        <CardHeader><CardTitle className="font-display text-base">Bio</CardTitle></CardHeader>
        <CardContent>
          {isEditing ? (
            <Textarea
              value={draft.bio}
              onChange={(e) => setDraft({ ...draft, bio: e.target.value })}
              rows={4}
            />
          ) : (
            <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
          )}
        </CardContent>
      </Card>

      {currentUser && <MemberTagsCard memberId={currentUser.id} editable />}

      {currentUser && <MemberDecisionsCard memberId={currentUser.id} />}

      <Card className="bg-white">
        <CardHeader><CardTitle className="font-display text-base">CAMS Info</CardTitle></CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Committee:</span> {currentUser?.committee}</p>
          <p><span className="text-muted-foreground">Class Year:</span> {currentUser?.classYear}</p>
          <p><span className="text-muted-foreground">Cohort:</span> {currentUser?.cohort}</p>
          <Badge>{currentUser?.role}</Badge>
        </CardContent>
      </Card>

      <Card className="bg-white">
        <CardHeader><CardTitle className="font-display text-base">Finance Interests</CardTitle></CardHeader>
        <CardContent className="flex flex-wrap gap-2">
          {FINANCE_TRACKS.map((track) => (
            <button
              key={track}
              type="button"
              onClick={() =>
                setDraft((prev) => ({
                  ...prev,
                  targetRoles: prev.targetRoles.includes(track)
                    ? prev.targetRoles.filter((t) => t !== track)
                    : [...prev.targetRoles, track],
                }))
              }
              className={`px-3 py-1 rounded-full text-xs border ${draft.targetRoles.includes(track) ? "bg-primary text-primary-foreground" : "bg-white"}`}
            >
              {track}
            </button>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
