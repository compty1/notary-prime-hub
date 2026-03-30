import { useState, useEffect, useCallback } from "react";
import { usePageTitle } from "@/lib/usePageTitle";
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
import { ChevronLeft, CheckCircle, FileText, Globe, Upload, Loader2, Shield, Briefcase, ClipboardList, X } from "lucide-react";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";

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
  "Data Entry": {
    label: "Data Entry Request",
    fields: [
      { name: "data_source", label: "Data Source", type: "select", options: ["Spreadsheet / CSV", "CRM System", "Database", "Paper Documents", "Other"], required: true },
      { name: "description", label: "Describe the Work", type: "textarea", placeholder: "What data needs to be entered and where...", required: true },
      { name: "volume", label: "Estimated Volume", type: "select", options: ["Small (< 100 records)", "Medium (100-500 records)", "Large (500+ records)"] },
      { name: "turnaround", label: "Turnaround", type: "select", options: ["Standard (3-5 days)", "Rush (1-2 days)", "Same Day"] },
    ],
  },
  "Travel Arrangements": {
    label: "Travel Arrangements Request",
    fields: [
      { name: "travel_type", label: "Travel Type", type: "select", options: ["Domestic Flight + Hotel", "International Travel", "Ground Transportation", "Full Itinerary Planning"], required: true },
      { name: "travelers", label: "Number of Travelers", type: "number", placeholder: "1" },
      { name: "dates", label: "Travel Dates", type: "text", placeholder: "e.g., March 15-20, 2026", required: true },
      { name: "destination", label: "Destination", type: "text", placeholder: "e.g., New York, NY", required: true },
      { name: "budget", label: "Budget Range", type: "select", options: ["Economy", "Mid-Range", "Premium", "No Budget Limit"] },
      { name: "special_requests", label: "Special Requests", type: "textarea", placeholder: "Preferences, requirements..." },
    ],
  },
  "Blog Post Writing": {
    label: "Blog Post Writing Request",
    fields: [
      { name: "topic", label: "Blog Topic", type: "text", placeholder: "e.g., Ohio Notary Requirements for 2026", required: true },
      { name: "word_count", label: "Target Word Count", type: "select", options: ["500 words", "1000 words", "1500 words", "2000+ words"], required: true },
      { name: "target_audience", label: "Target Audience", type: "text", placeholder: "e.g., Small business owners in Ohio" },
      { name: "keywords", label: "SEO Keywords", type: "text", placeholder: "Comma-separated keywords..." },
      { name: "tone", label: "Tone", type: "select", options: ["Professional", "Conversational", "Technical", "Friendly"] },
    ],
  },
  "Social Media Content": {
    label: "Social Media Content Request",
    fields: [
      { name: "platforms", label: "Platforms", type: "select", options: ["Facebook", "Instagram", "LinkedIn", "Twitter/X", "All Platforms"], required: true },
      { name: "post_count", label: "Number of Posts", type: "number", placeholder: "10" },
      { name: "theme", label: "Content Theme", type: "text", placeholder: "e.g., Notary tips, service promotions...", required: true },
      { name: "include_graphics", label: "Include Graphics?", type: "select", options: ["Yes — Custom graphics", "Yes — Stock images", "Text only"] },
    ],
  },
  "Newsletter Design": {
    label: "Newsletter Design Request",
    fields: [
      { name: "purpose", label: "Newsletter Purpose", type: "select", options: ["Monthly Update", "Product Launch", "Event Promotion", "Educational Content", "Other"], required: true },
      { name: "audience_size", label: "Audience Size", type: "select", options: ["Under 500", "500-2,000", "2,000-10,000", "10,000+"] },
      { name: "content_notes", label: "Content Notes", type: "textarea", placeholder: "Key topics, promotions, or articles to include...", required: true },
      { name: "brand_guidelines", label: "Brand Guidelines URL", type: "text", placeholder: "Link to brand guide (optional)" },
    ],
  },
  "Market Research Report": {
    label: "Market Research Request",
    fields: [
      { name: "research_topic", label: "Research Topic", type: "text", placeholder: "e.g., Mobile notary demand in central Ohio", required: true },
      { name: "scope", label: "Research Scope", type: "select", options: ["Local Market", "State-Wide", "National", "Industry Specific"], required: true },
      { name: "competitors", label: "Key Competitors to Analyze", type: "textarea", placeholder: "List competitor names or URLs..." },
      { name: "deliverable", label: "Preferred Deliverable", type: "select", options: ["PDF Report", "Slide Deck", "Executive Summary", "Full Report + Data"] },
    ],
  },
  "Lead Generation": {
    label: "Lead Generation Request",
    fields: [
      { name: "target_industry", label: "Target Industry", type: "text", placeholder: "e.g., Real estate, legal, healthcare", required: true },
      { name: "geographic_area", label: "Geographic Area", type: "text", placeholder: "e.g., Columbus OH metro area", required: true },
      { name: "lead_count", label: "Number of Leads Needed", type: "select", options: ["25 leads", "50 leads", "100 leads", "Custom amount"] },
      { name: "data_points", label: "Required Data Points", type: "select", options: ["Name + Email", "Name + Email + Phone", "Full Contact + Company Info"] },
    ],
  },
  "Email Support Handling": {
    label: "Email Support Request",
    fields: [
      { name: "volume", label: "Monthly Email Volume", type: "select", options: ["1-25 emails", "26-50 emails", "51-100 emails", "100+ emails"], required: true },
      { name: "response_time", label: "Target Response Time", type: "select", options: ["Within 1 hour", "Within 4 hours", "Same business day", "Next business day"] },
      { name: "email_account", label: "Email Account Details", type: "text", placeholder: "e.g., support@yourcompany.com", required: true },
      { name: "guidelines", label: "Response Guidelines", type: "textarea", placeholder: "Tone, common questions, escalation rules..." },
    ],
  },
  "Live Chat Support": {
    label: "Live Chat Support Request",
    fields: [
      { name: "hours_needed", label: "Hours of Coverage Needed", type: "select", options: ["4 hours/day", "8 hours/day", "12 hours/day", "24/7"], required: true },
      { name: "platform", label: "Chat Platform", type: "select", options: ["Website Live Chat", "Facebook Messenger", "WhatsApp", "Other"], required: true },
      { name: "training_notes", label: "Training / FAQ Notes", type: "textarea", placeholder: "Common questions, product info, escalation procedures..." },
    ],
  },
  "Website Content Updates": {
    label: "Website Content Update Request",
    fields: [
      { name: "website_url", label: "Website URL", type: "text", placeholder: "https://yourwebsite.com", required: true },
      { name: "pages_to_update", label: "Pages to Update", type: "textarea", placeholder: "List specific pages and what changes are needed...", required: true },
      { name: "access_method", label: "CMS / Access Method", type: "select", options: ["WordPress", "Squarespace", "Wix", "Shopify", "Custom CMS", "Other"] },
      { name: "turnaround", label: "Turnaround", type: "select", options: ["Standard (3-5 days)", "Rush (1-2 days)", "Same Day"] },
    ],
  },
  "UX Audit & Heuristic Review": {
    label: "UX Audit Request",
    fields: [
      { name: "app_url", label: "Application / Website URL", type: "text", placeholder: "https://yourapp.com", required: true },
      { name: "scope", label: "Audit Scope", type: "select", options: ["Full Application", "Specific User Flows", "Mobile Experience", "Accessibility Only"], required: true },
      { name: "target_users", label: "Target User Description", type: "text", placeholder: "e.g., Small business owners aged 30-55" },
      { name: "known_issues", label: "Known Issues / Pain Points", type: "textarea", placeholder: "Any issues you're already aware of..." },
    ],
  },
  "User Flow & Workflow Testing": {
    label: "Workflow Testing Request",
    fields: [
      { name: "app_url", label: "Application URL", type: "text", placeholder: "https://yourapp.com", required: true },
      { name: "flows_to_test", label: "User Flows to Test", type: "textarea", placeholder: "e.g., Signup → onboarding → first purchase", required: true },
      { name: "devices", label: "Devices to Test On", type: "select", options: ["Desktop Only", "Mobile Only", "Desktop + Mobile", "All Devices"] },
      { name: "success_criteria", label: "Success Criteria", type: "textarea", placeholder: "What defines a successful flow completion..." },
    ],
  },
  "Usability Testing & Report": {
    label: "Usability Testing Request",
    fields: [
      { name: "app_url", label: "Application URL", type: "text", placeholder: "https://yourapp.com", required: true },
      { name: "participant_count", label: "Number of Test Participants", type: "select", options: ["3 participants", "5 participants", "8 participants", "10+ participants"], required: true },
      { name: "tasks", label: "Tasks for Participants", type: "textarea", placeholder: "List the tasks participants should attempt...", required: true },
      { name: "deliverable", label: "Report Format", type: "select", options: ["Written Report", "Video Highlights + Report", "Full Session Recordings + Report"] },
    ],
  },
  "UX Research & Persona Development": {
    label: "UX Research Request",
    fields: [
      { name: "research_goal", label: "Research Goal", type: "textarea", placeholder: "What do you want to learn about your users?", required: true },
      { name: "existing_data", label: "Existing User Data Available?", type: "select", options: ["Analytics data available", "Some survey results", "Customer interviews done", "No existing data"], required: true },
      { name: "user_segments", label: "User Segments to Research", type: "text", placeholder: "e.g., New users, power users, churned users" },
      { name: "deliverable", label: "Deliverables Needed", type: "select", options: ["User Personas Only", "Personas + Journey Maps", "Full Research Report + Personas + Recommendations"] },
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
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);

  // Guest fields
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [guestPassword, setGuestPassword] = useState("");

  usePageTitle(config.label);

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
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mx-auto">
            <CheckCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="font-sans text-2xl font-bold">Request Submitted!</h1>
          <p className="text-muted-foreground">Your {config.label.toLowerCase()} has been received. We'll review it and contact you within 1-2 business days.</p>
          <div className="flex gap-3 justify-center">
            <Link to="/portal"><Button className="">Go to Portal</Button></Link>
            <Link to="/services"><Button variant="outline">Browse Services</Button></Link>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <PageShell>

      <div className="container mx-auto max-w-2xl px-4 py-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="mb-6 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
              <ClipboardList className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h1 className="font-sans text-2xl font-bold text-foreground">{config.label}</h1>
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
                <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
                  <p className="text-sm font-medium flex items-center gap-2">
                    <Shield className="h-4 w-4 text-primary" /> Sign in to submit
                  </p>
                  <p className="text-xs text-muted-foreground">
                    You need an account to track your request. <Link to={`/login?redirect=${encodeURIComponent(window.location.pathname + window.location.search)}`} className="text-primary underline">Sign in</Link> or <Link to="/signup" className="text-primary underline">create an account</Link>.
                  </p>
                </div>
              )}

              <Button onClick={handleSubmit} disabled={submitting || !user} className="w-full " size="lg">
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : "Submit Request"}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>

    </PageShell>
  );
}
