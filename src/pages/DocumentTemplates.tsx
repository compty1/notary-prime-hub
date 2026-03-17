import { useState, useRef } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Search, FileText, Download, Eye, Printer, ChevronLeft, AlertTriangle } from "lucide-react";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";

interface TemplateField {
  name: string;
  label: string;
  type: "text" | "date" | "textarea";
  placeholder?: string;
}

interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  fields: TemplateField[];
  body: string; // Template body with {{field_name}} placeholders
}

const templates: Template[] = [
  {
    id: "travel-consent",
    title: "Travel Consent Form",
    category: "Personal",
    description: "Authorization for a minor to travel with a non-parent guardian. Not legal advice — consult an attorney for specific requirements.",
    tags: ["travel", "minor", "consent"],
    fields: [
      { name: "child_name", label: "Child's Full Name", type: "text" },
      { name: "child_dob", label: "Child's Date of Birth", type: "date" },
      { name: "parent_name", label: "Parent/Guardian Name", type: "text" },
      { name: "companion_name", label: "Travel Companion Name", type: "text" },
      { name: "destination", label: "Travel Destination", type: "text" },
      { name: "travel_dates", label: "Travel Dates", type: "text", placeholder: "e.g., March 15 - March 22, 2026" },
      { name: "parent_phone", label: "Parent Contact Phone", type: "text" },
    ],
    body: `TRAVEL CONSENT FORM

I, {{parent_name}}, the undersigned parent/legal guardian of {{child_name}} (Date of Birth: {{child_dob}}), hereby authorize {{companion_name}} to travel with my child to {{destination}} during the period of {{travel_dates}}.

I grant {{companion_name}} permission to authorize emergency medical treatment for my child if I cannot be reached.

Emergency Contact: {{parent_phone}}

_________________________
Signature of Parent/Guardian

_________________________
Printed Name

_________________________
Date

NOTARY ACKNOWLEDGMENT
State of Ohio, County of ___________

On this ___ day of _________, 20___, before me personally appeared {{parent_name}}, known to me (or proved on the basis of satisfactory evidence) to be the person whose name is subscribed to the within instrument, and acknowledged that they executed the same for the purposes therein contained.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "general-affidavit",
    title: "General Affidavit",
    category: "Legal",
    description: "A sworn statement of facts. Requires oath administration (jurat). This is a generic template — specific affidavits may need additional content.",
    tags: ["affidavit", "jurat", "sworn"],
    fields: [
      { name: "affiant_name", label: "Affiant's Full Name", type: "text" },
      { name: "affiant_address", label: "Affiant's Address", type: "text" },
      { name: "county", label: "County", type: "text", placeholder: "Franklin" },
      { name: "statement", label: "Statement of Facts", type: "textarea", placeholder: "Enter the facts you are swearing to..." },
    ],
    body: `GENERAL AFFIDAVIT

State of Ohio
County of {{county}}

I, {{affiant_name}}, residing at {{affiant_address}}, being duly sworn, do hereby state under oath:

{{statement}}

I declare under penalty of perjury that the foregoing is true and correct.

_________________________
Signature of Affiant

_________________________
Printed Name: {{affiant_name}}

_________________________
Date

JURAT
State of Ohio, County of {{county}}

Subscribed and sworn to before me this ___ day of _________, 20___, by {{affiant_name}}.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "identity-statement",
    title: "Identity Verification Statement",
    category: "Legal",
    description: "A sworn statement confirming personal identity, often used for name discrepancies or missing documents.",
    tags: ["identity", "verification", "jurat"],
    fields: [
      { name: "declarant_name", label: "Full Legal Name", type: "text" },
      { name: "also_known_as", label: "Also Known As (if any)", type: "text", placeholder: "Any other names used" },
      { name: "dob", label: "Date of Birth", type: "date" },
      { name: "address", label: "Current Address", type: "text" },
      { name: "id_type", label: "ID Type Presented", type: "text", placeholder: "e.g., Ohio Driver's License" },
      { name: "id_number", label: "ID Number", type: "text" },
    ],
    body: `IDENTITY VERIFICATION STATEMENT

State of Ohio
County of ___________

I, {{declarant_name}}, hereby declare and affirm under oath:

1. My full legal name is {{declarant_name}}.
2. I am also known as: {{also_known_as}}
3. My date of birth is {{dob}}.
4. My current address is {{address}}.
5. I have presented the following identification: {{id_type}}, Number: {{id_number}}.

I declare under penalty of perjury that the foregoing is true and correct.

_________________________
Signature

_________________________
Date

JURAT
Subscribed and sworn to before me this ___ day of _________, 20___, by {{declarant_name}}.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "bill-of-sale",
    title: "Bill of Sale",
    category: "Business",
    description: "General bill of sale for personal property transfers. For vehicles, use the Ohio BMV form.",
    tags: ["sale", "property", "transfer"],
    fields: [
      { name: "seller_name", label: "Seller's Full Name", type: "text" },
      { name: "buyer_name", label: "Buyer's Full Name", type: "text" },
      { name: "item_description", label: "Item Description", type: "textarea", placeholder: "Describe the item(s) being sold..." },
      { name: "sale_price", label: "Sale Price ($)", type: "text" },
      { name: "sale_date", label: "Date of Sale", type: "date" },
    ],
    body: `BILL OF SALE

KNOW ALL MEN BY THESE PRESENTS:

I, {{seller_name}} ("Seller"), for and in consideration of the sum of {{sale_price}} dollars, receipt of which is hereby acknowledged, do hereby sell, transfer, and convey to {{buyer_name}} ("Buyer") the following described personal property:

{{item_description}}

Seller warrants that they are the lawful owner of the above-described property and have the right to sell said property.

This sale is made on {{sale_date}}.

_________________________          _________________________
Seller Signature                    Buyer Signature

_________________________          _________________________
Printed Name: {{seller_name}}       Printed Name: {{buyer_name}}

NOTARY ACKNOWLEDGMENT
State of Ohio, County of ___________

On this ___ day of _________, 20___, before me personally appeared {{seller_name}} and {{buyer_name}}, known to me to be the persons whose names are subscribed to the within instrument, and acknowledged that they executed the same.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "general-agreement",
    title: "General Agreement / Contract",
    category: "Business",
    description: "A basic agreement template between two parties. For complex agreements, consult an attorney.",
    tags: ["agreement", "contract", "business"],
    fields: [
      { name: "party_a", label: "Party A (Full Name)", type: "text" },
      { name: "party_b", label: "Party B (Full Name)", type: "text" },
      { name: "agreement_date", label: "Effective Date", type: "date" },
      { name: "terms", label: "Terms and Conditions", type: "textarea", placeholder: "Describe the agreement terms..." },
    ],
    body: `GENERAL AGREEMENT

This Agreement is entered into as of {{agreement_date}}, by and between:

Party A: {{party_a}}
Party B: {{party_b}}

TERMS AND CONDITIONS:

{{terms}}

Both parties agree to the terms and conditions set forth above.

_________________________          _________________________
Party A Signature                   Party B Signature

_________________________          _________________________
Printed Name: {{party_a}}          Printed Name: {{party_b}}

_________________________          _________________________
Date                                Date

NOTARY ACKNOWLEDGMENT
State of Ohio, County of ___________

On this ___ day of _________, 20___, before me personally appeared {{party_a}} and {{party_b}}, known to me to be the persons whose names are subscribed to the within instrument, and acknowledged that they executed the same.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "oath-certificate",
    title: "Oath / Affirmation Certificate",
    category: "Legal",
    description: "Certificate for administering an oath or affirmation. Used when a person needs to swear to the truth of statements.",
    tags: ["oath", "affirmation", "certificate"],
    fields: [
      { name: "person_name", label: "Person Taking Oath", type: "text" },
      { name: "purpose", label: "Purpose of Oath", type: "textarea", placeholder: "Describe what the person is swearing/affirming..." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin" },
    ],
    body: `CERTIFICATE OF OATH / AFFIRMATION

State of Ohio
County of {{county}}

I, the undersigned Notary Public, do hereby certify that on this date, {{person_name}} personally appeared before me and was duly sworn (or affirmed) as follows:

Purpose: {{purpose}}

Oath Administered: "Do you solemnly swear (or affirm) that the statements you are about to make are the truth, the whole truth, and nothing but the truth?"

Response: "I do."

_________________________
{{person_name}}

Administered on: _____________

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________
[NOTARY SEAL]`
  },
  {
    id: "general-poa",
    title: "General Power of Attorney",
    category: "Legal",
    description: "Authorizes an agent to act on your behalf for financial and legal matters. Consult an attorney for specific powers needed.",
    tags: ["poa", "power of attorney", "agent"],
    fields: [
      { name: "principal_name", label: "Principal's Full Name", type: "text" },
      { name: "principal_address", label: "Principal's Address", type: "text" },
      { name: "agent_name", label: "Agent's Full Name", type: "text" },
      { name: "agent_address", label: "Agent's Address", type: "text" },
      { name: "powers", label: "Specific Powers Granted", type: "textarea", placeholder: "e.g., manage bank accounts, sign documents, sell property..." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin" },
    ],
    body: `GENERAL POWER OF ATTORNEY

State of Ohio
County of {{county}}

KNOW ALL PERSONS BY THESE PRESENTS:

I, {{principal_name}}, residing at {{principal_address}}, hereby appoint {{agent_name}}, residing at {{agent_address}}, as my true and lawful Attorney-in-Fact ("Agent") to act on my behalf.

POWERS GRANTED:

{{powers}}

This Power of Attorney shall remain in effect until revoked in writing by the Principal.

IN WITNESS WHEREOF, I have executed this Power of Attorney on this ___ day of _________, 20___.

_________________________
{{principal_name}} (Principal)

NOTARY ACKNOWLEDGMENT
State of Ohio, County of {{county}}

On this ___ day of _________, 20___, before me personally appeared {{principal_name}}, known to me to be the person whose name is subscribed to the within instrument, and acknowledged that they executed the same for the purposes therein contained.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "healthcare-poa",
    title: "Healthcare Power of Attorney",
    category: "Personal",
    description: "Designates someone to make healthcare decisions if you become incapacitated. Ohio-specific form — review with your physician or attorney.",
    tags: ["healthcare", "poa", "medical", "directive"],
    fields: [
      { name: "principal_name", label: "Principal's Full Name", type: "text" },
      { name: "agent_name", label: "Healthcare Agent's Full Name", type: "text" },
      { name: "agent_phone", label: "Agent's Phone", type: "text" },
      { name: "alternate_name", label: "Alternate Agent's Name (optional)", type: "text" },
      { name: "instructions", label: "Specific Healthcare Instructions", type: "textarea", placeholder: "Any specific wishes regarding treatment, end-of-life care, etc." },
    ],
    body: `HEALTHCARE POWER OF ATTORNEY
(Ohio Revised Code §1337.12)

I, {{principal_name}}, being of sound mind, hereby designate:

PRIMARY HEALTHCARE AGENT:
Name: {{agent_name}}
Phone: {{agent_phone}}

ALTERNATE AGENT (if primary is unavailable):
Name: {{alternate_name}}

I grant my Healthcare Agent authority to make any and all healthcare decisions on my behalf if I am unable to do so, including but not limited to consenting to, refusing, or withdrawing medical treatment.

SPECIFIC INSTRUCTIONS:
{{instructions}}

_________________________
Signature of Principal: {{principal_name}}

_________________________
Date

WITNESSES (Two required under Ohio law):

Witness 1: _________________________  Date: ___________
Witness 2: _________________________  Date: ___________

NOTARY ACKNOWLEDGMENT
State of Ohio, County of ___________

Subscribed and sworn to before me this ___ day of _________, 20___, by {{principal_name}}.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "loan-signing-ack",
    title: "Loan Signing Acknowledgment",
    category: "Business",
    description: "Standard acknowledgment certificate for loan document signings. Attach to loan packages requiring notarization.",
    tags: ["loan", "signing", "acknowledgment", "mortgage"],
    fields: [
      { name: "signer_name", label: "Signer's Full Name", type: "text" },
      { name: "county", label: "County", type: "text", placeholder: "Franklin" },
      { name: "document_desc", label: "Document Description", type: "text", placeholder: "e.g., Deed of Trust, Mortgage Note" },
    ],
    body: `NOTARY ACKNOWLEDGMENT — LOAN SIGNING

State of Ohio
County of {{county}}

On this ___ day of _________, 20___, before me, the undersigned Notary Public, personally appeared {{signer_name}}, proved to me through satisfactory evidence of identity to be the person(s) whose name(s) is/are subscribed to the within instrument:

Document(s): {{document_desc}}

and acknowledged that he/she/they executed the same for the purposes therein contained.

IN WITNESS WHEREOF, I have hereunto set my hand and official seal.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________
[NOTARY SEAL]`
  },
  {
    id: "vehicle-bill-of-sale",
    title: "Vehicle Bill of Sale (Ohio)",
    category: "Personal",
    description: "Ohio-specific vehicle bill of sale. Note: The Ohio BMV may require their official form for title transfer — check with your local BMV office.",
    tags: ["vehicle", "car", "ohio", "bmv", "sale"],
    fields: [
      { name: "seller_name", label: "Seller's Full Name", type: "text" },
      { name: "buyer_name", label: "Buyer's Full Name", type: "text" },
      { name: "vehicle_year", label: "Vehicle Year", type: "text" },
      { name: "vehicle_make", label: "Vehicle Make", type: "text" },
      { name: "vehicle_model", label: "Vehicle Model", type: "text" },
      { name: "vin", label: "VIN Number", type: "text" },
      { name: "odometer", label: "Odometer Reading", type: "text" },
      { name: "sale_price", label: "Sale Price ($)", type: "text" },
      { name: "sale_date", label: "Date of Sale", type: "date" },
    ],
    body: `VEHICLE BILL OF SALE — STATE OF OHIO

I, {{seller_name}} ("Seller"), hereby sell, transfer, and convey to {{buyer_name}} ("Buyer") the following described motor vehicle:

Year: {{vehicle_year}}
Make: {{vehicle_make}}
Model: {{vehicle_model}}
VIN: {{vin}}
Odometer Reading: {{odometer}} miles

SALE PRICE: ${{sale_price}}
DATE OF SALE: {{sale_date}}

Seller warrants that the vehicle is free of liens and encumbrances and that Seller has the legal right to sell the vehicle.

Buyer acknowledges responsibility for title transfer, registration, and any applicable taxes.

NOTE: Ohio BMV may require Form BMV 3724 for title transfer. This bill of sale is supplemental documentation.

_________________________          _________________________
Seller: {{seller_name}}             Buyer: {{buyer_name}}

_________________________          _________________________
Date                                Date

NOTARY ACKNOWLEDGMENT
State of Ohio, County of ___________

On this ___ day of _________, 20___, before me personally appeared {{seller_name}} and {{buyer_name}}.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "name-change-affidavit",
    title: "Name Change Affidavit",
    category: "Legal",
    description: "Sworn statement declaring a legal name change. This template is informational — court orders may be required for official name changes.",
    tags: ["name change", "affidavit", "identity"],
    fields: [
      { name: "current_name", label: "Current Legal Name", type: "text" },
      { name: "previous_name", label: "Previous/Former Name", type: "text" },
      { name: "reason", label: "Reason for Name Change", type: "textarea", placeholder: "e.g., marriage, divorce, personal preference, court order..." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin" },
      { name: "address", label: "Current Address", type: "text" },
    ],
    body: `NAME CHANGE AFFIDAVIT

State of Ohio
County of {{county}}

I, {{current_name}}, formerly known as {{previous_name}}, residing at {{address}}, do hereby swear and affirm under oath:

1. My legal name was previously {{previous_name}}.
2. My current legal name is {{current_name}}.
3. The reason for the name change is: {{reason}}
4. This affidavit is made for the purpose of documenting and affirming my legal name change.

I declare under penalty of perjury that the foregoing is true and correct.

_________________________
Signature: {{current_name}}

_________________________
Date

JURAT
State of Ohio, County of {{county}}

Subscribed and sworn to before me this ___ day of _________, 20___, by {{current_name}}.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "guardianship-consent",
    title: "Temporary Guardianship Consent",
    category: "Personal",
    description: "Grants temporary guardianship of a minor to a designated adult. For long-term guardianship, court proceedings are typically required.",
    tags: ["guardianship", "minor", "consent", "temporary"],
    fields: [
      { name: "parent_name", label: "Parent/Guardian Name", type: "text" },
      { name: "child_name", label: "Child's Full Name", type: "text" },
      { name: "child_dob", label: "Child's Date of Birth", type: "date" },
      { name: "guardian_name", label: "Temporary Guardian's Name", type: "text" },
      { name: "guardian_address", label: "Temporary Guardian's Address", type: "text" },
      { name: "start_date", label: "Start Date", type: "date" },
      { name: "end_date", label: "End Date", type: "date" },
      { name: "reason", label: "Reason for Temporary Guardianship", type: "textarea" },
    ],
    body: `TEMPORARY GUARDIANSHIP CONSENT

I, {{parent_name}}, the parent/legal guardian of {{child_name}} (DOB: {{child_dob}}), hereby grant temporary guardianship of my child to:

Temporary Guardian: {{guardian_name}}
Address: {{guardian_address}}

EFFECTIVE PERIOD: {{start_date}} through {{end_date}}

REASON: {{reason}}

During this period, {{guardian_name}} is authorized to:
• Make routine medical decisions and authorize emergency treatment
• Enroll or continue the child in school activities
• Provide daily care, supervision, and discipline
• Sign routine permissions and authorizations

This temporary guardianship does NOT transfer permanent custody rights.

_________________________
Parent/Guardian: {{parent_name}}

_________________________
Temporary Guardian: {{guardian_name}}

_________________________
Date

NOTARY ACKNOWLEDGMENT
State of Ohio, County of ___________

On this ___ day of _________, 20___, before me personally appeared {{parent_name}}, known to me to be the person whose name is subscribed to the within instrument.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________`
  },
  {
    id: "deed-of-trust-ack",
    title: "Deed of Trust Acknowledgment",
    category: "Business",
    description: "Standard acknowledgment for real property deed of trust documents. Used in real estate transactions requiring notarization.",
    tags: ["deed", "trust", "real estate", "property"],
    fields: [
      { name: "grantor_name", label: "Grantor's Full Name", type: "text" },
      { name: "property_desc", label: "Property Description", type: "textarea", placeholder: "Legal description or address of property" },
      { name: "county", label: "County", type: "text", placeholder: "Franklin" },
    ],
    body: `ACKNOWLEDGMENT — DEED OF TRUST

State of Ohio
County of {{county}}

On this ___ day of _________, 20___, before me, a Notary Public in and for the State of Ohio, personally appeared:

{{grantor_name}} ("Grantor")

proved to me on the basis of satisfactory evidence to be the person(s) whose name(s) is/are subscribed to the within Deed of Trust for the following property:

{{property_desc}}

and acknowledged to me that he/she/they executed the same in his/her/their authorized capacity(ies), and that by his/her/their signature(s) on the instrument, the person(s), or the entity upon behalf of which the person(s) acted, executed the instrument.

WITNESS my hand and official seal.

_________________________
Notary Public, State of Ohio
My Commission Expires: ___________
[NOTARY SEAL]`
  },
];

export default function DocumentTemplates() {
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const printRef = useRef<HTMLDivElement>(null);

  const filtered = templates.filter(
    (t) => t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.includes(search.toLowerCase())) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const openTemplate = (t: Template) => {
    setSelectedTemplate(t);
    const initialData: Record<string, string> = {};
    t.fields.forEach((f) => { initialData[f.name] = ""; });
    setFormData(initialData);
  };

  const renderBody = () => {
    if (!selectedTemplate) return "";
    let body = selectedTemplate.body;
    Object.entries(formData).forEach(([key, value]) => {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || `[${key}]`);
    });
    return body;
  };

  const handlePrint = () => {
    const printContent = renderBody();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${selectedTemplate?.title}</title><style>body{font-family:serif;padding:2rem;line-height:1.8;white-space:pre-wrap;max-width:800px;margin:0 auto}h1{text-align:center}</style></head><body>${printContent.replace(/\n/g, "<br/>")}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <nav className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary"><span className="font-display text-lg font-bold text-primary-foreground">SG</span></div>
            <span className="font-display text-lg font-bold text-foreground">Document Templates</span>
          </Link>
          <div className="flex items-center gap-4">
            <DarkModeToggle />
            <Link to="/"><Button variant="outline" size="sm"><ChevronLeft className="mr-1 h-3 w-3" /> Home</Button></Link>
            <Link to="/builder"><Button size="sm" className="bg-accent text-accent-foreground hover:bg-gold-dark">Document Builder</Button></Link>
          </div>
        </div>
      </nav>

      <div className="container mx-auto max-w-5xl px-4 py-8">
        <div className="mb-8 text-center">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">Document Templates Library</h1>
          <p className="text-muted-foreground">Ready-to-use templates for common notarized documents</p>
          <div className="mt-2 mx-auto max-w-xl rounded-lg bg-amber-50 border border-amber-200 p-3">
            <p className="flex items-center justify-center gap-2 text-sm text-amber-800"><AlertTriangle className="h-4 w-4" /> These are generic templates — not legal advice. Consult an attorney for specific needs.</p>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="h-full border-border/50 transition-shadow hover:shadow-md cursor-pointer" onClick={() => openTemplate(t)}>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-accent" />
                    <Badge variant="outline" className="text-xs">{t.category}</Badge>
                  </div>
                  <h3 className="font-display text-lg font-semibold mb-1">{t.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                  <div className="flex gap-1">{t.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Template Fill Dialog */}
      <Dialog open={!!selectedTemplate && !previewOpen} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">{selectedTemplate?.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">{selectedTemplate?.description}</p>
          <div className="space-y-4">
            {selectedTemplate?.fields.map((field) => (
              <div key={field.name}>
                <Label>{field.label}</Label>
                {field.type === "textarea" ? (
                  <Textarea value={formData[field.name] || ""} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} placeholder={field.placeholder} />
                ) : (
                  <Input type={field.type} value={formData[field.name] || ""} onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })} placeholder={field.placeholder} />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Cancel</Button>
            <Button onClick={() => setPreviewOpen(true)} className="bg-accent text-accent-foreground hover:bg-gold-dark"><Eye className="mr-1 h-4 w-4" /> Preview</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-display">Document Preview</DialogTitle></DialogHeader>
          <div ref={printRef} className="whitespace-pre-wrap font-serif text-sm leading-relaxed border rounded-lg p-6 bg-white text-gray-900">
            {renderBody()}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Back to Edit</Button>
            <Button onClick={handlePrint} className="bg-accent text-accent-foreground hover:bg-gold-dark"><Printer className="mr-1 h-4 w-4" /> Print / Save PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
