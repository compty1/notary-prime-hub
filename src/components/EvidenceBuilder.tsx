/**
 * SVC-362: Evidence package builder for disputes
 * Collects and bundles evidence for dispute resolution.
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Download, Package, FileText } from "lucide-react";
import { generateAuditPackage } from "@/lib/auditPackageGenerator";
import { toast } from "sonner";

interface EvidenceBuilderProps {
  appointmentId: string;
}

export function EvidenceBuilder({ appointmentId }: EvidenceBuilderProps) {
  const [includeJournal, setIncludeJournal] = useState(true);
  const [includeDocuments, setIncludeDocuments] = useState(true);
  const [includeAuditLog, setIncludeAuditLog] = useState(true);
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      await generateAuditPackage({
        appointmentId,
        includeJournal,
        includeDocuments,
        includeAuditLog,
      });
    } catch {
      // Error handled in generator
    } finally {
      setGenerating(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Package className="h-4 w-4" /> Evidence Package Builder
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Select the data to include in this evidence package. All items will be checksummed for integrity verification.
        </p>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Checkbox id="ev-journal" checked={includeJournal} onCheckedChange={v => setIncludeJournal(!!v)} />
            <Label htmlFor="ev-journal" className="text-sm">Journal Entries</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ev-docs" checked={includeDocuments} onCheckedChange={v => setIncludeDocuments(!!v)} />
            <Label htmlFor="ev-docs" className="text-sm">Document Records</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox id="ev-audit" checked={includeAuditLog} onCheckedChange={v => setIncludeAuditLog(!!v)} />
            <Label htmlFor="ev-audit" className="text-sm">Audit Trail</Label>
          </div>
        </div>

        <div>
          <Label>Additional Notes</Label>
          <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context for this evidence package..." rows={3} />
        </div>

        <Button onClick={handleGenerate} disabled={generating} className="w-full">
          {generating ? "Generating..." : (
            <><Download className="mr-1 h-4 w-4" /> Generate Evidence Package</>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}
