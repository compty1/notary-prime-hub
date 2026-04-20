import { Link, useLocation } from "react-router-dom";
import { ChevronRight, Home } from "lucide-react";
import { forwardRef, useEffect } from "react";
import { BREADCRUMB_LABELS } from "@/lib/breadcrumbLabels";

const labelMap = BREADCRUMB_LABELS;

/** forwardRef so framer-motion / Slot wrappers can pass refs without warning. */
export const Breadcrumbs = forwardRef<HTMLElement>((_props, ref) => {
  const { pathname } = useLocation();
  const segments = pathname.split("/").filter(Boolean);

  const crumbs = segments.map((seg, i) => ({
    label: labelMap[seg] || seg.replace(/-/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
    path: "/" + segments.slice(0, i + 1).join("/"),
    isLast: i === segments.length - 1,
  }));

  // Emit BreadcrumbList JSON-LD
  useEffect(() => {
    if (segments.length === 0) return;
    const schema = {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      "itemListElement": [
        { "@type": "ListItem", "position": 1, "name": "Home", "item": "https://notardex.com" },
        ...crumbs.map((c, i) => ({
          "@type": "ListItem",
          "position": i + 2,
          "name": c.label,
          "item": `https://notardex.com${c.path}`,
        })),
      ],
    };
    const script = document.createElement("script");
    script.type = "application/ld+json";
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [pathname]);

  if (segments.length === 0) return null;

  return (
    <nav ref={ref} aria-label="Breadcrumb" className="mb-4">
      <ol className="flex items-center gap-1 text-sm text-muted-foreground">
        <li>
          <Link to="/" className="hover:text-foreground transition-colors" aria-label="Home">
            <Home className="h-3.5 w-3.5" />
          </Link>
        </li>
        {crumbs.map((crumb) => (
          <li key={crumb.path} className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {crumb.isLast ? (
              <span className="font-medium text-foreground" aria-current="page">{crumb.label}</span>
            ) : (
              <Link to={crumb.path} className="hover:text-foreground transition-colors">
                {crumb.label}
              </Link>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
});
Breadcrumbs.displayName = "Breadcrumbs";
