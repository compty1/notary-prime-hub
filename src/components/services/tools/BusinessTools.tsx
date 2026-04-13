/**
 * Sprint 9: Business Tools Panel
 * Industry template selector, corporate formatting, financial formatting helpers
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Building2, FileText, DollarSign, Copy, Calculator } from "lucide-react";
import { toast } from "sonner";

const ENTITY_TYPES = [
  { value: "llc", label: "LLC", docs: ["Articles of Organization", "Operating Agreement", "EIN Application", "BOI Report"] },
  { value: "corp", label: "Corporation", docs: ["Articles of Incorporation", "Bylaws", "Initial Resolutions", "Stock Certificates", "EIN Application"] },
  { value: "nonprofit", label: "Nonprofit", docs: ["Articles of Incorporation (Nonprofit)", "Bylaws", "IRS Form 1023/1023-EZ", "Conflict of Interest Policy"] },
  { value: "sole-prop", label: "Sole Proprietorship", docs: ["DBA Filing", "Business License", "EIN Application (optional)"] },
  { value: "partnership", label: "Partnership", docs: ["Partnership Agreement", "Statement of Partnership", "EIN Application"] },
];

const INDUSTRY_TEMPLATES = [
  { value: "consulting", label: "Consulting", sections: ["Scope of Services", "Deliverables", "Timeline", "Fees", "Confidentiality", "Termination"] },
  { value: "technology", label: "Technology/SaaS", sections: ["Product Description", "SLA", "Data Processing", "IP Ownership", "Licensing", "Support"] },
  { value: "real-estate", label: "Real Estate", sections: ["Property Description", "Purchase Price", "Contingencies", "Closing", "Representations", "Title"] },
  { value: "healthcare", label: "Healthcare", sections: ["Services", "HIPAA Compliance", "Credentials", "Liability", "Insurance", "Regulatory"] },
  { value: "construction", label: "Construction", sections: ["Scope of Work", "Materials", "Schedule", "Payment Terms", "Warranties", "Permits", "Change Orders"] },
];

export function BusinessTools() {
  const [entityType, setEntityType] = useState("llc");
  const [industry, setIndustry] = useState("consulting");
  const [revenue, setRevenue] = useState("");
  const [expenses, setExpenses] = useState("");

  const entity = ENTITY_TYPES.find(e => e.value === entityType);
  const template = INDUSTRY_TEMPLATES.find(t => t.value === industry);

  const netIncome = (parseFloat(revenue) || 0) - (parseFloat(expenses) || 0);
  const margin = (parseFloat(revenue) || 0) > 0 ? ((netIncome / parseFloat(revenue)) * 100).toFixed(1) : "0.0";

  const copyDocList = () => {
    if (!entity) return;
    const list = entity.docs.map((d, i) => `${i + 1}. ${d}`).join("\n");
    navigator.clipboard.writeText(`Required Documents for ${entity.label}:\n\n${list}`);
    toast.success("Document list copied");
  };

  const copySections = () => {
    if (!template) return;
    const outline = template.sections.map((s, i) => `## ${i + 1}. ${s}\n\n[Content]\n`).join("\n");
    navigator.clipboard.writeText(`# ${template.label} Agreement\n\n${outline}`);
    toast.success("Template outline copied");
  };

  return (
    <div className="space-y-4">
      {/* Entity Type Wizard */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Building2 className="h-4 w-4" /> Entity Type & Required Documents
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={entityType} onValueChange={setEntityType}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {ENTITY_TYPES.map(e => <SelectItem key={e.value} value={e.value} className="text-xs">{e.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {entity && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Required Documents:</Label>
              {entity.docs.map((doc, i) => (
                <div key={i} className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="outline" className="text-[10px] w-5 h-5 p-0 flex items-center justify-center">{i + 1}</Badge>
                  {doc}
                </div>
              ))}
              <Button size="sm" variant="outline" onClick={copyDocList} className="mt-2 w-full text-xs h-7">
                <Copy className="h-3 w-3 mr-1" /> Copy Document List
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Industry Template */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FileText className="h-4 w-4" /> Industry Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={industry} onValueChange={setIndustry}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {INDUSTRY_TEMPLATES.map(t => <SelectItem key={t.value} value={t.value} className="text-xs">{t.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {template && (
            <div className="space-y-1">
              <Label className="text-xs font-medium">Recommended Sections:</Label>
              <ScrollArea className="max-h-[150px]">
                {template.sections.map((s, i) => (
                  <div key={i} className="text-xs py-0.5 text-muted-foreground">
                    {i + 1}. {s}
                  </div>
                ))}
              </ScrollArea>
              <Button size="sm" variant="outline" onClick={copySections} className="w-full text-xs h-7">
                <Copy className="h-3 w-3 mr-1" /> Copy Template Outline
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Quick Calc */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <Calculator className="h-4 w-4" /> Financial Quick Calculator
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Revenue ($)</Label>
              <Input type="number" value={revenue} onChange={e => setRevenue(e.target.value)} className="h-8 text-xs" placeholder="0.00" />
            </div>
            <div>
              <Label className="text-xs">Expenses ($)</Label>
              <Input type="number" value={expenses} onChange={e => setExpenses(e.target.value)} className="h-8 text-xs" placeholder="0.00" />
            </div>
          </div>
          <Separator />
          <div className="flex justify-between text-xs">
            <span>Net Income:</span>
            <span className={`font-semibold ${netIncome >= 0 ? "text-primary" : "text-destructive"}`}>
              ${netIncome.toLocaleString("en-US", { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span>Profit Margin:</span>
            <Badge variant={parseFloat(margin) > 0 ? "default" : "secondary"}>{margin}%</Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
