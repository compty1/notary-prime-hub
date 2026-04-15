import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { DocuDexEditor } from "@/components/DocuDexEditor";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Loader2, Users, FileText, Sparkles } from "lucide-react";

// Professional templates for service fulfillment
const PRO_TEMPLATES = [
  { id: "notary_cert", label: "Notarization Certificate", service: "notarization", content: "<h1>Certificate of Notarization</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>On this ___ day of ____________, 20___, before me, a Notary Public in and for the State of Ohio, personally appeared ____________, known to me (or proved to me on the basis of satisfactory evidence) to be the person whose name is subscribed to the within instrument and acknowledged to me that they executed the same.</p><p><strong>Witness</strong> my hand and official seal.</p><p>___________________________<br>Notary Public, State of Ohio<br>My Commission Expires: ____________<br>Commission Number: ____________</p>" },
  { id: "deed_prep", label: "Deed Preparation", service: "deed", content: "<h1>Warranty Deed</h1><p>This deed is made on ____________, by and between:</p><p><strong>Grantor:</strong> ____________<br><strong>Grantee:</strong> ____________</p><h2>Property Description</h2><p></p><h2>Consideration</h2><p>For and in consideration of ____________ DOLLARS ($____________) and other good and valuable consideration.</p><h2>Covenants</h2><p>The Grantor covenants that they are lawfully seized of the above-described property and have good right to convey the same.</p>" },
  { id: "affidavit_prep", label: "Affidavit", service: "affidavit", content: "<h1>Affidavit</h1><p><strong>State of Ohio</strong><br>County of ____________</p><p>I, ____________, being first duly sworn upon oath, depose and state as follows:</p><ol><li></li><li></li></ol><p>Further Affiant sayeth naught.</p><p>___________________________<br>Affiant</p><p>Sworn to and subscribed before me this ___ day of ____________, 20___.</p><p>___________________________<br>Notary Public</p>" },
  { id: "poa_prep", label: "Power of Attorney", service: "poa", content: "<h1>General Power of Attorney</h1><p>I, ____________ (\"Principal\"), of ____________, Ohio, do hereby appoint ____________ (\"Agent\") of ____________, as my true and lawful attorney-in-fact.</p><h2>Powers Granted</h2><ul><li>Real property transactions</li><li>Banking and financial transactions</li><li>Legal proceedings</li></ul><h2>Duration</h2><p>This Power of Attorney shall remain in effect until revoked by the Principal in writing.</p><p>Executed this ___ day of ____________, 20___.</p><p>___________________________<br>Principal</p>" },
  { id: "loan_signing", label: "Loan Signing Package", service: "loan_signing", content: "<h1>Loan Signing Cover Sheet</h1><p><strong>Date:</strong> ____________<br><strong>Loan Officer:</strong> ____________<br><strong>Borrower(s):</strong> ____________<br><strong>Property Address:</strong> ____________<br><strong>Loan Number:</strong> ____________</p><h2>Documents in Package</h2><ol><li>Deed of Trust / Mortgage</li><li>Promissory Note</li><li>Closing Disclosure</li><li>Right to Cancel</li></ol><h2>Signing Instructions</h2><p></p><h2>Return Instructions</h2><p></p>" },
  { id: "general_doc", label: "General Document", service: "general", content: "<h1>Document Title</h1><p>Prepared for: ____________<br>Date: ____________</p><p></p>" },
];

export default function AdminDocuDexPro() {
  usePageMeta({ title: "DocuDex Pro | Admin", noIndex: true });
  const { user } = useAuth();
  const { toast } = useToast();

  const [clients, setClients] = useState<Record<string, unknown>[]>([]);
  const [appointments, setAppointments] = useState<Record<string, unknown>[]>([]);
  const [selectedClient, setSelectedClient] = useState<string>("none");
  const [selectedAppointment, setSelectedAppointment] = useState<string>("none");
  const [selectedTemplate, setSelectedTemplate] = useState<string>("none");
  const [showEditor, setShowEditor] = useState(false);
  const [initialPages, setInitialPages] = useState<{ id: string; html: string }[]>([]);
  const [initialTitle, setInitialTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  const clientProfile = clients.find(c => c.user_id === selectedClient);
  const appointment = appointments.find(a => a.id === selectedAppointment);

  useEffect(() => {
    const load = async () => {
      const [{ data: profileData }, { data: apptData }] = await Promise.all([
        supabase.from("profiles").select("user_id, full_name, email, phone").order("full_name"),
        supabase.from("appointments").select("id, client_id, service_type, scheduled_date, status, confirmation_number").order("scheduled_date", { ascending: false }).limit(100),
      ]);
      setClients(profileData || []);
      setAppointments(apptData || []);
      setLoading(false);
    };
    load();
  }, []);

  // Filter appointments by selected client
  const filteredAppointments = selectedClient !== "none"
    ? appointments.filter(a => a.client_id === selectedClient)
    : appointments;

  // Start with template
  const startWithTemplate = (templateId: string) => {
    const tpl = PRO_TEMPLATES.find(t => t.id === templateId);
    if (!tpl) return;
    // Auto-populate client data
    let content = tpl.content;
    if (clientProfile) {
      content = content.replace(/____________ \(client name\)|personally appeared ____________/g, `personally appeared ${clientProfile.full_name || "____________"}`);
    }
    setInitialPages([{ id: crypto.randomUUID(), html: content }]);
    setInitialTitle(tpl.label + (clientProfile ? ` — ${clientProfile.full_name}` : ""));
    setShowEditor(true);
  };

  // AI Generate for service
  const generateForService = async () => {
    if (!appointment) {
      toast({ title: "Select an appointment", variant: "destructive" });
      return;
    }
    setGenerating(true);
    try {
      const prompt = `Generate a professional notarization document for the following service:\n\nService: ${appointment.service_type}\nClient: ${clientProfile?.full_name || "Unknown"}\nDate: ${appointment.scheduled_date}\nConfirmation: ${appointment.confirmation_number || "N/A"}\n\nGenerate a complete, ready-to-use document in clean HTML format. Include all necessary legal language for Ohio notarization compliance (ORC §147).`;
      const resp = await supabase.functions.invoke("notary-assistant", {
        body: {
          messages: [
            { role: "system", content: "You are a professional legal document generator for Ohio notary services. Generate complete, ready-to-use documents in clean HTML (p, h1-h3, ul, ol, li, strong, em, table tags). Include proper legal language for Ohio notarization." },
            { role: "user", content: prompt },
          ],
        },
      });
      if (resp.error) throw resp.error;
      const text = typeof resp.data === "string" ? resp.data : resp.data?.response || resp.data?.content || "";
      setInitialPages([{ id: crypto.randomUUID(), html: text }]);
      setInitialTitle(`${appointment.service_type} — ${clientProfile?.full_name || "Client"}`);
      setShowEditor(true);
    } catch (e: any) {
      toast({ title: "Generation failed", description: e.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // Save handler
  const handleSave = async (title: string, pages: { id: string; html: string }[]) => {
    if (!user) return;
    const combinedHtml = pages.map(p => p.html).join("\n<!-- page-break -->\n");
    const fileName = `${title || "DocuDex Pro Document"}.html`;
    const filePath = `docudex-pro/${user.id}/${Date.now()}-${fileName}`;
    const blob = new Blob([combinedHtml], { type: "text/html" });

    const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, blob);
    if (uploadError) throw uploadError;

    const { error: dbError } = await supabase.from("documents").insert({
      file_name: fileName,
      file_path: filePath,
      uploaded_by: user.id,
      appointment_id: selectedAppointment !== "none" ? selectedAppointment : null,
      status: "uploaded",
    });
    if (dbError) throw dbError;

    toast({ title: "Document saved", description: "Saved to document vault" + (selectedAppointment !== "none" ? " and linked to appointment." : ".") });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (showEditor) {
    return (
      <div className="flex flex-col h-[calc(100vh-48px)]">
        <div className="flex items-center justify-between border-b border-border bg-card px-4 py-2">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => setShowEditor(false)}>← Back to Setup</Button>
            {clientProfile && <Badge variant="outline" className="text-xs"><Users className="h-3 w-3 mr-1" />{clientProfile.full_name}</Badge>}
            {appointment && <Badge variant="outline" className="text-xs"><FileText className="h-3 w-3 mr-1" />{appointment.service_type}</Badge>}
          </div>
        </div>
        <div className="flex-1">
          <DocuDexEditor
            initialPages={initialPages}
            initialTitle={initialTitle}
            onSave={handleSave}
            maxChars={500000}
            clientName={clientProfile?.full_name}
            serviceName={appointment?.service_type}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">DocuDex Pro</h1>
        <p className="text-sm text-muted-foreground">Professional document generation for client services. Generate, edit, and deliver notarization documents.</p>
      </div>

      {/* Client & appointment selectors */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardContent className="p-4">
            <Label className="text-xs mb-2 block">Select Client</Label>
            <Select value={selectedClient} onValueChange={setSelectedClient}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Choose a client..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No client selected —</SelectItem>
                {clients.map(c => (
                  <SelectItem key={c.user_id} value={c.user_id}>{c.full_name || c.email}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            {clientProfile && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Email: {clientProfile.email}</p>
                {clientProfile.phone && <p>Phone: {clientProfile.phone}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <Label className="text-xs mb-2 block">Link to Appointment</Label>
            <Select value={selectedAppointment} onValueChange={setSelectedAppointment}>
              <SelectTrigger className="h-9"><SelectValue placeholder="Choose appointment..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">— No appointment —</SelectItem>
                {filteredAppointments.map(a => (
                  <SelectItem key={a.id} value={a.id}>
                    {a.service_type} — {a.scheduled_date} ({a.status})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {appointment && (
              <div className="mt-2 text-xs text-muted-foreground">
                <p>Confirmation: {appointment.confirmation_number || "N/A"}</p>
                <p>Status: <Badge variant="secondary" className="text-[10px]">{appointment.status}</Badge></p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* AI Generate */}
      {appointment && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" /> AI Document Generation
                </h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Generate a complete document for {appointment.service_type} — {clientProfile?.full_name || "client"}
                </p>
              </div>
              <Button onClick={generateForService} disabled={generating}>
                {generating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />}
                Generate Document
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Professional templates */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Professional Templates</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {PRO_TEMPLATES.map(tpl => (
            <Card key={tpl.id} className="cursor-pointer hover:border-primary/40 transition-colors" onClick={() => { setSelectedTemplate(tpl.id); startWithTemplate(tpl.id); }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-1">
                  <FileText className="h-4 w-4 text-primary" />
                  <h3 className="text-sm font-semibold">{tpl.label}</h3>
                </div>
                <p className="text-xs text-muted-foreground">Click to start editing with this template</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Start blank */}
      <div className="flex justify-center">
        <Button variant="outline" size="lg" onClick={() => { setInitialPages([{ id: crypto.randomUUID(), html: "<p><br></p>" }]); setInitialTitle(""); setShowEditor(true); }}>
          <FileText className="h-4 w-4 mr-2" /> Start Blank Document
        </Button>
      </div>
    </div>
  );
}
