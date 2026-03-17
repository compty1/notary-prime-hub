import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Shield, Monitor, ArrowLeft, CheckCircle, AlertCircle } from "lucide-react";

export default function BlueNotarySession() {
  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border/50 bg-background px-4 py-3">
        <div className="flex items-center justify-between">
          <Link to="/portal" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Portal
          </Link>
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-accent" />
            <span className="text-sm font-medium">Secure RON Session</span>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-4xl px-4 py-8">
        {/* Pre-notarization checklist */}
        <Card className="mb-6 border-border/50">
          <CardContent className="p-6">
            <h2 className="mb-4 font-display text-xl font-semibold">Before Your Session</h2>
            <div className="space-y-3">
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium">Government-Issued Photo ID Ready</p>
                  <p className="text-sm text-muted-foreground">Driver's license, passport, or state ID</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="mt-0.5 h-5 w-5 text-emerald-500" />
                <div>
                  <p className="font-medium">Stable Internet Connection</p>
                  <p className="text-sm text-muted-foreground">Camera and microphone access required</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <AlertCircle className="mt-0.5 h-5 w-5 text-amber-500" />
                <div>
                  <p className="font-medium">Knowledge-Based Authentication (KBA)</p>
                  <p className="text-sm text-muted-foreground">You'll be asked identity verification questions before the session</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BlueNotary Iframe Placeholder */}
        <Card className="border-2 border-dashed border-accent/30">
          <CardContent className="flex flex-col items-center justify-center py-20 text-center">
            <Monitor className="mb-4 h-16 w-16 text-accent/50" />
            <h3 className="mb-2 font-display text-xl font-semibold text-foreground">BlueNotary Session</h3>
            <p className="mb-6 max-w-md text-sm text-muted-foreground">
              This is where the BlueNotary remote online notarization platform will be embedded. 
              Replace this placeholder with your BlueNotary iframe URL.
            </p>
            <code className="rounded bg-muted px-4 py-2 text-xs text-muted-foreground">
              {'<iframe src="https://app.bluenotary.us/your-session-url" />'}
            </code>
            <p className="mt-4 text-xs text-muted-foreground">
              Ohio RON Compliant • ORC §147.65-.66 • End-to-End Encrypted
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
