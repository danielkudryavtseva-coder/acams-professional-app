import * as React from "react";
import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { supabase, supabaseConfigured } from "../lib/supabaseClient";

export default function Verify() {
  const [resent, setResent] = React.useState(false);
  const [email, setEmail] = React.useState("");

  const handleResend = async () => {
    if (!supabaseConfigured || !email) return;
    await supabase.auth.resend({ type: "signup", email });
    setResent(true);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            <Mail className="h-7 w-7 text-primary" />
          </div>
          <CardTitle>Check your email</CardTitle>
          <CardDescription>
            We sent a confirmation link to your Crimson email address. Click
            it to activate your account, then come back and log in.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@crimson.ua.edu"
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          />
          <Button className="w-full" variant="outline" onClick={handleResend} disabled={!email}>
            {resent ? "Email resent" : "Resend confirmation email"}
          </Button>
          <Link to="/login" className="block text-sm font-medium text-primary hover:underline">
            Go to login
          </Link>
        </CardContent>
      </Card>
    </div>
  );
}
