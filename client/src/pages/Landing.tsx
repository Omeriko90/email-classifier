import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, Tags, Zap, Sparkles } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8">
        <div className="flex flex-col items-center text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
            <Mail className="w-8 h-8 text-primary" />
          </div>

          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight">
              Email Manager
            </h1>
            <p className="text-muted-foreground">
              Organize your inbox with AI-powered classification and automated workflows
            </p>
          </div>

          <div className="w-full space-y-3 pt-4">
            <div className="flex items-start gap-3 text-sm">
              <Tags className="w-5 h-5 text-chart-2 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Custom Labels</div>
                <div className="text-muted-foreground text-xs">
                  Create and organize emails with custom labels
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Sparkles className="w-5 h-5 text-chart-4 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">AI Classification</div>
                <div className="text-muted-foreground text-xs">
                  Automatically categorize emails with AI
                </div>
              </div>
            </div>

            <div className="flex items-start gap-3 text-sm">
              <Zap className="w-5 h-5 text-chart-3 mt-0.5 flex-shrink-0" />
              <div className="text-left">
                <div className="font-medium">Automated Workflows</div>
                <div className="text-muted-foreground text-xs">
                  Generate summaries with custom schedules
                </div>
              </div>
            </div>
          </div>

          <div className="w-full pt-6">
            <Button
              className="w-full"
              size="lg"
              onClick={() => window.location.href = "/api/login"}
              data-testid="button-login"
            >
              Get Started
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
