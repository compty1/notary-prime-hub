/**
 * P4-003: Version history panel
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useEditorStore } from "@/stores/editorStore";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { History, RotateCcw, Clock, Save } from "lucide-react";
import type { EditorPage } from "@/stores/editorStore";

interface Version {
  id: string;
  version_number: number;
  label: string | null;
  created_at: string;
  created_by: string | null;
  pages: any;
}

interface VersionHistoryProps {
  documentId: string | null;
  className?: string;
}

export function VersionHistory({ documentId, className }: VersionHistoryProps) {
  const [versions, setVersions] = useState<Version[]>([]);
  const [loading, setLoading] = useState(false);
  const { setPages } = useEditorStore();

  const fetchVersions = useCallback(async () => {
    if (!documentId) return;
    setLoading(true);
    const { data } = await supabase
      .from("docudex_versions")
      .select("*")
      .eq("document_id", documentId)
      .order("version_number", { ascending: false })
      .limit(50);

    if (data) setVersions(data as Version[]);
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  const restoreVersion = (version: Version) => {
    if (!version.pages) return;
    const pages = version.pages as EditorPage[];
    setPages(pages);
  };

  if (!documentId) {
    return (
      <div className={cn("w-64 border-l border-border bg-card p-4", className)}>
        <p className="text-xs text-muted-foreground text-center">Save document to enable version history</p>
      </div>
    );
  }

  return (
    <div className={cn("w-64 border-l border-border bg-card flex flex-col", className)}>
      <div className="px-3 py-2 border-b border-border">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <History className="w-3.5 h-3.5" /> Version History
        </h3>
      </div>

      <ScrollArea className="flex-1">
        {versions.map(v => (
          <div
            key={v.id}
            className="px-3 py-2 border-b border-border last:border-0 hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-medium">v{v.version_number}</span>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => restoreVersion(v)}
                title="Restore this version"
              >
                <RotateCcw className="w-3 h-3" />
              </Button>
            </div>
            {v.label && (
              <p className="text-[10px] text-muted-foreground mb-1">{v.label}</p>
            )}
            <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
              <Clock className="w-2.5 h-2.5" />
              {new Date(v.created_at).toLocaleString()}
            </div>
          </div>
        ))}

        {versions.length === 0 && !loading && (
          <div className="p-6 text-center text-xs text-muted-foreground">
            <Save className="w-6 h-6 mx-auto mb-2 opacity-40" />
            No versions yet
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
