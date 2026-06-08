import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { ExecNewsPostForm } from "../components/ExecNewsPostForm";

export default function ExecNewPostPage() {
  const navigate = useNavigate();
  return (
    <div className="mx-auto w-full max-w-4xl min-w-0 p-6 space-y-6">
      <div className="sticky top-0 z-10 -mx-6 -mt-6 mb-2 border-b bg-background/95 px-6 py-4 backdrop-blur supports-[backdrop-filter]:bg-background/90">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-3">
            <Button variant="outline" size="icon" className="shrink-0" asChild>
              <Link to="/dashboard/exec" aria-label="Back to Exec Tools">
                <ArrowLeft className="h-4 w-4" />
              </Link>
            </Button>
            <div>
              <h1 className="font-display text-2xl font-semibold tracking-tight">Publish update</h1>
              <p className="text-sm text-muted-foreground mt-1">
                Posts appear on <span className="text-crimson font-medium">/news</span> and the home page.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Card className="w-full max-w-full min-w-0 bg-paper border-border">
        <CardHeader>
          <CardTitle className="font-display text-lg">New society post</CardTitle>
          <CardDescription>Title and body are required.</CardDescription>
        </CardHeader>
        <CardContent>
          <ExecNewsPostForm
            idPrefix="page-new-post"
            onPublished={() => navigate("/dashboard/exec")}
            onCancel={() => navigate("/dashboard/exec")}
            cancelLabel="Back to Exec Tools"
          />
        </CardContent>
      </Card>
    </div>
  );
}
