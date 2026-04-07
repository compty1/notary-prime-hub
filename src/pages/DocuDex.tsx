import { usePageMeta } from "@/hooks/usePageMeta";
import { useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DocuDexEditor } from "@/components/DocuDexEditor";
import { stripHtml } from "@/lib/sanitize";

export default function DocuDex() {
  usePageMeta({
    title: "DocuDex — Document Studio | NotarDex",
    description: "Create, edit, and generate professional documents with AI assistance. Multi-page canvas editor with templates, translation, and export.",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = async (title: string, pages: { id: string; html: string }[]) => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save documents.", variant: "destructive" });
      return;
    }

    // Save to documents table as a stored document
    const combinedHtml = pages.map(p => p.html).join("\n<!-- page-break -->\n");
    const fileName = `${title || "Untitled Document"}.html`;

    // Upload to storage
    const filePath = `docudex/${user.id}/${Date.now()}-${fileName}`;
    const blob = new Blob([combinedHtml], { type: "text/html" });
    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, blob);
    if (uploadError) throw uploadError;

    // Create document record
    const { error: dbError } = await supabase.from("documents").insert({
      file_name: fileName,
      file_path: filePath,
      uploaded_by: user.id,
      status: "uploaded" as any,
    });
    if (dbError) throw dbError;
  };

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <div className="flex-1 flex flex-col">
        <DocuDexEditor
          onSave={handleSave}
          maxChars={500000}
        />
      </div>
    </div>
  );
}
