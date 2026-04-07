import type { Editor } from "@tiptap/react";

export interface PageData {
  id: string;
  html: string;
  headerHtml?: string;
  footerHtml?: string;
}

export interface HistorySnapshot {
  timestamp: string;
  pages: PageData[];
  label: string;
  name?: string;
}

export interface CustomTemplate {
  id: string;
  label: string;
  icon: string;
  category: string;
  content: string;
  createdAt: string;
}

export interface DocuDexEditorProps {
  initialPages?: PageData[];
  initialTitle?: string;
  onSave?: (title: string, pages: PageData[]) => Promise<void>;
  maxChars?: number;
  clientName?: string;
  serviceName?: string;
  compact?: boolean;
  appointmentId?: string;
  sessionId?: string;
}

export interface PageSize { value: string; label: string; width: number; height: number; }
