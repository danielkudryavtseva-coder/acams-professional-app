import { useNavigate } from "react-router-dom";
import { Clock3, CircleX } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { useAuth } from "../context/AuthContext";

export default function AccountStatusPage() {
  const navigate = useNavigate();
  const { currentUser, logout } = useAuth();
  const rejected = currentUser?.approvalStatus === "rejected";

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm text-center">
        <CardHeader>
          <div className="mx-auto h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
            {rejected ? (
              <CircleX className="h-7 w-7 text-destructive" />
            ) : (
              <Clock3 className="h-7 w-7 text-primary" />
            )}
          </div>
          <CardTitle>{rejected ? "Account not approved" : "Awaiting exec approval"}</CardTitle>
          <CardDescription>
            {rejected
              ? "An exec board member has declined this account. If you think this is a mistake, reach out to the exec board directly."
              : "Your email is confirmed — an exec board member still needs to approve your account before you can access the dashboard. Check back soon."}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button className="w-full" variant="outline" onClick={handleLogout}>
            Log out
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
