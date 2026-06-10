import { useState, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Progress } from "../components/ui/progress";
import { Badge } from "../components/ui/badge";
import { useAuth, type RegisterPayload } from "../context/AuthContext";
import { INTEREST_QUIZ, FINANCE_TRACKS, COMMITTEES } from "../data/constants";
import type { FinanceTrack } from "../data/mockData";

// ALABAMACAMS{year} — year must be 1–4 years out from today.
// The code encodes the graduation year, which auto-determines class year.
function parseClassCode(code: string): { classYear: string; gradYear: number } | null {
  const match = code.trim().toUpperCase().match(/^ALABAMACAMS(\d{4})$/);
  if (!match) return null;
  const gradYear = parseInt(match[1]);
  const current = new Date().getFullYear();
  const yearsOut = gradYear - current;
  const classYearMap: Record<number, string> = {
    1: "Senior",
    2: "Junior",
    3: "Sophomore",
    4: "Freshman",
  };
  const classYear = classYearMap[yearsOut];
  if (!classYear) return null;
  return { classYear, gradYear };
}

const step1Schema = z.object({
  firstName: z.string().min(2, "First name required"),
  lastName: z.string().min(2, "Last name required"),
  email: z.string().email("Enter a valid email").refine(
    (v) => v.endsWith("@crimson.ua.edu"),
    { message: "Must be a @crimson.ua.edu email address" }
  ),
  phone: z.string().min(7, "Phone number required"),
  classCode: z.string().min(1, "Class code required").refine(
    (v) => parseClassCode(v) !== null,
    { message: "Incorrect class code. Contact an exec board member." }
  ),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((d) => d.password === d.confirmPassword, {
  message: "Passwords do not match",
  path: ["confirmPassword"],
});

const step2Schema = z.object({
  personalStatement: z.string().min(50, "Personal statement must be at least 50 characters"),
  committee: z.string().min(1, "Select a committee"),
});

type Step1Values = z.infer<typeof step1Schema>;
type Step2Values = z.infer<typeof step2Schema>;

const STEP_LABELS = ["Identity", "Profile", "Interest Quiz"];

export default function Register() {
  const navigate = useNavigate();
  const { register: registerUser } = useAuth();
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedInterests, setSelectedInterests] = useState<FinanceTrack[]>([]);
  const [interestError, setInterestError] = useState<string | null>(null);
  const [resumeFilename, setResumeFilename] = useState<string | null>(null);
  const [quizAnswers, setQuizAnswers] = useState<Record<string, string>>({});
  const [detectedClassYear, setDetectedClassYear] = useState<string>("");
  const accumulated = useRef<Partial<RegisterPayload>>({});

  const step1Form = useForm<Step1Values>({ resolver: zodResolver(step1Schema) });
  const step2Form = useForm<Step2Values>({ resolver: zodResolver(step2Schema) });

  const handleStep1 = (data: Step1Values) => {
    const parsed = parseClassCode(data.classCode)!;
    const { confirmPassword: _c, classCode: _k, ...rest } = data;
    accumulated.current = {
      ...accumulated.current,
      ...rest,
      classYear: parsed.classYear,
    };
    setDetectedClassYear(parsed.classYear);
    setStep(2);
  };

  const handleStep2 = (data: Step2Values) => {
    if (selectedInterests.length === 0) {
      setInterestError("Select at least one interest track");
      return;
    }
    setInterestError(null);
    accumulated.current = {
      ...accumulated.current,
      ...data,
      interests: selectedInterests,
      resumeFilename,
    };
    setStep(3);
  };

  const handleStep3 = async () => {
    const unanswered = INTEREST_QUIZ.filter(q => !quizAnswers[q.id]);
    if (unanswered.length > 0) {
      setServerError("Please answer all quiz questions");
      return;
    }
    setServerError(null);
    const payload: RegisterPayload = {
      ...(accumulated.current as RegisterPayload),
      quizAnswers,
    };
    const result = await registerUser(payload);
    if (result.success) {
      navigate("/verify");
    } else {
      setServerError(result.error ?? "Registration failed");
    }
  };

  const toggleInterest = (track: FinanceTrack) => {
    setSelectedInterests(prev =>
      prev.includes(track) ? prev.filter(t => t !== track) : [...prev, track]
    );
    setInterestError(null);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto h-10 w-10 rounded-lg bg-primary flex items-center justify-center mb-2">
            <span className="text-primary-foreground font-bold">C</span>
          </div>
          <CardTitle>Create your account</CardTitle>
          <CardDescription>Step {step} of 3 — {STEP_LABELS[step - 1]}</CardDescription>
          <Progress value={(step / 3) * 100} className="mt-3" />
        </CardHeader>
        <CardContent>

          {/* STEP 1 — Identity */}
          {step === 1 && (
            <form onSubmit={step1Form.handleSubmit(handleStep1)} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input id="firstName" placeholder="Jane" {...step1Form.register("firstName")} />
                  {step1Form.formState.errors.firstName && <p className="text-xs text-destructive">{step1Form.formState.errors.firstName.message}</p>}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input id="lastName" placeholder="Smith" {...step1Form.register("lastName")} />
                  {step1Form.formState.errors.lastName && <p className="text-xs text-destructive">{step1Form.formState.errors.lastName.message}</p>}
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Crimson Email</Label>
                <Input id="email" type="email" placeholder="you@crimson.ua.edu" {...step1Form.register("email")} />
                {step1Form.formState.errors.email && <p className="text-xs text-destructive">{step1Form.formState.errors.email.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="phone">Phone Number</Label>
                <Input id="phone" type="tel" placeholder="205-555-0000" {...step1Form.register("phone")} />
                {step1Form.formState.errors.phone && <p className="text-xs text-destructive">{step1Form.formState.errors.phone.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="classCode">Class Code</Label>
                <Input id="classCode" type="password" placeholder="Provided by exec board" {...step1Form.register("classCode")} />
                {step1Form.formState.errors.classCode
                  ? <p className="text-xs text-destructive">{step1Form.formState.errors.classCode.message}</p>
                  : <p className="text-xs text-muted-foreground">Your class code determines your graduation year automatically.</p>
                }
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" placeholder="Min. 8 characters" {...step1Form.register("password")} />
                {step1Form.formState.errors.password && <p className="text-xs text-destructive">{step1Form.formState.errors.password.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input id="confirmPassword" type="password" placeholder="Re-enter your password" {...step1Form.register("confirmPassword")} />
                {step1Form.formState.errors.confirmPassword && <p className="text-xs text-destructive">{step1Form.formState.errors.confirmPassword.message}</p>}
              </div>
              <Button type="submit" className="w-full">Next →</Button>
              <p className="mt-2 text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="text-primary hover:underline font-medium">Sign in</Link>
              </p>
            </form>
          )}

          {/* STEP 2 — Profile */}
          {step === 2 && (
            <form onSubmit={step2Form.handleSubmit(handleStep2)} className="space-y-4">
              <div className="flex items-center gap-2 rounded-md border bg-muted/50 px-3 py-2">
                <span className="text-xs text-muted-foreground">Class year detected:</span>
                <Badge variant="secondary">{detectedClassYear}</Badge>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="personalStatement">Personal Statement</Label>
                <Textarea
                  id="personalStatement"
                  placeholder="Tell us about your finance interests and goals..."
                  rows={4}
                  {...step2Form.register("personalStatement")}
                />
                {step2Form.formState.errors.personalStatement && <p className="text-xs text-destructive">{step2Form.formState.errors.personalStatement.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="resume">Resume (PDF)</Label>
                <Input
                  id="resume"
                  type="file"
                  accept=".pdf"
                  onChange={(e) => setResumeFilename(e.target.files?.[0]?.name ?? null)}
                />
                {resumeFilename && <p className="text-xs text-muted-foreground">Selected: {resumeFilename}</p>}
              </div>
              <div className="space-y-2">
                <Label>Finance Interests (select all that apply)</Label>
                <div className="flex flex-wrap gap-2">
                  {FINANCE_TRACKS.map(track => (
                    <button
                      key={track}
                      type="button"
                      onClick={() => toggleInterest(track)}
                      className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                        selectedInterests.includes(track)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-foreground border-border hover:border-primary"
                      }`}
                    >
                      {track}
                    </button>
                  ))}
                </div>
                {interestError && <p className="text-xs text-destructive">{interestError}</p>}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="committee">Committee Preference</Label>
                <select id="committee" {...step2Form.register("committee")} className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="">Select committee</option>
                  {COMMITTEES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                {step2Form.formState.errors.committee && <p className="text-xs text-destructive">{step2Form.formState.errors.committee.message}</p>}
              </div>
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>← Back</Button>
                <Button type="submit" className="flex-1">Next →</Button>
              </div>
            </form>
          )}

          {/* STEP 3 — Interest Quiz */}
          {step === 3 && (
            <div className="space-y-6">
              {INTEREST_QUIZ.map((q) => (
                <div key={q.id} className="space-y-2">
                  <p className="text-sm font-medium">{q.question}</p>
                  <div className="space-y-1.5">
                    {q.options.map((opt) => (
                      <label key={opt} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name={q.id}
                          value={opt}
                          checked={quizAnswers[q.id] === opt}
                          onChange={() => setQuizAnswers(prev => ({ ...prev, [q.id]: opt }))}
                          className="accent-primary"
                        />
                        <span className="text-sm">{opt}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {serverError && <p className="text-xs text-destructive text-center">{serverError}</p>}
              <div className="flex gap-2">
                <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(2)}>← Back</Button>
                <Button type="button" className="flex-1" onClick={handleStep3}>Create Account</Button>
              </div>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}
