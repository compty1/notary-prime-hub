import React from "react";
import { LucideIcon, AlertTriangle, Palette, FolderOpen, FileCheck } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useState } from "react";

interface EnterpriseLayoutProps {
  children: React.ReactNode;
  title: string;
  icon: LucideIcon;
  description?: string;
}

const EnterpriseLayout: React.FC<EnterpriseLayoutProps> = ({ children, title, icon: Icon, description }) => {
  const [showDisclaimer, setShowDisclaimer] = useState(true);
  const location = useLocation();

  const breadcrumb = location.pathname.split("/").filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-primary/10">
            <Icon className="h-6 w-6 text-primary" />
          </div>
          <div>
            <nav className="mb-1 flex items-center gap-1 text-xs text-muted-foreground">
              {breadcrumb.map((seg, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <span>/</span>}
                  <span className="capitalize">{seg.replace(/-/g, " ")}</span>
                </React.Fragment>
              ))}
            </nav>
            <h1 className="text-2xl font-black tracking-tight">{title}</h1>
            {description && <p className="text-sm text-muted-foreground">{description}</p>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/enterprise/brand-settings"><Palette className="mr-1.5 h-3.5 w-3.5" />Brand Kits</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/enterprise/digital-vault"><FolderOpen className="mr-1.5 h-3.5 w-3.5" />Vault</Link>
          </Button>
          <Button variant="outline" size="sm" asChild>
            <Link to="/admin/enterprise/ai-grader"><FileCheck className="mr-1.5 h-3.5 w-3.5" />AI Grader</Link>
          </Button>
        </div>
      </div>

      {/* Disclaimer */}
      {showDisclaimer && (
        <div className="flex items-start gap-3 rounded-[16px] border border-destructive/20 bg-destructive/5 p-4">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <div className="flex-1">
            <p className="text-xs text-muted-foreground">
              Enterprise tools generate documents for informational purposes only. They do not constitute legal advice. Always consult a licensed attorney.
            </p>
          </div>
          <button onClick={() => setShowDisclaimer(false)} className="text-xs text-muted-foreground hover:text-foreground">Dismiss</button>
        </div>
      )}

      {/* Content */}
      {children}
    </div>
  );
};

export default EnterpriseLayout;
