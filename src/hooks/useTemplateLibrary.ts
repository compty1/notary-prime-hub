/**
 * P3-004: Template persistence in Supabase
 */
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import type { EditorPage } from "@/stores/editorStore";

export interface DocuDexTemplate {
  id: string;
  title: string;
  category: string;
  content: any;
  icon: string | null;
  is_public: boolean;
  thumbnail_url: string | null;
  use_count: number;
  created_by: string | null;
  created_at: string;
}

export function useTemplateLibrary() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [templates, setTemplates] = useState<DocuDexTemplate[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("docudex_templates")
      .select("*")
      .or(`is_public.eq.true,created_by.eq.${user?.id || "00000000-0000-0000-0000-000000000000"}`)
      .order("use_count", { ascending: false });

    if (!error && data) {
      setTemplates(data as DocuDexTemplate[]);
    }
    setLoading(false);
  }, [user?.id]);

  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const saveTemplate = useCallback(async (
    title: string,
    category: string,
    pages: EditorPage[],
    isPublic = false,
    icon?: string
  ) => {
    if (!user) return null;

    const { data, error } = await supabase
      .from("docudex_templates")
      .insert({
        title,
        category,
        content: pages as any,
        is_public: isPublic,
        icon: icon || "FileText",
        created_by: user.id,
      })
      .select("id")
      .single();

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
      return null;
    }

    toast({ title: "Template saved", description: `"${title}" saved to your template library.` });
    fetchTemplates();
    return data?.id;
  }, [user, toast, fetchTemplates]);

  const useTemplate = useCallback(async (templateId: string) => {
    // Increment use count
    const template = templates.find(t => t.id === templateId);
    if (template) {
      await supabase
        .from("docudex_templates")
        .update({ use_count: template.use_count + 1 })
        .eq("id", templateId);
    }
    return template;
  }, [templates]);

  const deleteTemplate = useCallback(async (templateId: string) => {
    const { error } = await supabase
      .from("docudex_templates")
      .delete()
      .eq("id", templateId);

    if (!error) {
      setTemplates(prev => prev.filter(t => t.id !== templateId));
      toast({ title: "Template deleted" });
    }
  }, [toast]);

  return { templates, loading, saveTemplate, useTemplate, deleteTemplate, refresh: fetchTemplates };
}
