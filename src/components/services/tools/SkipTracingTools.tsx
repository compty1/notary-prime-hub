import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Crosshair, Database, MapPin, Shield, Clock } from "lucide-react";

const SEARCH_DATABASES = [
  { name: "TLO / IRB Search", type: "Premium", desc: "Full address history, phone, SSN trace, associates", cost: "$2–8/search" },
  { name: "CLEAR (Thomson Reuters)", type: "Premium", desc: "Comprehensive people search with real-time data", cost: "$5–15/search" },
  { name: "Accurint (LexisNexis)", type: "Premium", desc: "Public records aggregator with skip-trace focus", cost: "$3–10/search" },
  { name: "County Recorder", type: "Public", desc: "Property ownership, liens, deed transfers", cost: "Free" },
  { name: "Secretary of State", type: "Public", desc: "Business filings, registered agents, officer names", cost: "Free" },
  { name: "Social Media OSINT", type: "Open Source", desc: "Facebook, LinkedIn, Instagram check-ins, public posts", cost: "Free" },
  { name: "USPS Address Change", type: "Public", desc: "National Change of Address (NCOA) database", cost: "$0.25/query" },
  { name: "Voter Registration", type: "Public", desc: "Current registered address in Ohio counties", cost: "Free" },
];

const SKIP_TRACE_CHECKLIST = [
  "Verify subject full legal name and DOB",
  "Run initial address history search",
  "Check known associates and relatives",
  "Cross-reference property records",
  "Search business filings for registered agent",
  "Check social media for location clues",
  "Verify phone numbers (landline/cell)",
  "Document all search attempts with timestamps",
  "Confirm positive ID before reporting address",
  "Prepare affidavit of due diligence if needed",
];

export function SkipTracingTools() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Search Database Directory
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {SEARCH_DATABASES.map((db) => (
              <div key={db.name} className="flex items-start gap-3 p-3 rounded-lg border">
                <MapPin className="h-4 w-4 mt-0.5 text-primary shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{db.name}</span>
                    <Badge variant={db.type === "Premium" ? "default" : "secondary"} className="text-xs">{db.type}</Badge>
                    <Badge variant="outline" className="text-xs">{db.cost}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{db.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Crosshair className="h-5 w-5" />
            Skip Trace Workflow Checklist
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {SKIP_TRACE_CHECKLIST.map((item, i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded bg-muted/50">
                <span className="text-xs font-mono text-muted-foreground w-6">{i + 1}.</span>
                <span className="text-sm">{item}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Ohio Compliance Notes
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-2 text-muted-foreground">
          <p>• Ohio does not require a PI license for skip tracing used in service of process (ORC §4749.01).</p>
          <p>• DPPA compliance required for DMV record access (18 U.S.C. §2721).</p>
          <p>• FCRA applies if results used for credit/employment decisions.</p>
          <p>• Document all search methods for due diligence affidavits per Ohio Civ.R. 4.6.</p>
        </CardContent>
      </Card>
    </div>
  );
}
