import React, { useState, useMemo } from "react";
import { Award, FileText, Eye } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import EnterpriseLayout from "@/components/enterprise/EnterpriseLayout";
import DocumentGeneratorModal from "@/components/enterprise/DocumentGeneratorModal";

const CERT_TYPES = [
  { id: "acknowledgment", label: "Acknowledgment", icon: "✍️" },
  { id: "jurat", label: "Jurat", icon: "📜" },
  { id: "copy_certification", label: "Copy Certification", icon: "📄" },
];

const US_STATES = ["Ohio","Alabama","Alaska","Arizona","Arkansas","California","Colorado","Connecticut","Delaware","Florida","Georgia","Hawaii","Idaho","Illinois","Indiana","Iowa","Kansas","Kentucky","Louisiana","Maine","Maryland","Massachusetts","Michigan","Minnesota","Mississippi","Missouri","Montana","Nebraska","Nevada","New Hampshire","New Jersey","New Mexico","New York","North Carolina","North Dakota","Oklahoma","Oregon","Pennsylvania","Rhode Island","South Carolina","South Dakota","Tennessee","Texas","Utah","Vermont","Virginia","Washington","West Virginia","Wisconsin","Wyoming"];

const CertificateGenerator = () => {
  const [certType, setCertType] = useState("acknowledgment");
  const [state, setState] = useState("Ohio");
  const [county, setCounty] = useState("");
  const [signerName, setSignerName] = useState("");
  const [notaryName, setNotaryName] = useState("");
  const [commissionNumber, setCommissionNumber] = useState("");
  const [commissionExpiration, setCommissionExpiration] = useState("");
  const [documentDescription, setDocumentDescription] = useState("");
  const [isRon, setIsRon] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const formData = useMemo(() => ({
    state, county, date: new Date().toLocaleDateString(),
    signer_name: signerName, notary_name: notaryName,
    commission_number: commissionNumber, commission_expiration: commissionExpiration,
    document_description: documentDescription,
  }), [state, county, signerName, notaryName, commissionNumber, commissionExpiration, documentDescription]);

  return (
    <EnterpriseLayout title="Notarial Certificate Generator" icon={Award} description="Generate ORC-compliant notarial certificates">
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Form */}
        <div className="space-y-6">
          {/* Type selector */}
          <Card>
            <CardContent className="p-6">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3 block">Certificate Type</Label>
              <div className="grid grid-cols-3 gap-3">
                {CERT_TYPES.map(t => (
                  <button key={t.id} onClick={() => setCertType(t.id)}
                    className={`flex flex-col items-center gap-2 rounded-[16px] border-2 p-4 transition-all ${certType === t.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"}`}>
                    <span className="text-2xl">{t.icon}</span>
                    <span className="text-xs font-semibold">{t.label}</span>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Fields */}
          <Card>
            <CardContent className="space-y-4 p-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">State</Label>
                  <Select value={state} onValueChange={setState}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>{US_STATES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                  </Select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">County</Label>
                  <Input value={county} onChange={(e) => setCounty(e.target.value)} placeholder="e.g., Franklin" />
                </div>
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Signer Name</Label>
                <Input value={signerName} onChange={(e) => setSignerName(e.target.value)} placeholder="Full legal name" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Notary Name</Label>
                <Input value={notaryName} onChange={(e) => setNotaryName(e.target.value)} placeholder="Your notary name" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs">Commission #</Label>
                  <Input value={commissionNumber} onChange={(e) => setCommissionNumber(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">Expiration</Label>
                  <Input type="date" value={commissionExpiration} onChange={(e) => setCommissionExpiration(e.target.value)} />
                </div>
              </div>
              {certType === "copy_certification" && (
                <div className="space-y-1">
                  <Label className="text-xs">Document Description</Label>
                  <Input value={documentDescription} onChange={(e) => setDocumentDescription(e.target.value)} placeholder="e.g., Birth Certificate" />
                </div>
              )}
              <div className="flex items-center gap-3 rounded-[12px] bg-muted p-3">
                <Switch checked={isRon} onCheckedChange={setIsRon} />
                <div>
                  <p className="text-sm font-semibold">RON Session</p>
                  <p className="text-xs text-muted-foreground">Add ORC §147.62 technology provider fields</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Button onClick={() => setShowModal(true)} variant="dark" className="w-full">
            <FileText className="mr-2 h-4 w-4" />Generate Certificate
          </Button>
        </div>

        {/* Preview */}
        <Card>
          <CardContent className="p-6">
            <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-muted-foreground">
              <Eye className="h-4 w-4" />Live Preview
            </div>
            <div className="rounded-[12px] border bg-white p-6 text-sm" style={{ fontFamily: "serif" }}>
              <h3 className="text-center text-lg font-bold mb-4">{CERT_TYPES.find(t => t.id === certType)?.label?.toUpperCase()}</h3>
              <p><strong>STATE OF {state.toUpperCase()}</strong></p>
              <p><strong>COUNTY OF {county.toUpperCase() || "___________"}</strong></p>
              <br />
              <p>On this <strong>{new Date().toLocaleDateString()}</strong>, before me, <strong>{notaryName || "___________"}</strong>, a Notary Public, personally appeared <strong>{signerName || "___________"}</strong>.</p>
              <br /><br />
              <p>____________________________________</p>
              <p><strong>{notaryName || "___________"}</strong>, Notary Public</p>
              <p>Commission #: {commissionNumber || "___________"}</p>
              {isRon && <p className="mt-2 text-xs text-muted-foreground italic">Remote Online Notarization per ORC §147.62</p>}
            </div>
          </CardContent>
        </Card>
      </div>

      <DocumentGeneratorModal isOpen={showModal} onClose={() => setShowModal(false)} templateId={certType} data={formData} />
    </EnterpriseLayout>
  );
};

export default CertificateGenerator;
