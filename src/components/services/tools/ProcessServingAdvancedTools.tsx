import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MapPin, FileText, AlertTriangle, Scale, Plus, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const OHIO_SERVICE_RULES = [
  { method: "Personal Service", rule: "Civ.R. 4.1(A)", desc: "Serve defendant personally by leaving copy at their abode with person of suitable age and discretion." },
  { method: "Certified Mail", rule: "Civ.R. 4.1(A)(1)", desc: "Service by certified mail, return receipt requested. Effective when signed." },
  { method: "Ordinary Mail + Service", rule: "Civ.R. 4.6(D)", desc: "If certified mail unclaimed, serve by ordinary mail and service by posting." },
  { method: "Residence Service", rule: "Civ.R. 4.1(A)", desc: "Leave at usual place of residence with competent person over 16 residing therein." },
  { method: "Service by Publication", rule: "Civ.R. 4.4(A)", desc: "When defendant cannot be found. Publish in newspaper of general circulation for 6 consecutive weeks." },
  { method: "Service on Corporation", rule: "Civ.R. 4.2(F)", desc: "Serve registered agent, officer, managing agent, or agent appointed by law." },
  { method: "Service on State", rule: "Civ.R. 4.2(A)", desc: "Serve Attorney General of Ohio." },
];

const SUBSTITUTED_SERVICE_RULES = [
  { county: "Franklin", rule: "Must show 3 attempts at different times/days before substituted service", contact: "Clerk of Courts (614) 525-3600" },
  { county: "Cuyahoga", rule: "3 attempts required. Affidavit of attempts must be filed.", contact: "Clerk of Courts (216) 443-8560" },
  { county: "Hamilton", rule: "Minimum 3 diligent attempts, varied times. Motion required.", contact: "Clerk of Courts (513) 946-5656" },
  { county: "Summit", rule: "3 attempts at reasonable hours, different days of week.", contact: "Clerk of Courts (330) 643-2207" },
  { county: "Montgomery", rule: "3 attempts with detailed log. Weekend attempt recommended.", contact: "Clerk of Courts (937) 496-7231" },
];

export function ProcessServingAdvancedTools() {
  const { toast } = useToast();
  const [attempts, setAttempts] = useState<{ date: string; time: string; notes: string }[]>([]);
  const [newAttempt, setNewAttempt] = useState({ date: "", time: "", notes: "" });
  const [affidavitData, setAffidavitData] = useState({ case_number: "", court: "", plaintiff: "", defendant: "", server_name: "", service_date: "", service_method: "personal" });

  const addAttempt = () => {
    if (!newAttempt.date || !newAttempt.time) return;
    setAttempts(prev => [...prev, { ...newAttempt }]);
    setNewAttempt({ date: "", time: "", notes: "" });
  };

  const generateAffidavit = () => {
    const text = `AFFIDAVIT OF SERVICE

STATE OF OHIO
COUNTY OF ________

Case No.: ${affidavitData.case_number}
Court: ${affidavitData.court}

${affidavitData.plaintiff} v. ${affidavitData.defendant}

I, ${affidavitData.server_name}, being first duly sworn, depose and say:

1. I am over the age of 18 and am not a party to this action.

2. On ${affidavitData.service_date}, I served the above-named defendant, ${affidavitData.defendant}, with a true and accurate copy of the Summons and Complaint in the above-captioned matter by ${affidavitData.service_method === "personal" ? "personally delivering" : "leaving at the usual place of residence with a person of suitable age and discretion residing therein"} said documents.

${attempts.length > 0 ? `3. Prior attempts at service:\n${attempts.map((a, i) => `   Attempt ${i + 1}: ${a.date} at ${a.time} — ${a.notes}`).join("\n")}` : ""}

I declare under penalty of perjury that the foregoing is true and correct.

________________________________
${affidavitData.server_name}
Process Server

Sworn to and subscribed before me this ____ day of __________, 20___.

________________________________
Notary Public, State of Ohio
My Commission Expires: __________`;

    navigator.clipboard.writeText(text);
    toast({ title: "Affidavit copied to clipboard!" });
  };

  return (
    <Tabs defaultValue="rules">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="rules"><Scale className="h-3 w-3 mr-1" /> Service Rules</TabsTrigger>
        <TabsTrigger value="attempts"><MapPin className="h-3 w-3 mr-1" /> Attempt Log</TabsTrigger>
        <TabsTrigger value="affidavit"><FileText className="h-3 w-3 mr-1" /> Affidavit</TabsTrigger>
      </TabsList>

      <TabsContent value="rules">
        <Card>
          <CardHeader><CardTitle className="text-sm">Ohio Service of Process Rules (Civ.R. 4)</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <Table>
              <TableHeader><TableRow><TableHead>Method</TableHead><TableHead>Rule</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
              <TableBody>
                {OHIO_SERVICE_RULES.map(r => (
                  <TableRow key={r.method}>
                    <TableCell className="font-medium text-xs">{r.method}</TableCell>
                    <TableCell><Badge variant="outline" className="text-[10px] font-mono">{r.rule}</Badge></TableCell>
                    <TableCell className="text-xs">{r.desc}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>

            <div className="mt-4">
              <h4 className="text-sm font-bold mb-2">Substituted Service by County</h4>
              {SUBSTITUTED_SERVICE_RULES.map(c => (
                <div key={c.county} className="border rounded-lg p-2 mb-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">{c.county} County</span>
                    <span className="text-[10px] text-muted-foreground">{c.contact}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">{c.rule}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="attempts">
        <Card>
          <CardHeader><CardTitle className="text-sm">Service Attempt Log</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-3 gap-2">
              <div><Label className="text-xs">Date</Label><Input type="date" value={newAttempt.date} onChange={e => setNewAttempt(a => ({ ...a, date: e.target.value }))} /></div>
              <div><Label className="text-xs">Time</Label><Input type="time" value={newAttempt.time} onChange={e => setNewAttempt(a => ({ ...a, time: e.target.value }))} /></div>
              <div><Label className="text-xs">Notes</Label><Input value={newAttempt.notes} onChange={e => setNewAttempt(a => ({ ...a, notes: e.target.value }))} placeholder="Left door hanger..." /></div>
            </div>
            <Button size="sm" onClick={addAttempt} disabled={!newAttempt.date || !newAttempt.time}><Plus className="h-3 w-3 mr-1" /> Log Attempt</Button>

            {attempts.length > 0 && (
              <Table>
                <TableHeader><TableRow><TableHead>#</TableHead><TableHead>Date</TableHead><TableHead>Time</TableHead><TableHead>Notes</TableHead></TableRow></TableHeader>
                <TableBody>
                  {attempts.map((a, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-bold">{i + 1}</TableCell>
                      <TableCell className="text-xs">{a.date}</TableCell>
                      <TableCell className="text-xs">{a.time}</TableCell>
                      <TableCell className="text-xs">{a.notes}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {attempts.length === 0 && <p className="text-xs text-muted-foreground text-center py-4">No attempts logged yet</p>}
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="affidavit">
        <Card>
          <CardHeader><CardTitle className="text-sm">Affidavit of Service Generator</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-2 gap-2">
              <div><Label className="text-xs">Case Number</Label><Input value={affidavitData.case_number} onChange={e => setAffidavitData(d => ({ ...d, case_number: e.target.value }))} /></div>
              <div><Label className="text-xs">Court</Label><Input value={affidavitData.court} onChange={e => setAffidavitData(d => ({ ...d, court: e.target.value }))} placeholder="Franklin County Common Pleas" /></div>
              <div><Label className="text-xs">Plaintiff</Label><Input value={affidavitData.plaintiff} onChange={e => setAffidavitData(d => ({ ...d, plaintiff: e.target.value }))} /></div>
              <div><Label className="text-xs">Defendant</Label><Input value={affidavitData.defendant} onChange={e => setAffidavitData(d => ({ ...d, defendant: e.target.value }))} /></div>
              <div><Label className="text-xs">Server Name</Label><Input value={affidavitData.server_name} onChange={e => setAffidavitData(d => ({ ...d, server_name: e.target.value }))} /></div>
              <div><Label className="text-xs">Service Date</Label><Input type="date" value={affidavitData.service_date} onChange={e => setAffidavitData(d => ({ ...d, service_date: e.target.value }))} /></div>
            </div>
            <Select value={affidavitData.service_method} onValueChange={v => setAffidavitData(d => ({ ...d, service_method: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="personal">Personal Service</SelectItem>
                <SelectItem value="residence">Residence Service</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={generateAffidavit} className="w-full"><Copy className="h-4 w-4 mr-1" /> Generate & Copy Affidavit</Button>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
