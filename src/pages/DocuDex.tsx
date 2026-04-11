import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { DocuDexEditor } from "@/components/DocuDexEditor";
import { stripHtml } from "@/lib/sanitize";
import { safeGetItem, safeRemoveItem } from "@/lib/safeStorage";

export default function DocuDex() {
  usePageMeta({
    title: "DocuDex — Document Studio | Notar",
    description: "Create, edit, and generate professional documents with AI assistance. Multi-page canvas editor with templates, translation, and export.",
  });
  const { user } = useAuth();
  const { toast } = useToast();

  // Check for content passed from AI Tools Hub via sessionStorage
  const [incomingContent, setIncomingContent] = useState<string | null>(null);
  useEffect(() => {
    const content = safeGetItem("ai_tools_content", sessionStorage);
    if (content) {
      setIncomingContent(content);
      safeRemoveItem("ai_tools_content", sessionStorage);
    }
  }, []);

  // Convert markdown to simple HTML for the editor
  const initialPages = incomingContent
    ? [{ id: "incoming-1", html: incomingContent.split("\n").map(line => {
        if (line.startsWith("### ")) return `<h3>${line.slice(4)}</h3>`;
        if (line.startsWith("## ")) return `<h2>${line.slice(3)}</h2>`;
        if (line.startsWith("# ")) return `<h1>${line.slice(2)}</h1>`;
        if (line.startsWith("- ")) return `<li>${line.slice(2)}</li>`;
        if (line.startsWith("**") && line.endsWith("**")) return `<p><strong>${line.slice(2, -2)}</strong></p>`;
        if (line.trim() === "") return "<p><br></p>";
        return `<p>${line}</p>`;
      }).join("") }]
    : undefined;

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
          initialPages={initialPages}
          initialTitle={incomingContent ? "AI Generated Document" : undefined}
        />
      </div>
    </div>
  );
}
