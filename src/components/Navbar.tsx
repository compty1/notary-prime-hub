import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Menu } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { Logo } from "@/components/Logo";
import { useAuth } from "@/contexts/AuthContext";

const navLinks = [
  { to: "/services", label: "Services" },
  { to: "/about", label: "About" },
  { to: "/templates", label: "Templates" },
  { to: "/digitize", label: "Digitize" },
  { to: "/fee-calculator", label: "Pricing" },
];

export function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAdmin, isNotary } = useAuth();

  const portalLink = isAdmin || isNotary ? "/admin" : "/portal";
  const portalLabel = isAdmin || isNotary ? "Dashboard" : "Portal";

  return (
    <nav className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm" aria-label="Main navigation">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo size="sm" />
          <span className="font-sans text-lg font-semibold tracking-tight text-foreground">Notar</span>
        </Link>

        <div className="hidden items-center gap-1 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="relative px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground after:absolute after:bottom-0 after:left-3 after:right-3 after:h-0.5 after:scale-x-0 after:bg-primary after:transition-transform after:duration-200 hover:after:scale-x-100"
            >
              {link.label}
            </Link>
          ))}
          <div className="ml-2 flex items-center gap-2">
            <DarkModeToggle />
            {user ? (
              <Link to={portalLink}>
                <Button variant="ghost" size="sm" className="text-sm">{portalLabel}</Button>
              </Link>
            ) : (
              <Link to="/login">
                <Button variant="ghost" size="sm" className="text-sm">Sign In</Button>
              </Link>
            )}
            <Link to="/book">
              <Button size="sm" className="text-primary-foreground">
                Book Now
              </Button>
            </Link>
          </div>
        </div>

        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon" aria-label="Open menu">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-72 bg-background/95 backdrop-blur-xl">
            <div className="mt-8 flex flex-col gap-1">
              {navLinks.map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className="rounded-lg px-4 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </Link>
              ))}
              <hr className="my-3 border-border" />
              <div className="px-4 py-2">
                <DarkModeToggle />
              </div>
              {user ? (
                <Link to={portalLink} onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">{portalLabel}</Button>
                </Link>
              ) : (
                <Link to="/login" onClick={() => setOpen(false)}>
                  <Button variant="outline" className="w-full">Sign In</Button>
                </Link>
              )}
              <Link to="/book" onClick={() => setOpen(false)}>
                <Button className="w-full bg-gradient-primary text-primary-foreground">Book Now</Button>
              </Link>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
