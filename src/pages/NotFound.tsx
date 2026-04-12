import { useLocation, Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Button } from "@/components/ui/button";
import { Home, FileQuestion, Search, Flag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const popularPages = [
  { label: "Book Appointment", url: "/book" },
  { label: "Services", url: "/services" },
  { label: "Client Portal", url: "/portal" },
  { label: "RON Info", url: "/ron-info" },
  { label: "Fee Calculator", url: "/fee-calculator" },
  { label: "Find a Notary", url: "/notaries" },
];

const NotFound = () => {
  const location = useLocation();
  const [reported, setReported] = useState(false);

  usePageMeta({ title: "Page Not Found", description: "The page you're looking for doesn't exist. Browse our services or return home.", noIndex: true });

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
    // Log 404 to audit for broken link detection
    supabase.from("audit_log").insert({
      action: "404_not_found",
      entity_type: "route",
      details: {
        path: location.pathname,
        search: location.search,
        referrer: document.referrer || null,
      },
    }).then(() => {}, () => {});
  }, [location.pathname]);

  const handleReport = async () => {
    try {
      await supabase.from("audit_log").insert({
        action: "broken_link_report",
        entity_type: "route",
        details: {
          path: location.pathname,
          search: location.search,
          referrer: document.referrer || null,
          userAgent: navigator.userAgent,
        },
      });
      setReported(true);
      toast.success("Thank you! We've been notified about this broken link.");
    } catch {
      toast.error("Failed to report. Please try again.");
    }
  };

  return (
    <PageShell>
      <main aria-label="Page Not Found" className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
            <FileQuestion className="h-10 w-10 text-primary" />
          </div>
          <h1 className="mb-2 font-sans text-6xl font-bold text-foreground">404</h1>
          <p className="mb-2 text-xl font-medium text-foreground">Page Not Found</p>
          <p className="mb-6 text-muted-foreground">
            The page <code className="rounded bg-muted px-1.5 py-0.5 text-xs font-mono">{location.pathname}</code> doesn't exist or has been moved.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-6">
            <Link to="/">
              <Button className="bg-primary text-primary-foreground hover:bg-accent/90">
                <Home className="mr-2 h-4 w-4" /> Back to Home
              </Button>
            </Link>
            <Link to="/services">
              <Button variant="outline">
                <Search className="mr-2 h-4 w-4" /> Browse Services
              </Button>
            </Link>
          </div>

          {/* Report broken link CTA */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground hover:text-foreground"
              onClick={handleReport}
              disabled={reported}
            >
              <Flag className="mr-1 h-3 w-3" />
              {reported ? "Reported — Thank you!" : "Report this broken link"}
            </Button>
          </div>

          <div className="rounded-lg border border-border/50 bg-muted/30 p-4 text-left">
            <p className="text-sm font-medium text-foreground mb-3">Popular Pages</p>
            <div className="flex flex-wrap gap-2">
              {popularPages.map(p => (
                <Link key={p.url} to={p.url}>
                  <Button variant="outline" size="sm" className="text-xs">{p.label}</Button>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </main>
    </PageShell>
  );
};

export default NotFound;
