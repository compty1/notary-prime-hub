import { usePageTitle } from "@/lib/usePageTitle";
import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import {
  Upload, FileText, Download, Save, Loader2, ChevronLeft, Eye, Menu, Languages,
  Bold, Italic, Underline as UnderlineIcon, AlignLeft, AlignCenter, AlignRight,
  List, ListOrdered, Heading1, Heading2, Undo, Redo, Trash2, FolderOpen, Printer
} from "lucide-react";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import TiptapUnderline from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";

const LANGUAGES = ["English","Spanish","French","German","Chinese","Japanese","Korean","Arabic","Russian","Vietnamese","Tagalog","Portuguese","Italian","Hindi","Polish","Dutch"];

type DigiStep = "upload" | "processing" | "edit" | "done";

interface ProcessedDoc {
  fileName: string;
  html: string;
}

export default function DocumentDigitize() {
  usePageTitle("Digitize Documents");
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<DigiStep>("upload");
  const [files, setFiles] = useState<File[]>([]);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [processedDocs, setProcessedDocs] = useState<ProcessedDoc[]>([]);
  const [activeDocIndex, setActiveDocIndex] = useState(0);
  const [saving, setSaving] = useState(false);
  const [activeMode, setActiveMode] = useState<"digitize" | "translate">("digitize");
  const [sourceLang, setSourceLang] = useState("Spanish");
  const [targetLang, setTargetLang] = useState("English");
  const [translating, setTranslating] = useState(false);
  const [translationResult, setTranslationResult] = useState("");

  const editor = useEditor({
    extensions: [
      StarterKit,
      TiptapUnderline,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "prose prose-sm dark:prose-invert max-w-none min-h-[400px] p-4 focus:outline-none",
      },
    },
  });

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || []);
    if (selected.length === 0) return;
    setFiles(selected);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const dropped = Array.from(e.dataTransfer.files).filter(
      f => f.type.startsWith("image/") || f.type === "application/pdf"
    );
    if (dropped.length > 0) setFiles(dropped);
  }, []);

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        resolve(result.split(",")[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const processFiles = async () => {
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to use document digitization.", variant: "destructive" });
      navigate("/login");
      return;
    }
    setProcessing(true);
    setStep("processing");
    const results: ProcessedDoc[] = [];

    for (let i = 0; i < files.length; i++) {
      setProgress(Math.round(((i) / files.length) * 100));
      try {
        const base64 = await fileToBase64(files[i]);
        const { data, error } = await supabase.functions.invoke("ocr-digitize", {
          body: { image_base64: base64, file_name: files[i].name },
        });
        if (error) throw error;
        results.push({ fileName: files[i].name, html: data.html || "<p>No content detected.</p>" });
      } catch (err: any) {
        console.error("OCR error:", err);
        results.push({ fileName: files[i].name, html: `<p style="color:red">Error processing ${files[i].name}: ${err.message || "Unknown error"}</p>` });
      }
    }

    setProgress(100);
    setProcessedDocs(results);
    setActiveDocIndex(0);
    if (results.length > 0 && editor) {
      editor.commands.setContent(results[0].html);
    }
    setStep("edit");
    setProcessing(false);
  };

  const switchDoc = (index: number) => {
    // Save current editor content back to processedDocs
    if (editor) {
      const updated = [...processedDocs];
      updated[activeDocIndex] = { ...updated[activeDocIndex], html: editor.getHTML() };
      setProcessedDocs(updated);
    }
    setActiveDocIndex(index);
    if (editor && processedDocs[index]) {
      editor.commands.setContent(processedDocs[index].html);
    }
  };

  const handleSaveToVault = async () => {
    if (!user || !editor) return;
    setSaving(true);
    try {
      // Save current editor content
      const html = editor.getHTML();
      const fileName = processedDocs[activeDocIndex]?.fileName?.replace(/\.[^.]+$/, "") + "_digitized.html";
      const blob = new Blob([html], { type: "text/html" });
      const filePath = `${user.id}/${Date.now()}_${fileName}`;

      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, blob);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("documents").insert({
        uploaded_by: user.id,
        file_name: fileName,
        file_path: filePath,
        status: "uploaded" as any,
      });
      if (dbError) throw dbError;

      toast({ title: "Saved to Vault", description: `${fileName} has been saved to your document vault.` });
    } catch (err: any) {
      toast({ title: "Save failed", description: err.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const handlePrint = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${processedDocs[activeDocIndex]?.fileName || "Document"}</title><style>body{font-family:serif;padding:2rem;max-width:800px;margin:0 auto;line-height:1.6}table{border-collapse:collapse;width:100%}td,th{border:1px solid #ccc;padding:8px}</style></head><body>${html}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportDocx = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const content = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'><head><meta charset="utf-8"><style>body{font-family:serif;line-height:1.6}</style></head><body>${html}</body></html>`;
    const blob = new Blob([content], { type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = (processedDocs[activeDocIndex]?.fileName?.replace(/\.[^.]+$/, "") || "document") + ".doc";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!editor) return null;

  const handleTranslate = async () => {
    if (!editor || !user) return;
    setTranslating(true);
    try {
      const text = editor.getText();
      const { data, error } = await supabase.functions.invoke("translate-document", {
        body: { text, source_language: sourceLang, target_language: targetLang },
      });
      if (error) throw error;
      setTranslationResult(data.translated_text || data.translation || "Translation unavailable.");
      toast({ title: "Translation complete" });
    } catch (err: any) {
      toast({ title: "Translation failed", description: err.message, variant: "destructive" });
    }
    setTranslating(false);
  };

  return (
    <PageShell>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        {/* Mode tabs */}
        <Tabs value={activeMode} onValueChange={v => setActiveMode(v as any)} className="mb-6">
          <TabsList>
            <TabsTrigger value="digitize"><Eye className="mr-1 h-4 w-4" /> Digitize</TabsTrigger>
            <TabsTrigger value="translate"><Languages className="mr-1 h-4 w-4" /> Translate</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Steps indicator */}
        <div className="mb-8 flex items-center justify-center gap-4">
          {[
            { key: "upload", label: "Upload", icon: Upload },
            { key: "processing", label: "Process", icon: Loader2 },
            { key: "edit", label: "Edit & Export", icon: FileText },
          ].map((s, i) => (
            <div key={s.key} className="flex items-center gap-2">
              <div className={`flex h-8 w-8 items-center justify-center rounded-full ${
                step === s.key ? "bg-primary text-primary-foreground" :
                ["processing", "edit", "done"].indexOf(step) > ["upload", "processing", "edit"].indexOf(s.key) ? "bg-primary/20 text-primary" :
                "bg-muted text-muted-foreground"
              }`}>
                <s.icon className={`h-4 w-4 ${step === "processing" && s.key === "processing" ? "animate-spin" : ""}`} />
              </div>
              <span className="hidden text-sm font-medium sm:inline">{s.label}</span>
              {i < 2 && <div className="h-0.5 w-8 bg-border" />}
            </div>
          ))}
        </div>

        {/* Upload Step */}
        {step === "upload" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-sans">Upload Documents for Digitization</CardTitle>
              </CardHeader>
              <CardContent>
                <div
                  className="rounded-lg border-2 border-dashed border-primary/20 bg-primary/5 p-12 text-center cursor-pointer hover:border-primary/50 transition-colors"
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={handleDrop}
                  onClick={() => document.getElementById("digi-file-input")?.click()}
                >
                  <Upload className="mx-auto mb-4 h-12 w-12 text-primary/60" />
                  <p className="mb-2 font-medium text-foreground">Drag & drop or click to upload</p>
                  <p className="text-sm text-muted-foreground">Images (JPG, PNG) or PDF documents • Multiple files supported</p>
                  <input
                    id="digi-file-input"
                    type="file"
                    accept="image/*,.pdf"
                    multiple
                    className="hidden"
                    onChange={handleFileSelect}
                  />
                </div>

                {files.length > 0 && (
                  <div className="mt-4 space-y-2">
                    <p className="text-sm font-medium">{files.length} file(s) selected:</p>
                    {files.map((f, i) => (
                      <div key={i} className="flex items-center justify-between rounded border border-border/50 p-2 text-sm">
                        <span className="flex items-center gap-2"><FileText className="h-4 w-4 text-primary" /> {f.name}</span>
                        <span className="text-muted-foreground">{(f.size / 1024).toFixed(0)} KB</span>
                      </div>
                    ))}
                    <Button onClick={processFiles} className="mt-4 w-full ">
                      <Eye className="mr-2 h-4 w-4" /> Digitize {files.length} Document{files.length > 1 ? "s" : ""}
                    </Button>
                  </div>
                )}

                <div className="mt-6 rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                  <p className="font-medium text-foreground mb-2">How it works:</p>
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Upload a scanned document or photo</li>
                    <li>Our AI transcribes the text with original formatting</li>
                    <li>Edit the result with our rich text editor</li>
                    <li>Export as PDF, DOCX, or save to your cloud vault</li>
                  </ol>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Processing Step */}
        {step === "processing" && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <Card className="border-border/50">
              <CardContent className="py-16 text-center">
                <Loader2 className="mx-auto mb-4 h-12 w-12 animate-spin text-primary" />
                <h2 className="mb-2 font-sans text-xl font-bold">Processing Documents...</h2>
                <p className="mb-4 text-muted-foreground">AI is transcribing your documents with OCR</p>
                <div className="mx-auto max-w-xs">
                  <Progress value={progress} className="h-2" />
                  <p className="mt-2 text-sm text-muted-foreground">{progress}% complete</p>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Edit Step */}
        {step === "edit" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {/* Document tabs if multiple */}
            {processedDocs.length > 1 && (
              <div className="mb-4 flex gap-2 overflow-x-auto">
                {processedDocs.map((doc, i) => (
                  <Button
                    key={i}
                    size="sm"
                    variant={i === activeDocIndex ? "default" : "outline"}
                    className={i === activeDocIndex ? "bg-primary text-primary-foreground" : ""}
                    onClick={() => switchDoc(i)}
                  >
                    <FileText className="mr-1 h-3 w-3" /> {doc.fileName}
                  </Button>
                ))}
              </div>
            )}

            <Card className="border-border/50">
              <CardHeader className="pb-0">
                <div className="flex items-center justify-between">
                  <CardTitle className="font-sans text-lg">
                    {processedDocs[activeDocIndex]?.fileName || "Document"} — Edit
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => { setStep("upload"); setFiles([]); setProcessedDocs([]); }}>
                      <Trash2 className="mr-1 h-3 w-3" /> New
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {/* Toolbar */}
                <div className="mb-2 flex flex-wrap items-center gap-1 rounded-lg border border-border/50 bg-muted/30 p-2">
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBold().run()} className={editor.isActive("bold") ? "bg-primary/20" : ""}><Bold className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleItalic().run()} className={editor.isActive("italic") ? "bg-primary/20" : ""}><Italic className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleUnderline().run()} className={editor.isActive("underline") ? "bg-primary/20" : ""}><UnderlineIcon className="h-4 w-4" /></Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} className={editor.isActive("heading", { level: 1 }) ? "bg-primary/20" : ""}><Heading1 className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} className={editor.isActive("heading", { level: 2 }) ? "bg-primary/20" : ""}><Heading2 className="h-4 w-4" /></Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("left").run()} className={editor.isActive({ textAlign: "left" }) ? "bg-primary/20" : ""}><AlignLeft className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("center").run()} className={editor.isActive({ textAlign: "center" }) ? "bg-primary/20" : ""}><AlignCenter className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().setTextAlign("right").run()} className={editor.isActive({ textAlign: "right" }) ? "bg-primary/20" : ""}><AlignRight className="h-4 w-4" /></Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleBulletList().run()} className={editor.isActive("bulletList") ? "bg-primary/20" : ""}><List className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().toggleOrderedList().run()} className={editor.isActive("orderedList") ? "bg-primary/20" : ""}><ListOrdered className="h-4 w-4" /></Button>
                  <div className="h-5 w-px bg-border mx-1" />
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().undo().run()}><Undo className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => editor.chain().focus().redo().run()}><Redo className="h-4 w-4" /></Button>
                </div>

                {/* Editor */}
                <div className="rounded-lg border border-border/50 bg-card min-h-[400px]">
                  <EditorContent editor={editor} />
                </div>

                {/* Export actions */}
                <div className="mt-4 flex flex-wrap gap-3">
                  <Button onClick={handleSaveToVault} disabled={saving} className="">
                    {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FolderOpen className="mr-2 h-4 w-4" />}
                    Save to Vault
                  </Button>
                  <Button variant="outline" onClick={handlePrint}>
                    <Printer className="mr-2 h-4 w-4" /> Print / PDF
                  </Button>
                  <Button variant="outline" onClick={handleExportDocx}>
                    <Download className="mr-2 h-4 w-4" /> Export DOCX
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Translation panel - shown after edit step when in translate mode */}
        {activeMode === "translate" && step === "edit" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6">
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="font-sans text-lg flex items-center gap-2">
                  <Languages className="h-5 w-5 text-primary" /> Translate Document
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Source Language</Label>
                    <Select value={sourceLang} onValueChange={setSourceLang}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Target Language</Label>
                    <Select value={targetLang} onValueChange={setTargetLang}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>{LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                </div>
                <Button onClick={handleTranslate} disabled={translating}>
                  {translating ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Translating...</> : <><Languages className="mr-2 h-4 w-4" /> Translate</>}
                </Button>
                {translationResult && (
                  <div className="rounded-lg border border-border/50 bg-muted/30 p-4 max-h-[300px] overflow-y-auto">
                    <p className="text-sm whitespace-pre-wrap">{translationResult}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </div>

    </PageShell>
  );
}
