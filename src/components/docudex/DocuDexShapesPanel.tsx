import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import {
  AlertTriangle, CheckCircle, Info, XCircle, Quote, BarChart3,
  Layers, Clock, Sparkles, ArrowRight, Star, Zap, Shield, Heart,
  Bookmark, Flag, Award, Target, TrendingUp, Box,
} from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

interface ShapesPanelProps {
  onInsertShape: (html: string) => void;
}

const SHAPE_CATEGORIES = [
  { value: "all", label: "All" },
  { value: "callouts", label: "Callouts" },
  { value: "blocks", label: "Content Blocks" },
  { value: "decorative", label: "Decorative" },
  { value: "data", label: "Data Display" },
];

const SHAPES = [
  // Callouts
  {
    id: "callout-info",
    label: "Info Callout",
    icon: Info,
    category: "callouts",
    preview: "ℹ️ Information notice",
    html: `<div style="background:#EFF6FF;border-left:4px solid #3B82F6;padding:16px;margin:12px 0;border-radius:0 8px 8px 0;"><p style="margin:0;font-weight:600;color:#1E40AF;">ℹ️ Information</p><p style="margin:4px 0 0;color:#1E3A5F;">Enter your informational note here.</p></div>`,
  },
  {
    id: "callout-warning",
    label: "Warning Callout",
    icon: AlertTriangle,
    category: "callouts",
    preview: "⚠️ Warning notice",
    html: `<div style="background:#FFFBEB;border-left:4px solid #F59E0B;padding:16px;margin:12px 0;border-radius:0 8px 8px 0;"><p style="margin:0;font-weight:600;color:#92400E;">⚠️ Warning</p><p style="margin:4px 0 0;color:#78350F;">Important warning message here.</p></div>`,
  },
  {
    id: "callout-success",
    label: "Success Callout",
    icon: CheckCircle,
    category: "callouts",
    preview: "✅ Success notice",
    html: `<div style="background:#F0FDF4;border-left:4px solid #22C55E;padding:16px;margin:12px 0;border-radius:0 8px 8px 0;"><p style="margin:0;font-weight:600;color:#166534;">✅ Success</p><p style="margin:4px 0 0;color:#14532D;">Operation completed successfully.</p></div>`,
  },
  {
    id: "callout-error",
    label: "Error Callout",
    icon: XCircle,
    category: "callouts",
    preview: "❌ Error notice",
    html: `<div style="background:#FEF2F2;border-left:4px solid #EF4444;padding:16px;margin:12px 0;border-radius:0 8px 8px 0;"><p style="margin:0;font-weight:600;color:#991B1B;">❌ Error</p><p style="margin:4px 0 0;color:#7F1D1D;">Error details or corrective action here.</p></div>`,
  },
  // Content Blocks
  {
    id: "pull-quote",
    label: "Pull Quote",
    icon: Quote,
    category: "blocks",
    preview: "Elegant quote block",
    html: `<blockquote style="border-left:4px solid #F59E0B;margin:24px 0;padding:20px 24px;background:linear-gradient(135deg,#FFFBEB 0%,#FEF3C7 100%);border-radius:0 12px 12px 0;font-size:18px;font-style:italic;color:#92400E;line-height:1.6;"><p style="margin:0;">"Excellence is not a skill. It is an attitude."</p><p style="margin:8px 0 0;font-size:14px;font-style:normal;font-weight:600;">— Ralph Marston</p></blockquote>`,
  },
  {
    id: "feature-card",
    label: "Feature Card",
    icon: Star,
    category: "blocks",
    preview: "Highlighted feature",
    html: `<div style="background:linear-gradient(135deg,#1E293B,#334155);color:#F8FAFC;padding:24px;margin:16px 0;border-radius:12px;"><p style="margin:0;font-size:12px;text-transform:uppercase;letter-spacing:2px;color:#F59E0B;">Featured</p><p style="margin:8px 0;font-size:20px;font-weight:700;">Key Feature Title</p><p style="margin:0;color:#94A3B8;font-size:14px;line-height:1.6;">Describe the feature benefit and value proposition here. Make it compelling and clear.</p></div>`,
  },
  {
    id: "cta-block",
    label: "Call to Action",
    icon: ArrowRight,
    category: "blocks",
    preview: "Action prompt block",
    html: `<div style="background:linear-gradient(135deg,#F59E0B,#D97706);padding:24px;margin:16px 0;border-radius:12px;text-align:center;"><p style="margin:0;font-size:20px;font-weight:700;color:#FFFFFF;">Ready to Get Started?</p><p style="margin:8px 0 16px;color:#FEF3C7;font-size:14px;">Take the next step today. We're here to help.</p><p style="margin:0;"><span style="background:#FFFFFF;color:#D97706;padding:10px 24px;border-radius:8px;font-weight:600;font-size:14px;">Contact Us →</span></p></div>`,
  },
  {
    id: "testimonial",
    label: "Testimonial",
    icon: Heart,
    category: "blocks",
    preview: "Client testimonial",
    html: `<div style="border:1px solid #E2E8F0;padding:24px;margin:16px 0;border-radius:12px;background:#FFFFFF;"><p style="margin:0;font-size:16px;line-height:1.7;color:#475569;font-style:italic;">"This service exceeded all my expectations. Professional, thorough, and incredibly efficient."</p><div style="margin-top:16px;display:flex;align-items:center;gap:12px;"><div style="width:40px;height:40px;border-radius:50%;background:#F59E0B;display:flex;align-items:center;justify-content:center;color:#FFF;font-weight:700;">JD</div><div><p style="margin:0;font-weight:600;color:#1E293B;font-size:14px;">Jane Doe</p><p style="margin:0;font-size:12px;color:#94A3B8;">Business Owner, Columbus OH</p></div></div></div>`,
  },
  {
    id: "step-process",
    label: "Process Steps",
    icon: Layers,
    category: "blocks",
    preview: "Numbered process",
    html: `<div style="margin:16px 0;"><div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;"><div style="width:32px;height:32px;border-radius:50%;background:#F59E0B;color:#FFF;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">1</div><div><p style="margin:0;font-weight:600;">Step One</p><p style="margin:4px 0 0;color:#64748B;font-size:14px;">Description of the first step in your process.</p></div></div><div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:16px;"><div style="width:32px;height:32px;border-radius:50%;background:#F59E0B;color:#FFF;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">2</div><div><p style="margin:0;font-weight:600;">Step Two</p><p style="margin:4px 0 0;color:#64748B;font-size:14px;">Description of the second step.</p></div></div><div style="display:flex;gap:12px;align-items:flex-start;"><div style="width:32px;height:32px;border-radius:50%;background:#F59E0B;color:#FFF;display:flex;align-items:center;justify-content:center;font-weight:700;flex-shrink:0;">3</div><div><p style="margin:0;font-weight:600;">Step Three</p><p style="margin:4px 0 0;color:#64748B;font-size:14px;">Description of the final step.</p></div></div></div>`,
  },
  {
    id: "timeline",
    label: "Timeline Entry",
    icon: Clock,
    category: "blocks",
    preview: "Timeline milestone",
    html: `<div style="border-left:3px solid #F59E0B;padding-left:20px;margin:16px 0;position:relative;"><div style="position:absolute;left:-7px;top:0;width:11px;height:11px;border-radius:50%;background:#F59E0B;border:2px solid #FFF;"></div><p style="margin:0;font-size:12px;color:#F59E0B;font-weight:600;text-transform:uppercase;">January 2025</p><p style="margin:4px 0;font-weight:600;font-size:16px;">Milestone Title</p><p style="margin:0;color:#64748B;font-size:14px;">Description of what was achieved at this milestone.</p></div>`,
  },
  // Data Display
  {
    id: "stat-grid",
    label: "Stats Grid",
    icon: BarChart3,
    category: "data",
    preview: "3-column statistics",
    html: `<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin:16px 0;"><div style="text-align:center;padding:20px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;"><p style="margin:0;font-size:32px;font-weight:800;color:#F59E0B;">500+</p><p style="margin:4px 0 0;font-size:13px;color:#64748B;">Documents Notarized</p></div><div style="text-align:center;padding:20px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;"><p style="margin:0;font-size:32px;font-weight:800;color:#F59E0B;">4.9★</p><p style="margin:4px 0 0;font-size:13px;color:#64748B;">Client Rating</p></div><div style="text-align:center;padding:20px;background:#F8FAFC;border-radius:12px;border:1px solid #E2E8F0;"><p style="margin:0;font-size:32px;font-weight:800;color:#F59E0B;">24/7</p><p style="margin:4px 0 0;font-size:13px;color:#64748B;">Online Availability</p></div></div>`,
  },
  {
    id: "comparison-table",
    label: "Comparison Table",
    icon: Target,
    category: "data",
    preview: "Pro/Con comparison",
    html: `<table style="width:100%;border-collapse:collapse;margin:16px 0;border-radius:8px;overflow:hidden;"><thead><tr><th style="background:#1E293B;color:#F8FAFC;padding:12px 16px;text-align:left;font-size:14px;">Feature</th><th style="background:#1E293B;color:#F8FAFC;padding:12px 16px;text-align:center;font-size:14px;">Basic</th><th style="background:#F59E0B;color:#FFF;padding:12px 16px;text-align:center;font-size:14px;">Pro</th></tr></thead><tbody><tr><td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;">Document Notarization</td><td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;text-align:center;">✓</td><td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;text-align:center;">✓</td></tr><tr><td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;">Priority Support</td><td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;text-align:center;">—</td><td style="padding:10px 16px;border-bottom:1px solid #E2E8F0;text-align:center;">✓</td></tr><tr><td style="padding:10px 16px;">AI Document Tools</td><td style="padding:10px 16px;text-align:center;">—</td><td style="padding:10px 16px;text-align:center;">✓</td></tr></tbody></table>`,
  },
  {
    id: "progress-bar",
    label: "Progress Bar",
    icon: TrendingUp,
    category: "data",
    preview: "Visual progress",
    html: `<div style="margin:16px 0;"><p style="margin:0 0 8px;font-weight:600;font-size:14px;">Project Completion — 75%</p><div style="background:#E2E8F0;border-radius:999px;height:12px;overflow:hidden;"><div style="background:linear-gradient(90deg,#F59E0B,#EAB308);height:100%;width:75%;border-radius:999px;transition:width 0.3s;"></div></div></div>`,
  },
  // Decorative
  {
    id: "gradient-divider",
    label: "Gradient Divider",
    icon: Sparkles,
    category: "decorative",
    preview: "Decorative separator",
    html: `<div style="margin:24px 0;height:3px;background:linear-gradient(90deg,transparent,#F59E0B,transparent);border-radius:2px;"></div>`,
  },
  {
    id: "accent-line",
    label: "Accent Line",
    icon: Zap,
    category: "decorative",
    preview: "Bold accent separator",
    html: `<div style="margin:20px 0;display:flex;align-items:center;gap:12px;"><div style="flex:1;height:1px;background:#E2E8F0;"></div><div style="width:8px;height:8px;background:#F59E0B;border-radius:50%;"></div><div style="flex:1;height:1px;background:#E2E8F0;"></div></div>`,
  },
  {
    id: "badge-row",
    label: "Badge Row",
    icon: Award,
    category: "decorative",
    preview: "Tag badges",
    html: `<div style="display:flex;gap:8px;flex-wrap:wrap;margin:12px 0;"><span style="background:#FEF3C7;color:#92400E;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">Certified</span><span style="background:#DBEAFE;color:#1E40AF;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">Ohio Licensed</span><span style="background:#F0FDF4;color:#166534;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">RON Approved</span><span style="background:#FDF2F8;color:#9D174D;padding:4px 12px;border-radius:999px;font-size:12px;font-weight:600;">Insured</span></div>`,
  },
  {
    id: "seal-stamp",
    label: "Official Seal",
    icon: Shield,
    category: "decorative",
    preview: "Notary seal block",
    html: `<div style="border:3px double #1E293B;padding:24px;margin:24px auto;text-align:center;border-radius:12px;max-width:320px;background:#FAFAFA;"><p style="margin:0;font-size:10px;text-transform:uppercase;letter-spacing:3px;color:#64748B;">State of Ohio</p><p style="margin:8px 0;font-size:18px;font-weight:800;color:#1E293B;">NOTARY PUBLIC</p><div style="width:60px;height:2px;background:#F59E0B;margin:8px auto;"></div><p style="margin:8px 0 0;font-size:12px;color:#64748B;">Commission #: ____________</p><p style="margin:4px 0;font-size:12px;color:#64748B;">Expires: ____________</p></div>`,
  },
  {
    id: "ribbon-header",
    label: "Ribbon Header",
    icon: Flag,
    category: "decorative",
    preview: "Styled section header",
    html: `<div style="background:linear-gradient(135deg,#1E293B,#334155);color:#F8FAFC;padding:12px 24px;margin:16px -8px;position:relative;"><p style="margin:0;font-size:16px;font-weight:700;letter-spacing:0.5px;">Section Title</p><div style="position:absolute;bottom:-6px;left:0;width:0;height:0;border-top:6px solid #0F172A;border-right:6px solid transparent;"></div></div>`,
  },
  {
    id: "bookmark-note",
    label: "Bookmark Note",
    icon: Bookmark,
    category: "decorative",
    preview: "Pinned note style",
    html: `<div style="background:#FFFBEB;border:1px solid #FDE68A;padding:16px 16px 16px 48px;margin:16px 0;border-radius:8px;position:relative;"><div style="position:absolute;left:16px;top:16px;font-size:20px;">📌</div><p style="margin:0;font-weight:600;font-size:14px;color:#92400E;">Important Note</p><p style="margin:4px 0 0;color:#78350F;font-size:13px;">This is a pinned note that draws attention to key information.</p></div>`,
  },
];

export function DocuDexShapesPanel({ onInsertShape }: ShapesPanelProps) {
  const [category, setCategory] = useState("all");
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  const filtered = SHAPES.filter(s => category === "all" || s.category === category);

  return (
    <div className="space-y-3">
      <p className="text-[10px] text-muted-foreground font-medium">Drag-and-drop style content blocks</p>
      <div className="flex gap-1 flex-wrap">
        {SHAPE_CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "px-2 py-0.5 rounded-full text-[10px] transition-colors",
              category === cat.value
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-muted/80"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="space-y-1.5">
        {filtered.map(shape => {
          const Icon = shape.icon;
          return (
            <button
              key={shape.id}
              onClick={() => onInsertShape(shape.html)}
              onMouseEnter={() => setHoveredId(shape.id)}
              onMouseLeave={() => setHoveredId(null)}
              className="w-full text-left rounded-lg border border-border p-2.5 text-xs hover:bg-muted hover:border-primary/30 transition-all group"
            >
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-md bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="h-3.5 w-3.5 text-primary" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-[11px] leading-tight">{shape.label}</p>
                  <p className="text-[9px] text-muted-foreground truncate">{shape.preview}</p>
                </div>
                <Badge variant="outline" className="text-[8px] px-1.5 py-0 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  Insert
                </Badge>
              </div>
            </button>
          );
        })}
      </div>
      {filtered.length === 0 && (
        <p className="text-[10px] text-muted-foreground text-center py-4">No shapes in this category.</p>
      )}
    </div>
  );
}
