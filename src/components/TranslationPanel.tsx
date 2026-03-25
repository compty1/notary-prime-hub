import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Languages, Download, Printer, Loader2, Copy } from "lucide-react";

const LANGUAGES = [
  "Spanish", "French", "German", "Portuguese", "Italian", "Chinese (Simplified)",
  "Chinese (Traditional)", "Japanese", "Korean", "Arabic", "Russian", "Hindi",
  "Vietnamese", "Tagalog", "Haitian Creole", "Somali", "Nepali", "Swahili",
];

interface TranslationPanelProps {
  initialText?: string;
  clientName?: string;
  documentType?: string;
}

export default function TranslationPanel({ initialText = "", clientName = "", documentType = "" }: TranslationPanelProps) {
  const { toast } = useToast();
  const [sourceText, setSourceText] = useState(initialText);
  const [sourceLanguage, setSourceLanguage] = useState("English");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [certificate, setCertificate] = useState("");
  const [translating, setTranslating] = useState(false);

  const handleTranslate = async () => {
    if (!sourceText.trim() || !targetLanguage) {
      toast({ title: "Missing fields", description: "Enter text and select target language.", variant: "destructive" });
      return;
    }
    setTranslating(true);
    try {
      const { data, error } = await supabase.functions.invoke("translate-document", {
        body: {
          text: sourceText,
          source_language: sourceLanguage,
          target_language: targetLanguage,
          document_type: documentType,
          client_name: clientName,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setTranslatedText(data.translated_text);
      setCertificate(data.certificate);
      toast({ title: "Translation complete" });
    } catch (e: any) {
      toast({ title: "Translation failed", description: e.message, variant: "destructive" });
    }
    setTranslating(false);
  };

  const downloadText = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const printContent = (content: string, title: string) => {
    const w = window.open("", "_blank");
    if (w) {
      w.document.write(`<html><head><title>${title}</title><style>body{font-family:serif;padding:2rem;line-height:1.8;white-space:pre-wrap;max-width:700px;margin:0 auto}</style></head><body>${content.replace(/\n/g, "<br/>")}</body></html>`);
      w.document.close();
      w.print();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Languages className="h-5 w-5 text-primary" />
        <h3 className="font-sans font-semibold">Document Translation</h3>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Source Language</Label>
          <Select value={sourceLanguage} onValueChange={setSourceLanguage}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="English">English</SelectItem>
              {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Target Language *</Label>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
            <SelectContent>
              {LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <div>
          <Label>Original Text</Label>
          <Textarea value={sourceText} onChange={(e) => setSourceText(e.target.value)} rows={10} placeholder="Paste document text here..." className="font-mono text-xs" />
        </div>
        <div>
          <Label>Translated Text</Label>
          <Textarea value={translatedText} readOnly rows={10} placeholder="Translation will appear here..." className="font-mono text-xs bg-muted/30" />
        </div>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        <Button onClick={handleTranslate} disabled={translating || !sourceText.trim() || !targetLanguage} className="bg-gradient-primary text-white hover:opacity-90">
          {translating ? <Loader2 className="mr-1 h-4 w-4 animate-spin" /> : <Languages className="mr-1 h-4 w-4" />}
          Translate
        </Button>

        {translatedText && (
          <>
            <Button variant="outline" size="sm" onClick={() => { navigator.clipboard.writeText(translatedText); toast({ title: "Copied" }); }}>
              <Copy className="mr-1 h-3 w-3" /> Copy
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadText(translatedText, `translated_${targetLanguage.toLowerCase()}.txt`)}>
              <Download className="mr-1 h-3 w-3" /> Download
            </Button>
            <Button variant="outline" size="sm" onClick={() => printContent(translatedText, `Translation — ${targetLanguage}`)}>
              <Printer className="mr-1 h-3 w-3" /> Print
            </Button>
          </>
        )}
      </div>

      {certificate && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-sans text-sm font-semibold">Certificate of Translation Accuracy</h4>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => downloadText(certificate, "translation_certificate.txt")}>
                  <Download className="h-3 w-3" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => printContent(certificate, "Certificate of Translation Accuracy")}>
                  <Printer className="h-3 w-3" />
                </Button>
              </div>
            </div>
            <pre className="text-xs text-muted-foreground whitespace-pre-wrap font-serif bg-muted/50 rounded p-3">{certificate}</pre>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
