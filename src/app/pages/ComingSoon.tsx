import { useNavigate } from "react-router-dom";
import { Clock, ArrowLeft } from "lucide-react";
import { Button } from "../components/ui/button";

interface ComingSoonProps {
  feature?: string;
}

export default function ComingSoon({ feature = "This feature" }: ComingSoonProps) {
  const navigate = useNavigate();

  return (
    <div className="flex-1 flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <div className="mx-auto h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-6">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-2xl font-bold mb-2">Coming Soon</h2>
        <p className="text-muted-foreground mb-6">
          {feature} is currently in development. Check back soon!
        </p>
        <Button variant="outline" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />
          Go Back
        </Button>
      </div>
    </div>
  );
}
