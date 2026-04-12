/**
 * SVC-119: Document version history viewer
 * Shows version timeline for a document with restore capability.
 */
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Download, RotateCcw, FileText } from "lucide-react";
import { toast } from "sonner";

interface DocumentVersionHistoryProps {
  documentId: string;
  onRestore?: (versionId: string) => void;
}

export function DocumentVersionHistory({ documentId, onRestore }: DocumentVersionHistoryProps) {
  const { data: versions = [], isLoading } = useQuery({
    queryKey: ["document-versions", documentId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("document_versions")
        .select("*")
        .eq("document_id", documentId)
        .order("version_number", { ascending: false });
      if (error) throw error;
      return data || [];
    },
  });

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading versions...</div>;

  if (versions.length === 0) {
    return (
      <div className="text-center py-6 text-sm text-muted-foreground">
        <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
        No version history available
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Clock className="h-4 w-4" /> Version History
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {versions.map((version: any, idx: number) => (
          <div key={version.id} className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors">
            <div className="flex items-center gap-3">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">v{version.version_number}</p>
              </div>
              <div>
                <p className="text-sm font-medium">{version.file_name}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(version.created_at).toLocaleString()}
                </p>
                {version.notes && <p className="text-xs text-muted-foreground mt-0.5">{version.notes}</p>}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {idx === 0 && <Badge variant="secondary" className="text-xs">Current</Badge>}
              {idx > 0 && onRestore && (
                <Button variant="ghost" size="sm" onClick={() => {
                  onRestore(version.id);
                  toast.success(`Restored to v${version.version_number}`);
                }}>
                  <RotateCcw className="mr-1 h-3 w-3" /> Restore
                </Button>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
