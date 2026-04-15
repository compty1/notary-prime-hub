import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { PenLine, Stamp, Calculator, Clock, FileText, QrCode } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";

function SignatureGenerator() {
  const [name, setName] = useState("");
  const [style, setStyle] = useState<"cursive" | "serif" | "mono">("cursive");
  const fonts: Record<string, string> = { cursive: "'Brush Script MT', cursive", serif: "Georgia, serif", mono: "'Courier New', monospace" };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><PenLine className="h-5 w-5" />Signature Generator</CardTitle><CardDescription>Generate a styled digital signature</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Full Name</Label><Input value={name} onChange={e => setName(e.target.value)} placeholder="Jane Doe" /></div>
          <div><Label>Style</Label><Select value={style} onValueChange={v => setStyle(v as "cursive")}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="cursive">Cursive</SelectItem><SelectItem value="serif">Serif</SelectItem><SelectItem value="mono">Monospace</SelectItem></SelectContent></Select></div>
        </div>
        {name && (
          <div className="border-2 border-dashed rounded-lg p-6 text-center bg-white dark:bg-background">
            <p style={{ fontFamily: fonts[style], fontSize: "2rem", lineHeight: 1.2 }}>{name}</p>
            <div className="w-48 mx-auto border-b border-foreground/30 mt-1" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StampPreview() {
  const [notaryName, setNotaryName] = useState("");
  const [commission, setCommission] = useState("");
  const [county, setCounty] = useState("");
  const [expiry, setExpiry] = useState("");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Stamp className="h-5 w-5" />Notary Stamp Preview</CardTitle><CardDescription>Preview how your notary stamp will appear (Ohio format)</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Notary Name</Label><Input value={notaryName} onChange={e => setNotaryName(e.target.value)} /></div>
          <div><Label>Commission #</Label><Input value={commission} onChange={e => setCommission(e.target.value)} /></div>
          <div><Label>County</Label><Input value={county} onChange={e => setCounty(e.target.value)} /></div>
          <div><Label>Expiry Date</Label><Input type="date" value={expiry} onChange={e => setExpiry(e.target.value)} /></div>
        </div>
        <div className="border-2 border-primary rounded-lg p-6 text-center max-w-xs mx-auto bg-white dark:bg-background">
          <p className="text-[10px] font-bold uppercase tracking-widest text-primary">State of Ohio</p>
          <p className="text-base font-bold mt-1">{notaryName || "Your Name"}</p>
          <p className="text-xs text-muted-foreground">Notary Public</p>
          <div className="border-t border-primary/30 my-2" />
          <p className="text-[10px]">Commission #{commission || "XXXXXXX"}</p>
          <p className="text-[10px]">{county || "______"} County</p>
          <p className="text-[10px]">Exp: {expiry || "MM/DD/YYYY"}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function FeeCalculator() {
  const [acts, setActs] = useState(1);
  const [travel, setTravel] = useState(0);
  const [copies, setCopies] = useState(0);
  const notaryFee = acts * 5;
  const travelFee = travel * 0.70;
  const copyFee = copies * 1;
  const total = notaryFee + travelFee + copyFee;
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Calculator className="h-5 w-5" />Fee Calculator</CardTitle><CardDescription>Ohio statutory fee limits (ORC §147.08)</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-3">
          <div><Label>Notarial Acts</Label><Input type="number" min={1} value={acts} onChange={e => setActs(Number(e.target.value))} /></div>
          <div><Label>Travel Miles</Label><Input type="number" min={0} value={travel} onChange={e => setTravel(Number(e.target.value))} /></div>
          <div><Label>Copies</Label><Input type="number" min={0} value={copies} onChange={e => setCopies(Number(e.target.value))} /></div>
        </div>
        <div className="bg-muted/50 rounded-lg p-4 space-y-2 text-sm">
          <div className="flex justify-between"><span>Notary fees ({acts} × $5.00)</span><span>${notaryFee.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Travel ({travel} mi × $0.70)</span><span>${travelFee.toFixed(2)}</span></div>
          <div className="flex justify-between"><span>Copies ({copies} × $1.00)</span><span>${copyFee.toFixed(2)}</span></div>
          <div className="border-t pt-2 flex justify-between font-bold text-base"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
        <p className="text-xs text-muted-foreground">* Ohio law caps notary fees at $5.00 per act. Travel and copy fees are separate.</p>
      </CardContent>
    </Card>
  );
}

function QRCodeGenerator() {
  const [url, setUrl] = useState("");
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><QrCode className="h-5 w-5" />QR Code Generator</CardTitle><CardDescription>Generate QR codes for booking links, verification, etc.</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div><Label>URL or Text</Label><Input value={url} onChange={e => setUrl(e.target.value)} placeholder="https://..." /></div>
        {url && (
          <div className="flex justify-center p-4 bg-white rounded-lg">
            <QRCodeSVG value={url} size={180} />
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function TimezoneConverter() {
  const [time, setTime] = useState("12:00");
  const [fromTz, setFromTz] = useState("America/New_York");
  const zones = ["America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles", "America/Phoenix", "Pacific/Honolulu", "UTC"];
  const getConverted = (tz: string) => {
    try {
      const d = new Date(); d.setHours(parseInt(time.split(":")[0]), parseInt(time.split(":")[1]));
      return d.toLocaleTimeString("en-US", { timeZone: tz, hour: "2-digit", minute: "2-digit", timeZoneName: "short" });
    } catch { return "—"; }
  };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Clock className="h-5 w-5" />Timezone Converter</CardTitle><CardDescription>Convert times across US time zones for RON sessions</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div><Label>Time</Label><Input type="time" value={time} onChange={e => setTime(e.target.value)} /></div>
          <div><Label>From</Label><Select value={fromTz} onValueChange={setFromTz}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{zones.map(z => <SelectItem key={z} value={z}>{z.split("/")[1]?.replace(/_/g, " ") || z}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {zones.filter(z => z !== fromTz).map(z => (
            <div key={z} className="bg-muted/50 rounded p-2 text-sm">
              <p className="font-medium">{getConverted(z)}</p>
              <p className="text-xs text-muted-foreground">{z.split("/")[1]?.replace(/_/g, " ") || z}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function DocumentChecklist() {
  const [docType, setDocType] = useState("acknowledgment");
  const checklists: Record<string, string[]> = {
    acknowledgment: ["Signer physically present or via audio-video", "Signer identified via acceptable ID", "Signer acknowledged signing voluntarily", "Certificate completed with date, name, county", "Notary seal/stamp affixed", "Journal entry recorded"],
    jurat: ["Signer physically present or via audio-video", "Oath/affirmation administered", "Signer signed in notary's presence", "Certificate completed", "Notary seal/stamp affixed", "Journal entry with oath noted"],
    copy_certification: ["Original document presented", "Not a vital record (birth/death/marriage)", "Copy compared to original", "Certification statement attached", "Notary seal/stamp affixed"],
  };
  const items = checklists[docType] || [];
  const [checked, setChecked] = useState<Set<number>>(new Set());
  const toggle = (i: number) => { const s = new Set(checked); s.has(i) ? s.delete(i) : s.add(i); setChecked(s); };
  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><FileText className="h-5 w-5" />Document Checklist</CardTitle><CardDescription>Pre-notarization verification checklist</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <Select value={docType} onValueChange={v => { setDocType(v); setChecked(new Set()); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="acknowledgment">Acknowledgment</SelectItem><SelectItem value="jurat">Jurat</SelectItem><SelectItem value="copy_certification">Copy Certification</SelectItem></SelectContent></Select>
        <div className="space-y-2">
          {items.map((item, i) => (
            <label key={i} className="flex items-center gap-2 cursor-pointer text-sm">
              <input type="checkbox" checked={checked.has(i)} onChange={() => toggle(i)} className="rounded" />
              <span className={checked.has(i) ? "line-through text-muted-foreground" : ""}>{item}</span>
            </label>
          ))}
        </div>
        {checked.size === items.length && items.length > 0 && <Badge className="bg-green-100 text-green-700">✓ All checks passed</Badge>}
      </CardContent>
    </Card>
  );
}

export default function AdminMicroTools() {
  usePageMeta({ title: "Micro-Tools" });
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Micro-Tools</h1>
      <p className="text-muted-foreground text-sm">Quick-access utilities for daily notary and document operations</p>
      <Tabs defaultValue="signature">
        <TabsList className="flex-wrap">
          <TabsTrigger value="signature"><PenLine className="h-3.5 w-3.5 mr-1" />Signature</TabsTrigger>
          <TabsTrigger value="stamp"><Stamp className="h-3.5 w-3.5 mr-1" />Stamp</TabsTrigger>
          <TabsTrigger value="fee"><Calculator className="h-3.5 w-3.5 mr-1" />Fee Calc</TabsTrigger>
          <TabsTrigger value="qr"><QrCode className="h-3.5 w-3.5 mr-1" />QR Code</TabsTrigger>
          <TabsTrigger value="timezone"><Clock className="h-3.5 w-3.5 mr-1" />Timezone</TabsTrigger>
          <TabsTrigger value="checklist"><FileText className="h-3.5 w-3.5 mr-1" />Checklist</TabsTrigger>
        </TabsList>
        <TabsContent value="signature"><SignatureGenerator /></TabsContent>
        <TabsContent value="stamp"><StampPreview /></TabsContent>
        <TabsContent value="fee"><FeeCalculator /></TabsContent>
        <TabsContent value="qr"><QRCodeGenerator /></TabsContent>
        <TabsContent value="timezone"><TimezoneConverter /></TabsContent>
        <TabsContent value="checklist"><DocumentChecklist /></TabsContent>
      </Tabs>
    </div>
  );
}
