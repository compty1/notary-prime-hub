/**
 * P7-004: Embeddable Editor Widget & REST API wrapper
 * Provides a lightweight embeddable component + postMessage API
 */
import { useEffect, useCallback, useRef } from "react";
import { useEditorStore, type EditorPage } from "@/stores/editorStore";

interface EmbeddableConfig {
  documentId?: string;
  readOnly?: boolean;
  theme?: "light" | "dark";
  allowedTools?: string[];
  onSave?: (data: { title: string; pages: EditorPage[] }) => void;
  onExport?: (format: string, data: Blob) => void;
}

/**
 * Hook for parent-window communication via postMessage
 * Enables embedding DocuDex in iframes with two-way messaging
 */
export function useEmbeddableAPI(config?: EmbeddableConfig) {
  const store = useEditorStore;
  const configRef = useRef(config);
  configRef.current = config;

  // Track the parent origin learned from the host's first handshake message.
  // Using a precise targetOrigin avoids "Failed to execute 'postMessage' ... target origin
  // provided does not match recipient window's origin" warnings that appear when "*" is used
  // against a sandboxed/cross-origin iframe.
  const parentOriginRef = useRef<string | null>(null);

  const sendMessage = useCallback((type: string, payload: any) => {
    if (window.parent === window) return;
    const target = parentOriginRef.current;
    if (!target) return; // wait until host introduces itself
    try {
      window.parent.postMessage({ source: "docudex", type, payload }, target);
    } catch (err) {
      console.warn("[docudex] postMessage to parent failed", err);
    }
  }, []);

  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (event.data?.source !== "docudex-host") return;
      // Lock onto the first host origin we hear from.
      if (!parentOriginRef.current && event.origin && event.origin !== "null") {
        parentOriginRef.current = event.origin;
      }
      const { type, payload } = event.data;

      switch (type) {
        case "load-document": {
          const state = store.getState();
          if (payload.title) state.setTitle(payload.title);
          if (payload.pages) state.setPages(payload.pages);
          if (payload.documentId) state.setDocumentId(payload.documentId);
          sendMessage("document-loaded", { success: true });
          break;
        }

        case "get-document": {
          const { title, pages, pageSize } = store.getState();
          sendMessage("document-data", { title, pages, pageSize });
          break;
        }

        case "set-read-only": {
          // Store read-only state for the editor
          sendMessage("read-only-set", { readOnly: !!payload.readOnly });
          break;
        }

        case "add-element": {
          const state = store.getState();
          const pageId = state.activePageId;
          if (pageId && payload.element) {
            state.addElement(pageId, payload.element);
            sendMessage("element-added", { success: true });
          }
          break;
        }

        case "export": {
          const { title: docTitle, pages: docPages, pageSize: docPageSize } = store.getState();
          sendMessage("export-data", {
            format: payload.format || "json",
            data: { title: docTitle, pages: docPages, pageSize: docPageSize },
          });
          break;
        }

        default:
          sendMessage("error", { message: `Unknown command: ${type}` });
      }
    };

    window.addEventListener("message", handler);

    // Announce ready to a known parent origin if available (document.referrer fallback);
    // otherwise wait for the host's first handshake before responding.
    try {
      if (!parentOriginRef.current && document.referrer) {
        parentOriginRef.current = new URL(document.referrer).origin;
      }
    } catch { /* ignore */ }
    sendMessage("ready", {
      version: "1.0.0",
      features: ["load", "export", "add-element", "read-only"],
    });

    return () => window.removeEventListener("message", handler);
  }, [store, sendMessage]);

  return { sendMessage };
}

/**
 * Generates the embed snippet for external websites
 */
export function generateEmbedCode(options: {
  documentId?: string;
  width?: string;
  height?: string;
  theme?: "light" | "dark";
}): string {
  const { documentId, width = "100%", height = "600px", theme = "light" } = options;
  const baseUrl = window.location.origin;
  const params = new URLSearchParams();
  if (documentId) params.set("doc", documentId);
  params.set("embed", "true");
  params.set("theme", theme);

  return `<!-- DocuDex Embeddable Editor -->
<iframe
  src="${baseUrl}/docudex?${params.toString()}"
  width="${width}"
  height="${height}"
  frameborder="0"
  allow="clipboard-write"
  style="border: 1px solid #e5e7eb; border-radius: 8px;"
></iframe>

<script>
  // DocuDex PostMessage API
  const docudex = document.querySelector('iframe[src*="docudex"]');
  
  // Load a document
  // docudex.contentWindow.postMessage({
  //   source: 'docudex-host',
  //   type: 'load-document',
  //   payload: { title: 'My Document', pages: [...] }
  // }, '*');
  
  // Listen for events
  window.addEventListener('message', (e) => {
    if (e.data?.source === 'docudex') {
      console.log('DocuDex event:', e.data.type, e.data.payload);
    }
  });
</script>`;
}
