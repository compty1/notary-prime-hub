import { usePageMeta } from "@/hooks/usePageMeta";
import { useSettings } from "@/hooks/useSettings";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench, Clock } from "lucide-react";
import { Logo } from "@/components/Logo";

/** GB-0756: Surface admin-configurable ETA banner (platform_settings.maintenance_eta). */
export default function Maintenance() {
  usePageMeta({ title: "Maintenance", noIndex: true });
  const { get } = useSettings(["maintenance_eta", "maintenance_message"]);
  const eta = get("maintenance_eta");
  const message = get(
    "maintenance_message",
    "We're performing scheduled maintenance. We'll be back shortly. Thank you for your patience."
  );

  return (
    <main aria-label="Maintenance" className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <Logo size="lg" />
          <Wrench className="mt-6 h-12 w-12 text-primary" aria-hidden="true" />
          <h1 className="mt-4 font-sans text-2xl font-bold text-foreground">Under Maintenance</h1>
          <p className="mt-2 text-sm text-muted-foreground">{message}</p>
          {eta && (
            <div
              role="status"
              className="mt-6 inline-flex items-center gap-2 rounded-[12px] border-2 border-foreground bg-primary/10 px-4 py-2 text-sm font-bold text-foreground shadow-[3px_3px_0_0_hsl(var(--foreground))]"
            >
              <Clock className="h-4 w-4" aria-hidden="true" />
              <span>Estimated back online: {eta}</span>
            </div>
          )}
        </CardContent>
      </Card>
    </main>
  );
}
