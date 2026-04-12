import { useState, useRef } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { PageShell } from "@/components/PageShell";
import { Breadcrumbs } from "@/components/Breadcrumbs";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, FileText, Scale, Shield, Stamp, PenTool, AlertTriangle, BookOpen, Image } from "lucide-react";
import { DOCUMENT_ANATOMY } from "@/components/AnatomyDiagram";

const certificates = [
  {
    id: "acknowledgment",
    title: "Ohio Acknowledgment Certificate",
    icon: Stamp,
    category: "Primary Act",
    content: `
## Overview

An acknowledgment is the most common notarial act performed in Ohio. Under Ohio Revised Code (ORC) §147.55, an acknowledgment is a declaration by a signer—made before a notary public—that the signer has executed a document voluntarily and for its intended purpose. The signer does NOT need to sign in the notary's presence; they must only acknowledge that the signature on the document is theirs and was made willingly.

## When to Use an Acknowledgment

Use an acknowledgment certificate when:

- **Real estate documents**: Deeds, mortgages, easements, and property transfers almost always require acknowledgment. Ohio county recorders mandate notarized acknowledgments for recording.
- **Powers of Attorney**: Both durable and healthcare POAs under ORC §1337 benefit from acknowledged signatures to ensure enforceability.
- **Business formation documents**: Articles of incorporation, operating agreements, and corporate resolutions often specify acknowledged signatures.
- **Estate planning documents**: Trusts, beneficiary designations, and transfer-on-death instruments.
- **Financial instruments**: Loan documents, promissory notes, and security agreements when the lender requires acknowledged signatures.

## Statutory Language (ORC §147.55)

Ohio law requires the following elements in a valid acknowledgment certificate:

1. **Venue**: The state and county where the notarization occurs.
2. **Date**: The exact date of the notarial act.
3. **Signer identification**: Statement that the signer appeared before the notary and was identified through satisfactory evidence.
4. **Voluntary execution**: Statement that the signer acknowledged executing the document willingly.
5. **Notary signature block**: Notary's printed name, signature, commission expiration date, and official seal.

### Sample Ohio Acknowledgment Certificate

**State of Ohio, County of [County]**

On this [day] day of [month], [year], before me, [Notary Name], a Notary Public in and for said state, personally appeared [Signer Name], known to me (or proved to me on the basis of satisfactory evidence) to be the person whose name is subscribed to the within instrument, and acknowledged to me that [he/she/they] executed the same for the purposes therein contained.

In witness whereof, I have hereunto set my hand and official seal.

[Notary Signature]
[Notary Name], Notary Public, State of Ohio
My Commission Expires: [Date]

## Common Pitfalls & What to Watch For

- **Signer must appear personally**: Ohio law requires the signer to be physically present (or virtually present for RON sessions). Never notarize a document for someone who is not before you.
- **Cannot notarize your own signature**: ORC §147.141 prohibits a notary from performing a notarial act if the notary is a party to or has a direct beneficial interest in the transaction.
- **Verify identity carefully**: Accept only valid, current government-issued photo identification. Expired IDs are NOT acceptable under Ohio law.
- **Corporate acknowledgments**: When a signer acts in a representative capacity (e.g., CEO signing for a corporation), the certificate must reflect the capacity: "personally appeared [Name], as [Title] of [Entity], and acknowledged..."
- **Representative capacity**: For agents under a power of attorney, the certificate must identify both the agent and the principal.
- **Do not advise on content**: The notary cannot explain, interpret, or advise on the legal effect of the document (UPL prohibition under ORC §147.01).
- **Date accuracy**: The date on the certificate must match the date the signer appeared, not the date the document was originally signed.
- **Incomplete documents**: Never notarize a document with blank spaces intended to be filled in later.

## Special Circumstances

**Multiple signers**: Each signer needs their own acknowledgment unless the certificate specifically names all signers.

**Signers who cannot write**: If a signer cannot sign their name, they may make a mark (X) in the presence of the notary, and the notary should note "Signer made mark in my presence" on the certificate.

**Foreign language documents**: Ohio notaries may notarize foreign language documents but must be able to communicate directly with the signer. The certificate itself should be in English.
`,
  },
  {
    id: "jurat",
    title: "Ohio Jurat Certificate",
    icon: Scale,
    category: "Primary Act",
    content: `
## Overview

A jurat (also called a "verification upon oath or affirmation") is a notarial act in which the signer must both sign the document AND take an oath or affirmation in the notary's presence. This is a critical distinction from an acknowledgment—with a jurat, the notary witnesses the actual signing and administers an oath attesting to the truthfulness of the document's contents. Ohio Revised Code §147.542 governs jurat requirements.

## When to Use a Jurat

Use a jurat certificate when:

- **Affidavits**: Any sworn statement or affidavit requires a jurat because the signer is swearing to the truth of the contents under penalty of perjury.
- **Depositions**: Legal testimony transcripts that must be sworn.
- **Financial disclosures**: Tax returns, financial statements submitted under oath.
- **Court filings**: Verified complaints, petitions, and motions that require sworn statements.
- **Insurance claims**: Sworn proof-of-loss statements and claims affidavits.
- **Government forms**: Immigration applications (USCIS), benefit applications, and other federal/state forms specifying "subscribed and sworn."
- **Applications and petitions**: Any document requiring the signer to attest under oath or affirmation.

## Key Differences from Acknowledgment

| Feature | Acknowledgment | Jurat |
|---------|---------------|-------|
| Signing location | Can sign before appearing | Must sign in notary's presence |
| Oath required | No | Yes — mandatory |
| Truthfulness of content | Not attested | Signer swears content is true |
| Typical documents | Deeds, POAs | Affidavits, sworn statements |

## Statutory Language & Sample

### Administering the Oath

The notary MUST administer an oath or affirmation before the signer signs. Common Ohio oath:

**"Do you solemnly swear (or affirm) that the statements contained in this document are true and correct to the best of your knowledge and belief, so help you God?"**

For affirmation (non-religious alternative):
**"Do you solemnly affirm, under penalty of perjury, that the statements in this document are true and correct to the best of your knowledge?"**

### Sample Ohio Jurat Certificate

**State of Ohio, County of [County]**

Subscribed and sworn to (or affirmed) before me on this [day] day of [month], [year], by [Signer Name], who is personally known to me or who has produced [type of identification] as identification.

[Notary Signature]
[Notary Name], Notary Public, State of Ohio
My Commission Expires: [Date]

## Common Pitfalls & What to Watch For

- **Signer MUST sign in your presence**: Unlike an acknowledgment, you must witness the actual signing. If the document is already signed, the signer must re-sign or initial in your presence.
- **Oath is mandatory**: Forgetting to administer the oath invalidates the jurat. Always ask the signer to raise their right hand and administer the oath BEFORE they sign.
- **Do not paraphrase the oath**: Use the statutory language or a close equivalent. A casual "Is this true?" is insufficient.
- **Record the oath type**: Note whether an oath or affirmation was used in your notary journal.
- **Pre-signed documents**: If a document arrives already signed and requires a jurat, the signer must either sign again in your presence or you must use an acknowledgment instead (if the document allows it).
- **Signer must understand**: The signer must understand what they are swearing to. If they indicate they have not read the document, advise them to do so (without interpreting it for them).
- **Document type mismatch**: If a document contains jurat language ("subscribed and sworn") but the client wants an acknowledgment, do NOT change the certificate type without the document preparer's approval.
- **Blank spaces**: Never allow a signer to take an oath on a document with unfilled blanks that could be completed later.

## Special Circumstances

**Religious objections**: Some signers object to the word "swear" or "so help you God." Always offer the affirmation alternative — it carries the same legal weight under Ohio law.

**Signer refuses the oath**: If the signer refuses to take an oath or affirmation, you cannot complete the jurat. The notarization must be refused and documented in your journal.

**Multiple oaths**: Each signer in a multi-signer jurat must individually take the oath. Group oaths are permissible only if each signer verbally affirms.
`,
  },
  {
    id: "copy-certification",
    title: "Ohio Copy Certification by Notary",
    icon: FileText,
    category: "Secondary Act",
    content: `
## Overview

A copy certification is a notarial act in which the notary certifies that a photocopy or reproduction of an original document is a true, exact, and complete copy. Under Ohio Revised Code §147.542, notaries are authorized to certify copies of documents, but there are strict limitations on which documents a notary may certify. Understanding these restrictions is critical for Ohio compliance.

## When to Use Copy Certification

Use a copy certification when:

- **Personal documents**: Diplomas, transcripts (non-vital), professional licenses, military records (DD-214), passports, and immigration documents.
- **Business records**: Contracts, meeting minutes, corporate charters, and organizational documents that need certified copies for filing or submission.
- **Legal correspondence**: Letters, notices, and communications that require authenticated copies.
- **Medical records**: Non-vital health records, insurance cards, and vaccination records (not birth/death certificates).
- **Academic records**: Degrees, certifications, and continuing education certificates.
- **Foreign document submissions**: When USCIS, embassies, or consulates require certified copies of original documents.

## Prohibited Documents — Vital Records

**CRITICAL**: Ohio notaries CANNOT certify copies of vital records. This is one of the most common compliance violations. The following documents must be certified ONLY by the issuing authority:

- **Birth certificates** — Must be obtained from Ohio Department of Health or county health department
- **Death certificates** — Same as above
- **Marriage certificates** — Obtained from the Probate Court that issued the license
- **Divorce decrees** — Obtained from the issuing court

Attempting to certify a vital record is a violation of Ohio law and can result in commission revocation, fines, and civil liability.

## Proper Procedure

1. **Examine the original**: The signer must present the original document. You cannot certify a copy from another copy.
2. **Make the copy**: Ideally, the notary should make the photocopy to ensure it is complete and accurate. If the requester provides the copy, carefully compare it page-by-page against the original.
3. **Compare thoroughly**: Verify that every page of the copy matches the original — check for missing pages, redactions, or alterations.
4. **Attach the certificate**: Apply the copy certification certificate to the copy, NOT to the original.
5. **Apply seal and signature**: Sign, date, and affix your official notary seal.

### Sample Ohio Copy Certification Certificate

**State of Ohio, County of [County]**

I, [Notary Name], a Notary Public in and for the State of Ohio, do hereby certify that the attached [number of pages]-page document is a true, exact, and complete copy of the original document presented to me by [Requester Name] on [date].

In witness whereof, I have hereunto set my hand and official seal on this [day] day of [month], [year].

[Notary Signature]
[Notary Name], Notary Public, State of Ohio
My Commission Expires: [Date]

## Common Pitfalls & What to Watch For

- **Vital records prohibition**: This bears repeating — NEVER certify birth certificates, death certificates, marriage licenses, or divorce decrees. Direct requesters to the issuing agency.
- **Copy from a copy**: Always work from the original document. A copy of a copy cannot be reliably certified.
- **Partial copies**: If only certain pages are needed, clearly state in the certificate which pages were copied and that they are true copies of those specific pages.
- **Altered documents**: If you detect signs of tampering, white-out, or unauthorized alterations on the original, refuse the certification and document your refusal.
- **Digital documents**: You may certify a printout of a digital document if the requester can demonstrate it is the current, unaltered version.
- **Multi-page documents**: Number each page ("Page X of Y") and initial each page for additional security.

## Special Circumstances

**Passport copy certifications**: Very common for immigration and visa applications. Ensure you copy ALL relevant pages (not just the photo page) if requested.

**Documents in foreign languages**: You may certify a copy of a foreign language document — you are certifying the accuracy of the copy, not translating or interpreting the content.

**Certified mail and courier**: Copy certifications for documents being sent internationally should note the number of pages to prevent page substitution during transit.
`,
  },
  {
    id: "signature-witnessing",
    title: "Ohio Signature Witnessing",
    icon: PenTool,
    category: "Secondary Act",
    content: `
## Overview

Signature witnessing is a notarial act in which the notary public observes an individual signing a document but does not administer an oath or affirmation, and the signer does not make any acknowledgment about the document's purpose. The notary simply certifies that the named person signed the document in the notary's presence. This act is authorized under Ohio Revised Code §147.542 and is distinct from both acknowledgments and jurats.

## When to Use Signature Witnessing

Use signature witnessing when:

- **Documents requiring witnessed signatures**: Some contracts, agreements, and organizational documents specify that signatures must be "witnessed" rather than "notarized" in the traditional sense.
- **Consent forms**: Medical consent forms, research participation agreements, and institutional forms that require a witness signature.
- **Financial documents**: Certain banking and insurance forms that require a witnessed signature.
- **Employment documents**: Non-compete agreements, separation agreements, and employee acknowledgment forms.
- **Personal correspondence**: Letters, declarations, and personal statements that need a witnessed signature but no oath.
- **International documents**: Some foreign jurisdictions accept or require witnessed signatures rather than full notarizations.

## Key Characteristics

- **No oath or affirmation**: Unlike a jurat, the notary does NOT administer an oath.
- **No acknowledgment**: Unlike an acknowledgment, the signer does NOT declare the purpose or voluntariness of the document.
- **Notary witnesses signing**: The notary physically observes the signer writing their signature on the document.
- **Identity verification still required**: Even though no oath is given, the notary must still verify the signer's identity through acceptable identification.

## Proper Procedure

1. **Verify identity**: Check the signer's valid, current government-issued photo identification.
2. **Confirm the signer has NOT yet signed**: The document must be unsigned when presented.
3. **Observe the signing**: Watch the signer execute their signature on the document.
4. **Complete the certificate**: Attach or complete the signature witnessing certificate.
5. **Apply seal and signature**: Sign, date, and affix your official notary seal.
6. **Record in journal**: Document the act in your notary journal with all required details.

### Sample Ohio Signature Witnessing Certificate

**State of Ohio, County of [County]**

On this [day] day of [month], [year], before me, [Notary Name], a Notary Public in and for the State of Ohio, personally appeared [Signer Name], known to me (or identified through satisfactory evidence) to be the person whose name is subscribed to the within instrument, and I witnessed the signing of this document.

[Notary Signature]
[Notary Name], Notary Public, State of Ohio
My Commission Expires: [Date]

## Common Pitfalls & What to Watch For

- **Pre-signed documents**: If the document is already signed when presented, you cannot perform a signature witnessing. The options are: (a) have the signer cross out and re-sign, (b) use an acknowledgment instead, or (c) have a new document prepared.
- **Confusion with acknowledgment**: Many people confuse witnessing with acknowledgment. Clarify with the requester which act is needed. If the document says "acknowledged before me," use an acknowledgment certificate.
- **Witness vs. notary witness**: Being a "witness" and performing a "notarial signature witnessing" are different. A lay witness does not need a commission; a notarial witness performs an official act with their seal.
- **Multiple signers**: Each signer must individually sign in your presence. You cannot witness one signing and assume others were genuine.
- **Venue accuracy**: Record the actual location where you witnessed the signature, not where the document was prepared or will be filed.
- **Rushed signers**: Do not allow signers to rush through the process. Ensure they are signing deliberately and voluntarily.

## Special Circumstances

**Wills and testamentary documents**: Ohio Wills under ORC §2107.03 require TWO competent witnesses in addition to the testator's signature. A notary can serve as one of the witnesses, but the notarial act is separate from the witness requirement. The notary's role as a notarial witness and their role as a statutory witness to a will are distinct.

**Hospital and care facility signings**: When witnessing signatures in healthcare settings, ensure the signer is mentally competent and not under duress or undue influence from staff or family members.

**Signing by mark**: If the signer makes a mark instead of a written signature, note this on the certificate and ensure the mark was made voluntarily.
`,
  },
  {
    id: "ron-modifications",
    title: "RON-Specific Certificate Modifications",
    icon: Shield,
    category: "Digital & RON",
    content: `
## Overview

Remote Online Notarization (RON) sessions in Ohio require specific modifications to standard notarial certificates. Under Ohio Revised Code §147.60–147.66, all RON certificates must include additional elements that identify the session as a remote notarization, document the technology platform used, and comply with electronic signature and seal requirements. These modifications apply to ALL notarial acts performed via RON — acknowledgments, jurats, copy certifications, and signature witnessing.

## Mandatory RON Certificate Elements

Every RON certificate in Ohio must include the following elements beyond the standard in-person requirements:

1. **Remote notarization statement**: A clear statement that the notarial act was performed using communication technology (audio-visual).
2. **Technology platform identification**: The name of the RON platform used (e.g., "Notarize," "Nexsys CLOSEsmart," "OneNotary").
3. **Electronic seal**: The notary's electronic seal must meet Ohio requirements — it must be tamper-evident, uniquely linked to the notary, and include the notary's name, commission number, commission expiration, and the state of Ohio.
4. **Session recording reference**: While the recording itself is stored separately, the certificate should note that the session was recorded per ORC §147.63.
5. **KBA verification statement**: The certificate must note that the signer's identity was verified through knowledge-based authentication (KBA) and credential analysis.
6. **Signer location**: The physical location (state/country) of the signer at the time of the RON session.

## Modified Certificate Language

### RON Acknowledgment Addition

Add the following to the standard acknowledgment certificate:

*"This notarial act involved a remote online notarization performed in accordance with Ohio Revised Code §147.60–147.66. The signer appeared before me by means of audio-visual communication technology via [Platform Name]. Identity was verified through credential analysis and knowledge-based authentication. The signer was located in [State/Country] at the time of this act. This session was recorded and will be retained for a minimum of 10 years per ORC §147.63."*

### RON Jurat Addition

Add the following to the standard jurat certificate:

*"This oath/affirmation was administered and the document was signed during a remote online notarization session conducted via [Platform Name] in compliance with ORC §147.60–147.66. Signer identity confirmed through KBA and credential analysis. Signer location: [State/Country]. Session recorded per statutory requirements."*

## Electronic Seal Requirements (ORC §147.542)

The electronic notary seal for RON must:

- Be **tamper-evident** — any modification to the document after sealing must be detectable
- Include the notary's **full legal name** as it appears on the commission
- Include the **commission number** issued by the Ohio Secretary of State
- Include the **commission expiration date**
- Include the words **"State of Ohio"** and **"Notary Public"**
- Be rendered using a **digital certificate** (PKI-based) that links the seal to the notary
- Use **SHA-256 or stronger** hashing algorithm for document integrity verification

## Common Pitfalls & What to Watch For

- **Missing RON statement**: The most common error — failing to add the remote notarization disclosure. Without it, the certificate may be rejected by county recorders or courts.
- **Platform not identified**: Always name the specific platform. "Online" or "video call" is insufficient.
- **Generic video tools**: RON sessions CANNOT be conducted over Zoom, FaceTime, Skype, or other general video conferencing tools. Only approved RON platforms that meet Ohio's technology requirements are permitted.
- **Signer location omitted**: The signer's physical location is a mandatory element. If the signer is outside the United States, additional considerations may apply regarding document acceptance.
- **Recording retention failure**: Ohio requires 10-year retention of RON session recordings. Failure to maintain recordings is a serious compliance violation that can result in commission revocation.
- **KBA failures**: If the signer fails KBA twice, the session MUST be terminated per Ohio law. Do not attempt alternative verification methods.
- **Electronic seal vs. rubber stamp scan**: A scanned image of a physical rubber stamp is NOT an acceptable electronic seal. The seal must be a digital certificate-based seal.
- **Multi-state considerations**: Ohio RON certificates are valid nationwide under the Full Faith and Credit clause, but some states may have additional acceptance requirements. Always check the destination state's requirements.
- **Timestamp accuracy**: Electronic timestamps on RON certificates must be accurate. Ensure your platform's clock is synchronized.

## Special Circumstances

**Out-of-state signers**: Ohio RON notaries can notarize documents for signers located in other states or countries, provided the notary follows Ohio law. The signer's location must be documented.

**Technical failures**: If audio or video connection is lost during a RON session, the session must be terminated and restarted. Partial sessions cannot produce valid certificates.

**Multi-document sessions**: When notarizing multiple documents in a single RON session, each document needs its own certificate with the RON modifications. The recording covers the entire session.

**Credential analysis**: In addition to KBA, RON requires credential analysis — the digital verification of the signer's government-issued ID through the RON platform's identity proofing system. This is separate from visually checking an ID.
`,
  },
  {
    id: "protest",
    title: "Ohio Protest Certificate (Commercial Paper)",
    icon: BookOpen,
    category: "Specialized Act",
    content: `
## Overview

A protest certificate is a specialized and rarely used notarial act related to commercial paper instruments under the Uniform Commercial Code (UCC). Under Ohio Revised Code §1303.68, a notary public may issue a certificate of protest when a negotiable instrument (such as a check, promissory note, or draft) has been dishonored — meaning the party responsible for payment has refused to pay or the instrument has been returned unpaid.

While protests were historically significant in commercial law, they have become increasingly rare in modern practice due to changes in banking procedures and the UCC's relaxation of protest requirements for domestic instruments. However, they remain relevant for **international commercial transactions** governed by foreign law, and Ohio notaries should understand the procedure.

## When to Use a Protest Certificate

Use a protest certificate when:

- **International drafts and bills of exchange**: Foreign jurisdictions may still require formal protest of dishonored instruments as a condition for the holder to preserve their right to recover against endorsers and drawers.
- **Dishonored promissory notes**: When a maker fails to pay a promissory note at maturity, and formal protest is requested by the holder (typically for legal proceedings).
- **Returned checks**: In rare cases, a holder may request a formal protest of a dishonored check, particularly in commercial contexts involving large sums.
- **Foreign law requirements**: When the instrument is governed by the law of a country that requires protest as a condition precedent to legal action against secondary parties.
- **Demand instruments**: When demand for payment has been made and refused, and the holder wishes to create a formal record.

## Proper Procedure

1. **Receive the instrument**: The holder of the dishonored instrument presents it to the notary along with evidence of dishonor (returned check notice, bank statement showing non-payment, etc.).
2. **Present for payment (re-presentment)**: If requested, the notary may formally present the instrument to the drawee/maker for payment. This step may be waived if payment has already been refused.
3. **Record dishonor**: Document the dishonor — the fact that payment was demanded and refused, or that the instrument was returned unpaid.
4. **Prepare the protest certificate**: Draft the certificate including all required elements (see below).
5. **Give notice**: After protesting, notice of dishonor must be given to all secondary parties (endorsers, drawers) within the time frame specified by the UCC.
6. **Record in journal**: Document the protest in your notary journal with full details.

### Sample Ohio Protest Certificate

**CERTIFICATE OF PROTEST**

**State of Ohio, County of [County]**

I, [Notary Name], a Notary Public duly commissioned in the State of Ohio, do hereby certify that:

On this [day] day of [month], [year], the following described instrument was presented to me by [Holder Name] for protest:

**Instrument Type**: [Check/Promissory Note/Draft/Bill of Exchange]
**Date of Instrument**: [Date]
**Amount**: $[Amount]
**Maker/Drawer**: [Name]
**Payee**: [Name]
**Drawee/Bank**: [Name]

The said instrument was duly presented for payment to [Drawee Name] at [Location] on [Date], and payment was refused/the instrument was returned dishonored, with the reason stated as: [Reason for Dishonor, e.g., "Insufficient Funds," "Account Closed," "Payment Stopped"].

I do hereby formally PROTEST said instrument for non-payment and declare that the holder and all prior parties are entitled to all rights and remedies provided by law.

Notice of this protest has been/will be sent to all endorsers and other secondary parties.

In witness whereof, I have hereunto set my hand and official seal.

[Notary Signature]
[Notary Name], Notary Public, State of Ohio
My Commission Expires: [Date]

## Common Pitfalls & What to Watch For

- **Rarity of use**: Most notaries will never be asked to protest an instrument. If you receive such a request, take extra care to research current UCC requirements.
- **Time sensitivity**: Protest must be made on the day of dishonor or the next business day. Delays can waive the holder's rights against secondary parties.
- **Notice requirements**: After protest, notice of dishonor must be sent to all endorsers and secondary parties within 30 days (UCC §3-503). Failure to give notice can discharge secondary parties from liability.
- **Domestic vs. international**: For domestic instruments (within the United States), protest is generally NOT required to preserve the holder's rights against endorsers. It IS commonly required for international instruments.
- **Do not interpret the instrument**: The notary's role is ministerial — record the dishonor and issue the certificate. Do not advise on legal rights or remedies.
- **Fee considerations**: Ohio does not have a specific statutory fee for protests. Negotiate a reasonable fee that reflects the complexity and urgency of the act.

## Special Circumstances

**Electronic presentment**: Modern banking may involve electronic presentment and return of instruments. The notary should document the method of presentment and dishonor, whether physical or electronic.

**Multiple dishonors**: If an instrument has been protested previously and is presented again, a new protest certificate should be issued for each instance of dishonor.

**Waiver of protest**: Many modern negotiable instruments include a "protest waived" clause. If the instrument contains such language, inform the holder that protest may not be legally required, though they may still choose to have one issued for evidentiary purposes.
`,
  },
];

export default function NotaryCertificates() {
  usePageMeta({
    title: "Ohio Notarial Certificates Guide",
    description: "Comprehensive Ohio notarial certificate reference — Acknowledgments, Jurats, Copy Certifications, Signature Witnessing, RON modifications, and Protest Certificates with ORC citations.",
  });

  const [activeTab, setActiveTab] = useState("acknowledgment");
  const printRef = useRef<HTMLDivElement>(null);

  const handleDownloadPDF = () => {
    window.print();
  };

  const activeCert = certificates.find((c) => c.id === activeTab);

  return (
    <PageShell>
      <div className="container mx-auto max-w-6xl px-4 py-12">
        <Breadcrumbs />
        <div className="mb-8">
          <h1 className="mb-3 font-sans text-3xl font-bold text-foreground">Ohio Notarial Certificates Guide</h1>
          <p className="max-w-3xl text-muted-foreground">
            Comprehensive reference for each type of notarial certificate recognized under Ohio law.
            Includes statutory language, sample formats, common pitfalls, and special circumstances per ORC §147.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          {/* Sidebar nav */}
          <div className="space-y-2">
            {certificates.map((cert) => (
              <button
                key={cert.id}
                onClick={() => setActiveTab(cert.id)}
                className={`w-full flex items-center gap-3 rounded-lg p-3 text-left text-sm transition-colors ${
                  activeTab === cert.id
                    ? "bg-primary/10 text-primary border border-primary/20"
                    : "hover:bg-muted border border-transparent"
                }`}
              >
                <cert.icon className="h-4 w-4 flex-shrink-0" />
                <div>
                  <p className="font-medium">{cert.title.replace("Ohio ", "")}</p>
                  <p className="text-xs text-muted-foreground">{cert.category}</p>
                </div>
              </button>
            ))}
          </div>

          {/* Content */}
          <div>
            {activeCert && (
              <Card className="border-border/50">
                <CardContent className="p-6 md:p-8">
                  <div className="mb-6 flex items-center justify-between print:hidden">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <activeCert.icon className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h2 className="font-sans text-xl font-bold">{activeCert.title}</h2>
                        <Badge variant="outline">{activeCert.category}</Badge>
                      </div>
                    </div>
                    <Button variant="outline" size="sm" onClick={handleDownloadPDF}>
                      <Download className="mr-2 h-4 w-4" /> Download PDF
                    </Button>
                  </div>

                  {/* Example Document Image */}
                  {(() => {
                    const anatomyKey = activeCert.id === "acknowledgment" ? "acknowledgment" : activeCert.id === "jurat" ? "jurat" : activeCert.id === "copy-certification" ? "copy_certification" : activeCert.id === "poa" ? "poa" : activeCert.id === "corporate" ? "corporate" : activeCert.id === "signature-by-mark" ? "signature_by_mark" : null;
                    const anatomy = anatomyKey ? DOCUMENT_ANATOMY[anatomyKey] : null;
                    if (!anatomy) return null;
                    return (
                      <div className="mb-6 rounded-lg border border-border/50 overflow-hidden">
                        <div className="bg-muted/30 px-4 py-2 flex items-center gap-2 text-sm font-medium">
                          <Image className="h-4 w-4 text-primary" /> Example Document
                        </div>
                        <img src={anatomy.image} alt={`${activeCert.title} example`} className="w-full max-w-md mx-auto" loading="lazy" />
                      </div>
                    );
                  })()}

                  <div ref={printRef} className="certificate-content prose prose-sm dark:prose-invert max-w-none">
                    {/* Render markdown-like content as structured HTML */}
                    {(() => {
                      const lines = activeCert.content.split("\n");
                      const elements: React.ReactNode[] = [];
                      let i = 0;
                      while (i < lines.length) {
                        const trimmed = lines[i].trim();
                        // Collect consecutive table rows
                        if (trimmed.startsWith("|")) {
                          const tableLines: string[] = [];
                          while (i < lines.length && lines[i].trim().startsWith("|")) {
                            tableLines.push(lines[i].trim());
                            i++;
                          }
                          // Parse: first line = header, second = separator (skip), rest = body
                          const parseRow = (row: string) => row.split("|").filter((_, idx, arr) => idx > 0 && idx < arr.length - 1).map(c => c.trim());
                          const headerCells = parseRow(tableLines[0]);
                          const bodyRows = tableLines.slice(2).map(parseRow); // skip separator row
                          elements.push(
                            <div key={`table-${i}`} className="my-4 overflow-x-auto rounded-lg border border-border">
                              <table className="w-full text-sm">
                                <thead><tr className="bg-muted/50">{headerCells.map((h, hi) => <th key={hi} className="px-3 py-2 text-left font-semibold text-foreground">{h}</th>)}</tr></thead>
                                <tbody>{bodyRows.map((row, ri) => <tr key={ri} className="border-t border-border">{row.map((cell, ci) => <td key={ci} className="px-3 py-2 text-muted-foreground">{cell}</td>)}</tr>)}</tbody>
                              </table>
                            </div>
                          );
                          continue;
                        }
                        if (!trimmed) { elements.push(<br key={i} />); i++; continue; }
                        if (trimmed.startsWith("## ")) { elements.push(<h2 key={i} className="mt-6 mb-3 text-lg font-bold text-foreground">{trimmed.slice(3)}</h2>); i++; continue; }
                        if (trimmed.startsWith("### ")) { elements.push(<h3 key={i} className="mt-4 mb-2 text-base font-semibold text-foreground">{trimmed.slice(4)}</h3>); i++; continue; }
                        if (trimmed.startsWith("- **")) {
                          const match = trimmed.match(/^- \*\*(.+?)\*\*:?\s*(.*)/);
                          if (match) { elements.push(<div key={i} className="flex gap-2 my-1 ml-4"><AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0 text-primary" /><p className="text-sm"><strong className="text-foreground">{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}</p></div>); i++; continue; }
                        }
                        if (trimmed.startsWith("- ")) { elements.push(<div key={i} className="flex gap-2 my-1 ml-4"><span className="text-primary mt-1">•</span><p className="text-sm text-foreground">{trimmed.slice(2)}</p></div>); i++; continue; }
                        if (/^[1-6]\. /.test(trimmed)) {
                          const num = trimmed.charAt(0);
                          elements.push(<div key={i} className="flex gap-2 my-1 ml-4"><span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary flex-shrink-0">{num}</span><p className="text-sm text-foreground">{trimmed.slice(3)}</p></div>);
                          i++; continue;
                        }
                        if (trimmed.startsWith("**") && trimmed.endsWith("**")) { elements.push(<p key={i} className="my-2 font-semibold text-foreground">{trimmed.slice(2, -2)}</p>); i++; continue; }
                        if (trimmed.startsWith("*\"") || trimmed.startsWith("*\u201C")) { elements.push(<blockquote key={i} className="border-l-4 border-primary/30 pl-4 my-3 italic text-sm text-muted-foreground">{trimmed.replace(/^\*"?/g, "").replace(/"?\*$/g, "").replace(/[\u201C\u201D]/g, '"')}</blockquote>); i++; continue; }
                        elements.push(<p key={i} className="my-2 text-sm text-foreground/90">{trimmed}</p>);
                        i++;
                      }
                      return elements;
                    })()}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          nav, footer, .print\\:hidden, button, header, [data-radix-scroll-area-viewport] { display: none !important; }
          .certificate-content { font-size: 11pt; max-width: 100%; }
          body { background: white; }
        }
      `}</style>
    </PageShell>
  );
}
