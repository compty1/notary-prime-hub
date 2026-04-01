import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, Copy, Download, Eye, EyeOff, Palette } from "lucide-react";

const STORAGE_KEY = "build-tracker-themes";

type ThemeColors = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  foreground: string;
  muted: string;
};

type Theme = {
  id: string;
  name: string;
  description: string;
  colors: ThemeColors;
  typography: { heading: string; body: string };
  mood: string;
  saved: boolean;
};

const THEME_PROMPT = `Generate 4 unique alternative theme options for NotaryDex, an Ohio-based remote online notarization platform. Each theme should be distinct and professional.

Return ONLY valid JSON (no markdown), with this structure:
{
  "themes": [
    {
      "name": "Theme Name",
      "description": "Brief description of the theme's feel",
      "colors": {
        "primary": "#hex",
        "secondary": "#hex",
        "accent": "#hex",
        "background": "#hex",
        "foreground": "#hex",
        "muted": "#hex"
      },
      "typography": { "heading": "Font Name", "body": "Font Name" },
      "mood": "Professional, Trustworthy, Modern"
    }
  ]
}

Make themes diverse: one warm/corporate, one cool/modern, one minimal/clean, one bold/premium.`;

function ColorSwatch({ color, label }: { color: string; label: string }) {
  return (
    <div className="flex items-center gap-2">
      <div className="h-6 w-6 rounded border shadow-sm" style={{ backgroundColor: color }} />
      <div>
        <p className="text-xs font-medium">{label}</p>
        <p className="text-[10px] text-muted-foreground font-mono">{color}</p>
      </div>
    </div>
  );
}

function generateCSS(theme: Theme): string {
  return `:root {
  --primary: ${theme.colors.primary};
  --secondary: ${theme.colors.secondary};
  --accent: ${theme.colors.accent};
  --background: ${theme.colors.background};
  --foreground: ${theme.colors.foreground};
  --muted: ${theme.colors.muted};
  --font-heading: '${theme.typography.heading}', sans-serif;
  --font-body: '${theme.typography.body}', sans-serif;
}`;
}

function generateTailwind(theme: Theme): string {
  return `// tailwind.config.ts theme extension
{
  colors: {
    primary: '${theme.colors.primary}',
    secondary: '${theme.colors.secondary}',
    accent: '${theme.colors.accent}',
    background: '${theme.colors.background}',
    foreground: '${theme.colors.foreground}',
    muted: '${theme.colors.muted}',
  },
  fontFamily: {
    heading: ['${theme.typography.heading}', 'sans-serif'],
    body: ['${theme.typography.body}', 'sans-serif'],
  },
}`;
}

function generateLovablePrompt(theme: Theme): string {
  return `Update the theme to "${theme.name}": Use ${theme.colors.primary} as primary, ${theme.colors.accent} as accent, ${theme.colors.background} background. Heading font: ${theme.typography.heading}, body font: ${theme.typography.body}. Mood: ${theme.mood}. ${theme.description}`;
}

export default function ThemeExplorerTab() {
  const [themes, setThemes] = useState<Theme[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch { return []; }
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [exportTheme, setExportTheme] = useState<Theme | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const saveThemes = useCallback((t: Theme[]) => {
    setThemes(t);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(t)); } catch {}
  }, []);

  const generate = useCallback(async () => {
    setIsGenerating(true);
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/build-analyst`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [{ role: "user", content: THEME_PROMPT }],
          context: "Theme generation mode — return only valid JSON.",
        }),
      });

      if (!resp.ok) throw new Error(`Error ${resp.status}`);
      if (!resp.body) throw new Error("No response body");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";
      let fullContent = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });
        let idx: number;
        while ((idx = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, idx);
          textBuffer = textBuffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) fullContent += content;
          } catch { /* partial */ }
        }
      }

      let jsonContent = fullContent;
      const jsonMatch = fullContent.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) jsonContent = jsonMatch[1];
      const rawMatch = jsonContent.match(/\{[\s\S]*\}/);
      if (rawMatch) jsonContent = rawMatch[0];

      const result = JSON.parse(jsonContent);
      const newThemes: Theme[] = (result.themes || []).map((t: any, i: number) => ({
        ...t,
        id: `theme-${Date.now()}-${i}`,
        saved: false,
      }));

      saveThemes([...themes, ...newThemes]);
      toast.success(`Generated ${newThemes.length} themes`);
    } catch (e: any) {
      toast.error(e.message || "Failed to generate themes");
    } finally {
      setIsGenerating(false);
    }
  }, [themes, saveThemes]);

  const toggleSave = (id: string) => {
    saveThemes(themes.map(t => t.id === id ? { ...t, saved: !t.saved } : t));
  };

  const deleteTheme = (id: string) => {
    saveThemes(themes.filter(t => t.id !== id));
  };

  const toggleCompare = (id: string) => {
    setCompareIds(prev =>
      prev.includes(id) ? prev.filter(x => x !== id) : prev.length >= 2 ? [prev[1], id] : [...prev, id]
    );
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  const compareThemes = themes.filter(t => compareIds.includes(t.id));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-semibold">Theme Explorer</h3>
          <p className="text-sm text-muted-foreground">Generate AI-powered theme alternatives, compare, and export</p>
        </div>
        <div className="flex gap-2">
          {compareIds.length === 2 && (
            <Button variant="outline" size="sm" onClick={() => setCompareIds([])}>
              <EyeOff className="h-3.5 w-3.5 mr-1" /> Exit Compare
            </Button>
          )}
          <Button onClick={generate} disabled={isGenerating}>
            {isGenerating ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate Alternatives
          </Button>
        </div>
      </div>

      {themes.length === 0 && !isGenerating && (
        <Card>
          <CardContent className="p-12 text-center">
            <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No Themes Generated</p>
            <p className="text-sm text-muted-foreground mb-4">Generate AI-powered theme alternatives to explore different visual directions.</p>
            <Button onClick={generate}><Sparkles className="h-4 w-4 mr-1" /> Generate Themes</Button>
          </CardContent>
        </Card>
      )}

      {isGenerating && (
        <Card>
          <CardContent className="p-12 text-center">
            <Loader2 className="h-10 w-10 animate-spin mx-auto mb-4 text-primary" />
            <p className="font-medium">Generating theme alternatives...</p>
          </CardContent>
        </Card>
      )}

      {/* Compare Mode */}
      {compareIds.length === 2 && compareThemes.length === 2 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm">Side-by-Side Comparison</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6">
              {compareThemes.map(theme => (
                <div key={theme.id} className="space-y-3">
                  <h4 className="font-medium text-sm">{theme.name}</h4>
                  <div className="flex gap-1">
                    {Object.entries(theme.colors).map(([key, color]) => (
                      <div key={key} className="h-10 flex-1 rounded" style={{ backgroundColor: color }} title={`${key}: ${color}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{theme.mood}</p>
                  <p className="text-xs">Fonts: {theme.typography.heading} / {theme.typography.body}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Theme Cards */}
      <div className="grid md:grid-cols-2 gap-4">
        {themes.map(theme => (
          <Card key={theme.id} className={`transition-all ${compareIds.includes(theme.id) ? "ring-2 ring-primary" : ""}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">{theme.name}</CardTitle>
                <div className="flex items-center gap-1">
                  {theme.saved && <Badge variant="secondary" className="text-[10px]">Saved</Badge>}
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleCompare(theme.id)} title="Compare">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExportTheme(theme)} title="Export">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTheme(theme.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{theme.description}</p>

              {/* Color preview strip */}
              <div className="flex gap-0.5 rounded-md overflow-hidden h-8">
                {Object.entries(theme.colors).map(([key, color]) => (
                  <div key={key} className="flex-1" style={{ backgroundColor: color }} title={`${key}: ${color}`} />
                ))}
              </div>

              <div className="grid grid-cols-3 gap-2">
                {Object.entries(theme.colors).map(([key, color]) => (
                  <ColorSwatch key={key} color={color} label={key} />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">
                  <strong>Fonts:</strong> {theme.typography.heading} / {theme.typography.body}
                </span>
                <Badge variant="outline" className="text-[10px]">{theme.mood}</Badge>
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => toggleSave(theme.id)}>
                  {theme.saved ? "Unsave" : "Save"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Export Dialog */}
      <Dialog open={!!exportTheme} onOpenChange={(o) => !o && setExportTheme(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Export: {exportTheme?.name}</DialogTitle>
          </DialogHeader>
          {exportTheme && (
            <Tabs defaultValue="css">
              <TabsList className="w-full">
                <TabsTrigger value="css" className="flex-1">CSS</TabsTrigger>
                <TabsTrigger value="tailwind" className="flex-1">Tailwind</TabsTrigger>
                <TabsTrigger value="lovable" className="flex-1">Lovable Prompt</TabsTrigger>
              </TabsList>
              <TabsContent value="css">
                <div className="relative">
                  <Textarea readOnly value={generateCSS(exportTheme)} className="font-mono text-xs min-h-[200px]" />
                  <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyText(generateCSS(exportTheme))}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="tailwind">
                <div className="relative">
                  <Textarea readOnly value={generateTailwind(exportTheme)} className="font-mono text-xs min-h-[200px]" />
                  <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyText(generateTailwind(exportTheme))}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TabsContent>
              <TabsContent value="lovable">
                <div className="relative">
                  <Textarea readOnly value={generateLovablePrompt(exportTheme)} className="font-mono text-xs min-h-[200px]" />
                  <Button size="sm" variant="outline" className="absolute top-2 right-2" onClick={() => copyText(generateLovablePrompt(exportTheme))}>
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
