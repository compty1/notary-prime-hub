/**
 * Sprint 1: Dynamic Service Intake Form
 * Renders a form from a field config array, handles file upload, consent, and pricing sidebar.
 * Submits to service_requests with JSONB metadata.
 */
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Loader2, Upload, FileText, CheckCircle } from "lucide-react";
import { useServiceRequest } from "@/hooks/useServiceScaffold";
import { ConsentCheckboxes } from "@/components/ConsentCheckboxes";
import { useAuth } from "@/contexts/AuthContext";

export interface IntakeField {
  name: string;
  label: string;
  type: "text" | "email" | "tel" | "number" | "textarea" | "select" | "switch" | "file" | "date";
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  description?: string;
}

interface ServiceIntakeFormProps {
  serviceSlug: string;
  serviceTitle: string;
  serviceDescription?: string;
  fields: IntakeField[];
  estimatedPrice?: string;
  consentItems?: Array<{
    id: string;
    label: string;
    description?: string;
    required?: boolean;
  }>;
  onSuccess?: (data: any) => void;
  children?: React.ReactNode;
}

export function ServiceIntakeForm({
  serviceSlug,
  serviceTitle,
  serviceDescription,
  fields,
  estimatedPrice,
  consentItems,
  onSuccess,
  children,
}: ServiceIntakeFormProps) {
  const { user } = useAuth();
  const { submitRequest } = useServiceRequest(serviceSlug);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [consents, setConsents] = useState<Record<string, boolean>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [notes, setNotes] = useState("");

  const updateField = (name: string, value: any) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const allRequiredFilled = fields
    .filter(f => f.required)
    .every(f => formData[f.name] !== undefined && formData[f.name] !== "");

  const allRequiredConsents = consentItems
    ? consentItems.filter(c => c.required).every(c => consents[c.id])
    : true;

  const canSubmit = allRequiredFilled && allRequiredConsents && !submitting && !!user;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    const result = await submitRequest({ ...formData, consents }, notes || undefined);
    setSubmitting(false);
    if (result) {
      setSubmitted(true);
      onSuccess?.(result);
    }
  };

  if (submitted) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-4 py-12">
          <CheckCircle className="h-12 w-12 text-primary" />
          <h3 className="text-xl font-bold">Request Submitted!</h3>
          <p className="text-muted-foreground text-center max-w-md">
            Your {serviceTitle} request has been received. You'll receive a confirmation email shortly.
          </p>
          <Button variant="outline" onClick={() => { setSubmitted(false); setFormData({}); }}>
            Submit Another
          </Button>
        </CardContent>
      </Card>
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
            {serviceDescription && (
              <p className="text-sm text-muted-foreground">{serviceDescription}</p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {fields.map((field) => (
              <div key={field.name} className="space-y-1.5">
                <Label htmlFor={field.name} className="text-sm">
                  {field.label}
                  {field.required && <span className="text-destructive ml-1">*</span>}
                </Label>
                {field.description && (
                  <p className="text-xs text-muted-foreground">{field.description}</p>
                )}

                {field.type === "textarea" ? (
                  <Textarea
                    id={field.name}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={e => updateField(field.name, e.target.value)}
                    rows={4}
                  />
                ) : field.type === "select" ? (
                  <Select
                    value={formData[field.name] || ""}
                    onValueChange={v => updateField(field.name, v)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={field.placeholder || "Select..."} />
                    </SelectTrigger>
                    <SelectContent>
                      {field.options?.map(opt => (
                        <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : field.type === "switch" ? (
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={!!formData[field.name]}
                      onCheckedChange={v => updateField(field.name, v)}
                    />
                    <span className="text-sm text-muted-foreground">{field.placeholder}</span>
                  </div>
                ) : field.type === "file" ? (
                  <div className="border-2 border-dashed rounded-lg p-4 text-center">
                    <Upload className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground">
                      File upload will be available after submission
                    </p>
                  </div>
                ) : (
                  <Input
                    id={field.name}
                    type={field.type}
                    placeholder={field.placeholder}
                    value={formData[field.name] || ""}
                    onChange={e => updateField(field.name, e.target.value)}
                  />
                )}
              </div>
            ))}

            <div className="space-y-1.5">
              <Label className="text-sm">Additional Notes</Label>
              <Textarea
                placeholder="Any special instructions or details..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {consentItems && consentItems.length > 0 && (
              <>
                <Separator />
                <ConsentCheckboxes
                  consents={consentItems}
                  values={consents}
                  onChange={(id, checked) => setConsents(prev => ({ ...prev, [id]: checked }))}
                />
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Sidebar */}
      <div className="space-y-4">
        {estimatedPrice && (
          <Card>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground mb-1">Estimated Price</p>
              <p className="text-2xl font-bold">{estimatedPrice}</p>
              <p className="text-xs text-muted-foreground mt-1">Final price may vary based on complexity</p>
            </CardContent>
          </Card>
        )}

        {children}

        <Button className="w-full" size="lg" disabled={!canSubmit} onClick={handleSubmit}>
          {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
          {submitting ? "Submitting..." : "Submit Request"}
        </Button>

        {!user && (
          <p className="text-xs text-destructive text-center">
            Please sign in to submit a service request.
          </p>
        )}
      </div>
    </div>
  );
}
