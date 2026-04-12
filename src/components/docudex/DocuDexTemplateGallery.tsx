import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Search, FileText, Briefcase, Scale, Building2, Heart, GraduationCap, Globe } from "lucide-react";

interface TemplateGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (html: string, title: string) => void;
}

const CATEGORIES = [
  { id: "all", label: "All", icon: FileText },
  { id: "legal", label: "Legal", icon: Scale },
  { id: "business", label: "Business", icon: Briefcase },
  { id: "real-estate", label: "Real Estate", icon: Building2 },
  { id: "personal", label: "Personal", icon: Heart },
  { id: "education", label: "Education", icon: GraduationCap },
  { id: "international", label: "International", icon: Globe },
];

const GALLERY_TEMPLATES = [
  { id: "affidavit", name: "General Affidavit", category: "legal", description: "Sworn statement template with notary block", html: "<h1>AFFIDAVIT</h1><p>STATE OF OHIO</p><p>COUNTY OF ___________</p><p><br></p><p>I, <strong>[Full Name]</strong>, being duly sworn, depose and state as follows:</p><ol><li><p>[Statement 1]</p></li><li><p>[Statement 2]</p></li></ol><p><br></p><p>______________________________</p><p>Affiant Signature</p><p><br></p><p>Sworn to and subscribed before me this ___ day of _________, 20___.</p><p>______________________________</p><p>Notary Public, State of Ohio</p><p>My Commission Expires: ___________</p>" },
  { id: "poa", name: "Power of Attorney", category: "legal", description: "General or limited power of attorney", html: "<h1>POWER OF ATTORNEY</h1><p>STATE OF OHIO</p><p><br></p><p>KNOW ALL PERSONS BY THESE PRESENTS:</p><p>I, <strong>[Principal Name]</strong>, of [Address], do hereby appoint <strong>[Agent Name]</strong> as my true and lawful Attorney-in-Fact to act on my behalf.</p><h2>POWERS GRANTED</h2><ul><li><p>[Power 1]</p></li><li><p>[Power 2]</p></li></ul><p><br></p><p>This Power of Attorney shall [remain in effect / terminate on ___].</p><p><br></p><p>______________________________</p><p>Principal Signature &amp; Date</p>" },
  { id: "nda", name: "Non-Disclosure Agreement", category: "business", description: "Mutual or one-way NDA", html: "<h1>NON-DISCLOSURE AGREEMENT</h1><p>This Non-Disclosure Agreement (\"Agreement\") is entered into as of <strong>[Date]</strong> by and between:</p><p><strong>Disclosing Party:</strong> [Name]</p><p><strong>Receiving Party:</strong> [Name]</p><h2>1. CONFIDENTIAL INFORMATION</h2><p>\"Confidential Information\" means any non-public information disclosed by the Disclosing Party...</p><h2>2. OBLIGATIONS</h2><p>The Receiving Party agrees to hold and maintain the Confidential Information in strict confidence...</p><h2>3. TERM</h2><p>This Agreement shall remain in effect for a period of [___] years.</p><p><br></p><p>______________________________&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;______________________________</p><p>Disclosing Party&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;Receiving Party</p>" },
  { id: "invoice", name: "Professional Invoice", category: "business", description: "Itemized service invoice", html: "<h1>INVOICE</h1><p><strong>[Company Name]</strong></p><p>[Address] | [Phone] | [Email]</p><p><br></p><table><tr><th>Invoice #</th><td>[INV-001]</td><th>Date</th><td>[Date]</td></tr><tr><th>Bill To</th><td colspan='3'>[Client Name, Address]</td></tr></table><p><br></p><table><tr><th>Description</th><th>Qty</th><th>Rate</th><th>Amount</th></tr><tr><td>[Service]</td><td>1</td><td>$0.00</td><td>$0.00</td></tr></table><p><br></p><p><strong>Total Due: $0.00</strong></p>" },
  { id: "lease", name: "Residential Lease Agreement", category: "real-estate", description: "Standard Ohio lease template", html: "<h1>RESIDENTIAL LEASE AGREEMENT</h1><p>This Lease Agreement is made on <strong>[Date]</strong> between:</p><p><strong>Landlord:</strong> [Name]</p><p><strong>Tenant:</strong> [Name]</p><h2>PROPERTY</h2><p>[Property Address]</p><h2>TERM</h2><p>This lease begins on [Start Date] and ends on [End Date].</p><h2>RENT</h2><p>Monthly rent: <strong>$[Amount]</strong>, due on the [1st] of each month.</p><h2>SECURITY DEPOSIT</h2><p>$[Amount]</p>" },
  { id: "will", name: "Simple Will", category: "personal", description: "Last will and testament template", html: "<h1>LAST WILL AND TESTAMENT</h1><p>of</p><p><strong>[Full Legal Name]</strong></p><p><br></p><p>I, [Full Name], of [City, County, State], being of sound mind, declare this to be my Last Will and Testament.</p><h2>ARTICLE I — REVOCATION</h2><p>I revoke all prior wills and codicils.</p><h2>ARTICLE II — DEBTS AND EXPENSES</h2><p>I direct that all my legally enforceable debts and funeral expenses be paid.</p><h2>ARTICLE III — SPECIFIC BEQUESTS</h2><p>[List specific bequests]</p><h2>ARTICLE IV — RESIDUARY ESTATE</h2><p>I give the rest of my estate to [Name/Names].</p>" },
  { id: "cert-copy", name: "Certified Copy Request", category: "legal", description: "Request for certified document copies", html: "<h1>REQUEST FOR CERTIFIED COPIES</h1><p>Date: [Date]</p><p><br></p><p>To: [Office/Agency Name]</p><p><br></p><p>I, <strong>[Name]</strong>, hereby request certified copies of the following documents:</p><ol><li><p>[Document 1]</p></li><li><p>[Document 2]</p></li></ol><p><br></p><p>Purpose: [Reason for request]</p><p>Number of copies needed: [#]</p>" },
  { id: "meeting-minutes", name: "Meeting Minutes", category: "business", description: "Corporate meeting minutes template", html: "<h1>MEETING MINUTES</h1><p><strong>[Organization Name]</strong></p><p>Date: [Date] | Time: [Time] | Location: [Location]</p><h2>ATTENDEES</h2><ul><li><p>[Name 1]</p></li><li><p>[Name 2]</p></li></ul><h2>AGENDA ITEMS</h2><h3>1. Call to Order</h3><p>The meeting was called to order at [Time].</p><h3>2. [Topic]</h3><p>[Discussion notes]</p><h3>3. Action Items</h3><ul><li><p>[Action] — Assigned to [Name], Due [Date]</p></li></ul><h2>ADJOURNMENT</h2><p>Meeting adjourned at [Time].</p>" },
  { id: "letter-intent", name: "Letter of Intent", category: "business", description: "Business transaction LOI", html: "<h1>LETTER OF INTENT</h1><p>[Date]</p><p><br></p><p>Dear [Recipient],</p><p><br></p><p>This Letter of Intent outlines the proposed terms for [transaction description].</p><h2>PARTIES</h2><p><strong>Buyer:</strong> [Name]</p><p><strong>Seller:</strong> [Name]</p><h2>PROPOSED TERMS</h2><ul><li><p>Purchase Price: $[Amount]</p></li><li><p>Closing Date: [Date]</p></li><li><p>Contingencies: [List]</p></li></ul><p><br></p><p>This LOI is non-binding except for confidentiality provisions.</p>" },
  { id: "permission-slip", name: "Permission Form", category: "education", description: "Guardian consent and permission", html: "<h1>PERMISSION AND CONSENT FORM</h1><p><strong>[Organization/School Name]</strong></p><p><br></p><p>I, <strong>[Parent/Guardian Name]</strong>, hereby grant permission for <strong>[Child's Name]</strong> to participate in [Activity/Event] on [Date].</p><p><br></p><p>Emergency Contact: [Phone]</p><p>Known Allergies/Medical Conditions: [Details]</p><p><br></p><p>______________________________</p><p>Parent/Guardian Signature &amp; Date</p>" },
  { id: "translation-cert", name: "Translation Certificate", category: "international", description: "Certified translation attestation", html: "<h1>CERTIFICATE OF TRANSLATION ACCURACY</h1><p><br></p><p>I, <strong>[Translator Name]</strong>, certify that I am competent to translate from <strong>[Source Language]</strong> to <strong>[Target Language]</strong>, and that the attached translation of <strong>[Document Name]</strong> is a true and accurate translation of the original document.</p><p><br></p><p>______________________________</p><p>Translator Signature</p><p>Date: ___________</p><p>Certification #: ___________</p>" },
  { id: "promissory-note", name: "Promissory Note", category: "legal", description: "Loan repayment promise document", html: "<h1>PROMISSORY NOTE</h1><p>Amount: $<strong>[Amount]</strong></p><p>Date: [Date]</p><p><br></p><p>FOR VALUE RECEIVED, the undersigned, <strong>[Borrower Name]</strong>, promises to pay to the order of <strong>[Lender Name]</strong> the sum of $[Amount] with interest at [Rate]% per annum.</p><h2>PAYMENT TERMS</h2><p>[Monthly payments of $X beginning on Date]</p><p><br></p><p>______________________________</p><p>Borrower Signature</p>" },
];

export function DocuDexTemplateGallery({ open, onOpenChange, onSelect }: TemplateGalleryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");

  const filtered = GALLERY_TEMPLATES.filter(t => {
    if (category !== "all" && t.category !== category) return false;
    if (search && !t.name.toLowerCase().includes(search.toLowerCase()) && !t.description.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[80vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="h-5 w-5" /> Template Gallery</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search templates..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>

          <div className="flex flex-wrap gap-1.5">
            {CATEGORIES.map(cat => {
              const Icon = cat.icon;
              return (
                <Badge
                  key={cat.id}
                  variant={category === cat.id ? "default" : "outline"}
                  className="cursor-pointer text-xs"
                  onClick={() => setCategory(cat.id)}
                >
                  <Icon className="h-3 w-3 mr-1" /> {cat.label}
                </Badge>
              );
            })}
          </div>

          <ScrollArea className="h-[50vh]">
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3 pr-2">
              {filtered.map(t => (
                <button
                  key={t.id}
                  onClick={() => { onSelect(t.html, t.name); onOpenChange(false); }}
                  className="text-left rounded-lg border border-border p-3 hover:border-primary/40 hover:bg-primary/5 transition-all group"
                >
                  <div className="flex items-center gap-2 mb-1.5">
                    <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    <span className="text-sm font-medium">{t.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{t.description}</p>
                  <Badge variant="outline" className="text-[9px] mt-2">{t.category}</Badge>
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="col-span-full text-center text-sm text-muted-foreground py-8">No templates match your search</p>
              )}
            </div>
          </ScrollArea>
        </div>
      </DialogContent>
    </Dialog>
  );
}
