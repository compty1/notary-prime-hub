/**
 * SVC-121: In-browser PDF viewer with lazy loading
 * Uses native browser PDF rendering via iframe/embed
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, Maximize2, Minimize2, FileText, Loader2 } from "lucide-react";

interface PDFViewerProps {
  url: string;
  title?: string;
  className?: string;
  height?: string;
  downloadable?: boolean;
}

export function PDFViewer({ url, title, className = "", height = "600px", downloadable = true }: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [fullscreen, setFullscreen] = useState(false);

  return (
    <Card className={className}>
      {title && (
        <CardHeader className="flex-row items-center justify-between py-3">
          <CardTitle className="text-base flex items-center gap-2">
            <FileText className="h-4 w-4" /> {title}
          </CardTitle>
          <div className="flex gap-1">
            {downloadable && (
              <Button variant="ghost" size="icon" asChild aria-label="Action">
                <a href={url} download target="_blank" rel="noopener noreferrer">
                  <Download className="h-4 w-4" />
                </a>
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={() = aria-label="Action"> setFullscreen(!fullscreen)}>
              {fullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </CardHeader>
      )}
      <CardContent className="p-0 relative">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted/50 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          className="w-full border-0 rounded-b-lg"
          style={{ height: fullscreen ? "90vh" : height }}
          title={title || "PDF Document"}
          onLoad={() => setLoading(false)}
        />
      </CardContent>
    </Card>
  );
}
