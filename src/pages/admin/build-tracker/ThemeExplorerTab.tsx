import { useState, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2, Sparkles, Trash2, Copy, Download, Eye, EyeOff, Palette, AlertTriangle } from "lucide-react";
import { useSSEStream, extractJSON, safeClipboardWrite } from "./useSSEStream";

const STORAGE_KEY = "build-tracker-themes";
const MAX_THEMES = 20;

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

/** Calculate WCAG 2.1 contrast ratio between two hex colors */
function hexToLuminance(hex: string): number {
  const c = hex.replace("#", "");
  const r = parseInt(c.substring(0, 2), 16) / 255;
  const g = parseInt(c.substring(2, 4), 16) / 255;
  const b = parseInt(c.substring(4, 6), 16) / 255;
  const toLinear = (v: number) => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

function contrastRatio(hex1: string, hex2: string): number {
  const l1 = hexToLuminance(hex1);
  const l2 = hexToLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function wcagLevel(ratio: number): { level: string; color: string } {
  if (ratio >= 7) return { level: "AAA", color: "text-green-600 dark:text-green-400" };
  if (ratio >= 4.5) return { level: "AA", color: "text-yellow-600 dark:text-yellow-400" };
  return { level: "Fail", color: "text-destructive" };
}

function ContrastCheck({ theme }: { theme: Theme }) {
  const pairs = [
    { label: "FG on BG", fg: theme.colors.foreground, bg: theme.colors.background },
    { label: "Primary on BG", fg: theme.colors.primary, bg: theme.colors.background },
    { label: "FG on Muted", fg: theme.colors.foreground, bg: theme.colors.muted },
  ];
  return (
    <div className="space-y-1 mt-2">
      <p className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
        <AlertTriangle className="h-3 w-3" /> WCAG Contrast
      </p>
      {pairs.map(p => {
        const ratio = contrastRatio(p.fg, p.bg);
        const { level, color } = wcagLevel(ratio);
        return (
          <div key={p.label} className="flex items-center justify-between text-[10px]">
            <span className="text-muted-foreground">{p.label}</span>
            <span className={`font-bold ${color}`}>{ratio.toFixed(1)}:1 ({level})</span>
          </div>
        );
      })}
    </div>
  );
}

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

export default function ThemeExplorerTab({ onPreviewTheme }: { onPreviewTheme?: (colors: ThemeColors) => void }) {
  const [themes, setThemes] = useState<Theme[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      const parsed = saved ? JSON.parse(saved) : [];
      return Array.isArray(parsed) ? parsed.slice(0, MAX_THEMES) : [];
    } catch { return []; }
  });
  const [exportTheme, setExportTheme] = useState<Theme | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);
  const { stream, isStreaming } = useSSEStream();

  const saveThemes = useCallback((t: Theme[]) => {
    const bounded = t.slice(0, MAX_THEMES);
    setThemes(bounded);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(bounded)); } catch (e) { console.warn("Theme save error:", e); }
  }, []);

  const generate = useCallback(async () => {
    try {
      const fullContent = await stream(
        [{ role: "user", content: THEME_PROMPT }],
        "Theme generation mode — return only valid JSON."
      );

      const result = extractJSON(fullContent);
      const newThemes: Theme[] = (result.themes || []).map((t: any, i: number) => ({
        ...t,
        id: `theme-${Date.now()}-${i}`,
        saved: false,
      }));

      saveThemes([...themes, ...newThemes]);
      toast.success(`Generated ${newThemes.length} themes`);
    } catch {
      // Error handled by useSSEStream
    }
  }, [themes, saveThemes, stream]);

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

  const copyText = async (text: string) => {
    const ok = await safeClipboardWrite(text);
    if (ok) toast.success("Copied to clipboard");
    else toast.error("Failed to copy");
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
          <Button onClick={generate} disabled={isStreaming}>
            {isStreaming ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1" />}
            Generate Alternatives
          </Button>
        </div>
      </div>

      {themes.length === 0 && !isStreaming && (
        <Card>
          <CardContent className="p-12 text-center">
            <Palette className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-lg font-medium mb-2">No Themes Generated</p>
            <p className="text-sm text-muted-foreground mb-4">Generate AI-powered theme alternatives to explore different visual directions.</p>
            <Button onClick={generate}><Sparkles className="h-4 w-4 mr-1" /> Generate Themes</Button>
          </CardContent>
        </Card>
      )}

      {isStreaming && (
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
                  <ContrastCheck theme={theme} />
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
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() = aria-label="Action"> toggleCompare(theme.id)} title="Compare">
                    <Eye className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() = aria-label="Action"> setExportTheme(theme)} title="Export">
                    <Download className="h-3.5 w-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() = aria-label="Action"> deleteTheme(theme.id)} title="Delete">
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-xs text-muted-foreground">{theme.description}</p>

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

              <ContrastCheck theme={theme} />

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
                {onPreviewTheme && (
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => onPreviewTheme(theme.colors)}>
                    <Eye className="h-3.5 w-3.5 mr-1" /> Preview
                  </Button>
                )}
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
