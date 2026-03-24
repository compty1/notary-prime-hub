import { useState, useEffect } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { ChevronLeft, CheckCircle, FileText, Globe, Upload, Loader2, Shield, Briefcase, ClipboardList } from "lucide-react";

const HAGUE_COUNTRIES = [
  "Albania","Andorra","Argentina","Armenia","Australia","Austria","Azerbaijan","Bahamas","Bahrain","Barbados","Belarus","Belgium","Belize","Bolivia","Bosnia and Herzegovina","Botswana","Brazil","Brunei","Bulgaria","Burundi","Canada","Cape Verde","Chile","China (Hong Kong)","China (Macao)","Colombia","Cook Islands","Costa Rica","Croatia","Cyprus","Czech Republic","Denmark","Dominica","Dominican Republic","Ecuador","El Salvador","Estonia","Eswatini","Fiji","Finland","France","Georgia","Germany","Greece","Grenada","Guatemala","Guyana","Honduras","Hungary","Iceland","India","Indonesia","Ireland","Israel","Italy","Jamaica","Japan","Jordan","Kazakhstan","Kosovo","Kyrgyzstan","Latvia","Lesotho","Liberia","Liechtenstein","Lithuania","Luxembourg","Malawi","Malta","Marshall Islands","Mauritius","Mexico","Moldova","Monaco","Mongolia","Montenegro","Morocco","Namibia","Netherlands","New Zealand","Nicaragua","Niue","North Macedonia","Norway","Oman","Pakistan","Palau","Panama","Paraguay","Peru","Philippines","Poland","Portugal","Republic of Korea","Romania","Russia","Rwanda","Saint Kitts and Nevis","Saint Lucia","Saint Vincent and the Grenadines","Samoa","San Marino","São Tomé and Príncipe","Saudi Arabia","Serbia","Seychelles","Singapore","Slovakia","Slovenia","South Africa","Spain","Suriname","Sweden","Switzerland","Tajikistan","Tonga","Trinidad and Tobago","Tunisia","Turkey","Ukraine","United Kingdom","United States","Uruguay","Uzbekistan","Vanuatu","Venezuela",
];

// Service-specific field configs
const SERVICE_FIELDS: Record<string, { label: string; fields: { name: string; label: string; type: string; options?: string[]; placeholder?: string; required?: boolean }[] }> = {
  "Apostille Facilitation": {
    label: "Apostille Request",
    fields: [
      { name: "document_description", label: "Document Description", type: "textarea", placeholder: "Describe the document(s) needing apostille...", required: true },
      { name: "destination_country", label: "Destination Country", type: "select", options: [...HAGUE_COUNTRIES, "Other (Non-Hague)"], required: true },
      { name: "document_count", label: "Number of Documents", type: "number", placeholder: "1" },
      { name: "urgency", label: "Urgency", type: "select", options: ["Standard (5-10 business days)", "Rush (2-3 business days)", "Same Day"] },
    ],
  },
  "Consular Legalization Prep": {
    label: "Consular Legalization Request",
    fields: [
      { name: "destination_country", label: "Destination Country", type: "select", options: [...HAGUE_COUNTRIES, "Other"], required: true },
      { name: "embassy_location", label: "Embassy / Consulate Location", type: "text", placeholder: "e.g., Washington D.C." },
      { name: "document_list", label: "Documents Requiring Legalization", type: "textarea", placeholder: "List all documents...", required: true },
      { name: "authentication_chain", label: "Authentication Chain Needed?", type: "select", options: ["Yes — County Clerk → SOS → Embassy", "Already authenticated by SOS", "Unsure — need guidance"] },
    ],
  },
  "Background Check Coordination": {
    label: "Background Check Request",
    fields: [
      { name: "subject_name", label: "Subject Full Name", type: "text", required: true },
      { name: "check_type", label: "Check Type", type: "select", options: ["Criminal Background", "Employment Verification", "Education Verification", "Credit Check", "Comprehensive"], required: true },
      { name: "turnaround", label: "Turnaround Preference", type: "select", options: ["Standard (5-7 days)", "Rush (2-3 days)", "Same Day (if available)"] },
      { name: "purpose", label: "Purpose", type: "text", placeholder: "e.g., Employment, Licensing, Tenant Screening" },
    ],
  },
  "Clerical Document Preparation": {
    label: "Document Preparation Request",
    fields: [
      { name: "document_type", label: "Document Type", type: "text", placeholder: "e.g., Affidavit, Power of Attorney", required: true },
      { name: "description", label: "What Preparation is Needed?", type: "textarea", placeholder: "Describe the work needed...", required: true },
      { name: "turnaround", label: "Turnaround", type: "select", options: ["Standard (3-5 days)", "Rush (1-2 days)", "Same Day"] },
    ],
  },
  "Document Cleanup & Formatting": {
    label: "Document Cleanup Request",
    fields: [
      { name: "description", label: "Formatting Instructions", type: "textarea", placeholder: "Describe desired formatting, cleanup needed...", required: true },
      { name: "turnaround", label: "Turnaround", type: "select", options: ["Standard (3-5 days)", "Rush (1-2 days)"] },
    ],
  },
  "Form Filling Assistance": {
    label: "Form Filling Request",
    fields: [
      { name: "form_name", label: "Which Form?", type: "text", placeholder: "e.g., I-130, Power of Attorney, LLC Articles", required: true },
      { name: "description", label: "Information / Instructions", type: "textarea", placeholder: "Provide the information to fill in, or describe what you need help with...", required: true },
    ],
  },
  "Certified Document Prep for Agencies": {
    label: "Agency Document Prep Request",
    fields: [
      { name: "agency", label: "Target Agency", type: "select", options: ["Ohio Secretary of State", "County Court", "Federal Court", "USCIS", "State Agency", "Other"], required: true },
      { name: "document_list", label: "Document List", type: "textarea", placeholder: "List all documents needed...", required: true },
      { name: "deadline", label: "Deadline", type: "date" },
      { name: "special_requirements", label: "Special Requirements", type: "textarea", placeholder: "Any specific agency requirements..." },
    ],
  },
  "Registered Agent Coordination": {
    label: "Registered Agent Request",
    fields: [
      { name: "entity_type", label: "Entity Type", type: "select", options: ["LLC", "Corporation (C-Corp)", "Corporation (S-Corp)", "Nonprofit", "Partnership", "Sole Proprietorship", "Other"], required: true },
      { name: "state_of_formation", label: "State of Formation", type: "text", placeholder: "e.g., Ohio", required: true },
      { name: "formation_date", label: "Formation Date (or Planned)", type: "date" },
      { name: "current_agent", label: "Current Registered Agent (if changing)", type: "text", placeholder: "Leave blank if new entity" },
    ],
  },
  "Email Management & Correspondence": {
    label: "Email Management Request",
    fields: [
      { name: "forwarding_address", label: "Forwarding Email Address", type: "email", required: true },
      { name: "volume_estimate", label: "Estimated Monthly Volume", type: "select", options: ["1-10 emails", "11-50 emails", "51-100 emails", "100+ emails"] },
      { name: "response_preferences", label: "Response Preferences", type: "textarea", placeholder: "Describe how you'd like correspondence handled..." },
    ],
  },
  "Notarized Translation Coordination": {
    label: "Translation Coordination Request",
    fields: [
      { name: "source_language", label: "Source Language", type: "text", placeholder: "e.g., Spanish", required: true },
      { name: "target_language", label: "Target Language", type: "text", placeholder: "e.g., English", required: true },
      { name: "document_type", label: "Document Type", type: "text", placeholder: "e.g., Birth Certificate", required: true },
      { name: "page_count", label: "Page Count", type: "number", placeholder: "1" },
      { name: "include_notarization", label: "Include Notarization?", type: "select", options: ["Yes — Notarize the translation certificate", "No — Translation only"] },
    ],
  },
};

// Fallback fields for unknown services
const DEFAULT_FIELDS = {
  label: "Service Request",
  fields: [
    { name: "description", label: "Describe What You Need", type: "textarea" as const, placeholder: "Provide details about your request...", required: true },
    { name: "urgency", label: "Urgency", type: "select" as const, options: ["Standard", "Rush", "Urgent"] },
  ],
};

export default function ServiceRequest() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const serviceName = searchParams.get("service") || "";
  const config = SERVICE_FIELDS[serviceName] || DEFAULT_FIELDS;

  const [formData, setFormData] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  useEffect(() => {
    document.title = `${config.label} — Notar`;
    return () => { document.title = "Notar — Ohio Notary Public | In-Person & RON"; };
  }, [config.label]);

  const updateField = (name: string, value: string) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async () => {
    if (!user) {
      toast({ title: "Please sign in", description: "You need an account to submit a service request.", variant: "destructive" });
      navigate(`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`);
      return;
    }

    const missingRequired = config.fields.filter(f => f.required && !formData[f.name]?.trim());
    if (missingRequired.length > 0) {
      toast({ title: "Missing required fields", description: `Please fill in: ${missingRequired.map(f => f.label).join(", ")}`, variant: "destructive" });
      return;
    }

    setSubmitting(true);
    const { error } = await supabase.from("service_requests").insert({
      client_id: user.id,
      service_name: serviceName,
      intake_data: formData,
      notes: notes || null,
    });

    if (error) {
      toast({ title: "Submission failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Request submitted!", description: "We'll review your request and get back to you shortly." });
      setSubmitted(true);
    }
    setSubmitting(false);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-4 max-w-md px-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-accent/10 mx-auto">
            <CheckCircle className="h-8 w-8 text-accent" />
          </div>
          <h1 className="font-display text-2xl font-bold">Request Submitted!</h1>
          <p className="text-muted-foreground">Your {config.label.toLowerCase()} has been received. We'll review it and contact you within 1-2 business days.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/portal"><Button className="bg-accent text-accent-foreground hover:bg-gold-dark">Go to Portal</Button></Link>
            <Link to="/services"><Button variant="outline">Browse Services</Button></Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="font-display text-lg font-bold text-primary-foreground">N</span>
            </div>
            <span className="font-display text-lg font-bold text-foreground">Notar</span>
          </Link>
          <div className="flex items-center gap-2">
            <Link to="/services"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> Services</Button></Link>
            {user ? (
              <Link to="/portal"><Button variant="outline" size="sm">My Portal</Button></Link>
            ) : (
              <Link to="/login"><Button variant="outline" size="sm">Sign In</Button></Link>
            )}
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10">
              <ClipboardList className="h-6 w-6 text-accent" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold text-foreground">{config.label}</h1>
              <p className="text-sm text-muted-foreground">{serviceName}</p>
            </div>
          </div>

          <Card className="border-border/50">
            <CardContent className="p-6 space-y-4">
              {config.fields.map(field => (
                <div key={field.name}>
                  <Label>{field.label} {field.required && <span className="text-destructive">*</span>}</Label>
                  {field.type === "textarea" ? (
                    <Textarea
                      value={formData[field.name] || ""}
                      onChange={e => updateField(field.name, e.target.value)}
                      placeholder={field.placeholder}
                      rows={3}
                    />
                  ) : field.type === "select" ? (
                    <Select value={formData[field.name] || ""} onValueChange={v => updateField(field.name, v)}>
                      <SelectTrigger><SelectValue placeholder={`Select ${field.label.toLowerCase()}...`} /></SelectTrigger>
                      <SelectContent>
                        {field.options?.map(o => <SelectItem key={o} value={o}>{o}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  ) : (
                    <Input
                      type={field.type}
                      value={formData[field.name] || ""}
                      onChange={e => updateField(field.name, e.target.value)}
                      placeholder={field.placeholder}
                    />
                  )}
                  {field.name === "destination_country" && formData[field.name] && (
                    <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {HAGUE_COUNTRIES.includes(formData[field.name])
                        ? "✓ Hague Convention member — Apostille accepted"
                        : "⚠ Non-Hague — may require consular legalization"}
                    </p>
                  )}
                </div>
              ))}

              <div>
                <Label>Additional Notes</Label>
                <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Any additional information..." rows={2} />
              </div>

              {!user && (
                <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-accent" /> Sign in to submit
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You need an account to track your request. <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="text-accent underline">Sign in</Link> or <Link to="/signup" className="text-accent underline">create an account</Link>.
                  </p>
                </div>
              )}

              <Button onClick={handleSubmit} disabled={submitting || !user} className="w-full bg-accent text-accent-foreground hover:bg-gold-dark" size="lg">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Request"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      <footer className="border-t border-border/50 bg-muted/30 py-8 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Notar — Ohio Notary & Document Services</p>
      </footer>
    </div>
  );
}
