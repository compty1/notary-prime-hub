/**
 * P4-003: Auto-save + version history for DocuDex documents (Supabase-backed)
 */
import { useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useEditorStore } from "@/stores/editorStore";
import { useToast } from "@/hooks/use-toast";

interface DocuDexAutoSaveOptions {
  interval?: number;
  enabled?: boolean;
}

export function useDocuDexAutoSave({ interval = 30000, enabled = true }: DocuDexAutoSaveOptions = {}) {
  const { user } = useAuth();
  const { toast } = useToast();
  const lastSavedRef = useRef<string>("");
  const timerRef = useRef<ReturnType<typeof setInterval>>();

  const saveDocument = useCallback(async () => {
    if (!user) return;
    const state = useEditorStore.getState();
    const { documentId, title, pages, pageSize } = state;

    const pagesJson = JSON.stringify(pages);
    if (pagesJson === lastSavedRef.current) return;

    try {
      if (documentId) {
        await supabase
          .from("docudex_documents")
          .update({
            title,
            pages: pages as any,
            page_size: pageSize.label,
            last_auto_saved_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq("id", documentId);

        const { data: versionCount } = await supabase
          .from("docudex_versions")
          .select("version_number")
          .eq("document_id", documentId)
          .order("version_number", { ascending: false })
          .limit(1);

        const nextVersion = (versionCount?.[0]?.version_number ?? 0) + 1;

        await supabase.from("docudex_versions").insert({
          document_id: documentId,
          version_number: nextVersion,
          pages: pages as any,
          created_by: user.id,
          label: `Auto-save v${nextVersion}`,
        });
      } else {
        const { data, error } = await supabase
          .from("docudex_documents")
          .insert({
            title,
            pages: pages as any,
            page_size: pageSize.label,
            user_id: user.id,
            last_auto_saved_at: new Date().toISOString(),
          })
          .select("id")
          .single();

        if (!error && data) {
          state.setDocumentId(data.id);
        }
      }

      lastSavedRef.current = pagesJson;
    } catch (err) {
      console.error("Auto-save failed:", err);
    }
  }, [user]);

  const manualSave = useCallback(async () => {
    await saveDocument();
    toast({ title: "Document saved", description: "Your changes have been saved." });
  }, [saveDocument, toast]);

  useEffect(() => {
    if (!enabled || !user) return;
    timerRef.current = setInterval(saveDocument, interval);
    return () => clearInterval(timerRef.current);
  }, [enabled, interval, saveDocument, user]);

  useEffect(() => {
    return () => { saveDocument(); };
  }, [saveDocument]);

  return { saveDocument, manualSave };
}
