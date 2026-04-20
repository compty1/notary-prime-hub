/**
 * Dynamic Service Intake Form with file upload, cross-sell, packages, add-ons, FAQ, checklist, and timeline.
 */
import { useState, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, FileText, CheckCircle, X } from "lucide-react";
import { useServiceRequest } from "@/hooks/useServiceScaffold";
import { ConsentCheckboxes } from "@/components/ConsentCheckboxes";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { ServicePackages, ServicePackage } from "./ServicePackages";
import { ServiceAddOns, ServiceAddOn } from "./ServiceAddOns";
import { ServiceFAQ, FAQItem } from "./ServiceFAQ";
import { ServiceChecklist, ChecklistItem } from "./ServiceChecklist";
import { ServiceTimeline, TimelineStep } from "./ServiceTimeline";
import { CrossSellPanel } from "./CrossSellPanel";
import { PricingQuotePanel } from "./PricingQuotePanel";

export interface IntakeField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "switch" | "file" | "date";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

export interface PricingConfig {
  serviceId: string;
  notarizationType?: "in_person" | "ron";
  /** Maps form field names to pricing params: signerCount, documentCount, isRush, isAfterHours, isMobile, travelZone */
  fieldMapping?: Record<string, string>;
}

interface ServiceIntakeFormProps {
  serviceSlug: string;
  serviceTitle: string;
  serviceDescription?: string;
  fields: IntakeField[];
  estimatedPrice?: string;
  consentItems?: Array<{ id: string; label: string; description?: string; required?: boolean }>;
  packages?: ServicePackage[];
  addOns?: ServiceAddOn[];
  faq?: FAQItem[];
  checklist?: ChecklistItem[];
  timeline?: { steps: TimelineStep[]; turnaround?: string };
  pricingConfig?: PricingConfig;
  onSuccess?: (data: any) => void;
  children?: React.ReactNode;
}

export function ServiceIntakeForm({
  serviceSlug, serviceTitle, serviceDescription, fields, estimatedPrice,
  consentItems, packages, addOns, faq, checklist, timeline, pricingConfig, onSuccess, children,
}: ServiceIntakeFormProps) {
  const { user } = useAuth();
  const { submitRequest } = useServiceRequest(serviceSlug);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");
  const [selectedPackage, setSelectedPackage] = useState<string>("");
  const [selectedAddOns, setSelectedAddOns] = useState<string[]>([]);
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, { name: string; path: string }[]>>({});
  const [uploading, setUploading] = useState<Record<string, boolean>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  const updateField = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileUpload = async (fieldName: string, files: FileList | null) => {
    if (!files?.length || !user) return;
    setUploading(prev => ({ ...prev, [fieldName]: true }));
    const uploaded: { name: string; path: string }[] = [...(uploadedFiles[fieldName] || [])];

    for (const file of Array.from(files)) {
      const ext = file.name.split('.').pop();
      const path = `${user.id}/${serviceSlug}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
      const { error } = await supabase.storage.from("documents").upload(path, file);
      if (!error) {
        uploaded.push({ name: file.name, path });
      }
    }

    setUploadedFiles(prev => ({ ...prev, [fieldName]: uploaded }));
    updateField(fieldName, uploaded.map(f => f.path));
    setUploading(prev => ({ ...prev, [fieldName]: false }));
  };

  const removeFile = (fieldName: string, index: number) => {
    const updated = [...(uploadedFiles[fieldName] || [])];
    updated.splice(index, 1);
    setUploadedFiles(prev => ({ ...prev, [fieldName]: updated }));
    updateField(fieldName, updated.map(f => f.path));
  };

  const allRequiredFilled = fields
    .filter(f => f.required)
    .every(f => {
      if (f.type === "file") return (uploadedFiles[f.name]?.length || 0) > 0;
      return formData[f.name] !== undefined && formData[f.name] !== "";
    });

  const allRequiredConsents = consentItems
    ? consentItems.filter(c => c.required).every(c => consents[c.id])
    : true;

  const canSubmit = allRequiredFilled && allRequiredConsents && !submitting && !!user;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const payload = {
      ...formData,
      consents,
      ...(selectedPackage && { selected_package: selectedPackage }),
      ...(selectedAddOns.length && { add_ons: selectedAddOns }),
    };
    const result = await submitRequest(payload, notes || undefined);
    setSubmitting(false);
    if (result) {
      setSubmitted(true);
      onSuccess?.(result);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex flex-col items-center gap-4 py-12">
            <CheckCircle className="h-12 w-12 text-primary" />
            <h3 className="text-xl font-bold">Request Submitted!</h3>
            <p className="text-muted-foreground text-center max-w-md">
              Your {serviceTitle} request has been received. You'll receive a confirmation email shortly.
            </p>
            <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({}); setUploadedFiles({}); setSelectedPackage(""); setSelectedAddOns([]); }}>
              Submit Another
            </Button>
          </CardContent>
        </Card>
        <CrossSellPanel completedServiceType={serviceSlug} />
      </div>
    );
  }

  return (
    <div className="grid gap-6 lg:grid-cols-3">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              {serviceTitle}
            </CardTitle>
            {serviceDescription && <p className="text-sm text-muted-foreground">{serviceDescription}</p>}
          </CardHeader>
          <CardContent className="space-y-4">
            {packages && packages.length > 0 && (
              <>
                <ServicePackages packages={packages} selected={selectedPackage} onSelect={setSelectedPackage} />
                <Separator />
              </>
            )}

            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name} className="text-sm">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.description && <p className="text-xs text-muted-foreground">{field.description}</p>}

                {field.type === "textarea" ? (
                  <Textarea id={field.name} placeholder={field.placeholder} value={formData[field.name] || ""} onChange={e => updateField(field.name, e.target.value)} rows={4} />
                ) : field.type === "select" ? (
                  <Select value={formData[field.name] || ""} onValueChange={v => updateField(field.name, v)}>
                    <SelectTrigger><SelectValue placeholder={field.placeholder || "Select..."} /></SelectTrigger>
                    <SelectContent>
                      {field.options?.map(opt => <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                ) : field.type === "switch" ? (
                  <div className="flex items-center gap-3">
                    <Switch checked={!!formData[field.name]} onCheckedChange={v => updateField(field.name, v)} />
                    <span className="text-sm text-muted-foreground">{field.placeholder}</span>
                  </div>
                ) : field.type === "file" ? (
                  <div className="space-y-2">
                    <div
                      className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                      onClick={() => fileInputRefs.current[field.name]?.click()}
                    >
                      <input
                        ref={el => { fileInputRefs.current[field.name] = el; }}
                        type="file"
                        className="hidden"
                        multiple
                        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.tiff"
                        onChange={e => handleFileUpload(field.name, e.target.files)}
                      />
                      {uploading[field.name] ? (
                        <Loader2 className="h-6 w-6 mx-auto animate-spin text-primary" />
                      ) : (
                        <>
                          <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                          <p className="text-xs text-muted-foreground">Click to upload files (PDF, DOC, JPG, PNG)</p>
                        </>
                      )}
                    </div>
                    {(uploadedFiles[field.name] || []).map((f, i) => (
                      <div key={i} className="flex items-center justify-between text-xs bg-muted/50 rounded px-3 py-1.5">
                        <span className="truncate">{f.name}</span>
                        <Button variant="ghost" size="icon" className="h-5 w-5" onClick={() => removeFile(field.name, i)}>
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <Input id={field.name} type={field.type} placeholder={field.placeholder} value={formData[field.name] || ""} onChange={e => updateField(field.name, e.target.value)} />
                )}
              </div>
            ))}

            {addOns && addOns.length > 0 && (
              <>
                <Separator />
                <ServiceAddOns addOns={addOns} selected={selectedAddOns} onChange={setSelectedAddOns} />
              </>
            )}

            <div className="space-y-1.5">
              <Label className="text-sm">Additional Notes</Label>
              <Textarea placeholder="Any special instructions or details..." value={notes} onChange={e => setNotes(e.target.value)} rows={3} />
            </div>

            {consentItems && consentItems.length > 0 && (
              <>
                <Separator />
                <ConsentCheckboxes consents={consentItems} values={consents} onChange={(id, checked) => setConsents(prev => ({ ...prev, [id]: checked }))} />
              </>
            )}
          </CardContent>
        </Card>

        {faq && faq.length > 0 && (
          <Card>
            <CardContent className="pt-6">
              <ServiceFAQ items={faq} />
            </CardContent>
          </Card>
        )}
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {pricingConfig ? (
          <PricingQuotePanel
            serviceId={pricingConfig.serviceId}
            signerCount={pricingConfig.fieldMapping?.signerCount ? Number(formData[pricingConfig.fieldMapping.signerCount]) || 1 : 1}
            documentCount={pricingConfig.fieldMapping?.documentCount ? Number(formData[pricingConfig.fieldMapping.documentCount]) || 1 : 1}
            isRush={pricingConfig.fieldMapping?.isRush ? !!formData[pricingConfig.fieldMapping.isRush] : false}
            isAfterHours={pricingConfig.fieldMapping?.isAfterHours ? !!formData[pricingConfig.fieldMapping.isAfterHours] : false}
            isMobile={pricingConfig.fieldMapping?.isMobile ? !!formData[pricingConfig.fieldMapping.isMobile] : false}
            travelZone={pricingConfig.fieldMapping?.travelZone ? Number(formData[pricingConfig.fieldMapping.travelZone]) || undefined : undefined}
            notarizationType={pricingConfig.notarizationType}
          />
        ) : estimatedPrice ? (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Estimated Price</p>
              <p className="text-2xl font-bold">{estimatedPrice}</p>
              <p className="text-xs text-muted-foreground mt-1">Final price may vary based on complexity</p>
            </CardContent>
          </Card>
        ) : null}

        {timeline && <ServiceTimeline steps={timeline.steps} turnaround={timeline.turnaround} />}
        {checklist && checklist.length > 0 && <ServiceChecklist items={checklist} />}
        {children}

        <Button className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>

        {!user && (
          <p className="text-xs text-destructive text-center">Please sign in to submit a service request.</p>
        )}
      </div>
    </div>
  );
}
