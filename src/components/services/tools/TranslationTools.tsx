/**
 * Sprint 9: Translation Tools Panel
 * Side-by-side source/target, glossary, certification statement generator
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Copy, Plus, Trash2, Languages, FileCheck, BookOpen } from "lucide-react";
import { toast } from "sonner";

const LANGUAGES = [
  "Arabic", "Chinese (Simplified)", "Chinese (Traditional)", "English", "French",
  "German", "Hindi", "Italian", "Japanese", "Korean", "Portuguese", "Russian",
  "Spanish", "Tagalog", "Vietnamese", "Haitian Creole", "Somali", "Nepali",
];

interface GlossaryEntry { source: string; target: string; }

export function TranslationTools() {
  const [sourceLang, setSourceLang] = useState("Spanish");
  const [targetLang, setTargetLang] = useState("English");
  const [sourceText, setSourceText] = useState("");
  const [targetText, setTargetText] = useState("");
  const [glossary, setGlossary] = useState<GlossaryEntry[]>([]);
  const [newSource, setNewSource] = useState("");
  const [newTarget, setNewTarget] = useState("");
  const [translatorName, setTranslatorName] = useState("");

  const wordCount = (text: string) => text.trim().split(/\s+/).filter(Boolean).length;

  const addGlossaryEntry = () => {
    if (!newSource.trim() || !newTarget.trim()) return;
    setGlossary(prev => [...prev, { source: newSource.trim(), target: newTarget.trim() }]);
    setNewSource("");
    setNewTarget("");
  };

  const generateCertification = () => {
    const name = translatorName || "[Translator Full Name]";
    const cert = `CERTIFICATE OF TRANSLATION ACCURACY

I, ${name}, certify that I am fluent in the ${sourceLang} and ${targetLang} languages, and that the above translation of the attached document from ${sourceLang} to ${targetLang} is true, accurate, and complete to the best of my knowledge and abilities.

Translator: ${name}
Date: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
Language Pair: ${sourceLang} → ${targetLang}

Signature: ____________________________

This certification is made under penalty of perjury under the laws of the United States.`;
    navigator.clipboard.writeText(cert);
    toast.success("Certification statement copied to clipboard");
  };

  return (
    <div className="space-y-4">
      {/* Language Pair */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Languages className="h-4 w-4" /> Language Pair
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs">Source</Label>
              <Select value={sourceLang} onValueChange={setSourceLang}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Target</Label>
              <Select value={targetLang} onValueChange={setTargetLang}>
                <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Side-by-Side Editor */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">Side-by-Side View</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">{sourceLang}</Label>
                <Badge variant="secondary" className="text-[10px]">{wordCount(sourceText)} words</Badge>
              </div>
              <Textarea
                value={sourceText}
                onChange={e => setSourceText(e.target.value)}
                placeholder={`Paste ${sourceLang} text...`}
                className="min-h-[150px] text-sm"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label className="text-xs">{targetLang}</Label>
                <Badge variant="secondary" className="text-[10px]">{wordCount(targetText)} words</Badge>
              </div>
              <Textarea
                value={targetText}
                onChange={e => setTargetText(e.target.value)}
                placeholder={`Paste ${targetLang} translation...`}
                className="min-h-[150px] text-sm"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Glossary */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Glossary
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex gap-2">
            <Input placeholder="Source term" value={newSource} onChange={e => setNewSource(e.target.value)} className="h-8 text-xs" />
            <Input placeholder="Target term" value={newTarget} onChange={e => setNewTarget(e.target.value)} className="h-8 text-xs" />
            <Button size="sm" variant="outline" onClick={addGlossaryEntry} className="h-8 px-2"><Plus className="h-3 w-3" /></Button>
          </div>
          {glossary.length > 0 && (
            <ScrollArea className="max-h-[120px]">
              <div className="space-y-1">
                {glossary.map((entry, i) => (
                  <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-2 py-1">
                    <span>{entry.source} → {entry.target}</span>
                    <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => setGlossary(prev => prev.filter((_, idx) => idx !== i))}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Certification Statement */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileCheck className="h-4 w-4" /> Certification Statement
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div>
            <Label className="text-xs">Translator Name</Label>
            <Input value={translatorName} onChange={e => setTranslatorName(e.target.value)} placeholder="Full legal name" className="h-8 text-xs" />
          </div>
          <Button size="sm" onClick={generateCertification} className="w-full">
            <Copy className="h-3.5 w-3.5 mr-1" /> Generate & Copy Certification
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
