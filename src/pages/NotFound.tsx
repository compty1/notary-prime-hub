import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, ArrowLeft, FileQuestion } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center max-w-md px-6">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10">
          <FileQuestion className="h-10 w-10 text-primary" />
        </div>
        <h1 className="mb-2 font-display text-6xl font-bold text-foreground">404</h1>
        <p className="mb-2 text-xl font-medium text-foreground">Page Not Found</p>
        <p className="mb-8 text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link to="/">
            <Button className="bg-gradient-primary text-white hover:bg-accent/90">
              <Home className="mr-2 h-4 w-4" /> Back to Home
            </Button>
          </Link>
          <Link to="/book">
            <Button variant="outline">
              <ArrowLeft className="mr-2 h-4 w-4" /> Book Appointment
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
