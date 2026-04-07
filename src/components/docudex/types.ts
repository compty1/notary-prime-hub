import type { Editor } from "@tiptap/react";

export interface PageData { id: string; html: string; }
export interface HistorySnapshot { timestamp: string; pages: PageData[]; label: string; }

export interface DocuDexEditorProps {
  initialPages?: PageData[];
  initialTitle?: string;
  onSave?: (title: string, pages: PageData[]) => Promise<void>;
  maxChars?: number;
  clientName?: string;
  serviceName?: string;
  compact?: boolean;
}

export interface PageSize { value: string; label: string; width: number; height: number; }
