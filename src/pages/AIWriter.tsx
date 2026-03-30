import { useState } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { callEdgeFunctionStream } from "@/lib/edgeFunctionAuth";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { fadeUp } from "@/lib/animations";
import { Mail, MessageSquare, FileText, Copy, Download, Loader2, Sparkles, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";

type WritingMode = "email" | "social" | "document";

export default function AIWriter() {
  usePageTitle("AI Writing Tools");
  const { user } = useAuth();
  const { toast } = useToast();

  const [mode, setMode] = useState<WritingMode>("email");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");

  // Email fields
  const [emailTone, setEmailTone] = useState("professional");
  const [emailPurpose, setEmailPurpose] = useState("");
  const [emailKeyPoints, setEmailKeyPoints] = useState("");

  // Social fields
  const [socialPlatform, setSocialPlatform] = useState("linkedin");
  const [socialTopic, setSocialTopic] = useState("");

  // Document fields
  const [docType, setDocType] = useState("letter");
  const [docContext, setDocContext] = useState("");

  const buildPrompt = (): string => {
    if (mode === "email") {
      return `Write a ${emailTone} email for the following purpose: ${emailPurpose}\n\nKey points to include:\n${emailKeyPoints}\n\nProvide just the email with subject line, greeting, body, and sign-off. Do not include any explanations.`;
    }
    if (mode === "social") {
      const platformNames: Record<string, string> = { linkedin: "LinkedIn", twitter: "Twitter/X", facebook: "Facebook", instagram: "Instagram" };
      return `Write a ${platformNames[socialPlatform]} post about: ${socialTopic}\n\nInclude relevant hashtags. Keep it engaging and platform-appropriate. Provide just the post text.`;
    }
    const docTypes: Record<string, string> = { letter: "formal letter", memo: "business memo", proposal: "project proposal", report: "summary report" };
    return `Write a ${docTypes[docType]} based on this context: ${docContext}\n\nProvide the complete document with proper formatting, headers, and structure. Do not include explanations.`;
  };

  const generate = async () => {
    if (loading) return;
    const prompt = buildPrompt();
    if (!prompt || prompt.length < 20) {
      toast({ title: "Please fill in the required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    let soFar = "";
    try {
      const resp = await callEdgeFunctionStream("client-assistant", {
        messages: [{ role: "user", content: prompt }],
      }, 60000);
      if (!resp.ok) throw new Error("AI unavailable");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) { soFar += content; setResult(soFar); }
          } catch { /* partial */ }
        }
      }
    } catch {
      setResult("AI assistant is temporarily unavailable. Please try again later.");
    }
    setLoading(false);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(result);
    toast({ title: "Copied to clipboard!" });
  };

  const downloadAsText = () => {
    const blob = new Blob([result], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mode}-draft.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!user) {
    return (
      <PageShell>
        <div className="container mx-auto px-4 py-20 text-center">
          <Sparkles className="mx-auto mb-4 h-12 w-12 text-primary" />
          <h1 className="mb-4 text-3xl font-bold text-foreground">AI Writing Tools</h1>
          <p className="mb-6 text-muted-foreground">Sign in to access AI-powered writing tools.</p>
          <Link to="/login"><Button size="lg">Sign In <ArrowRight className="ml-2 h-4 w-4" /></Button></Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <section className="border-b border-border bg-card py-12">
        <div className="container mx-auto px-4 text-center">
          <Badge variant="secondary" className="mb-3"><Sparkles className="mr-1 h-3 w-3" /> AI-Powered</Badge>
          <h1 className="mb-3 text-3xl font-bold text-foreground md:text-4xl">AI Writing Tools</h1>
          <p className="mx-auto max-w-xl text-muted-foreground">
            Generate professional emails, social media posts, and documents in seconds.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="mx-auto max-w-3xl">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as WritingMode); setResult(""); }}>
            <TabsList className="mb-6 w-full">
              <TabsTrigger value="email" className="flex-1 gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
              <TabsTrigger value="social" className="flex-1 gap-2"><MessageSquare className="h-4 w-4" /> Social Post</TabsTrigger>
              <TabsTrigger value="document" className="flex-1 gap-2"><FileText className="h-4 w-4" /> Document</TabsTrigger>
            </TabsList>

            <TabsContent value="email">
              <Card>
                <CardHeader><CardTitle>Email Generator</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Tone</Label>
                    <Select value={emailTone} onValueChange={setEmailTone}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="professional">Professional</SelectItem>
                        <SelectItem value="friendly">Friendly</SelectItem>
                        <SelectItem value="formal">Formal</SelectItem>
                        <SelectItem value="persuasive">Persuasive</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Purpose *</Label>
                    <Input placeholder="e.g., Follow up on a meeting, Request a quote..." value={emailPurpose} onChange={(e) => setEmailPurpose(e.target.value)} />
                  </div>
                  <div>
                    <Label>Key Points</Label>
                    <Textarea placeholder="List the main points you want included..." value={emailKeyPoints} onChange={(e) => setEmailKeyPoints(e.target.value)} rows={4} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="social">
              <Card>
                <CardHeader><CardTitle>Social Media Post</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Platform</Label>
                    <Select value={socialPlatform} onValueChange={setSocialPlatform}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="linkedin">LinkedIn</SelectItem>
                        <SelectItem value="twitter">Twitter / X</SelectItem>
                        <SelectItem value="facebook">Facebook</SelectItem>
                        <SelectItem value="instagram">Instagram</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Topic *</Label>
                    <Textarea placeholder="What is the post about? Include any context, announcements, or key messages..." value={socialTopic} onChange={(e) => setSocialTopic(e.target.value)} rows={4} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="document">
              <Card>
                <CardHeader><CardTitle>Document Draft</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Document Type</Label>
                    <Select value={docType} onValueChange={setDocType}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="letter">Formal Letter</SelectItem>
                        <SelectItem value="memo">Business Memo</SelectItem>
                        <SelectItem value="proposal">Project Proposal</SelectItem>
                        <SelectItem value="report">Summary Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Context & Details *</Label>
                    <Textarea placeholder="Describe what this document is about, who it's for, and any specific details to include..." value={docContext} onChange={(e) => setDocContext(e.target.value)} rows={5} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <div className="mt-4 flex justify-end">
            <Button onClick={generate} disabled={loading} size="lg">
              {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate</>}
            </Button>
          </div>

          {result && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">Result</CardTitle>
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="mr-1 h-3 w-3" /> Copy</Button>
                      <Button variant="outline" size="sm" onClick={downloadAsText}><Download className="mr-1 h-3 w-3" /> Download</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm text-foreground">{result}</div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
