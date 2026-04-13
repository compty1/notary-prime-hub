import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PenTool, Calendar, Search, Share2, Copy } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

const PLATFORMS = ["LinkedIn", "Twitter/X", "Facebook", "Instagram"];
const TONES = ["Professional", "Casual", "Educational", "Persuasive"];

export function ContentAdvancedTools() {
  const { toast } = useToast();
  const [briefTopic, setBriefTopic] = useState("");
  const [briefAudience, setBriefAudience] = useState("");
  const [briefTone, setBriefTone] = useState("Professional");
  const [socialContent, setSocialContent] = useState("");
  const [socialPlatform, setSocialPlatform] = useState("LinkedIn");

  const generateBrief = () => {
    const brief = `# Content Brief: ${briefTopic}\n\n**Target Audience:** ${briefAudience}\n**Tone:** ${briefTone}\n**Word Count:** 800-1200\n\n## Key Points to Cover\n- Introduction to ${briefTopic}\n- Why it matters for ${briefAudience}\n- Actionable steps/tips\n- Call to action\n\n## SEO Keywords\n- ${briefTopic.toLowerCase()}\n- ${briefTopic.toLowerCase()} guide\n- ${briefTopic.toLowerCase()} tips\n- best ${briefTopic.toLowerCase()} practices\n\n## Internal Links\n- Link to related service page\n- Link to booking page\n- Link to resource library`;
    navigator.clipboard.writeText(brief);
    toast({ title: "Content brief copied to clipboard!" });
  };

  const previewCards: Record<string, { maxLen: number; style: string }> = {
    LinkedIn: { maxLen: 3000, style: "Professional network post" },
    "Twitter/X": { maxLen: 280, style: "Short-form micro-post" },
    Facebook: { maxLen: 500, style: "Community engagement post" },
    Instagram: { maxLen: 2200, style: "Visual-first caption" },
  };

  const platform = previewCards[socialPlatform];

  return (
    <Tabs defaultValue="brief">
      <TabsList className="grid grid-cols-3 w-full">
        <TabsTrigger value="brief"><PenTool className="h-3 w-3 mr-1" /> Content Brief</TabsTrigger>
        <TabsTrigger value="calendar"><Calendar className="h-3 w-3 mr-1" /> Editorial Plan</TabsTrigger>
        <TabsTrigger value="social"><Share2 className="h-3 w-3 mr-1" /> Social Preview</TabsTrigger>
      </TabsList>

      <TabsContent value="brief">
        <Card>
          <CardHeader><CardTitle className="text-sm">Content Brief Generator</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div><Label>Topic</Label><Input value={briefTopic} onChange={e => setBriefTopic(e.target.value)} placeholder="e.g., Remote Online Notarization Benefits" /></div>
            <div><Label>Target Audience</Label><Input value={briefAudience} onChange={e => setBriefAudience(e.target.value)} placeholder="e.g., Small business owners" /></div>
            <div><Label>Tone</Label>
              <Select value={briefTone} onValueChange={setBriefTone}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent>{TONES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
            </div>
            <Button onClick={generateBrief} disabled={!briefTopic}><Copy className="h-4 w-4 mr-1" /> Generate & Copy Brief</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="calendar">
        <Card>
          <CardHeader><CardTitle className="text-sm">Weekly Editorial Calendar Template</CardTitle></CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 gap-2 text-xs">
              {["Mon", "Tue", "Wed", "Thu", "Fri"].map(day => (
                <div key={day} className="border rounded-lg p-2 space-y-1">
                  <p className="font-bold text-primary">{day}</p>
                  <Badge variant="outline" className="text-[10px] w-full justify-center">
                    {day === "Mon" ? "Blog Post" : day === "Tue" ? "Social Media" : day === "Wed" ? "Newsletter" : day === "Thu" ? "Case Study" : "Community"}
                  </Badge>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">Customize this template in the Content Workspace for a full drag-and-drop editorial calendar.</p>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="social">
        <Card>
          <CardHeader><CardTitle className="text-sm">Social Media Preview</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Select value={socialPlatform} onValueChange={setSocialPlatform}>
              <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
              <SelectContent>{PLATFORMS.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent>
            </Select>
            <Textarea rows={4} value={socialContent} onChange={e => setSocialContent(e.target.value)} placeholder={`Write your ${socialPlatform} post...`} maxLength={platform.maxLen} />
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{platform.style}</span>
              <span className={socialContent.length > platform.maxLen * 0.9 ? "text-amber-500 font-medium" : ""}>{socialContent.length}/{platform.maxLen}</span>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
