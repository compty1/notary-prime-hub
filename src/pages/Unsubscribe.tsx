import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, AlertCircle, Loader2, Mail } from "lucide-react";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function Unsubscribe() {
  usePageMeta({ title: "Unsubscribe", description: "Manage your email preferences and unsubscribe from Notar communications.", noIndex: true });
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error" | "no-token">("loading");

  useEffect(() => {
    if (!token) { setStatus("no-token"); return; }
    const process = async () => {
      // Bug 493: Resolve actual email from token before inserting suppression
      const { data: tokenData, error: tokenError } = await supabase
        .from("email_unsubscribe_tokens")
        .select("email")
        .eq("token", token)
        .maybeSingle();

      if (tokenError || !tokenData?.email) {
        setStatus("error");
        return;
      }

      const { error } = await supabase.from("suppressed_emails").insert({
        email: tokenData.email,
        reason: `unsubscribe_token:${token}`,
      });

      // Mark token as used
      await supabase
        .from("email_unsubscribe_tokens")
        .update({ used_at: new Date().toISOString() })
        .eq("token", token);

      setStatus(error ? "error" : "success");
    };
    process();
  }, [token]);

  return (
    <PageShell>
      <div className="flex min-h-[60vh] items-center justify-center px-4">
        <Breadcrumbs />
        <Card className="w-full max-w-md border-border/50">
          <CardContent className="flex flex-col items-center py-12 text-center">
            {status === "loading" && <Loader2 className="h-12 w-12 animate-spin text-muted-foreground mb-4" />}
            {status === "success" && (
              <>
                <CheckCircle className="h-12 w-12 text-primary mb-4" />
                <h2 className="font-sans text-xl font-bold mb-2">Unsubscribed</h2>
                <p className="text-sm text-muted-foreground">You have been successfully unsubscribed from our emails.</p>
              </>
            )}
            {status === "error" && (
              <>
                <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                <h2 className="font-sans text-xl font-bold mb-2">Something went wrong</h2>
                <p className="text-sm text-muted-foreground">This link may be invalid or expired. Please contact us to be removed from our mailing list.</p>
              </>
            )}
            {status === "no-token" && (
              <>
                <Mail className="h-12 w-12 text-muted-foreground mb-4" />
                <h2 className="font-sans text-xl font-bold mb-2">Invalid Link</h2>
                <p className="text-sm text-muted-foreground">This unsubscribe link is invalid or has expired.</p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </PageShell>
  );
}
