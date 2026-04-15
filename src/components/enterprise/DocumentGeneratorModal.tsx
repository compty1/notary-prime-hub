import React, { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Printer, Save, FileText } from "lucide-react";
import { documentTemplates, getTemplatesByCategory } from "@/lib/documentTemplates";
import { renderTemplate, type BrandKit } from "@/lib/templateRenderer";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface DocumentGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  templateId?: string;
  data?: Record<string, string>;
  brandKit?: BrandKit;
}

const DocumentGeneratorModal: React.FC<DocumentGeneratorModalProps> = ({
  isOpen, onClose, templateId: initialTemplateId, data: initialData, brandKit: externalBrandKit,
}) => {
  const { user } = useAuth();
  const [selectedTemplate, setSelectedTemplate] = useState(initialTemplateId || "");
  const [formData, setFormData] = useState<Record<string, string>>(initialData || {});
  const [brandKit, setBrandKit] = useState<BrandKit | undefined>(externalBrandKit);
  const [brandKits, setBrandKits] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialTemplateId) setSelectedTemplate(initialTemplateId);
    if (initialData) setFormData(prev => ({ ...prev, ...initialData }));
  }, [initialTemplateId, initialData]);

  useEffect(() => {
    if (externalBrandKit) setBrandKit(externalBrandKit);
  }, [externalBrandKit]);

  // Load user brand kits
  useEffect(() => {
    if (!user) return;
    supabase.from("client_brand_kits").select("*").eq("user_id", user.id).then(({ data }) => {
      if (data) setBrandKits(data);
      const defaultKit = data?.find((k: any) => k.is_default);
      if (defaultKit && !externalBrandKit) {
        setBrandKit({
          company_name: defaultKit.company_name,
          logo_url: defaultKit.logo_path ? undefined : undefined,
          primary_color: defaultKit.primary_color,
          secondary_color: defaultKit.secondary_color,
          font_family: defaultKit.font_family,
          tagline: defaultKit.tagline,
        });
      }
    });
  }, [user, externalBrandKit]);

  const template = selectedTemplate ? documentTemplates[selectedTemplate] : null;
  const placeholders = template?.placeholders || [];
  const renderedHtml = selectedTemplate ? renderTemplate(selectedTemplate, formData, brandKit) : "";

  const categories = getTemplatesByCategory();

  const handleFieldChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadPdf = async () => {
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const element = previewRef.current;
      if (!element) return;
      html2pdf().set({
        margin: 0.5,
        filename: `${template?.name || "document"}.pdf`,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2 },
        jsPDF: { unit: "in", format: "letter", orientation: "portrait" },
      }).from(element).save();
      toast.success("PDF downloaded");
    } catch (err) {
      toast.error("Failed to generate PDF");
    }
  };

  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`<html><head><title>${template?.name}</title></head><body>${renderedHtml}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const handleSaveToVault = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const blob = new Blob([renderedHtml], { type: "text/html" });
      const fileName = `${user.id}/${Date.now()}_${template?.name || "document"}.html`;
      const { error } = await supabase.storage.from("compliance_documents").upload(fileName, blob);
      if (error) throw error;
      toast.success("Saved to Digital Vault");
    } catch (err) {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleBrandKitSelect = (kitId: string) => {
    const kit = brandKits.find((k: any) => k.id === kitId);
    if (kit) {
      setBrandKit({
        company_name: kit.company_name,
        primary_color: kit.primary_color,
        secondary_color: kit.secondary_color,
        font_family: kit.font_family,
        tagline: kit.tagline,
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={() => onClose()}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-black">
            <FileText className="h-5 w-5 text-primary" />
            Document Generator
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-1 gap-4 overflow-hidden">
          {/* Left: Form */}
          <div className="w-1/3 space-y-4 overflow-y-auto pr-4">
            {/* Template selector */}
            <div className="space-y-2">
              <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Template</Label>
              <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
                <SelectTrigger><SelectValue placeholder="Select template" /></SelectTrigger>
                <SelectContent>
                  {Object.entries(categories).map(([cat, templates]) => (
                    <React.Fragment key={cat}>
                      <div className="px-2 py-1 text-xs font-bold text-muted-foreground">{cat}</div>
                      {templates.map(t => (
                        <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Brand kit selector */}
            {brandKits.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Brand Kit</Label>
                <Select onValueChange={handleBrandKitSelect}>
                  <SelectTrigger><SelectValue placeholder="None (default)" /></SelectTrigger>
                  <SelectContent>
                    {brandKits.map((k: any) => (
                      <SelectItem key={k.id} value={k.id}>{k.company_name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Dynamic fields */}
            {placeholders.map(p => (
              <div key={p} className="space-y-1">
                <Label className="text-xs capitalize">{p.replace(/_/g, " ")}</Label>
                <Input
                  value={formData[p] || ""}
                  onChange={(e) => handleFieldChange(p, e.target.value)}
                  placeholder={p.replace(/_/g, " ")}
                />
              </div>
            ))}

            {/* Actions */}
            <div className="flex flex-col gap-2 pt-4 border-t">
              <Button onClick={handleDownloadPdf} className="w-full" variant="dark">
                <Download className="mr-2 h-4 w-4" />Download PDF
              </Button>
              <Button onClick={handlePrint} variant="outline" className="w-full">
                <Printer className="mr-2 h-4 w-4" />Print
              </Button>
              <Button onClick={handleSaveToVault} variant="outline" className="w-full" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />{saving ? "Saving..." : "Save to Vault"}
              </Button>
            </div>
          </div>

          {/* Right: Preview */}
          <div className="flex-1 overflow-y-auto rounded-[16px] border bg-white p-6">
            <div ref={previewRef} dangerouslySetInnerHTML={{ __html: renderedHtml }} />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentGeneratorModal;
