import * as React from "react";
import { useNavigate } from "react-router-dom";
import { Mail, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";

export default function Verify() {
  const navigate = useNavigate();
  const [verified, setVerified] = React.useState(false);

  const handleVerify = () => {
    setVerified(true);
    setTimeout(() => navigate("/dashboard"), 1500);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            {verified ? (
              <CheckCircle className="h-7 w-7 text-[#c63f60]" />
            ) : (
              <Mail className="h-7 w-7 text-primary" />
            )}
          </div>
          <CardTitle>{verified ? "Email Verified!" : "Check your email"}</CardTitle>
          <CardDescription>
            {verified
              ? "Redirecting you to the dashboard..."
              : "We sent a verification link to your email address. Click the link to activate your account."}
          </CardDescription>
        </CardHeader>
        {!verified && (
          <CardContent className="space-y-3">
            <Button className="w-full" onClick={handleVerify}>
              Verify (Demo — Click to Continue)
            </Button>
            <Button variant="ghost" size="sm" className="w-full text-muted-foreground">
              Resend verification email
            </Button>
          </CardContent>
        )}
      </Card>
    </div>
  );
}
