import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import {
  RectangleHorizontal, Circle, Triangle, Star, ArrowRight,
  Minus, CornerDownRight, Frame, Quote, Bookmark, Shield, Award,
} from "lucide-react";

interface ShapeItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  html: string;
}

const SHAPES: ShapeItem[] = [
  {
    id: "rect-filled",
    label: "Filled Box",
    icon: <RectangleHorizontal className="h-4 w-4" />,
    html: `<div style="background:#f1f5f9;border-radius:12px;padding:24px;margin:16px 0;"><p>Content block</p></div>`,
  },
  {
    id: "rect-outlined",
    label: "Outlined Box",
    icon: <Frame className="h-4 w-4" />,
    html: `<div style="border:2px solid #e2e8f0;border-radius:12px;padding:24px;margin:16px 0;"><p>Content block</p></div>`,
  },
  {
    id: "accent-box",
    label: "Accent Box",
    icon: <RectangleHorizontal className="h-4 w-4" />,
    html: `<div style="border-left:4px solid #3b82f6;background:#eff6ff;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;"><p><strong>Note:</strong> Important information here</p></div>`,
  },
  {
    id: "warning-box",
    label: "Warning Box",
    icon: <Shield className="h-4 w-4" />,
    html: `<div style="border-left:4px solid #f59e0b;background:#fffbeb;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;"><p>⚠️ <strong>Warning:</strong> Please review carefully</p></div>`,
  },
  {
    id: "success-box",
    label: "Success Box",
    icon: <Award className="h-4 w-4" />,
    html: `<div style="border-left:4px solid #10b981;background:#f0fdf4;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;"><p>✅ <strong>Complete:</strong> All requirements met</p></div>`,
  },
  {
    id: "error-box",
    label: "Error Box",
    icon: <Shield className="h-4 w-4" />,
    html: `<div style="border-left:4px solid #ef4444;background:#fef2f2;padding:16px 20px;border-radius:0 8px 8px 0;margin:16px 0;"><p>❌ <strong>Error:</strong> Action required</p></div>`,
  },
  {
    id: "pull-quote",
    label: "Pull Quote",
    icon: <Quote className="h-4 w-4" />,
    html: `<div style="border-top:3px solid #1e293b;border-bottom:3px solid #1e293b;padding:24px 16px;margin:24px 32px;text-align:center;"><p style="font-size:20px;font-style:italic;color:#334155;line-height:1.6;">"Your quote text here"</p><p style="font-size:13px;color:#94a3b8;margin-top:8px;">— Attribution</p></div>`,
  },
  {
    id: "stat-block",
    label: "Stat Block",
    icon: <Star className="h-4 w-4" />,
    html: `<table style="width:100%;border:none;border-collapse:separate;border-spacing:12px;text-align:center;"><tr><td style="border:none;background:#f8fafc;border-radius:12px;padding:20px;"><p style="font-size:32px;font-weight:bold;color:#1e293b;margin:0;">99%</p><p style="font-size:12px;color:#64748b;margin:4px 0 0;">Satisfaction</p></td><td style="border:none;background:#f8fafc;border-radius:12px;padding:20px;"><p style="font-size:32px;font-weight:bold;color:#1e293b;margin:0;">500+</p><p style="font-size:12px;color:#64748b;margin:4px 0 0;">Documents</p></td><td style="border:none;background:#f8fafc;border-radius:12px;padding:20px;"><p style="font-size:32px;font-weight:bold;color:#1e293b;margin:0;">24/7</p><p style="font-size:12px;color:#64748b;margin:4px 0 0;">Support</p></td></tr></table>`,
  },
  {
    id: "divider-fancy",
    label: "Fancy Divider",
    icon: <Minus className="h-4 w-4" />,
    html: `<div style="text-align:center;margin:32px 0;"><span style="display:inline-block;width:80px;height:1px;background:#cbd5e1;vertical-align:middle;"></span><span style="display:inline-block;margin:0 12px;color:#94a3b8;font-size:14px;">✦</span><span style="display:inline-block;width:80px;height:1px;background:#cbd5e1;vertical-align:middle;"></span></div>`,
  },
  {
    id: "divider-dots",
    label: "Dot Divider",
    icon: <Minus className="h-4 w-4" />,
    html: `<p style="text-align:center;letter-spacing:8px;color:#94a3b8;margin:24px 0;">• • • • •</p>`,
  },
  {
    id: "gradient-banner",
    label: "Gradient Banner",
    icon: <RectangleHorizontal className="h-4 w-4" />,
    html: `<div style="background:linear-gradient(135deg,#667eea,#764ba2);color:#fff;padding:32px;border-radius:12px;margin:16px 0;text-align:center;"><h2 style="color:#fff;margin:0 0 8px;">Banner Title</h2><p style="color:rgba(255,255,255,0.8);margin:0;">Supporting text goes here</p></div>`,
  },
  {
    id: "timeline-entry",
    label: "Timeline Entry",
    icon: <CornerDownRight className="h-4 w-4" />,
    html: `<table style="width:100%;border:none;"><tr><td style="width:80px;text-align:center;vertical-align:top;border:none;"><div style="background:#3b82f6;color:#fff;border-radius:50%;width:32px;height:32px;line-height:32px;text-align:center;margin:0 auto;">1</div><div style="width:2px;height:40px;background:#e2e8f0;margin:4px auto;"></div></td><td style="padding:4px 16px;vertical-align:top;border:none;"><h3 style="margin:4px 0;">Step One</h3><p style="font-size:13px;color:#64748b;">Description of this step</p></td></tr></table>`,
  },
  {
    id: "arrow-callout",
    label: "Arrow Callout",
    icon: <ArrowRight className="h-4 w-4" />,
    html: `<div style="display:flex;align-items:center;gap:12px;background:#fefce8;border:1px solid #fde68a;border-radius:8px;padding:16px;margin:16px 0;"><span style="font-size:24px;">👉</span><div><p style="margin:0;font-weight:600;">Action Required</p><p style="margin:4px 0 0;font-size:13px;color:#64748b;">Description of what needs to be done</p></div></div>`,
  },
  {
    id: "badge-row",
    label: "Badge Row",
    icon: <Bookmark className="h-4 w-4" />,
    html: `<p style="display:flex;gap:8px;flex-wrap:wrap;margin:16px 0;"><span style="display:inline-block;background:#dbeafe;color:#1e40af;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:500;">Label 1</span><span style="display:inline-block;background:#dcfce7;color:#166534;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:500;">Label 2</span><span style="display:inline-block;background:#fef3c7;color:#92400e;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:500;">Label 3</span></p>`,
  },
];

interface ShapesPanelProps {
  onInsertShape: (html: string) => void;
}

export function DocuDexShapesPanel({ onInsertShape }: ShapesPanelProps) {
  const [search, setSearch] = useState("");

  const filtered = SHAPES.filter(s =>
    !search || s.label.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <p className="text-[10px] text-muted-foreground mb-1">Visual blocks & decorative elements</p>
      <Input
        className="h-7 text-xs"
        placeholder="Search shapes..."
        value={search}
        onChange={e => setSearch(e.target.value)}
      />
      <div className="grid grid-cols-2 gap-2 mt-2">
        {filtered.map(shape => (
          <button
            key={shape.id}
            onClick={() => onInsertShape(shape.html)}
            className={cn(
              "flex flex-col items-center gap-1.5 rounded-lg border border-border p-2.5",
              "text-xs hover:bg-muted hover:border-primary/30 transition-all group"
            )}
          >
            <div className="h-7 w-7 rounded-md bg-muted flex items-center justify-center group-hover:bg-primary/10 transition-colors">
              {shape.icon}
            </div>
            <span className="text-[9px] text-center font-medium leading-tight">{shape.label}</span>
          </button>
        ))}
      </div>
      {filtered.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-4">No shapes match.</p>
      )}
    </div>
  );
}
