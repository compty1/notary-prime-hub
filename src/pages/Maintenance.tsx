import { usePageTitle } from "@/lib/usePageTitle";
import { Card, CardContent } from "@/components/ui/card";
import { Wrench } from "lucide-react";
import { Logo } from "@/components/Logo";

export default function Maintenance() {
  usePageTitle("Maintenance");
  return (
    <main aria-label="Maintenance" className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-md border-border/50">
        <CardContent className="flex flex-col items-center py-16 text-center">
          <Logo size="lg" />
          <Wrench className="mt-6 h-12 w-12 text-primary" />
          <h1 className="mt-4 font-sans text-2xl font-bold text-foreground">Under Maintenance</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            We're performing scheduled maintenance. We'll be back shortly. Thank you for your patience.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
