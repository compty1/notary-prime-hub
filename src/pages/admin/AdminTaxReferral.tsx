import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Calculator, UserPlus, Search, Phone, Mail, MapPin } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface CPA {
  id: string;
  name: string;
  firm: string;
  email: string;
  phone: string;
  specializations: string[];
  location: string;
  referralCount: number;
}

const MOCK_CPAS: CPA[] = [
  { id: "1", name: "Sarah Chen, CPA", firm: "Chen & Associates", email: "sarah@chen.cpa", phone: "(614) 555-1001", specializations: ["Small Business", "LLC"], location: "Columbus, OH", referralCount: 12 },
  { id: "2", name: "Michael Torres, EA", firm: "Torres Tax Service", email: "mike@torrestax.com", phone: "(614) 555-2002", specializations: ["Individual", "Self-Employed"], location: "Dublin, OH", referralCount: 8 },
];

export default function AdminTaxReferral() {
  usePageMeta({ title: "Tax Prep Referral | Admin", noIndex: true });
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);
  const { toast } = useToast();
  const [cpas] = useState<CPA[]>(MOCK_CPAS);

  const filtered = cpas.filter(c => !search || `${c.name} ${c.firm} ${c.specializations.join(" ")}`.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2"><Calculator className="h-6 w-6 text-primary" /> Tax Preparation Referral Network</h1>
          <p className="text-sm text-muted-foreground mt-1">CPA and EA partner directory for client tax referrals</p>
        </div>
        <Button onClick={() => setShowAdd(true)}><UserPlus className="h-4 w-4 mr-2" /> Add Partner</Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{cpas.length}</div><p className="text-xs text-muted-foreground">Partners</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold">{cpas.reduce((s, c) => s + c.referralCount, 0)}</div><p className="text-xs text-muted-foreground">Total Referrals</p></CardContent></Card>
        <Card><CardContent className="pt-4 text-center"><div className="text-2xl font-bold text-green-600">Active</div><p className="text-xs text-muted-foreground">Network Status</p></CardContent></Card>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Search partners..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Firm</TableHead>
                <TableHead>Specializations</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Referrals</TableHead>
                <TableHead>Contact</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(c => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell>{c.firm}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{c.specializations.map(s => <Badge key={s} variant="outline" className="text-[10px]">{s}</Badge>)}</div></TableCell>
                  <TableCell className="text-sm"><MapPin className="h-3 w-3 inline mr-1" />{c.location}</TableCell>
                  <TableCell>{c.referralCount}</TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(`mailto:${c.email}`)}><Mail className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => window.open(`tel:${c.phone}`)}><Phone className="h-3.5 w-3.5" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={showAdd} onOpenChange={setShowAdd}>
        <DialogContent>
          <DialogHeader><DialogTitle>Add Tax Partner</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>Full Name</Label><Input placeholder="John Smith, CPA" /></div>
            <div><Label>Firm Name</Label><Input placeholder="Smith Tax Services" /></div>
            <div><Label>Email</Label><Input type="email" placeholder="john@smithtax.com" /></div>
            <div><Label>Phone</Label><Input placeholder="(614) 555-0000" /></div>
            <div><Label>Location</Label><Input placeholder="Columbus, OH" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAdd(false)}>Cancel</Button>
            <Button onClick={() => { toast({ title: "Partner added" }); setShowAdd(false); }}>Add Partner</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
