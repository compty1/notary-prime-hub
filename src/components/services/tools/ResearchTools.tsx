/**
 * Sprint 9: Research Tools Panel
 * Source citation formatter, data table generator, methodology template
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { BookOpen, Copy, Plus, Trash2, Table2, FlaskConical } from "lucide-react";
import { toast } from "sonner";

interface Citation {
  author: string;
  title: string;
  year: string;
  source: string;
}

const CITATION_FORMATS = ["APA 7th", "MLA 9th", "Chicago", "IEEE"];

const METHODOLOGY_TEMPLATES = [
  {
    id: "quantitative",
    label: "Quantitative",
    sections: [
      "## Research Design\n\nThis study employs a [descriptive/experimental/correlational] research design.",
      "## Population & Sample\n\nThe target population is [describe]. A [random/stratified/convenience] sample of N=[number] was selected.",
      "## Data Collection\n\nData was collected via [surveys/instruments/observations] over [timeframe].",
      "## Variables\n\n- **Independent Variable(s):** [list]\n- **Dependent Variable(s):** [list]\n- **Control Variable(s):** [list]",
      "## Data Analysis\n\nData was analyzed using [statistical methods]. Significance level set at p < 0.05.",
      "## Limitations\n\n[Describe limitations of the methodology]",
    ],
  },
  {
    id: "qualitative",
    label: "Qualitative",
    sections: [
      "## Research Approach\n\nThis study uses a [phenomenological/grounded theory/case study/ethnographic] approach.",
      "## Participants\n\n[Number] participants were selected using [purposive/snowball] sampling.",
      "## Data Collection\n\nSemi-structured interviews lasting [duration] were conducted. [Observations/documents] were also collected.",
      "## Data Analysis\n\nThematic analysis was performed using [open/axial/selective] coding.",
      "## Trustworthiness\n\nCredibility ensured through [member checking/triangulation/peer debriefing].",
      "## Limitations\n\n[Describe limitations]",
    ],
  },
  {
    id: "market-research",
    label: "Market Research",
    sections: [
      "## Objectives\n\nThis research aims to [identify market size/understand customer needs/evaluate competitors].",
      "## Methodology\n\n- **Primary Research:** [surveys/interviews/focus groups]\n- **Secondary Research:** [industry reports/public data/competitor analysis]",
      "## Sample\n\nTarget demographic: [describe]. Sample size: N=[number].",
      "## Data Sources\n\n[List specific data sources: industry reports, government databases, etc.]",
      "## Analysis Framework\n\n[SWOT/Porter's Five Forces/PESTEL/Value Chain]",
      "## Limitations & Assumptions\n\n[Describe]",
    ],
  },
];

export function ResearchTools() {
  const [citations, setCitations] = useState<Citation[]>([]);
  const [citFormat, setCitFormat] = useState("APA 7th");
  const [newCit, setNewCit] = useState<Citation>({ author: "", title: "", year: "", source: "" });
  const [selectedMethod, setSelectedMethod] = useState("quantitative");

  const addCitation = () => {
    if (!newCit.author.trim() || !newCit.title.trim()) return;
    setCitations(prev => [...prev, { ...newCit }]);
    setNewCit({ author: "", title: "", year: "", source: "" });
  };

  const formatCitation = (c: Citation): string => {
    switch (citFormat) {
      case "APA 7th":
        return `${c.author} (${c.year}). ${c.title}. ${c.source}.`;
      case "MLA 9th":
        return `${c.author}. "${c.title}." ${c.source}, ${c.year}.`;
      case "Chicago":
        return `${c.author}. "${c.title}." ${c.source} (${c.year}).`;
      case "IEEE":
        return `${c.author}, "${c.title}," ${c.source}, ${c.year}.`;
      default:
        return `${c.author}. ${c.title}. ${c.source}, ${c.year}.`;
    }
  };

  const copyAllCitations = () => {
    const formatted = citations.map((c, i) => `${i + 1}. ${formatCitation(c)}`).join("\n");
    navigator.clipboard.writeText(`## References\n\n${formatted}`);
    toast.success("Citations copied");
  };

  const methodTemplate = METHODOLOGY_TEMPLATES.find(m => m.id === selectedMethod);

  const copyMethodology = () => {
    if (!methodTemplate) return;
    navigator.clipboard.writeText(methodTemplate.sections.join("\n\n"));
    toast.success("Methodology template copied");
  };

  return (
    <div className="space-y-4">
      {/* Citation Manager */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BookOpen className="h-4 w-4" /> Citation Manager
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={citFormat} onValueChange={setCitFormat}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {CITATION_FORMATS.map(f => <SelectItem key={f} value={f} className="text-xs">{f}</SelectItem>)}
            </SelectContent>
          </Select>

          <div className="grid grid-cols-2 gap-2">
            <Input placeholder="Author(s)" value={newCit.author} onChange={e => setNewCit(p => ({ ...p, author: e.target.value }))} className="h-7 text-xs" />
            <Input placeholder="Year" value={newCit.year} onChange={e => setNewCit(p => ({ ...p, year: e.target.value }))} className="h-7 text-xs" />
            <Input placeholder="Title" value={newCit.title} onChange={e => setNewCit(p => ({ ...p, title: e.target.value }))} className="h-7 text-xs col-span-2" />
            <Input placeholder="Source/Journal" value={newCit.source} onChange={e => setNewCit(p => ({ ...p, source: e.target.value }))} className="h-7 text-xs col-span-2" />
          </div>
          <Button size="sm" variant="outline" onClick={addCitation} className="w-full text-xs h-7">
            <Plus className="h-3 w-3 mr-1" /> Add Citation
          </Button>

          {citations.length > 0 && (
            <>
              <Separator />
              <ScrollArea className="max-h-[150px]">
                <div className="space-y-1.5">
                  {citations.map((c, i) => (
                    <div key={i} className="flex items-start gap-1.5 text-xs">
                      <span className="text-muted-foreground shrink-0">{i + 1}.</span>
                      <span className="flex-1">{formatCitation(c)}</span>
                      <Button variant="ghost" size="sm" className="h-5 w-5 p-0 shrink-0" onClick={() => setCitations(prev => prev.filter((_, idx) => idx !== i))}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              </ScrollArea>
              <Button size="sm" onClick={copyAllCitations} className="w-full text-xs h-7">
                <Copy className="h-3 w-3 mr-1" /> Copy All ({citFormat})
              </Button>
            </>
          )}
        </CardContent>
      </Card>

      {/* Methodology Template */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <FlaskConical className="h-4 w-4" /> Methodology Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Select value={selectedMethod} onValueChange={setSelectedMethod}>
            <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
            <SelectContent>
              {METHODOLOGY_TEMPLATES.map(m => <SelectItem key={m.id} value={m.id} className="text-xs">{m.label}</SelectItem>)}
            </SelectContent>
          </Select>
          {methodTemplate && (
            <>
              <ScrollArea className="max-h-[180px]">
                <div className="space-y-2">
                  {methodTemplate.sections.map((s, i) => (
                    <div key={i} className="text-xs text-muted-foreground whitespace-pre-wrap border-l-2 border-muted pl-2">{s}</div>
                  ))}
                </div>
              </ScrollArea>
              <Button size="sm" variant="outline" onClick={copyMethodology} className="w-full text-xs h-7">
                <Copy className="h-3 w-3 mr-1" /> Copy Template
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
