import { useState, useEffect } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
import { useAuth } from "@/contexts/AuthContext";
import { callEdgeFunctionStream } from "@/lib/edgeFunctionAuth";
import { supabase } from "@/integrations/supabase/client";
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
import { Mail, MessageSquare, FileText, Copy, Download, Loader2, Sparkles, ArrowRight, FileSignature, Printer, Palette } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import { StyleMatchPanel } from "@/components/StyleMatchPanel";
import ReactMarkdown from "react-markdown";

type WritingMode = "email" | "social" | "document" | "proposal" | "style-match";

export default function AIWriter() {
  usePageTitle("AI Writing Tools");
  const { user } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();

  const initialTab = (searchParams.get("tab") as WritingMode) || "email";
  const [mode, setMode] = useState<WritingMode>(initialTab);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [showRendered, setShowRendered] = useState(false);

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

  // Proposal fields
  const [proposalTone, setProposalTone] = useState("professional");
  const [leads, setLeads] = useState<any[]>([]);
  const [selectedLeadId, setSelectedLeadId] = useState("");
  const [proposalForm, setProposalForm] = useState({
    name: "", business_name: "", service_needed: "", city: "", state: "OH",
    phone: "", email: "", lead_type: "individual", notes: "",
  });

  // Load leads for proposal tab
  useEffect(() => {
    if (mode === "proposal" && user) {
      supabase.from("leads").select("*").order("created_at", { ascending: false }).limit(100)
        .then(({ data }) => { if (data) setLeads(data); });
    }
  }, [mode, user]);

  // Pre-fill from URL params
  useEffect(() => {
    const leadId = searchParams.get("leadId");
    if (leadId && leads.length > 0) {
      const lead = leads.find((l) => l.id === leadId);
      if (lead) {
        setSelectedLeadId(leadId);
        setProposalForm({
          name: lead.name || "", business_name: lead.business_name || "",
          service_needed: lead.service_needed || "", city: lead.city || "",
          state: lead.state || "OH", phone: lead.phone || "", email: lead.email || "",
          lead_type: lead.lead_type || "individual", notes: lead.notes || "",
        });
      }
    }
  }, [searchParams, leads]);

  const handleLeadSelect = (leadId: string) => {
    setSelectedLeadId(leadId);
    if (leadId === "manual") {
      setProposalForm({ name: "", business_name: "", service_needed: "", city: "", state: "OH", phone: "", email: "", lead_type: "individual", notes: "" });
      return;
    }
    const lead = leads.find((l) => l.id === leadId);
    if (lead) {
      setProposalForm({
        name: lead.name || "", business_name: lead.business_name || "",
        service_needed: lead.service_needed || "", city: lead.city || "",
        state: lead.state || "OH", phone: lead.phone || "", email: lead.email || "",
        lead_type: lead.lead_type || "individual", notes: lead.notes || "",
      });
    }
  };

  const buildPrompt = (): string => {
    if (mode === "email") {
      return `Write a ${emailTone} email for the following purpose: ${emailPurpose}\n\nKey points to include:\n${emailKeyPoints}\n\nProvide just the email with subject line, greeting, body, and sign-off. Use markdown formatting. Do not include any explanations.`;
    }
    if (mode === "social") {
      const platformNames: Record<string, string> = { linkedin: "LinkedIn", twitter: "Twitter/X", facebook: "Facebook", instagram: "Instagram" };
      return `Write a ${platformNames[socialPlatform]} post about: ${socialTopic}\n\nInclude relevant hashtags. Keep it engaging and platform-appropriate. Provide just the post text.`;
    }
    if (mode === "document") {
      const docTypes: Record<string, string> = { letter: "formal letter", memo: "business memo", proposal: "project proposal", report: "summary report" };
      return `Write a ${docTypes[docType]} based on this context: ${docContext}\n\nProvide the complete document with proper markdown formatting, headers, and structure. Do not include explanations.`;
    }
    return "";
  };

  const streamSSE = async (resp: Response) => {
    let soFar = "";
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
  };

  const generate = async () => {
    if (loading) return;

    if (mode === "proposal") {
      if (!proposalForm.name && !proposalForm.business_name) {
        toast({ title: "Please provide a name or business name", variant: "destructive" });
        return;
      }
      setLoading(true);
      setResult("");
      try {
        const resp = await callEdgeFunctionStream("generate-lead-proposal", {
          leadData: proposalForm,
          tone: proposalTone,
        }, 60000);
        if (!resp.ok) {
          const err = await resp.json().catch(() => ({ error: "AI unavailable" }));
          toast({ title: err.error || "Generation failed", variant: "destructive" });
          setLoading(false);
          return;
        }
        await streamSSE(resp);
      } catch {
        setResult("AI assistant is temporarily unavailable. Please try again later.");
      }
      setLoading(false);
      return;
    }

    const prompt = buildPrompt();
    if (!prompt || prompt.length < 20) {
      toast({ title: "Please fill in the required fields", variant: "destructive" });
      return;
    }
    setLoading(true);
    setResult("");
    try {
      const resp = await callEdgeFunctionStream("client-assistant", {
        messages: [{ role: "user", content: prompt }],
      }, 60000);
      if (!resp.ok) throw new Error("AI unavailable");
      await streamSSE(resp);
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
    const blob = new Blob([result], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${mode}-draft.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const printResult = () => {
    const win = window.open("", "_blank");
    if (win) {
      win.document.write(`<html><head><title>NotaryPrime Document</title><style>body{font-family:Georgia,serif;max-width:700px;margin:40px auto;padding:20px;line-height:1.6;white-space:pre-wrap;}</style></head><body>${result}</body></html>`);
      win.document.close();
      win.print();
    }
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
            Generate professional emails, social media posts, documents, proposals, and style-matched content.
          </p>
        </div>
      </section>

      <div className="container mx-auto px-4 py-8">
        <Breadcrumbs />
        <div className="mx-auto max-w-3xl">
          <Tabs value={mode} onValueChange={(v) => { setMode(v as WritingMode); setResult(""); }}>
            <TabsList className="mb-6 w-full flex-wrap h-auto gap-1">
              <TabsTrigger value="email" className="flex-1 gap-2"><Mail className="h-4 w-4" /> Email</TabsTrigger>
              <TabsTrigger value="social" className="flex-1 gap-2"><MessageSquare className="h-4 w-4" /> Social</TabsTrigger>
              <TabsTrigger value="document" className="flex-1 gap-2"><FileText className="h-4 w-4" /> Document</TabsTrigger>
              <TabsTrigger value="proposal" className="flex-1 gap-2"><FileSignature className="h-4 w-4" /> Proposal</TabsTrigger>
              <TabsTrigger value="style-match" className="flex-1 gap-2"><Palette className="h-4 w-4" /> Style Match</TabsTrigger>
            </TabsList>

            {/* Style-Match tab */}
            <TabsContent value="style-match">
              <StyleMatchPanel />
            </TabsContent>

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
                    <Textarea placeholder="What is the post about?..." value={socialTopic} onChange={(e) => setSocialTopic(e.target.value)} rows={4} />
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
                    <Textarea placeholder="Describe what this document is about..." value={docContext} onChange={(e) => setDocContext(e.target.value)} rows={5} />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="proposal">
              <Card>
                <CardHeader><CardTitle>Lead Proposal Generator</CardTitle></CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Select Lead</Label>
                    <Select value={selectedLeadId} onValueChange={handleLeadSelect}>
                      <SelectTrigger><SelectValue placeholder="Choose a lead or enter manually..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="manual">✏️ Enter Manually</SelectItem>
                        {leads.map((l) => (
                          <SelectItem key={l.id} value={l.id}>
                            {l.name || l.business_name || "Unknown"} {l.city ? `— ${l.city}` : ""} {l.service_needed ? `(${l.service_needed})` : ""}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Name *</Label>
                      <Input value={proposalForm.name} onChange={(e) => setProposalForm({ ...proposalForm, name: e.target.value })} placeholder="Lead name" />
                    </div>
                    <div>
                      <Label>Business Name</Label>
                      <Input value={proposalForm.business_name} onChange={(e) => setProposalForm({ ...proposalForm, business_name: e.target.value })} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Service Needed</Label>
                      <Input value={proposalForm.service_needed} onChange={(e) => setProposalForm({ ...proposalForm, service_needed: e.target.value })} placeholder="Notarization, RON, Loan Signing..." />
                    </div>
                    <div>
                      <Label>Tone</Label>
                      <Select value={proposalTone} onValueChange={setProposalTone}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="professional">Professional</SelectItem>
                          <SelectItem value="friendly">Friendly</SelectItem>
                          <SelectItem value="persuasive">Persuasive</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <Label>City</Label>
                      <Input value={proposalForm.city} onChange={(e) => setProposalForm({ ...proposalForm, city: e.target.value })} />
                    </div>
                    <div>
                      <Label>State</Label>
                      <Input value={proposalForm.state} onChange={(e) => setProposalForm({ ...proposalForm, state: e.target.value })} maxLength={2} />
                    </div>
                    <div>
                      <Label>Lead Type</Label>
                      <Select value={proposalForm.lead_type} onValueChange={(v) => setProposalForm({ ...proposalForm, lead_type: v })}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="individual">Individual</SelectItem>
                          <SelectItem value="business">Business</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Phone</Label>
                      <Input value={proposalForm.phone} onChange={(e) => setProposalForm({ ...proposalForm, phone: e.target.value })} placeholder="(614) 555-1234" />
                    </div>
                    <div>
                      <Label>Email</Label>
                      <Input value={proposalForm.email} onChange={(e) => setProposalForm({ ...proposalForm, email: e.target.value })} type="email" />
                    </div>
                  </div>
                  <div>
                    <Label>Additional Notes</Label>
                    <Textarea value={proposalForm.notes} onChange={(e) => setProposalForm({ ...proposalForm, notes: e.target.value })} rows={2} placeholder="Any context, special requirements, or details..." />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Generate button — not for style-match (it has its own) */}
          {mode !== "style-match" && (
            <div className="mt-4 flex justify-end">
              <Button onClick={generate} disabled={loading} size="lg">
                {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Generating...</> : <><Sparkles className="mr-2 h-4 w-4" /> Generate</>}
              </Button>
            </div>
          )}

          {result && mode !== "style-match" && (
            <motion.div initial="hidden" animate="visible" variants={fadeUp} custom={0} className="mt-6">
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <CardTitle className="text-lg">Result</CardTitle>
                    <div className="flex gap-2 flex-wrap">
                      <Button variant="outline" size="sm" onClick={() => setShowRendered(!showRendered)}>
                        {showRendered ? "Raw" : "Preview"}
                      </Button>
                      <Button variant="outline" size="sm" onClick={copyToClipboard}><Copy className="mr-1 h-3 w-3" /> Copy</Button>
                      <Button variant="outline" size="sm" onClick={downloadAsText}><Download className="mr-1 h-3 w-3" /> Download</Button>
                      {mode === "proposal" && (
                        <Button variant="outline" size="sm" onClick={printResult}><Printer className="mr-1 h-3 w-3" /> Print</Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {showRendered ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none rounded-lg bg-muted/30 p-4">
                      <ReactMarkdown>{result}</ReactMarkdown>
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap rounded-lg bg-muted p-4 text-sm text-foreground">{result}</div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          )}
        </div>
      </div>
    </PageShell>
  );
}
