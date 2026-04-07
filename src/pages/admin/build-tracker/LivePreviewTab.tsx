import { useState, useRef, useCallback, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, AlertTriangle, Navigation } from "lucide-react";

const PUBLISHED_URL = "https://notary-prime-hub.lovable.app";
const PREVIEW_URL = PUBLISHED_URL; // Use published URL — preview URLs require Lovable login and block iframe embedding

const VIEWPORTS = [
  { label: "Desktop", icon: Monitor, width: 1280, height: 800 },
  { label: "Tablet", icon: Tablet, width: 768, height: 1024 },
  { label: "Mobile", icon: Smartphone, width: 375, height: 812 },
] as const;

type ThemeOverlay = {
  primary?: string;
  background?: string;
  foreground?: string;
  accent?: string;
  secondary?: string;
  muted?: string;
} | null;

type Props = {
  themeOverlay?: ThemeOverlay;
};

/** Convert hex to HSL string for CSS variable injection */
function hexToHSL(hex: string): string {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** Build a theme query string for the preview iframe */
function buildThemeQuery(overlay: ThemeOverlay): string {
  if (!overlay) return "";
  const params = new URLSearchParams();
  Object.entries(overlay).forEach(([key, val]) => {
    if (val) params.set(`theme_${key}`, val);
  });
  const str = params.toString();
  return str ? `&${str}` : "";
}

const QUICK_ROUTES = [
  { label: "Home", path: "/" },
  { label: "About", path: "/about" },
  { label: "Services", path: "/services" },
  { label: "Book", path: "/book" },
  { label: "Login", path: "/login" },
  { label: "RON Info", path: "/ron-info" },
  { label: "Resources", path: "/resources" },
];

export default function LivePreviewTab({ themeOverlay }: Props) {
  const [viewport, setViewport] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [routePath, setRoutePath] = useState("/");
  const [inputPath, setInputPath] = useState("/");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const current = VIEWPORTS[viewport];

  const getIframeSrc = useCallback((path: string = "/") => {
    const cacheBust = `t=${Date.now()}`;
    const themeQ = buildThemeQuery(themeOverlay);
    return `${PREVIEW_URL}${path}?${cacheBust}${themeQ}`;
  }, [themeOverlay]);

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setLoadError(false);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = getIframeSrc(routePath);
    }
    setTimeout(() => setIsRefreshing(false), 1500);
  }, [getIframeSrc, routePath]);

  const navigateTo = useCallback((path: string) => {
    setRoutePath(path);
    setInputPath(path);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = getIframeSrc(path);
    }
  }, [getIframeSrc]);

  // Re-load iframe when theme overlay changes
  useEffect(() => {
    if (iframeRef.current && themeOverlay) {
      setIsLoading(true);
      iframeRef.current.src = getIframeSrc(routePath);
    }
  }, [themeOverlay, getIframeSrc, routePath]);

  // Also try postMessage for theme injection (works if same-origin or if app listens)
  useEffect(() => {
    if (!themeOverlay || !iframeRef.current) return;
    const cssVars: Record<string, string> = {};
    Object.entries(themeOverlay).forEach(([key, val]) => {
      if (val) cssVars[`--${key}`] = hexToHSL(val);
    });
    try {
      iframeRef.current.contentWindow?.postMessage(
        { type: "THEME_OVERRIDE", cssVars },
        "*"
      );
    } catch {}
  }, [themeOverlay, isLoading]);

  return (
    <div className="space-y-4">
      {/* Viewport & Actions Bar */}
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {VIEWPORTS.map((vp, idx) => (
            <Button
              key={vp.label}
              variant={viewport === idx ? "default" : "outline"}
              size="sm"
              onClick={() => { setViewport(idx); setIsLoading(true); }}
              className="gap-1.5"
            >
              <vp.icon className="h-4 w-4" />
              {vp.label}
            </Button>
          ))}
          <Badge variant="outline" className="ml-2 text-xs">
            {current.width}×{current.height}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refresh} disabled={isRefreshing}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1 ${isRefreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button variant="outline" size="sm" asChild>
            <a href={PREVIEW_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="h-3.5 w-3.5 mr-1" />
              Open
            </a>
          </Button>
        </div>
      </div>

      {/* Page Navigation */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="flex items-center gap-1">
          <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
          <Label className="text-xs text-muted-foreground">Navigate:</Label>
        </div>
        {QUICK_ROUTES.map(r => (
          <Button
            key={r.path}
            variant={routePath === r.path ? "secondary" : "ghost"}
            size="sm"
            className="h-7 text-xs"
            onClick={() => navigateTo(r.path)}
          >
            {r.label}
          </Button>
        ))}
        <div className="flex items-center gap-1 ml-auto">
          <Input
            value={inputPath}
            onChange={e => setInputPath(e.target.value)}
            onKeyDown={e => { if (e.key === "Enter") navigateTo(inputPath); }}
            placeholder="/path"
            className="h-7 w-32 text-xs"
          />
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => navigateTo(inputPath)}>Go</Button>
        </div>
      </div>

      {/* Theme Overlay Indicator */}
      {themeOverlay && (
        <div className="flex items-center gap-2 rounded-lg border bg-muted/30 p-2 text-xs">
          <span className="font-medium">Theme overlay active:</span>
          {Object.entries(themeOverlay).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1">
              <div className="h-3 w-3 rounded-full border" style={{ backgroundColor: val }} />
              <span className="text-muted-foreground">{key}</span>
            </div>
          ))}
        </div>
      )}

      {/* Preview Frame */}
      <Card className="overflow-hidden">
        <CardContent className="p-0 flex justify-center bg-muted/20" style={{ minHeight: "500px" }}>
          {loadError ? (
            <div className="flex flex-col items-center justify-center gap-3 p-12 text-center">
              <AlertTriangle className="h-10 w-10 text-yellow-500" />
              <p className="font-medium">Preview Unavailable</p>
              <p className="text-sm text-muted-foreground max-w-md">
                The preview couldn't load. This may happen due to iframe restrictions or if the preview server is starting up.
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={refresh}>Try Again</Button>
                <Button variant="outline" size="sm" asChild>
                  <a href={PREVIEW_URL} target="_blank" rel="noopener noreferrer">
                    Open in New Tab
                  </a>
                </Button>
              </div>
            </div>
          ) : (
            <div
              className="relative transition-all duration-300 border-x border-b bg-background shadow-lg"
              style={{
                width: current.width,
                maxWidth: "100%",
                height: current.height,
                maxHeight: "80vh",
              }}
            >
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              )}
              <iframe
                ref={iframeRef}
                src={getIframeSrc(routePath)}
                className="w-full h-full"
                title="Live Site Preview"
                sandbox="allow-scripts allow-same-origin allow-forms"
                onError={() => setLoadError(true)}
                onLoad={() => { setLoadError(false); setIsLoading(false); }}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
