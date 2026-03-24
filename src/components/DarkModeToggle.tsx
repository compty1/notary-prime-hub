import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

export function DarkModeToggle({ className = "" }: { className?: string }) {
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("theme") === "dark" ||
      (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches);
  });

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    localStorage.setItem("theme", dark ? "dark" : "light");
  }, [dark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      className={cn("relative overflow-hidden", className)}
      onClick={() => setDark(!dark)}
      aria-label={dark ? "Switch to light mode" : "Switch to dark mode"}
    >
      <Sun className={cn("h-4 w-4 transition-all duration-300", dark ? "rotate-0 scale-100" : "rotate-90 scale-0")} />
      <Moon className={cn("absolute h-4 w-4 transition-all duration-300", dark ? "-rotate-90 scale-0" : "rotate-0 scale-100")} />
    </Button>
  );
}
