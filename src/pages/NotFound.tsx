import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, FileQuestion, Search } from "lucide-react";

const popularPages = [
  { label: "Book Appointment", url: "/book" },
  { label: "Services", url: "/services" },
  { label: "Client Portal", url: "/portal" },
  { label: "RON Info", url: "/ron-info" },
  { label: "Fee Calculator", url: "/fee-calculator" },
];

const NotFound = () => {
  const location = useLocation();

  usePageTitle("Page Not Found");
  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main aria-label="Page Not Found" className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <FileQuestion className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-2 font-sans text-6xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl font-medium text-foreground">Page Not Found</p>
        <p className="mb-6 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-8">
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
  );
};

export default NotFound;
