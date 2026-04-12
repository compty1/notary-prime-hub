/**
 * SVC-515: Persist booking progress in localStorage
 * Auto-saves form state and restores on return
 */
import { useEffect, useCallback } from "react";
import { toast } from "sonner";

const BOOKING_DRAFT_KEY = "ntrdx_booking_draft";
const DRAFT_EXPIRY_MS = 24 * 60 * 60 * 1000; // 24 hours

interface BookingDraft {
  data: Record<string, any>;
  savedAt: number;
  step: number;
}

export function saveBookingDraft(data: Record<string, any>, step: number): void {
  try {
    const draft: BookingDraft = { data, savedAt: Date.now(), step };
    localStorage.setItem(BOOKING_DRAFT_KEY, JSON.stringify(draft));
  } catch {}
}

export function loadBookingDraft(): BookingDraft | null {
  try {
    const raw = localStorage.getItem(BOOKING_DRAFT_KEY);
    if (!raw) return null;
    const draft: BookingDraft = JSON.parse(raw);
    if (Date.now() - draft.savedAt > DRAFT_EXPIRY_MS) {
      clearBookingDraft();
      return null;
    }
    return draft;
  } catch { return null; }
}

export function clearBookingDraft(): void {
  try { localStorage.removeItem(BOOKING_DRAFT_KEY); } catch {}
}

/**
 * Hook to auto-save booking form progress
 */
export function useBookingAutoSave(
  formData: Record<string, any>,
  step: number,
  enabled: boolean = true,
) {
  const save = useCallback(() => {
    if (enabled && Object.keys(formData).some(k => formData[k])) {
      saveBookingDraft(formData, step);
    }
  }, [formData, step, enabled]);

  useEffect(() => {
    const timer = setTimeout(save, 1000); // Debounce 1s
    return () => clearTimeout(timer);
  }, [save]);

  return { save, clear: clearBookingDraft };
}

/**
 * Component to show draft recovery banner
 */
export function DraftRecoveryBanner({ onRestore, onDiscard }: {
  onRestore: (draft: BookingDraft) => void;
  onDiscard: () => void;
}) {
  const draft = loadBookingDraft();
  if (!draft) return null;

  const savedAgo = Math.round((Date.now() - draft.savedAt) / 60000);
  const timeLabel = savedAgo < 60 ? `${savedAgo}m ago` : `${Math.round(savedAgo / 60)}h ago`;

  return (
    <div className="rounded-lg border border-primary/30 bg-primary/5 p-4 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium">Continue where you left off?</p>
        <p className="text-xs text-muted-foreground">Draft saved {timeLabel} (Step {draft.step + 1})</p>
      </div>
      <div className="flex gap-2">
        <button
          onClick={onDiscard}
          className="text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-md border"
        >
          Start Over
        </button>
        <button
          onClick={() => onRestore(draft)}
          className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-md hover:bg-primary/90"
        >
          Resume
        </button>
      </div>
    </div>
  );
}
