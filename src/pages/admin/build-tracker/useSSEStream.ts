import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { getEdgeFunctionHeaders } from "@/lib/edgeFunctionAuth";

type SSEOptions = {
  onChunk?: (content: string, full: string) => void;
  onComplete?: (full: string) => void;
  onError?: (error: Error) => void;
};

/**
 * Shared SSE streaming hook for build-analyst edge function calls.
 * Eliminates duplicated SSE parsing across 5+ components.
 */
export function useSSEStream() {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState("");
  const abortRef = useRef<AbortController | null>(null);
  const lastCallRef = useRef<number>(0);

  const stream = useCallback(async (
    messages: { role: string; content: string }[],
    context: string,
    options?: SSEOptions
  ): Promise<string> => {
    // Rate limiting: minimum 2s between calls
    const now = Date.now();
    if (now - lastCallRef.current < 2000) {
      toast.error("Please wait before making another AI request");
      return "";
    }
    lastCallRef.current = now;

    // Abort any in-flight request
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setIsStreaming(true);
    setContent("");
    let fullContent = "";

    try {
      let headers: Record<string, string>;
      try {
        headers = await getEdgeFunctionHeaders();
      } catch {
        // Fallback if session fetch fails (e.g. preview environment)
        headers = {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        };
      }
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/build-analyst`, {
        method: "POST",
        headers,
        body: JSON.stringify({ messages, context }),
        signal: controller.signal,
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: `Error ${resp.status}` }));
        throw new Error(err.error || `Error ${resp.status}`);
      }

      const contentType = resp.headers.get("content-type") || "";

      // Handle non-streaming JSON response
      if (!contentType.includes("text/event-stream") && !contentType.includes("text/plain") && contentType.includes("application/json")) {
        const json = await resp.json();
        fullContent = json.choices?.[0]?.message?.content || json.content || JSON.stringify(json);
        setContent(fullContent);
        options?.onComplete?.(fullContent);
        return fullContent;
      }

      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;

          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;

          try {
            const parsed = JSON.parse(jsonStr);
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) {
              fullContent += chunk;
              setContent(fullContent);
              options?.onChunk?.(chunk, fullContent);
            }
          } catch {
            // Malformed JSON — skip this line rather than looping forever
            continue;
          }
        }
      }

      // Process remaining buffer
      if (textBuffer.trim()) {
        const remaining = textBuffer.trim();
        if (remaining.startsWith("data: ") && remaining.slice(6).trim() !== "[DONE]") {
          try {
            const parsed = JSON.parse(remaining.slice(6).trim());
            const chunk = parsed.choices?.[0]?.delta?.content;
            if (chunk) {
              fullContent += chunk;
              setContent(fullContent);
            }
          } catch { /* partial final chunk */ }
        }
      }

      options?.onComplete?.(fullContent);
      return fullContent;
    } catch (e: any) {
      if (e.name === "AbortError") return fullContent;
      const error = e instanceof Error ? e : new Error(String(e));
      options?.onError?.(error);
      toast.error(error.message || "AI request failed");
      throw error;
    } finally {
      setIsStreaming(false);
      abortRef.current = null;
    }
  }, []);

  const abort = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const reset = useCallback(() => {
    setContent("");
  }, []);

  return { stream, abort, reset, isStreaming, content };
}

/**
 * Extract JSON from AI response that may be wrapped in markdown code blocks.
 */
export function extractJSON<T = any>(raw: string): T {
  let jsonContent = raw;
  const jsonMatch = raw.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) jsonContent = jsonMatch[1];
  const rawMatch = jsonContent.match(/\{[\s\S]*\}/);
  if (rawMatch) jsonContent = rawMatch[0];
  return JSON.parse(jsonContent);
}

/**
 * Safely copy text to clipboard with fallback.
 */
export async function safeClipboardWrite(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback for insecure contexts
    try {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      document.body.removeChild(textarea);
      return true;
    } catch {
      return false;
    }
  }
}
