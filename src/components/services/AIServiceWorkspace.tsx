/**
 * Sprint 8: AI Service Workspace — full copilot sidebar with rich text output,
 * tone/style/length controls, quality review panel, and next steps widget.
 */
import { useState, useCallback } from "react";
import { useServiceAI, type AIMode } from "@/hooks/useServiceAI";
import { getServiceAIConfig, type ServiceAICategory } from "@/lib/serviceAIConfigs";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import ReactMarkdown from "react-markdown";
import {
  Sparkles, Send, RotateCcw, Copy, CheckCircle2, ListChecks,
  Lightbulb, FileEdit, Search, Wand2, Mail, StopCircle, Download
} from "lucide-react";
import { toast } from "sonner";

interface AIServiceWorkspaceProps {
  category: ServiceAICategory;
  initialContent?: string;
  onSave?: (content: string) => void;
  className?: string;
}

const MODE_OPTIONS: { value: AIMode; label: string; icon: React.ReactNode; description: string }[] = [
  { value: "generate", label: "Generate", icon: <Sparkles className="h-4 w-4" />, description: "Create new content" },
  { value: "review", label: "Review", icon: <Search className="h-4 w-4" />, description: "Analyze quality & compliance" },
  { value: "refine", label: "Refine", icon: <FileEdit className="h-4 w-4" />, description: "Improve existing content" },
  { value: "suggest_next", label: "Next Steps", icon: <Lightbulb className="h-4 w-4" />, description: "Get action suggestions" },
  { value: "autocomplete", label: "Autocomplete", icon: <Wand2 className="h-4 w-4" />, description: "Complete partial content" },
  { value: "outreach_email", label: "Outreach Email", icon: <Mail className="h-4 w-4" />, description: "Generate business emails" },
];

export function AIServiceWorkspace({ category, initialContent, onSave, className }: AIServiceWorkspaceProps) {
  const config = getServiceAIConfig(category);
  const { output, isStreaming, run, cancel, reset } = useServiceAI();

  const [mode, setMode] = useState<AIMode>("generate");
  const [tone, setTone] = useState(config.toneOptions[0] || "Professional");
  const [length, setLength] = useState(config.lengthOptions[1] || "Standard");
  const [instructions, setInstructions] = useState("");
  const [fields, setFields] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState("compose");

  const handleFieldChange = useCallback((key: string, value: string) => {
    setFields(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleRun = useCallback(() => {
    run({
      mode,
      category,
      fields: mode === "generate" || mode === "outreach_email" ? fields : undefined,
      content: mode !== "generate" ? (output || initialContent || "") : undefined,
      instructions: instructions || undefined,
      tone,
      length,
      previousOutput: mode === "refine" ? output : undefined,
    });
  }, [mode, category, fields, output, initialContent, instructions, tone, length, run]);

  const handleCopy = useCallback(async () => {
    if (!output) return;
    await navigator.clipboard.writeText(output);
    setCopied(true);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  }, [output]);

  const handleSave = useCallback(() => {
    if (output && onSave) {
      onSave(output);
      toast.success("Content saved");
    }
  }, [output, onSave]);

  const handleDownload = useCallback(() => {
    if (!output) return;
    const blob = new Blob([output], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${category}-output.md`;
    a.click();
    URL.revokeObjectURL(url);
  }, [output, category]);

  return (
    <div className={`grid grid-cols-1 lg:grid-cols-3 gap-4 ${className || ""}`}>
      {/* Left Panel: Controls */}
      <div className="lg:col-span-1 space-y-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" />
              AI Copilot — {config.label}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Mode</Label>
              <div className="grid grid-cols-2 gap-1.5">
                {MODE_OPTIONS.map(opt => (
                  <Button
                    key={opt.value}
                    variant={mode === opt.value ? "default" : "outline"}
                    size="sm"
                    className="justify-start gap-1.5 text-xs h-8"
                    onClick={() => setMode(opt.value)}
                  >
                    {opt.icon}
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>

            <Separator />

            {/* Dynamic Fields for Generate/Outreach modes */}
            {(mode === "generate" || mode === "outreach_email") && (
              <div className="space-y-2">
                <Label className="text-xs font-medium">Input Fields</Label>
                {config.suggestedFields.map(f => (
                  <div key={f.key}>
                    <Label className="text-xs text-muted-foreground">{f.label}</Label>
                    <Input
                      placeholder={f.placeholder}
                      value={fields[f.key] || ""}
                      onChange={e => handleFieldChange(f.key, e.target.value)}
                      className="h-8 text-sm"
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Tone & Length */}
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs font-medium">Tone</Label>
                <Select value={tone} onValueChange={setTone}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.toneOptions.map(t => (
                      <SelectItem key={t} value={t} className="text-xs">{t}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs font-medium">Length</Label>
                <Select value={length} onValueChange={setLength}>
                  <SelectTrigger className="h-8 text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {config.lengthOptions.map(l => (
                      <SelectItem key={l} value={l} className="text-xs">{l}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Additional Instructions */}
            <div>
              <Label className="text-xs font-medium">Instructions (optional)</Label>
              <Textarea
                placeholder="Additional instructions or context..."
                value={instructions}
                onChange={e => setInstructions(e.target.value)}
                className="text-sm min-h-[60px]"
                rows={2}
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2">
              {isStreaming ? (
                <Button variant="destructive" size="sm" onClick={cancel} className="flex-1">
                  <StopCircle className="h-4 w-4 mr-1" /> Stop
                </Button>
              ) : (
                <Button size="sm" onClick={handleRun} className="flex-1">
                  <Send className="h-4 w-4 mr-1" /> Run
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={reset}>
                <RotateCcw className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quality Checklist */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-xs flex items-center gap-1.5">
              <ListChecks className="h-3.5 w-3.5" /> Quality Checklist
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-1">
              {config.qualityChecklist.map((item, i) => (
                <li key={i} className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <CheckCircle2 className="h-3 w-3 mt-0.5 shrink-0 text-muted-foreground/50" />
                  {item}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Right Panel: Output */}
      <div className="lg:col-span-2">
        <Card className="h-full flex flex-col">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="h-8">
                  <TabsTrigger value="compose" className="text-xs h-6">Preview</TabsTrigger>
                  <TabsTrigger value="raw" className="text-xs h-6">Markdown</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="flex gap-1.5">
                {isStreaming && (
                  <Badge variant="secondary" className="text-xs animate-pulse">
                    Generating...
                  </Badge>
                )}
                <Button variant="ghost" size="sm" onClick={handleCopy} disabled={!output} className="h-7 px-2">
                  {copied ? <CheckCircle2 className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={handleDownload} disabled={!output} className="h-7 px-2">
                  <Download className="h-3.5 w-3.5" />
                </Button>
                {onSave && (
                  <Button variant="outline" size="sm" onClick={handleSave} disabled={!output} className="h-7 text-xs">
                    Save
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 min-h-0 p-0">
            <ScrollArea className="h-[500px] px-4 pb-4">
              {output ? (
                activeTab === "compose" ? (
                  <div className="prose prose-sm max-w-none dark:prose-invert">
                    <ReactMarkdown>{output}</ReactMarkdown>
                  </div>
                ) : (
                  <pre className="text-xs whitespace-pre-wrap font-mono text-muted-foreground">{output}</pre>
                )
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground py-20">
                  <Sparkles className="h-10 w-10 mb-3 opacity-30" />
                  <p className="text-sm font-medium">AI Copilot Ready</p>
                  <p className="text-xs mt-1">Select a mode, fill in the fields, and click Run</p>
                </div>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
