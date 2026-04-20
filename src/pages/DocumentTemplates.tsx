import { usePageMeta } from "@/hooks/usePageMeta";
import { useState, useRef, useEffect, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, FileText, Download, Eye, Printer, ChevronLeft, AlertTriangle, Save, MessageSquare, Sparkles, Send, Loader2, Bold, Italic, Underline as UnderlineIcon, List, ListOrdered, AlignLeft, AlignCenter, AlignRight, Heading1, Heading2, Heart, RotateCcw, HelpCircle, PenTool, Plus, CheckCircle, PanelRightOpen, ExternalLink } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { DarkModeToggle } from "@/components/DarkModeToggle";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useEditor, EditorContent } from "@tiptap/react";
import BubbleMenu from "@tiptap/extension-bubble-menu";
import StarterKit from "@tiptap/starter-kit";
import UnderlineExt from "@tiptap/extension-underline";
import TextAlign from "@tiptap/extension-text-align";
import ReactMarkdown from "react-markdown";
import { Logo } from "@/components/Logo";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { callEdgeFunctionStream } from "@/lib/edgeFunctionAuth";

interface TemplateField {
  name: string;
  label: string;
  type: "text" | "date" | "textarea";
  placeholder?: string;
  helpText?: string;
}

/** Reusable help text for common legal terms */
const TERM_HELP: Record<string, string> = {
  affiant: "The person making a sworn statement (affidavit). This is YOU if you are the one swearing to the facts.",
  principal: "The person granting authority to someone else to act on their behalf.",
  agent: "The person being authorized to act on behalf of the principal.",
  grantor: "The person transferring or conveying property or rights to another party.",
  declarant: "The person making a formal declaration or statement.",
  jurat: "A notarial certificate where the signer swears or affirms the truth of the document's contents under oath.",
  acknowledgment: "A notarial act where the signer confirms they signed the document voluntarily.",
  county: "The Ohio county where the notarization takes place (not where you live).",
};

interface Template {
  id: string;
  title: string;
  category: string;
  description: string;
  tags: string[];
  fields: TemplateField[];
  body: string;
  sampleData?: Record<string, string>;
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
    sampleData: { child_name: "Emily Johnson", child_dob: "2018-05-12", parent_name: "Sarah Johnson", companion_name: "Michael Johnson", destination: "Orlando, FL", travel_dates: "March 15 - March 22, 2026", parent_phone: "(614) 555-1234" },
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
      { name: "affiant_name", label: "Affiant's Full Name", type: "text", helpText: TERM_HELP.affiant },
      { name: "affiant_address", label: "Affiant's Address", type: "text", helpText: "The current home address of the person making the sworn statement." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin", helpText: TERM_HELP.county },
      { name: "statement", label: "Statement of Facts", type: "textarea", placeholder: "Enter the facts you are swearing to...", helpText: "Write the specific facts you are swearing to be true. Be clear and specific — this will be a legally binding sworn statement." },
    ],
    sampleData: { affiant_name: "John Smith", affiant_address: "123 Main St, Columbus, OH 43215", county: "Franklin", statement: "I am the owner of the vehicle described herein and have full authority to transfer ownership." },
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
      { name: "declarant_name", label: "Full Legal Name", type: "text", helpText: TERM_HELP.declarant },
      { name: "also_known_as", label: "Also Known As (if any)", type: "text", placeholder: "Any other names used", helpText: "Any other names you have used — maiden name, nickname, or prior legal name." },
      { name: "dob", label: "Date of Birth", type: "date" },
      { name: "address", label: "Current Address", type: "text" },
      { name: "id_type", label: "ID Type Presented", type: "text", placeholder: "e.g., Ohio Driver's License" },
      { name: "id_number", label: "ID Number", type: "text" },
    ],
    sampleData: { declarant_name: "Maria Rodriguez", also_known_as: "Maria Garcia", dob: "1985-03-22", address: "456 Oak Ave, Columbus, OH 43210", id_type: "Ohio Driver's License", id_number: "DL-1234567" },
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
    sampleData: { seller_name: "James Wilson", buyer_name: "Linda Chen", item_description: "One (1) Samsung 65\" 4K Television, Model QN65Q80B, Serial #XY123456", sale_price: "450.00", sale_date: "2026-03-24" },
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
    sampleData: { party_a: "Acme Services LLC", party_b: "Robert Davis", agreement_date: "2026-04-01", terms: "Party A agrees to provide consulting services to Party B for a period of 12 months at a rate of $150/hour." },
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
      { name: "person_name", label: "Person Taking Oath", type: "text", helpText: "The person who will swear or affirm the truth of a statement before the notary." },
      { name: "purpose", label: "Purpose of Oath", type: "textarea", placeholder: "Describe what the person is swearing/affirming...", helpText: "Briefly describe what the person is swearing to — e.g., testimony, statement of facts, or official duty." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin", helpText: TERM_HELP.county },
    ],
    sampleData: { person_name: "David Thompson", purpose: "Truthfully testifying regarding the witnessed automobile accident on March 1, 2026.", county: "Franklin" },
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
      { name: "principal_name", label: "Principal's Full Name", type: "text", helpText: TERM_HELP.principal },
      { name: "principal_address", label: "Principal's Address", type: "text" },
      { name: "agent_name", label: "Agent's Full Name", type: "text", helpText: TERM_HELP.agent },
      { name: "agent_address", label: "Agent's Address", type: "text" },
      { name: "powers", label: "Specific Powers Granted", type: "textarea", placeholder: "e.g., manage bank accounts, sign documents, sell property...", helpText: "List the specific actions the agent is allowed to perform on your behalf." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin", helpText: TERM_HELP.county },
    ],
    sampleData: { principal_name: "Karen Williams", principal_address: "789 Elm St, Dublin, OH 43017", agent_name: "Thomas Williams", agent_address: "321 Pine Rd, Columbus, OH 43215", powers: "Manage bank accounts, sign financial documents, and conduct real estate transactions on my behalf.", county: "Franklin" },
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
      { name: "principal_name", label: "Principal's Full Name", type: "text", helpText: TERM_HELP.principal },
      { name: "agent_name", label: "Healthcare Agent's Full Name", type: "text", helpText: "The person you trust to make medical decisions if you cannot. Often a spouse, adult child, or close friend." },
      { name: "agent_phone", label: "Agent's Phone", type: "text" },
      { name: "alternate_name", label: "Alternate Agent's Name (optional)", type: "text" },
      { name: "instructions", label: "Specific Healthcare Instructions", type: "textarea", placeholder: "Any specific wishes regarding treatment, end-of-life care, etc." },
    ],
    sampleData: { principal_name: "Barbara Anderson", agent_name: "Susan Anderson", agent_phone: "(614) 555-9876", alternate_name: "Mark Anderson", instructions: "I wish to receive all available treatment options. Do not withhold nutrition or hydration." },
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
      { name: "signer_name", label: "Signer's Full Name", type: "text", helpText: "The person signing the loan documents — typically the borrower." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin", helpText: TERM_HELP.county },
      { name: "document_desc", label: "Document Description", type: "text", placeholder: "e.g., Deed of Trust, Mortgage Note", helpText: "List the loan documents being notarized — e.g., Deed of Trust, Promissory Note, Closing Disclosure." },
    ],
    sampleData: { signer_name: "Patricia Miller", county: "Franklin", document_desc: "Deed of Trust and Promissory Note" },
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
    sampleData: { seller_name: "Richard Brown", buyer_name: "Jessica Lee", vehicle_year: "2020", vehicle_make: "Honda", vehicle_model: "Civic EX", vin: "2HGFC2F53LH123456", odometer: "42,350", sale_price: "18,500", sale_date: "2026-03-24" },
    body: `VEHICLE BILL OF SALE — STATE OF OHIO

I, {{seller_name}} ("Seller"), hereby sell, transfer, and convey to {{buyer_name}} ("Buyer") the following described motor vehicle:

Year: {{vehicle_year}}
Make: {{vehicle_make}}
Model: {{vehicle_model}}
VIN: {{vin}}
Odometer Reading: {{odometer}} miles

SALE PRICE: \${{sale_price}}
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
      { name: "current_name", label: "Current Legal Name", type: "text", helpText: "Your name as it appears on your current government-issued ID." },
      { name: "previous_name", label: "Previous/Former Name", type: "text", helpText: "The name you previously used — e.g., maiden name or name before court-ordered change." },
      { name: "reason", label: "Reason for Name Change", type: "textarea", placeholder: "e.g., marriage, divorce, personal preference, court order...", helpText: "State why the name was changed — marriage, divorce, court order, etc." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin", helpText: TERM_HELP.county },
      { name: "address", label: "Current Address", type: "text" },
    ],
    sampleData: { current_name: "Jennifer Martinez", previous_name: "Jennifer Lopez", reason: "Marriage on January 15, 2026 to Carlos Martinez.", county: "Franklin", address: "567 Maple Dr, Columbus, OH 43220" },
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
    sampleData: { parent_name: "Michelle Taylor", child_name: "Sophia Taylor", child_dob: "2019-08-15", guardian_name: "Amy Roberts", guardian_address: "890 Cedar Ln, Westerville, OH 43081", start_date: "2026-04-01", end_date: "2026-04-15", reason: "Parent traveling internationally for work." },
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
      { name: "grantor_name", label: "Grantor's Full Name", type: "text", helpText: TERM_HELP.grantor },
      { name: "property_desc", label: "Property Description", type: "textarea", placeholder: "Legal description or address of property", helpText: "The legal description from the deed, or the full street address of the property being transferred." },
      { name: "county", label: "County", type: "text", placeholder: "Franklin", helpText: TERM_HELP.county },
    ],
    sampleData: { grantor_name: "William Harris", property_desc: "Lot 42, Block 7, Riverside Subdivision, as recorded in Plat Book 15, Page 23, Franklin County, Ohio.", county: "Franklin" },
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

// TipTap toolbar component
function EditorToolbar({ editor }: { editor: any }) {
  if (!editor) return null;
  return (
    <div className="flex flex-wrap gap-1 border-b border-border p-2 bg-muted/30">
      <Button type="button" size="sm" variant={editor.isActive("bold") ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().toggleBold().run()}><Bold className="h-3 w-3" /></Button>
      <Button type="button" size="sm" variant={editor.isActive("italic") ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().toggleItalic().run()}><Italic className="h-3 w-3" /></Button>
      <Button type="button" size="sm" variant={editor.isActive("underline") ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().toggleUnderline().run()}><UnderlineIcon className="h-3 w-3" /></Button>
      <div className="w-px bg-border mx-1" />
      <Button type="button" size="sm" variant={editor.isActive("heading", { level: 1 }) ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="h-3 w-3" /></Button>
      <Button type="button" size="sm" variant={editor.isActive("heading", { level: 2 }) ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}><Heading2 className="h-3 w-3" /></Button>
      <div className="w-px bg-border mx-1" />
      <Button type="button" size="sm" variant={editor.isActive("bulletList") ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().toggleBulletList().run()}><List className="h-3 w-3" /></Button>
      <Button type="button" size="sm" variant={editor.isActive("orderedList") ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().toggleOrderedList().run()}><ListOrdered className="h-3 w-3" /></Button>
      <div className="w-px bg-border mx-1" />
      <Button type="button" size="sm" variant={editor.isActive({ textAlign: "left" }) ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().setTextAlign("left").run()}><AlignLeft className="h-3 w-3" /></Button>
      <Button type="button" size="sm" variant={editor.isActive({ textAlign: "center" }) ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().setTextAlign("center").run()}><AlignCenter className="h-3 w-3" /></Button>
      <Button type="button" size="sm" variant={editor.isActive({ textAlign: "right" }) ? "default" : "ghost"} className="h-7 w-7 p-0" onClick={() => editor.chain().focus().setTextAlign("right").run()}><AlignRight className="h-3 w-3" /></Button>
    </div>
  );
}

export default function DocumentTemplates() {
  usePageMeta({ title: "Document Studio — Templates & Builder", description: "Create documents from scratch or use Ohio notary templates. AI-powered editing, review, and export." });
  const [mainTab, setMainTab] = useState("templates");
  const [search, setSearch] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [previewOpen, setPreviewOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [quickPreviewTemplate, setQuickPreviewTemplate] = useState<Template | null>(null);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const printRef = useRef<HTMLDivElement>(null);

  /** Open filled template in DocuDex for advanced editing */
  const openInDocuDex = (t: Template) => {
    let body = t.body;
    Object.entries(formData).forEach(([k, v]) => { body = body.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v || `{{${k}}}`); });
    sessionStorage.setItem("ai_tools_content", body);
    navigate("/docudex");
  };

  // AI Chat state
  const [chatOpen, setChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [chatLoading, setChatLoading] = useState(false);

  // Document Studio states
  const [studioTitle, setStudioTitle] = useState("Untitled Document");
  const [studioChatOpen, setStudioChatOpen] = useState(false);
  const [studioChatMessages, setStudioChatMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [studioChatInput, setStudioChatInput] = useState("");
  const [studioChatLoading, setStudioChatLoading] = useState(false);
  const [studioSaving, setStudioSaving] = useState(false);
  const [studioReviewing, setStudioReviewing] = useState(false);
  const [studioReviewResult, setStudioReviewResult] = useState("");
  const [aiInlineLoading, setAiInlineLoading] = useState(false);

  // Load favorites from DB
  useEffect(() => {
    if (!user) return;
    supabase.from("user_favorites").select("entity_id").eq("user_id", user.id).eq("entity_type", "template")
      .then(({ data }) => {
        if (data) setFavorites(new Set(data.map(f => f.entity_id)));
      });
  }, [user]);

  const toggleFavorite = async (e: React.MouseEvent, templateId: string) => {
    e.stopPropagation();
    if (!user) {
      toast({ title: "Sign in required", description: "Please sign in to save favorites.", variant: "destructive" });
      return;
    }
    const isFav = favorites.has(templateId);
    const next = new Set(favorites);
    if (isFav) {
      next.delete(templateId);
      setFavorites(next);
      await supabase.from("user_favorites").delete().eq("user_id", user.id).eq("entity_type", "template").eq("entity_id", templateId);
    } else {
      next.add(templateId);
      setFavorites(next);
      await supabase.from("user_favorites").insert({ user_id: user.id, entity_type: "template", entity_id: templateId });
    }
  };

  // localStorage persistence for in-progress templates
  const STORAGE_KEY = "template_drafts";
  const getSavedDrafts = (): Record<string, Record<string, string>> => {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}"); } catch { return {}; }
  };
  const saveDraft = (templateId: string, data: Record<string, string>) => {
    const drafts = getSavedDrafts();
    drafts[templateId] = data;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  };
  const clearDraft = (templateId: string) => {
    const drafts = getSavedDrafts();
    delete drafts[templateId];
    localStorage.setItem(STORAGE_KEY, JSON.stringify(drafts));
  };
  const hasDraft = (templateId: string) => {
    const drafts = getSavedDrafts();
    return drafts[templateId] && Object.values(drafts[templateId]).some(v => v.trim() !== "");
  };

  const filtered = templates.filter(
    (t) => t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.tags.some((tag) => tag.includes(search.toLowerCase())) ||
      t.category.toLowerCase().includes(search.toLowerCase())
  );

  const openTemplate = (t: Template) => {
    setSelectedTemplate(t);
    // Check for saved draft
    const drafts = getSavedDrafts();
    const savedDraft = drafts[t.id];
    if (savedDraft && Object.values(savedDraft).some(v => v.trim() !== "")) {
      setFormData(savedDraft);
      toast({ title: "Draft restored", description: "Your previous progress has been loaded." });
    } else {
      const initialData: Record<string, string> = {};
      t.fields.forEach((f) => { initialData[f.name] = ""; });
      setFormData(initialData);
    }
    setChatMessages([]);
    setChatOpen(false);
  };

  const renderSamplePreview = (t: Template) => {
    let body = t.body;
    const data = t.sampleData || {};
    t.fields.forEach((f) => {
      body = body.replace(new RegExp(`\\{\\{${f.name}\\}\\}`, "g"), data[f.name] || `[${f.label}]`);
    });
    return body;
  };

  const renderBody = () => {
    if (!selectedTemplate) return "";
    let body = selectedTemplate.body;
    Object.entries(formData).forEach(([key, value]) => {
      body = body.replace(new RegExp(`\\{\\{${key}\\}\\}`, "g"), value || `[${key}]`);
    });
    return body;
  };

  const plainTextToHtml = (text: string) => {
    return text
      .split("\n\n")
      .map(p => `<p>${p.replace(/\n/g, "<br/>")}</p>`)
      .join("");
  };

  // TipTap editor
  const editor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "",
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[300px] p-4 font-serif" },
    },
  });

  // Update editor content when preview opens
  useEffect(() => {
    if (previewOpen && editor) {
      const html = plainTextToHtml(renderBody());
      editor.commands.setContent(html);
    }
  }, [previewOpen]);

  const handlePrint = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${selectedTemplate?.title}</title><style>body{font-family:serif;padding:2rem;line-height:1.8;max-width:800px;margin:0 auto}h1,h2,h3{margin-top:1em}</style></head><body>${html}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const handleExportDocx = () => {
    if (!editor) return;
    const html = editor.getHTML();
    const blob = new Blob([`<html><head><meta charset="utf-8"></head><body>${html}</body></html>`], { type: "application/vnd.ms-word;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${selectedTemplate?.title || "document"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveToVault = async () => {
    if (!user || !editor) {
      toast({ title: "Sign in required", description: "Please sign in to save documents to your vault.", variant: "destructive" });
      return;
    }
    setSaving(true);
    try {
      const html = editor.getHTML();
      const fileName = `${selectedTemplate?.title || "document"}_${Date.now()}.html`;
      const filePath = `${user.id}/${fileName}`;
      const blob = new Blob([html], { type: "text/html" });
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, blob);
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("documents").insert({
        uploaded_by: user.id,
        file_name: fileName,
        file_path: filePath,
        status: "uploaded",
      });
      if (insertError) throw insertError;
      if (selectedTemplate) clearDraft(selectedTemplate.id);
      toast({ title: "Saved to Vault", description: "Document saved to your portal documents." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
    setSaving(false);
  };

  // AI Chat for template
  const sendChatMessage = async () => {
    if (!chatInput.trim() || chatLoading) return;
    const userMsg = { role: "user" as const, content: chatInput.trim() };
    const newMessages = [...chatMessages, userMsg];
    setChatMessages(newMessages);
    setChatInput("");
    setChatLoading(true);

    let assistantSoFar = "";
    try {
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-assistant`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: newMessages,
          template_context: selectedTemplate ? {
            title: selectedTemplate.title,
            category: selectedTemplate.category,
            description: selectedTemplate.description,
            fields: formData,
          } : undefined,
        }),
      });

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({ error: "AI unavailable" }));
        throw new Error(err.error || "AI unavailable");
      }

      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let newlineIdx;
        while ((newlineIdx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, newlineIdx);
          buffer = buffer.slice(newlineIdx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { /* partial JSON */ }
        }
      }
    } catch (e: any) {
      setChatMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    }
    setChatLoading(false);
  };

  // ── Document Studio editor ──
  const studioEditor = useEditor({
    extensions: [
      StarterKit,
      UnderlineExt,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
    ],
    content: "<p>Start writing your document here...</p>",
    editorProps: {
      attributes: { class: "prose prose-sm max-w-none focus:outline-none min-h-[500px] p-6 font-serif" },
    },
  });

  const studioHandlePrint = () => {
    if (!studioEditor) return;
    const html = studioEditor.getHTML();
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`<html><head><title>${studioTitle}</title><style>body{font-family:serif;padding:2rem;line-height:1.8;max-width:800px;margin:0 auto}h1,h2,h3{margin-top:1em}</style></head><body>${html}</body></html>`);
      printWindow.document.close();
      printWindow.print();
    }
  };

  const studioHandleExport = () => {
    if (!studioEditor) return;
    const html = studioEditor.getHTML();
    const blob = new Blob([`<html><head><meta charset="utf-8"></head><body>${html}</body></html>`], { type: "application/vnd.ms-word;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${studioTitle || "document"}.doc`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const studioHandleSave = async () => {
    if (!user || !studioEditor) {
      toast({ title: "Sign in required", description: "Please sign in to save documents.", variant: "destructive" });
      return;
    }
    setStudioSaving(true);
    try {
      const html = studioEditor.getHTML();
      const fileName = `${studioTitle || "document"}_${Date.now()}.html`;
      const filePath = `${user.id}/${fileName}`;
      const blob = new Blob([html], { type: "text/html" });
      const { error: uploadError } = await supabase.storage.from("documents").upload(filePath, blob);
      if (uploadError) throw uploadError;
      const { error: insertError } = await supabase.from("documents").insert({
        uploaded_by: user.id,
        file_name: fileName,
        file_path: filePath,
        status: "uploaded",
      });
      if (insertError) throw insertError;
      toast({ title: "Saved to Vault", description: "Document saved to your portal." });
    } catch (e: any) {
      toast({ title: "Save failed", description: e.message, variant: "destructive" });
    }
    setStudioSaving(false);
  };

  const studioReviewDocument = async () => {
    if (!studioEditor) return;
    const docText = studioEditor.getText();
    if (docText.trim().length < 20) {
      toast({ title: "Not enough content", description: "Write more content before reviewing.", variant: "destructive" });
      return;
    }
    setStudioReviewing(true);
    setStudioReviewResult("");
    try {
      const resp = await callEdgeFunctionStream("build-analyst", {
        messages: [{ role: "user", content: `Review this document for completeness, tone, legal accuracy, and formatting. Provide scores, strengths, weaknesses, and actionable suggestions.\n\nDocument Title: ${studioTitle}\n\n${docText.slice(0, 5000)}` }],
        context: "Document review mode",
      }, 120000);
      if (!resp.ok) throw new Error("Review failed");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) { result += c; setStudioReviewResult(result); } } catch {}
        }
      }
    } catch (err: any) {
      toast({ title: "Review failed", description: err.message, variant: "destructive" });
    }
    setStudioReviewing(false);
  };

  const aiInlineAction = async (action: string) => {
    if (!studioEditor) return;
    const { from, to } = studioEditor.state.selection;
    const selectedText = studioEditor.state.doc.textBetween(from, to, " ");
    if (!selectedText.trim()) { toast({ title: "Select text first" }); return; }
    setAiInlineLoading(true);
    try {
      const promptMap: Record<string, string> = {
        rewrite: `Rewrite this text to be clearer and more professional. Return ONLY the rewritten text:\n\n${selectedText}`,
        expand: `Expand this text with more detail while maintaining the same tone. Return ONLY the expanded text:\n\n${selectedText}`,
        summarize: `Summarize this text concisely. Return ONLY the summary:\n\n${selectedText}`,
        grammar: `Fix any grammar, spelling, or punctuation errors. Return ONLY the corrected text:\n\n${selectedText}`,
        formal: `Rewrite this text in a more formal, professional tone. Return ONLY the formal version:\n\n${selectedText}`,
      };
      const resp = await callEdgeFunctionStream("build-analyst", {
        messages: [{ role: "user", content: promptMap[action] || promptMap.rewrite }],
        context: "Inline document editing",
      }, 60000);
      if (!resp.ok) throw new Error("AI action failed");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No body");
      const decoder = new TextDecoder();
      let result = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        for (const line of decoder.decode(value, { stream: true }).split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try { const p = JSON.parse(json); const c = p.choices?.[0]?.delta?.content; if (c) result += c; } catch {}
        }
      }
      if (result.trim()) {
        studioEditor.chain().focus().deleteRange({ from, to }).insertContentAt(from, result.trim()).run();
        toast({ title: `${action.charAt(0).toUpperCase() + action.slice(1)} applied` });
      }
    } catch (err: any) {
      toast({ title: "AI action failed", description: err.message, variant: "destructive" });
    }
    setAiInlineLoading(false);
  };

  // Studio AI Chat
  const sendStudioChat = async () => {
    if (!studioChatInput.trim() || studioChatLoading) return;
    const userMsg = { role: "user" as const, content: studioChatInput.trim() };
    const msgs = [...studioChatMessages, userMsg];
    setStudioChatMessages(msgs);
    setStudioChatInput("");
    setStudioChatLoading(true);
    let assistantSoFar = "";
    try {
      const docContext = studioEditor ? studioEditor.getText().slice(0, 2000) : "";
      const resp = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/client-assistant`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}` },
        body: JSON.stringify({ messages: msgs, template_context: { title: studioTitle, description: "User is creating a document from scratch in the Document Studio.", currentContent: docContext } }),
      });
      if (!resp.ok) throw new Error("AI unavailable");
      const reader = resp.body?.getReader();
      if (!reader) throw new Error("No stream");
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let idx;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const c = parsed.choices?.[0]?.delta?.content;
            if (c) {
              assistantSoFar += c;
              setStudioChatMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch (e) { console.warn("Stream parse error:", e); }
        }
      }
    } catch (e: any) {
      setStudioChatMessages(prev => [...prev, { role: "assistant", content: `Error: ${e.message}` }]);
    }
    setStudioChatLoading(false);
  };

  const startFromTemplate = (t: Template) => {
    const body = t.sampleData ? (() => {
      let b = t.body;
      Object.entries(t.sampleData).forEach(([k, v]) => { b = b.replace(new RegExp(`\\{\\{${k}\\}\\}`, "g"), v); });
      return b;
    })() : t.body;
    setStudioTitle(t.title);
    studioEditor?.commands.setContent(plainTextToHtml(body));
    setMainTab("studio");
    toast({ title: "Template loaded", description: `"${t.title}" loaded into the editor.` });
  };

  return (
    <PageShell>

      <div className="container mx-auto max-w-6xl px-4 py-8">
        <Breadcrumbs />
        <div className="mb-6 text-center">
          <h1 className="font-sans text-3xl font-bold text-foreground mb-2">Document Studio</h1>
          <p className="text-muted-foreground mb-4">Create from scratch or use ready-made templates</p>
        </div>

        <Tabs value={mainTab} onValueChange={setMainTab} className="mb-6">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2">
            <TabsTrigger value="templates" className="gap-1.5"><FileText className="h-4 w-4" /> Template Library</TabsTrigger>
            <TabsTrigger value="studio" className="gap-1.5"><PenTool className="h-4 w-4" /> Create New</TabsTrigger>
          </TabsList>

          <TabsContent value="templates" className="mt-6">

        {/* Legal Disclaimer */}
        <div className="mb-8 space-y-3">
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-950/30 dark:border-amber-800">
            <h3 className="flex items-center gap-2 font-sans text-sm font-semibold text-amber-900 dark:text-amber-200 mb-2">
              <AlertTriangle className="h-4 w-4" /> Important: Read Before Using These Templates
            </h3>
            <div className="text-sm text-amber-800 dark:text-amber-300 space-y-2">
              <p><strong>You CAN use these templates for:</strong> General informational starting points, standard notarial certificates (acknowledgments, jurats), routine personal documents (travel consent, general affidavits), and common business documents (bill of sale, basic contracts).</p>
              <p><strong>You MAY need attorney review for:</strong> Estate planning documents (wills, trusts, healthcare directives), real property transfers (deeds, mortgages), court filings, power of attorney documents with specific legal powers, and any document with significant legal or financial consequences.</p>
              <p><strong>Always check with your local officials:</strong> County recorders, courts, and government agencies may have specific form requirements.</p>
              <p className="text-xs italic">These templates are provided for informational purposes only and do not constitute legal advice.</p>
            </div>
          </div>
        </div>

        {/* Cross-sell banner */}
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border/50 bg-muted/30 p-4">
          <div>
            <p className="font-sans text-sm font-semibold">Need help with your documents?</p>
            <p className="text-xs text-muted-foreground">We offer professional document preparation, notarization, and more.</p>
          </div>
          <div className="flex gap-2">
            <Link to="/services"><Button variant="outline" size="sm">View All Services</Button></Link>
            <Link to="/digitize"><Button variant="outline" size="sm">Digitize Documents</Button></Link>
          </div>
        </div>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filtered.map((t) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
              <Card className="h-full border-border/50 transition-shadow hover:shadow-md cursor-pointer relative group" onClick={() => openTemplate(t)}>
                <CardContent className="p-5">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-5 w-5 text-primary" />
                      <Badge variant="outline" className="text-xs">{t.category}</Badge>
                      {hasDraft(t.id) && <Badge variant="secondary" className="text-xs">Draft</Badge>}
                    </div>
                    <div className="flex items-center gap-1">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => { e.stopPropagation(); setQuickPreviewTemplate(t); }} aria-label="Action">
                              <Eye className="h-4 w-4 text-muted-foreground" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Quick preview with sample data</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={(e) => toggleFavorite(e, t.id)} aria-label="Action">
                        <Heart className={`h-4 w-4 transition-colors ${favorites.has(t.id) ? "fill-destructive text-destructive" : "text-muted-foreground"}`} />
                      </Button>
                    </div>
                  </div>
                  <h3 className="font-sans text-lg font-semibold mb-1">{t.title}</h3>
                  <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                  <div className="flex gap-1 flex-wrap">{t.tags.map((tag) => <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>)}</div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
          </TabsContent>

          {/* ── Document Studio Tab ── */}
          <TabsContent value="studio" className="mt-6">
            <div className="flex flex-col gap-4">
              {/* Title + Actions Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <Input
                  value={studioTitle}
                  onChange={(e) => setStudioTitle(e.target.value)}
                  className="max-w-md text-lg font-semibold"
                  placeholder="Document Title"
                />
                <div className="flex gap-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => setStudioChatOpen(!studioChatOpen)}>
                    <PanelRightOpen className="h-4 w-4 mr-1.5" /> AI Chat
                  </Button>
                  <Button variant="outline" size="sm" onClick={studioReviewDocument} disabled={studioReviewing}>
                    {studioReviewing ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <CheckCircle className="h-4 w-4 mr-1.5" />}
                    Review
                  </Button>
                  <Button variant="outline" size="sm" onClick={studioHandleExport}><Download className="h-4 w-4 mr-1.5" /> Export .DOC</Button>
                  <Button variant="outline" size="sm" onClick={studioHandlePrint}><Printer className="h-4 w-4 mr-1.5" /> Print / PDF</Button>
                  <Button size="sm" onClick={studioHandleSave} disabled={studioSaving || !user}>
                    {studioSaving ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Save className="h-4 w-4 mr-1.5" />}
                    Save to Vault
                  </Button>
                </div>
              </div>

              <div className="flex gap-4">
                {/* Main Editor */}
                <div className="flex-1 border rounded-lg overflow-hidden bg-background">
                  <EditorToolbar editor={studioEditor} />
                  {/* AI Inline Actions Bar */}
                  <div className="flex gap-1 border-b border-border p-1.5 bg-muted/20 flex-wrap">
                    <span className="text-xs text-muted-foreground self-center mr-1">AI Actions:</span>
                    {["rewrite", "expand", "summarize", "grammar", "formal"].map((action) => (
                      <Button key={action} variant="ghost" size="sm" className="h-6 px-2 text-xs" onClick={() => aiInlineAction(action)} disabled={aiInlineLoading}>
                        {aiInlineLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : action.charAt(0).toUpperCase() + action.slice(1)}
                      </Button>
                    ))}
                    <span className="text-xs text-muted-foreground self-center ml-auto italic">Select text first</span>
                  </div>
                  <EditorContent editor={studioEditor} />
                </div>

                {/* AI Chat Sidebar */}
                {studioChatOpen && (
                  <div className="w-80 shrink-0 border rounded-lg flex flex-col bg-background">
                    <div className="p-3 border-b flex items-center justify-between">
                      <h3 className="text-sm font-semibold flex items-center gap-1.5"><Sparkles className="h-4 w-4 text-primary" /> AI Assistant</h3>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => setStudioChatOpen(false)}>×</Button>
                    </div>
                    <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[300px] max-h-[500px]">
                      {studioChatMessages.length === 0 && (
                        <div className="text-center text-xs text-muted-foreground py-8 space-y-2">
                          <p>Ask me to help draft, edit, or review your document.</p>
                          <div className="flex flex-wrap gap-1 justify-center">
                            {["Help me draft a letter", "Add a section about...", "Make this more formal"].map((q) => (
                              <Button key={q} variant="outline" size="sm" className="text-xs h-auto py-1" onClick={() => { setStudioChatInput(q); }}>
                                {q}
                              </Button>
                            ))}
                          </div>
                        </div>
                      )}
                      {studioChatMessages.map((msg, i) => (
                        <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                          <div className={`max-w-[90%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                            {msg.role === "assistant" ? (
                              <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                            ) : <p>{msg.content}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                    <div className="p-3 border-t flex gap-2">
                      <Input value={studioChatInput} onChange={(e) => setStudioChatInput(e.target.value)} placeholder="Ask AI..." onKeyDown={(e) => { if (e.key === "Enter") sendStudioChat(); }} className="text-sm" />
                      <Button size="sm" onClick={sendStudioChat} disabled={studioChatLoading || !studioChatInput.trim()}>
                        {studioChatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Review Results */}
              {studioReviewResult && (
                <Card>
                  <CardHeader className="pb-2"><CardTitle className="text-sm flex items-center gap-2"><CheckCircle className="h-4 w-4 text-primary" /> Document Review</CardTitle></CardHeader>
                  <CardContent className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{studioReviewResult}</ReactMarkdown>
                  </CardContent>
                </Card>
              )}

              {/* Quick Start Templates */}
              <div className="mt-4">
                <h3 className="text-sm font-semibold mb-3">Quick Start from Template</h3>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                  {templates.slice(0, 4).map((t) => (
                    <Card key={t.id} className="cursor-pointer hover:shadow-md transition-shadow" onClick={() => startFromTemplate(t)}>
                      <CardContent className="p-3">
                        <div className="flex items-center gap-2 mb-1">
                          <FileText className="h-4 w-4 text-primary" />
                          <Badge variant="outline" className="text-xs">{t.category}</Badge>
                        </div>
                        <p className="text-sm font-medium">{t.title}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <Dialog open={!!quickPreviewTemplate} onOpenChange={() => setQuickPreviewTemplate(null)}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-sans flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" /> Preview — {quickPreviewTemplate?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">This preview uses sample data to show how the completed document will look.</p>
          <div className="flex-1 overflow-y-auto border rounded-lg p-6 bg-muted/20">
            <pre className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-foreground">{quickPreviewTemplate ? renderSamplePreview(quickPreviewTemplate) : ""}</pre>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setQuickPreviewTemplate(null)}>Close</Button>
            <Button onClick={() => { if (quickPreviewTemplate) { openTemplate(quickPreviewTemplate); setQuickPreviewTemplate(null); } }} className="">
              Use This Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Template Fill Dialog */}
      <Dialog open={!!selectedTemplate && !previewOpen} onOpenChange={() => setSelectedTemplate(null)}>
        <DialogContent className="sm:max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="font-sans">{selectedTemplate?.title}</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground mb-4">{selectedTemplate?.description}</p>
          <div className="space-y-4">
            {selectedTemplate?.fields.map((field) => {
              const updateField = (value: string) => {
                const updated = { ...formData, [field.name]: value };
                setFormData(updated);
                if (selectedTemplate) saveDraft(selectedTemplate.id, updated);
              };
              return (
                <div key={field.name}>
                  <div className="flex items-center gap-1.5 mb-1">
                    <Label className="mb-0">{field.label}</Label>
                    {field.helpText && (
                      <TooltipProvider delayDuration={200}>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="h-3.5 w-3.5 text-muted-foreground cursor-help shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent side="top" className="max-w-[260px] text-xs">
                            {field.helpText}
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                  </div>
                  {field.type === "textarea" ? (
                    <Textarea value={formData[field.name] || ""} onChange={(e) => updateField(e.target.value)} placeholder={field.placeholder} />
                  ) : (
                    <Input type={field.type} value={formData[field.name] || ""} onChange={(e) => updateField(e.target.value)} placeholder={field.placeholder} />
                  )}
                </div>
              );
            })}
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setChatOpen(true)} className="gap-1">
                <Sparkles className="h-3 w-3" /> Ask AI About This
              </Button>
              {selectedTemplate && hasDraft(selectedTemplate.id) && (
                <Button variant="ghost" size="sm" onClick={() => {
                  if (selectedTemplate) {
                    clearDraft(selectedTemplate.id);
                    const initialData: Record<string, string> = {};
                    selectedTemplate.fields.forEach((f) => { initialData[f.name] = ""; });
                    setFormData(initialData);
                    toast({ title: "Draft cleared" });
                  }
                }} className="gap-1 text-muted-foreground">
                  <RotateCcw className="h-3 w-3" /> Clear Draft
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setSelectedTemplate(null)}>Cancel</Button>
              <Button variant="outline" onClick={() => { if (selectedTemplate) openInDocuDex(selectedTemplate); }} className="gap-1">
                <ExternalLink className="h-3 w-3" /> Open in DocuDex
              </Button>
              <Button onClick={() => setPreviewOpen(true)} className=""><Eye className="mr-1 h-4 w-4" /> Preview & Edit</Button>
            </div>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Rich Text Preview/Editor Dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
          <DialogHeader><DialogTitle className="font-sans">Edit Document — {selectedTemplate?.title}</DialogTitle></DialogHeader>
          <div className="flex-1 overflow-y-auto border rounded-lg">
            <EditorToolbar editor={editor} />
            <EditorContent editor={editor} />
          </div>
          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>Back to Fields</Button>
            <Button variant="outline" onClick={handleExportDocx} className="gap-1"><Download className="h-3 w-3" /> Export .DOC</Button>
            <Button variant="outline" onClick={() => { if (selectedTemplate) openInDocuDex(selectedTemplate); }} className="gap-1">
              <ExternalLink className="h-3 w-3" /> Open in DocuDex
            </Button>
            <Button variant="outline" onClick={handleSaveToVault} disabled={saving || !user} className="gap-1">
              {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />} Save to Vault
            </Button>
            <Button onClick={handlePrint} className=" gap-1"><Printer className="h-3 w-3" /> Print / PDF</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AI Chat Dialog for Template */}
      <Dialog open={chatOpen} onOpenChange={setChatOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="font-sans flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> AI Assistant — {selectedTemplate?.title}
            </DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">Ask questions about this template, your specific situation, Ohio notary requirements, and more.</p>
          <div className="flex-1 overflow-y-auto space-y-3 min-h-[200px] max-h-[400px] border rounded-lg p-3">
            {chatMessages.length === 0 && (
              <p className="text-center text-xs text-muted-foreground py-8">Ask a question about this template to get started.</p>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm max-w-none dark:prose-invert"><ReactMarkdown>{msg.content}</ReactMarkdown></div>
                  ) : (
                    <p>{msg.content}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="e.g., Do I need witnesses for this?"
              onKeyDown={(e) => { if (e.key === "Enter") sendChatMessage(); }}
            />
            <Button onClick={sendChatMessage} disabled={chatLoading || !chatInput.trim()} className="">
              {chatLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

    </PageShell>
  );
}
