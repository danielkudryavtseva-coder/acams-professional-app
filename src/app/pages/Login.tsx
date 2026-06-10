import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { useAuth } from "../context/AuthContext";
import camsLogo from "../../assets/cams-logo.png";

const loginSchema = z.object({
  email: z.string().email("Enter a valid email").refine(
    (v) => v.endsWith("@crimson.ua.edu"),
    { message: "Must be a @crimson.ua.edu email address" }
  ),
  password: z.string().min(1, "Password is required"),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [serverError, setServerError] = useState<string | null>(null);

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormValues) => {
    setServerError(null);
    const result = await login(data.email, data.password);
    if (result.success) {
      navigate("/dashboard");
    } else {
      setServerError(result.error ?? "Login failed");
    }
  };

  const handleGuestLogin = async () => {
    await login("dkwhitfield@crimson.ua.edu", "cams2026");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src={camsLogo} alt="CAMS logo" className="mx-auto h-10 w-10 rounded-lg object-cover mb-2" />
          <CardTitle>Welcome back</CardTitle>
          <CardDescription>Sign in to your CAMS account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Crimson Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@crimson.ua.edu"
                {...register("email")}
              />
              {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="Your password"
                {...register("password")}
              />
              {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
            </div>
            {serverError && (
              <p className="text-xs text-destructive text-center">{serverError}</p>
            )}
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? "Signing in..." : "Sign In"}
            </Button>
          </form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </div>
          <div className="mt-2 text-center">
            <Button
              variant="link"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={handleGuestLogin}
            >
              Continue as guest (demo exec account)
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
