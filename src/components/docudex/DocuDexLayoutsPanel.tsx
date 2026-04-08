import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { LayoutGrid, Columns2, Columns3, Rows2, Square, PanelLeft, PanelRight } from "lucide-react";

export interface LayoutItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  html: string;
}

const LAYOUTS: LayoutItem[] = [
  {
    id: "single-column",
    label: "Single Column",
    icon: <Square className="h-4 w-4" />,
    html: `<h1>Title</h1><p>Start typing your content here...</p>`,
  },
  {
    id: "two-column",
    label: "Two Columns",
    icon: <Columns2 className="h-4 w-4" />,
    html: `<table style="width:100%;border:none;border-collapse:collapse;"><tr><td style="width:48%;vertical-align:top;padding:12px;border:1px dashed #e2e8f0;border-radius:8px;"><h2>Left Column</h2><p>Content here...</p></td><td style="width:4%;border:none;"></td><td style="width:48%;vertical-align:top;padding:12px;border:1px dashed #e2e8f0;border-radius:8px;"><h2>Right Column</h2><p>Content here...</p></td></tr></table>`,
  },
  {
    id: "three-column",
    label: "Three Columns",
    icon: <Columns3 className="h-4 w-4" />,
    html: `<table style="width:100%;border:none;border-collapse:collapse;"><tr><td style="width:31%;vertical-align:top;padding:12px;border:1px dashed #e2e8f0;border-radius:8px;"><h3>Column 1</h3><p></p></td><td style="width:3.5%;border:none;"></td><td style="width:31%;vertical-align:top;padding:12px;border:1px dashed #e2e8f0;border-radius:8px;"><h3>Column 2</h3><p></p></td><td style="width:3.5%;border:none;"></td><td style="width:31%;vertical-align:top;padding:12px;border:1px dashed #e2e8f0;border-radius:8px;"><h3>Column 3</h3><p></p></td></tr></table>`,
  },
  {
    id: "sidebar-left",
    label: "Sidebar Left",
    icon: <PanelLeft className="h-4 w-4" />,
    html: `<table style="width:100%;border:none;border-collapse:collapse;"><tr><td style="width:30%;vertical-align:top;padding:16px;background:#f8fafc;border-radius:8px;"><h3>Sidebar</h3><p style="font-size:12px;">Navigation or notes</p></td><td style="width:4%;border:none;"></td><td style="width:66%;vertical-align:top;padding:16px;"><h1>Main Content</h1><p>Your primary content goes here...</p></td></tr></table>`,
  },
  {
    id: "sidebar-right",
    label: "Sidebar Right",
    icon: <PanelRight className="h-4 w-4" />,
    html: `<table style="width:100%;border:none;border-collapse:collapse;"><tr><td style="width:66%;vertical-align:top;padding:16px;"><h1>Main Content</h1><p>Your primary content goes here...</p></td><td style="width:4%;border:none;"></td><td style="width:30%;vertical-align:top;padding:16px;background:#f8fafc;border-radius:8px;"><h3>Sidebar</h3><p style="font-size:12px;">Notes or references</p></td></tr></table>`,
  },
  {
    id: "hero-header",
    label: "Hero Header",
    icon: <Rows2 className="h-4 w-4" />,
    html: `<div style="background:linear-gradient(135deg,#1e293b,#334155);color:#fff;padding:48px 32px;border-radius:12px;text-align:center;margin-bottom:24px;"><h1 style="color:#fff;font-size:32px;margin-bottom:8px;">Document Title</h1><p style="color:#94a3b8;font-size:16px;">Subtitle or description</p></div><p>Continue your document content below...</p>`,
  },
  {
    id: "card-grid",
    label: "Card Grid (2×2)",
    icon: <LayoutGrid className="h-4 w-4" />,
    html: `<table style="width:100%;border:none;border-collapse:separate;border-spacing:12px;"><tr><td style="width:48%;padding:20px;border:1px solid #e2e8f0;border-radius:12px;vertical-align:top;"><h3>Card 1</h3><p style="font-size:13px;color:#64748b;"></p></td><td style="width:48%;padding:20px;border:1px solid #e2e8f0;border-radius:12px;vertical-align:top;"><h3>Card 2</h3><p style="font-size:13px;color:#64748b;"></p></td></tr><tr><td style="width:48%;padding:20px;border:1px solid #e2e8f0;border-radius:12px;vertical-align:top;"><h3>Card 3</h3><p style="font-size:13px;color:#64748b;"></p></td><td style="width:48%;padding:20px;border:1px solid #e2e8f0;border-radius:12px;vertical-align:top;"><h3>Card 4</h3><p style="font-size:13px;color:#64748b;"></p></td></tr></table>`,
  },
  {
    id: "feature-list",
    label: "Feature List",
    icon: <Rows2 className="h-4 w-4" />,
    html: `<h1>Features</h1><table style="width:100%;border:none;border-collapse:separate;border-spacing:0 8px;"><tr><td style="width:48px;text-align:center;font-size:24px;vertical-align:top;">✅</td><td style="padding:8px 12px;"><h3 style="margin:0;">Feature One</h3><p style="margin:4px 0 0;font-size:13px;color:#64748b;">Description of this feature</p></td></tr><tr><td style="width:48px;text-align:center;font-size:24px;vertical-align:top;">🚀</td><td style="padding:8px 12px;"><h3 style="margin:0;">Feature Two</h3><p style="margin:4px 0 0;font-size:13px;color:#64748b;">Description of this feature</p></td></tr><tr><td style="width:48px;text-align:center;font-size:24px;vertical-align:top;">🔒</td><td style="padding:8px 12px;"><h3 style="margin:0;">Feature Three</h3><p style="margin:4px 0 0;font-size:13px;color:#64748b;">Description of this feature</p></td></tr></table>`,
  },
  {
    id: "letterhead",
    label: "Letterhead",
    icon: <Square className="h-4 w-4" />,
    html: `<div style="border-bottom:3px solid #1e293b;padding-bottom:12px;margin-bottom:24px;"><table style="width:100%;border:none;"><tr><td style="border:none;"><h2 style="margin:0;color:#1e293b;">Company Name</h2><p style="margin:2px 0 0;font-size:12px;color:#64748b;">Address Line 1 • City, State ZIP • (555) 123-4567</p></td><td style="border:none;text-align:right;font-size:12px;color:#64748b;">www.example.com<br>info@example.com</td></tr></table></div><p>Date: ____________</p><p>Dear ____________,</p><p></p>`,
  },
  {
    id: "certificate",
    label: "Certificate",
    icon: <Square className="h-4 w-4" />,
    html: `<div style="border:4px double #1e293b;padding:48px 32px;text-align:center;border-radius:4px;"><p style="font-size:14px;letter-spacing:4px;color:#64748b;text-transform:uppercase;">Certificate of</p><h1 style="font-size:36px;margin:16px 0;color:#1e293b;">Achievement</h1><p style="font-size:16px;margin:24px 0;">This certifies that</p><p style="font-size:24px;font-style:italic;border-bottom:1px solid #1e293b;display:inline-block;padding:0 48px 4px;">____________</p><p style="font-size:14px;margin-top:24px;color:#64748b;">has successfully completed the requirements</p><p style="margin-top:48px;"><span style="border-top:1px solid #1e293b;padding-top:8px;display:inline-block;min-width:200px;">Authorized Signature</span></p></div>`,
  },
];

interface LayoutsPanelProps {
  onApplyLayout: (html: string) => void;
}

export function DocuDexLayoutsPanel({ onApplyLayout }: LayoutsPanelProps) {
  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground mb-2">
        Choose a layout to apply to the current page
      </p>
      <div className="grid grid-cols-2 gap-2">
        {LAYOUTS.map(layout => (
          <button
            key={layout.id}
            onClick={() => onApplyLayout(layout.html)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border border-border p-3",
              "text-xs hover:bg-muted hover:border-primary/30 transition-all group"
            )}
          >
            <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              {layout.icon}
            </div>
            <span className="text-[10px] text-center font-medium leading-tight">{layout.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
