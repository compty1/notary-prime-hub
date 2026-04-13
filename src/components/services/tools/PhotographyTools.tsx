import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Camera, FileText, Image, Settings } from "lucide-react";

const PHOTO_SPECS: Record<string, { width: string; height: string; bg: string; notes: string }> = {
  "US Passport": { width: "2x2 in", height: "51x51 mm", bg: "White", notes: "Within 6 months. No glasses. Neutral expression." },
  "US Visa": { width: "2x2 in", height: "51x51 mm", bg: "White", notes: "Same as passport. Specific to consulate requirements." },
  "Green Card (I-551)": { width: "2x2 in", height: "51x51 mm", bg: "White", notes: "Current photo required for renewal." },
  "Canadian Passport": { width: "50x70 mm", height: "2x2.75 in", bg: "White", notes: "Must show full face and top of shoulders." },
  "UK Passport": { width: "35x45 mm", height: "1.4x1.8 in", bg: "Light grey/cream", notes: "Plain expression. No smile." },
  "Schengen Visa": { width: "35x45 mm", height: "1.4x1.8 in", bg: "Light/white", notes: "ICAO compliant. Face 70-80% of frame." },
  "Indian Visa/OCI": { width: "2x2 in", height: "51x51 mm", bg: "White", notes: "May require specific ear visibility." },
};

const QUALITY_CHECKLIST = [
  "Camera set to highest resolution",
  "Lighting even — no harsh shadows on face",
  "Background is plain white/light with no patterns",
  "Subject facing camera directly",
  "Eyes open and clearly visible",
  "No glasses (per current US requirements)",
  "Neutral facial expression, mouth closed",
  "Head centered and properly framed",
  "Photo taken within last 6 months",
  "Print quality: 300 DPI minimum on photo paper",
  "No digital alterations (filters, retouching)",
  "Proper skin tones — not over/under exposed",
];

export function PhotographyTools() {
  const [checked, setChecked] = useState<Set<number>>(new Set());

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Camera className="h-5 w-5 text-primary" /> Photo Specifications by Document Type</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {Object.entries(PHOTO_SPECS).map(([type, spec]) => (
              <div key={type} className="rounded-lg border p-3 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{type}</p>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{spec.width}</Badge>
                    <Badge variant="secondary">BG: {spec.bg}</Badge>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">{spec.notes}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-lg flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> Photo Quality Checklist</CardTitle></CardHeader>
        <CardContent>
          <div className="space-y-2">
            {QUALITY_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <Checkbox checked={checked.has(i)} onCheckedChange={() => {
                  setChecked(prev => { const n = new Set(prev); n.has(i) ? n.delete(i) : n.add(i); return n; });
                }} />
                <span className={checked.has(i) ? "line-through text-muted-foreground" : ""}>{item}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-3">{checked.size}/{QUALITY_CHECKLIST.length} quality checks passed</p>
        </CardContent>
      </Card>
    </div>
  );
}
