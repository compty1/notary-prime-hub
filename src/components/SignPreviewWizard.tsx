import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, ChevronLeft, ChevronRight, PenTool, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

interface SignatureLocation {
  id: number;
  type: "signature" | "initials" | "date";
  label: string;
  page: number;
}

interface Props {
  documentName?: string;
  signatureCount?: number;
  onReady: () => void;
  onBack?: () => void;
}

const DEFAULT_LOCATIONS: SignatureLocation[] = [
  { id: 1, type: "signature", label: "Full Signature", page: 1 },
  { id: 2, type: "initials", label: "Initials", page: 2 },
  { id: 3, type: "date", label: "Date", page: 2 },
  { id: 4, type: "signature", label: "Final Signature", page: 3 },
];

export default function SignPreviewWizard({ documentName, signatureCount, onReady, onBack }: Props) {
  const locations = DEFAULT_LOCATIONS.slice(0, signatureCount || DEFAULT_LOCATIONS.length);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewed, setReviewed] = useState<Set<number>>(new Set());

  const current = locations[currentIndex];
  const allReviewed = reviewed.size >= locations.length;

  const markReviewed = () => {
    setReviewed(prev => new Set(prev).add(current.id));
    if (currentIndex < locations.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const typeLabel = { signature: "Sign Here", initials: "Initial Here", date: "Date Here" };
  const typeIcon = { signature: PenTool, initials: PenTool, date: FileText };

  return (
    <Card className="border-border/50 max-w-lg mx-auto">
      <CardContent className="p-6 space-y-5">
        <div className="text-center">
          <h3 className="font-semibold text-lg text-foreground">Document Signing Preview</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {documentName ? `Preview: ${documentName}` : "Review where you'll need to sign before the live session"}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2">
          {locations.map((loc, i) => (
            <button
              key={loc.id}
              onClick={() => setCurrentIndex(i)}
              className={cn(
                "h-2.5 w-2.5 rounded-full transition-all",
                i === currentIndex && "w-6 bg-primary",
                i !== currentIndex && reviewed.has(loc.id) && "bg-primary/50",
                i !== currentIndex && !reviewed.has(loc.id) && "bg-muted-foreground/30"
              )}
            />
          ))}
        </div>

        {/* Current signing location preview */}
        <div className="rounded-lg border-2 border-dashed border-primary/30 bg-primary/5 p-6 text-center relative">
          <Badge className="absolute top-2 right-2 bg-muted text-muted-foreground">
            Page {current.page}
          </Badge>

          <div className="flex flex-col items-center gap-3">
            {(() => {
              const Icon = typeIcon[current.type];
              return <Icon className="h-10 w-10 text-primary" />;
            })()}
            <div className="space-y-1">
              <p className="text-lg font-bold text-primary">{typeLabel[current.type]}</p>
              <p className="text-sm text-muted-foreground">{current.label}</p>
              <p className="text-xs text-muted-foreground">
                {current.type === "signature" ? "You'll click to add your full signature" :
                 current.type === "initials" ? "You'll click to add your initials" :
                 "You'll click to add today's date"}
              </p>
            </div>
          </div>

          {reviewed.has(current.id) && (
            <div className="absolute top-2 left-2">
              <CheckCircle className="h-5 w-5 text-primary" />
            </div>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Signing location <span className="font-semibold text-foreground">{currentIndex + 1}</span> of{" "}
          <span className="font-semibold text-foreground">{locations.length}</span>
        </p>

        {/* Navigation */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => setCurrentIndex(Math.max(0, currentIndex - 1))}
            disabled={currentIndex === 0}
            className="flex-1"
          >
            <ChevronLeft className="mr-1 h-4 w-4" /> Previous
          </Button>

          {!reviewed.has(current.id) ? (
            <Button onClick={markReviewed} className="flex-1">
              Got It <CheckCircle className="ml-1 h-4 w-4" />
            </Button>
          ) : currentIndex < locations.length - 1 ? (
            <Button onClick={() => setCurrentIndex(currentIndex + 1)} className="flex-1">
              Next <ChevronRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={onReady} className="flex-1" disabled={!allReviewed}>
              I'm Ready! <CheckCircle className="ml-1 h-4 w-4" />
            </Button>
          )}
        </div>

        {onBack && (
          <Button variant="ghost" onClick={onBack} className="w-full text-muted-foreground">
            Go Back
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
