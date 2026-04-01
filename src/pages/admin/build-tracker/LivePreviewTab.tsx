import { useState, useRef, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Monitor, Tablet, Smartphone, RefreshCw, ExternalLink, AlertTriangle } from "lucide-react";

const PREVIEW_URL = "https://id-preview--b6d1b88a-ed8c-42c3-98a9-3a2517fa9990.lovable.app";

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
} | null;

type Props = {
  themeOverlay?: ThemeOverlay;
};

export default function LivePreviewTab({ themeOverlay }: Props) {
  const [viewport, setViewport] = useState(0);
  const [loadError, setLoadError] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const current = VIEWPORTS[viewport];

  const refresh = useCallback(() => {
    setIsRefreshing(true);
    setLoadError(false);
    setIsLoading(true);
    if (iframeRef.current) {
      iframeRef.current.src = PREVIEW_URL + "?t=" + Date.now();
    }
    setTimeout(() => setIsRefreshing(false), 1500);
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
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
                src={PREVIEW_URL}
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
