import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Shield, Search, ExternalLink, DollarSign } from "lucide-react";

const INSURANCE_TYPES = [
  { type: "E&O Insurance", description: "Errors & Omissions for notaries", avgCost: "$150-300/yr" },
  { type: "General Liability", description: "Business liability coverage", avgCost: "$400-800/yr" },
  { type: "Notary Bond", description: "Required Ohio notary bond", avgCost: "$50-100/4yr" },
  { type: "Cyber Liability", description: "Data breach and cyber coverage", avgCost: "$500-1,500/yr" },
  { type: "Workers Comp", description: "Employee injury coverage", avgCost: "Varies" },
];

const PROVIDERS = [
  { name: "NNA Insurance", types: ["E&O Insurance", "Notary Bond"], website: "https://www.nationalnotary.org", rating: 4.5 },
  { name: "Notary Rotary", types: ["E&O Insurance", "General Liability"], website: "https://www.notaryrotary.com", rating: 4.2 },
  { name: "NEXT Insurance", types: ["General Liability", "Workers Comp"], website: "https://www.nextinsurance.com", rating: 4.6 },
];

export default function AdminInsurance() {
  usePageMeta({ title: "Insurance Marketplace | Admin", noIndex: true });
  const [search, setSearch] = useState("");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Shield className="h-6 w-6 text-primary" /> Insurance Marketplace</h1>
        <p className="text-sm text-muted-foreground mt-1">E&O, business insurance, and notary bond provider directory</p>
      </div>

      <div className="grid md:grid-cols-3 lg:grid-cols-5 gap-3">
        {INSURANCE_TYPES.map(t => (
          <Card key={t.type}>
            <CardContent className="pt-4">
              <h3 className="font-semibold text-sm">{t.type}</h3>
              <p className="text-xs text-muted-foreground mt-1">{t.description}</p>
              <Badge variant="outline" className="mt-2 text-[10px]"><DollarSign className="h-2.5 w-2.5 mr-0.5" />{t.avgCost}</Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Insurance Providers</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Provider</TableHead>
                <TableHead>Coverage Types</TableHead>
                <TableHead>Rating</TableHead>
                <TableHead>Website</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {PROVIDERS.map(p => (
                <TableRow key={p.name}>
                  <TableCell className="font-medium">{p.name}</TableCell>
                  <TableCell><div className="flex flex-wrap gap-1">{p.types.map(t => <Badge key={t} variant="outline" className="text-[10px]">{t}</Badge>)}</div></TableCell>
                  <TableCell>⭐ {p.rating}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="ghost" onClick={() => window.open(p.website, "_blank")}>
                      <ExternalLink className="h-3.5 w-3.5 mr-1" /> Visit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
