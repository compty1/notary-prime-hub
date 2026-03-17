import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, FileText, Users, Shield, AlertTriangle, CheckCircle, BookOpen } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const documentGuides = [
  {
    category: "Real Estate",
    icon: "🏠",
    guides: [
      {
        title: "Deed Notarization (Warranty, Quit Claim, TOD)",
        tags: ["acknowledgment", "real estate"],
        steps: [
          "Verify identity of ALL grantors using acceptable government-issued photo ID",
          "Confirm the grantor(s) understand they are transferring property",
          "Ensure the document has the legal description of the property",
          "Have grantor(s) sign in your presence (do NOT accept pre-signed documents)",
          "Complete the acknowledgment certificate — confirm they signed willingly",
          "Apply notary seal and signature",
          "Record in notary journal: date, signer name, ID type/number, document type, fee",
          "Verify county recorder formatting requirements if applicable",
        ],
        whoPresent: "All grantors (sellers/transferors). Grantees do NOT need to be present unless also signing.",
        warnings: ["Never notarize a deed if the signer seems confused about what they're signing", "Check for power of attorney if someone is signing on behalf of another"],
      },
      {
        title: "Mortgage Closing Package",
        tags: ["acknowledgment", "real estate", "batch"],
        steps: [
          "Review the closing package — identify which documents require notarization",
          "Verify identity of ALL borrowers using acceptable photo ID",
          "Proceed through documents one at a time, explaining each signature line",
          "For each notarized document: have the borrower sign, then complete the certificate",
          "Apply seal and signature to each notarized document",
          "Create separate journal entries for EACH notarized document",
          "Return completed package to title company/lender",
        ],
        whoPresent: "All borrowers named on the mortgage. Lender representative may be present but typically doesn't sign before the notary.",
        warnings: ["Closing packages can have 50+ pages — only some require notarization", "Never rush a signer through documents they don't understand", "Some lenders require specific notary certificates — use theirs, not yours"],
      },
    ],
  },
  {
    category: "Legal Documents",
    icon: "⚖️",
    guides: [
      {
        title: "Power of Attorney (All Types)",
        tags: ["acknowledgment", "legal", "capacity"],
        steps: [
          "Verify the principal's identity using acceptable photo ID",
          "CRITICAL: Assess the principal's mental capacity — they must understand what they're signing",
          "Confirm the principal understands they are granting authority to the agent",
          "Have the principal sign in your presence",
          "Complete the acknowledgment certificate",
          "Apply seal and signature",
          "Record in journal with special note about capacity observation",
        ],
        whoPresent: "Only the PRINCIPAL must appear. The agent/attorney-in-fact does NOT need to be present. Witnesses recommended for durable POA.",
        warnings: ["If you have ANY doubt about the principal's mental capacity, DO NOT proceed", "A notary cannot give legal advice about which type of POA to use", "Healthcare POA in Ohio requires 2 witnesses per ORC §1337.12"],
      },
      {
        title: "Affidavits & Sworn Statements (Jurat)",
        tags: ["jurat", "oath", "legal"],
        steps: [
          "Verify the affiant's identity using acceptable photo ID",
          "Have the affiant read the document (or confirm they have read it)",
          "Administer the oath or affirmation — REQUIRED for jurats",
          "Oath script: 'Do you solemnly swear (or affirm) that the statements in this document are true and correct to the best of your knowledge?'",
          "After the affiant responds 'I do,' have them sign the document",
          "Complete the jurat certificate (different from acknowledgment!)",
          "Apply seal and signature",
          "Record in journal — note that oath was administered",
        ],
        whoPresent: "The affiant (person making the sworn statement). No witnesses required unless specified in the document.",
        warnings: ["A JURAT requires an oath — this is NOT optional", "The difference between acknowledgment and jurat matters legally", "If using wrong certificate type, the document may be rejected"],
      },
    ],
  },
  {
    category: "Estate Planning",
    icon: "📋",
    guides: [
      {
        title: "Last Will & Testament",
        tags: ["acknowledgment", "witnesses", "estate"],
        steps: [
          "Verify the testator's identity using acceptable photo ID",
          "Ensure TWO disinterested witnesses are present (ORC §2107.03)",
          "Witnesses must NOT be beneficiaries of the will",
          "Testator signs the will in presence of both witnesses and notary",
          "Both witnesses sign the will",
          "If there's a self-proving affidavit: administer oath to testator and witnesses",
          "All three (testator + 2 witnesses) sign the self-proving affidavit",
          "Notarize the self-proving affidavit (NOT the will itself)",
          "Apply seal and signature to the affidavit",
          "Record in journal",
        ],
        whoPresent: "Testator + 2 disinterested witnesses. All must be present simultaneously.",
        warnings: ["The NOTARY should not be a beneficiary or named in the will", "You notarize the SELF-PROVING AFFIDAVIT, not the will itself", "All parties must be present at the same time", "Witnesses must be competent adults who are NOT beneficiaries"],
      },
      {
        title: "Healthcare Directive / Living Will",
        tags: ["acknowledgment", "witnesses", "healthcare"],
        steps: [
          "Verify the principal's identity using acceptable photo ID",
          "Confirm the principal is of sound mind and acting voluntarily",
          "Ensure TWO witnesses are present per ORC §1337.12",
          "Witnesses cannot be: attending physician, nursing home admin, or the named agent",
          "Principal signs the directive",
          "Both witnesses sign",
          "Notarize the document",
          "Apply seal and record in journal",
        ],
        whoPresent: "Principal + 2 qualified witnesses (with specific disqualification rules per ORC §1337.12).",
        warnings: ["Witness restrictions are strict — verify each witness is eligible", "This document has serious life-and-death implications — ensure the principal understands"],
      },
    ],
  },
  {
    category: "Situational Guides",
    icon: "🔧",
    guides: [
      {
        title: "Signer Has Limited English Proficiency",
        tags: ["special", "interpreter"],
        steps: [
          "Determine if the signer can communicate their understanding of the document",
          "A qualified interpreter may assist — the interpreter should be a disinterested party",
          "The notary does NOT need to understand the document's language",
          "The notary DOES need to communicate directly with the signer for the oath/acknowledgment",
          "Consider having the interpreter take an oath to translate accurately",
          "Document the interpreter's name and the language used in your journal",
          "Complete notarization as normal",
        ],
        whoPresent: "The signer + qualified interpreter (if needed). The interpreter should not be a party to the document.",
        warnings: ["Never sign as interpreter yourself", "If you cannot communicate with the signer at all, you should decline", "The notary's certificate should be in English"],
      },
      {
        title: "Signer Cannot Physically Sign (Signature by Mark)",
        tags: ["special", "disability", "mark"],
        steps: [
          "Ohio allows signature by mark (X) under ORC §1.59",
          "The signer makes their mark in the notary's presence",
          "TWO witnesses should be present to observe the mark",
          "One witness writes the signer's name next to the mark",
          "Both witnesses sign as witnesses on the document",
          "Notary completes the certificate noting 'signature by mark'",
          "Record all details in journal including the names of both witnesses",
        ],
        whoPresent: "The signer + 2 witnesses. One witness writes the signer's name beside the mark.",
        warnings: ["The signer must still demonstrate understanding of the document", "This is NOT the same as someone signing 'on behalf of' another person"],
      },
      {
        title: "Signer Appears Under Duress or Coercion",
        tags: ["special", "refusal", "ethics"],
        steps: [
          "Watch for red flags: nervousness, another person answering for the signer, reluctance to sign",
          "Speak to the signer PRIVATELY if possible",
          "Ask the signer directly: 'Are you signing this document of your own free will?'",
          "If you suspect duress: REFUSE to notarize. This is your legal obligation.",
          "Document your refusal and the reasons in your journal",
          "If you suspect elder abuse: contact Adult Protective Services (Ohio: 1-855-642-1999)",
        ],
        whoPresent: "Ideally, speak with the signer alone to assess voluntariness.",
        warnings: ["NEVER notarize if you suspect the signer is being coerced", "Trust your instincts — if something feels wrong, it probably is", "You have legal protection for refusing in good faith"],
      },
      {
        title: "Notarizing for a Corporation/LLC",
        tags: ["business", "entity", "authority"],
        steps: [
          "Verify the signer's personal identity using acceptable photo ID",
          "Determine the signer's authority to sign on behalf of the entity",
          "Ask to see: articles of incorporation, corporate resolution, operating agreement, or letter of authority",
          "The signer signs their own name + their title (e.g., 'John Smith, President')",
          "The notarial certificate should reference the signer's representative capacity",
          "Record the entity name and signer's title in your journal",
        ],
        whoPresent: "The authorized representative of the entity (officer, manager, or authorized signatory).",
        warnings: ["You are notarizing the PERSON's signature, not the entity", "If you doubt their authority, ask for documentation", "The notarial certificate should reflect the representative capacity"],
      },
    ],
  },
];

const complianceReminders = [
  { title: "Seal Requirements", items: ["Must include: your name, 'Notary Public', 'State of Ohio'", "Commission expiration date", "Must be legible and reproducible when photocopied"] },
  { title: "Journal Requirements (ORC §147.551)", items: ["Date and time of notarial act", "Type of notarial act", "Document type and description", "Signer's name and address", "ID type and number", "Fee charged", "For RON: session recording stored 10+ years"] },
  { title: "Prohibited Acts", items: ["Cannot notarize your own signature", "Cannot notarize for spouse, parent, child, or sibling", "Cannot notarize if you have a direct financial interest", "Cannot practice law or give legal advice", "Cannot notarize a document you know is false", "Cannot notarize without the signer present"] },
];

export default function AdminResources() {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredGuides = documentGuides.map((cat) => ({
    ...cat,
    guides: cat.guides.filter(
      (g) =>
        g.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        g.tags.some((t) => t.includes(searchTerm.toLowerCase()))
    ),
  })).filter((cat) => cat.guides.length > 0);

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-foreground">Resource Bank</h1>
          <p className="text-sm text-muted-foreground">Step-by-step notarization guides for every situation</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search guides (e.g., 'jurat', 'deed', 'coercion')..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="guides" className="space-y-6">
        <TabsList>
          <TabsTrigger value="guides"><BookOpen className="mr-1 h-4 w-4" /> Guides</TabsTrigger>
          <TabsTrigger value="compliance"><Shield className="mr-1 h-4 w-4" /> Compliance</TabsTrigger>
        </TabsList>

        <TabsContent value="guides" className="space-y-8">
          {filteredGuides.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="py-12 text-center text-muted-foreground">
                No guides match your search. Try different keywords.
              </CardContent>
            </Card>
          ) : (
            filteredGuides.map((category) => (
              <div key={category.category}>
                <h2 className="mb-4 flex items-center gap-2 font-display text-lg font-semibold">
                  <span>{category.icon}</span> {category.category}
                </h2>
                <Accordion type="single" collapsible className="space-y-2">
                  {category.guides.map((guide, i) => (
                    <AccordionItem key={i} value={`${category.category}-${i}`} className="rounded-lg border border-border/50 bg-card px-4">
                      <AccordionTrigger className="text-left text-sm font-medium">
                        <div className="flex flex-wrap items-center gap-2">
                          <span>{guide.title}</span>
                          {guide.tags.map((t) => (
                            <Badge key={t} variant="outline" className="text-xs">{t}</Badge>
                          ))}
                        </div>
                      </AccordionTrigger>
                      <AccordionContent>
                        <div className="space-y-4 pb-2">
                          {/* Who must be present */}
                          <div className="rounded-lg bg-blue-50 p-3">
                            <p className="flex items-center gap-1.5 text-xs font-semibold text-blue-800">
                              <Users className="h-3 w-3" /> Who Must Be Present
                            </p>
                            <p className="mt-1 text-sm text-blue-700">{guide.whoPresent}</p>
                          </div>

                          {/* Steps */}
                          <div>
                            <p className="mb-2 text-xs font-semibold text-muted-foreground">Step-by-Step Procedure</p>
                            <div className="space-y-2">
                              {guide.steps.map((step, j) => (
                                <div key={j} className="flex gap-3">
                                  <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-accent/10 text-xs font-bold text-accent">
                                    {j + 1}
                                  </div>
                                  <p className="text-sm">{step}</p>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Warnings */}
                          {guide.warnings.length > 0 && (
                            <div className="rounded-lg bg-amber-50 p-3">
                              <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                                <AlertTriangle className="h-3 w-3" /> Important Warnings
                              </p>
                              <ul className="mt-1 space-y-1">
                                {guide.warnings.map((w, k) => (
                                  <li key={k} className="flex items-start gap-1.5 text-sm text-amber-700">
                                    <span className="mt-1.5 h-1 w-1 flex-shrink-0 rounded-full bg-amber-500" />
                                    {w}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
          )}
        </TabsContent>

        <TabsContent value="compliance" className="space-y-6">
          {complianceReminders.map((section) => (
            <Card key={section.title} className="border-border/50">
              <CardContent className="p-6">
                <h3 className="mb-3 flex items-center gap-2 font-display text-lg font-semibold">
                  <Shield className="h-5 w-5 text-accent" />
                  {section.title}
                </h3>
                <ul className="space-y-2">
                  {section.items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <CheckCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-emerald-500" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
