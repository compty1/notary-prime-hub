/**
 * SVC-515: Booking draft recovery banner
 * Shows a banner when a saved booking draft exists in localStorage.
 */
import { useState, useEffect } from "react";
import { loadDraft, clearDraft } from "@/lib/formDrafts";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RotateCcw, X } from "lucide-react";

interface DraftRecoveryBannerProps {
  formKey: string;
  onRestore: (data: Record<string, unknown>) => void;
}

export function DraftRecoveryBanner({ formKey, onRestore }: DraftRecoveryBannerProps) {
  const [draft, setDraft] = useState<Record<string, unknown> | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const saved = loadDraft(formKey);
    if (saved) setDraft(saved);
  }, [formKey]);

  if (!draft || dismissed) return null;

  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-700 p-3 flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm">
        <AlertTriangle className="h-4 w-4 text-amber-600 flex-shrink-0" />
        <span className="text-amber-800 dark:text-amber-300">You have an unsaved booking draft. Would you like to restore it?</span>
      </div>
      <div className="flex gap-2 flex-shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            onRestore(draft);
            setDismissed(true);
          }}
        >
          <RotateCcw className="mr-1 h-3 w-3" /> Restore
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            clearDraft(formKey);
            setDismissed(true);
          }}
        >
          <X className="h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
