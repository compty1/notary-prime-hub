import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Info, Globe } from "lucide-react";
import {
  HAGUE_COUNTRIES, USCIS_FORMS, COMMON_LANGUAGES, TRANSLATION_DOC_TYPES,
  DIGITAL_ONLY_SERVICES,
} from "./bookingConstants";

interface IntakeFieldsProps {
  serviceType: string;
  currentCategory: string;
  serviceCategories: Record<string, string>;
  // Apostille
  destinationCountry: string; setDestinationCountry: (v: string) => void;
  urgencyLevel: string; setUrgencyLevel: (v: string) => void;
  // Immigration
  uscisForm: string; setUscisForm: (v: string) => void;
  caseType: string; setCaseType: (v: string) => void;
  // Real Estate
  propertyAddress: string; setPropertyAddress: (v: string) => void;
  titleCompany: string; setTitleCompany: (v: string) => void;
  // Employer / I-9
  employerName: string; setEmployerName: (v: string) => void;
  hireStartDate: string; setHireStartDate: (v: string) => void;
  // Business
  companyName: string; setCompanyName: (v: string) => void;
  // RON onboarding
  clientState: string; setClientState: (v: string) => void;
  notes: string; setNotes: (v: string | ((prev: string) => string)) => void;
  // Translation
  sourceLanguage: string; setSourceLanguage: (v: string) => void;
  targetLanguage: string; setTargetLanguage: (v: string) => void;
  translationDocType: string; setTranslationDocType: (v: string) => void;
  translationPageCount: string; setTranslationPageCount: (v: string) => void;
  // Witness
  witnessCount: string; setWitnessCount: (v: string) => void;
  witnessMode: "in_person" | "virtual"; setWitnessMode: (v: "in_person" | "virtual") => void;
  witnessDocType: string; setWitnessDocType: (v: string) => void;
  // Certified copy
  certifiedDocName: string; setCertifiedDocName: (v: string) => void;
  issuingAuthority: string; setIssuingAuthority: (v: string) => void;
  copyCount: string; setCopyCount: (v: string) => void;
  // Employment onboarding
  employeeCount: string; setEmployeeCount: (v: string) => void;
  hrContact: string; setHrContact: (v: string) => void;
  docsPerEmployee: string; setDocsPerEmployee: (v: string) => void;
  // Custom workflow
  currentTools: string; setCurrentTools: (v: string) => void;
  teamSize: string; setTeamSize: (v: string) => void;
  budgetRange: string; setBudgetRange: (v: string) => void;
  // Bulk
  monthlyVolume: string; setMonthlyVolume: (v: string) => void;
  bulkDocTypes: string; setBulkDocTypes: (v: string) => void;
  schedulePreference: string; setSchedulePreference: (v: string) => void;
  // Scanning
  scanningMode: "digital" | "physical"; setScanningMode: (v: "digital" | "physical") => void;
  // Phase 12: Signer capacity & facility
  signerCapacity: string; setSignerCapacity: (v: string) => void;
  entityName: string; setEntityName: (v: string) => void;
  signerTitle: string; setSignerTitle: (v: string) => void;
  facilityName: string; setFacilityName: (v: string) => void;
  facilityContact: string; setFacilityContact: (v: string) => void;
  facilityRoom: string; setFacilityRoom: (v: string) => void;
  signerCount: number; setSignerCount: (v: number) => void;
  // Apostille toggle for notarization categories
  needsApostille?: boolean; setNeedsApostille?: (v: boolean) => void;
}

export default function BookingIntakeFields(props: IntakeFieldsProps) {
  const { serviceType, currentCategory: cat, serviceCategories } = props;
  if (!serviceType) return null;

  const svcLower = serviceType.toLowerCase();
  if (cat === "business_services") return null;

  const showApostille = cat === "authentication" || svcLower.includes("apostille");
  const showImmigration = cat === "consulting" && (svcLower.includes("immigration") || svcLower.includes("uscis"));
  const showRealEstate = svcLower.includes("real estate") || svcLower.includes("closing");
  const showI9 = svcLower.includes("i-9") || svcLower.includes("employment verification");
  const showBusiness = cat === "business" && !DIGITAL_ONLY_SERVICES.has(serviceType);
  const showRonOnboarding = svcLower.includes("ron onboarding");
  const showWorkflow = svcLower.includes("workflow") && !svcLower.includes("ron");
  const showTranslation = svcLower.includes("translation");
  const showWitness = svcLower.includes("witness");
  const showCertifiedCopy = svcLower.includes("certified copy");
  const showOnboarding = svcLower.includes("employment onboarding") || svcLower.includes("onboarding support");
  const showCustomWorkflow = svcLower.includes("custom workflow");
  const showBulk = svcLower.includes("bulk");
  const showScanning = svcLower.includes("scanning") || svcLower.includes("digitization");
  // Phase 12: facility signings
  const showFacility = svcLower.includes("hospital") || svcLower.includes("jail") || svcLower.includes("facility") || svcLower.includes("care");
  // Phase 12: witness logic gate — show for docs that typically need witnesses
  const showWitnessGate = !showWitness && (svcLower.includes("will") || svcLower.includes("estate") || svcLower.includes("trust") || svcLower.includes("deed"));

  // Always show signer capacity for notarization category
  const showSignerCapacity = cat === "notarization" || cat === "authentication";

  if (!showApostille && !showImmigration && !showRealEstate && !showI9 && !showBusiness && !showRonOnboarding && !showWorkflow && !showTranslation && !showWitness && !showCertifiedCopy && !showOnboarding && !showCustomWorkflow && !showBulk && !showScanning && !showFacility && !showSignerCapacity && !showWitnessGate) return null;

  return (
    <div className="space-y-3 rounded-lg border border-border/50 bg-muted/30 p-4">
      <p className="text-sm font-medium flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Service-Specific Details</p>

      {showApostille && (
        <>
          <div>
            <Label>Destination Country</Label>
            <Select value={props.destinationCountry} onValueChange={props.setDestinationCountry}>
              <SelectTrigger><SelectValue placeholder="Select country..." /></SelectTrigger>
              <SelectContent>
                {HAGUE_COUNTRIES.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                <SelectItem value="Other">Other (Non-Hague)</SelectItem>
              </SelectContent>
            </Select>
            {props.destinationCountry && (
              <p className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {HAGUE_COUNTRIES.includes(props.destinationCountry) ? "✓ Hague Convention member — Apostille accepted" : "⚠ Non-Hague country — consular legalization may be required"}
              </p>
            )}
          </div>
          <div>
            <Label>Urgency</Label>
            <Select value={props.urgencyLevel} onValueChange={props.setUrgencyLevel}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard (5-10 business days)</SelectItem>
                <SelectItem value="rush">Rush (2-3 business days, +$50)</SelectItem>
                <SelectItem value="same_day">Same Day (if available, +$100)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {showImmigration && (
        <>
          <div>
            <Label>USCIS Form Number</Label>
            <Select value={props.uscisForm} onValueChange={props.setUscisForm}>
              <SelectTrigger><SelectValue placeholder="Select form..." /></SelectTrigger>
              <SelectContent>{USCIS_FORMS.map(f => <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div>
            <Label>Case Type</Label>
            <Select value={props.caseType} onValueChange={props.setCaseType}>
              <SelectTrigger><SelectValue placeholder="Select case type..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Family">Family-Based</SelectItem>
                <SelectItem value="Employment">Employment-Based</SelectItem>
                <SelectItem value="Humanitarian">Humanitarian</SelectItem>
                <SelectItem value="Naturalization">Naturalization</SelectItem>
                <SelectItem value="Other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {showRealEstate && (
        <>
          <div><Label>Property Address</Label><Input value={props.propertyAddress} onChange={e => props.setPropertyAddress(e.target.value)} placeholder="Address of the property" /></div>
          <div><Label>Title Company (if applicable)</Label><Input value={props.titleCompany} onChange={e => props.setTitleCompany(e.target.value)} placeholder="Title company name" /></div>
        </>
      )}

      {showI9 && (
        <>
          <div><Label>Employer Name</Label><Input value={props.employerName} onChange={e => props.setEmployerName(e.target.value)} placeholder="Hiring company name" /></div>
          <div><Label>New Hire Start Date</Label><Input type="date" value={props.hireStartDate} onChange={e => props.setHireStartDate(e.target.value)} /></div>
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-3 space-y-2">
            <p className="text-xs font-semibold text-blue-900 flex items-center gap-1"><Info className="h-3 w-3" /> Acceptable I-9 Documents — Bring ONE of the following:</p>
            <div className="text-xs text-blue-800 space-y-2">
              <div><p className="font-semibold">List A — Proves Identity AND Work Authorization (need ONE):</p><ul className="ml-4 list-disc text-blue-700"><li>U.S. Passport or Passport Card</li><li>Permanent Resident Card (Green Card)</li><li>Employment Authorization Document (EAD / I-766)</li><li>Foreign passport with I-94 and endorsement</li></ul></div>
              <p className="font-semibold text-blue-900">— OR bring BOTH —</p>
              <div><p className="font-semibold">List B — Proves Identity (need ONE):</p><ul className="ml-4 list-disc text-blue-700"><li>Driver's license or state-issued ID</li><li>School ID with photo</li><li>Voter registration card</li><li>U.S. military card or draft record</li></ul></div>
              <div><p className="font-semibold">PLUS List C — Proves Work Authorization (need ONE):</p><ul className="ml-4 list-disc text-blue-700"><li>Social Security card (unrestricted)</li><li>U.S. birth certificate</li><li>Certification of Birth Abroad (FS-545 or DS-1350)</li></ul></div>
            </div>
          </div>
        </>
      )}

      {showBusiness && <div><Label>Company Name</Label><Input value={props.companyName} onChange={e => props.setCompanyName(e.target.value)} placeholder="Your business name" /></div>}

      {showRonOnboarding && (
        <>
          <div>
            <Label>Current Notary Commission State</Label>
            <Select value={props.clientState} onValueChange={props.setClientState}>
              <SelectTrigger><SelectValue placeholder="Select state..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="OH">Ohio</SelectItem><SelectItem value="IN">Indiana</SelectItem><SelectItem value="KY">Kentucky</SelectItem>
                <SelectItem value="WV">West Virginia</SelectItem><SelectItem value="PA">Pennsylvania</SelectItem><SelectItem value="MI">Michigan</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>RON Platform Experience</Label>
            <Select onValueChange={v => props.setNotes(prev => prev + `\n[RON Experience: ${v}]`)}>
              <SelectTrigger><SelectValue placeholder="Select experience level..." /></SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No experience with RON platforms</SelectItem>
                <SelectItem value="some">Some experience (used 1-2 platforms)</SelectItem>
                <SelectItem value="experienced">Experienced (regular RON user)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </>
      )}

      {showWorkflow && (
        <>
          <div><Label>Current Workflow Description</Label><Textarea placeholder="Describe your current notarization workflow..." rows={3} onChange={e => props.setNotes(prev => prev.replace(/\[Workflow:.*\]/s, "") + `\n[Workflow: ${e.target.value}]`)} /></div>
          <div><Label>Approximate Monthly Transactions</Label><Input type="number" placeholder="e.g., 50" min={0} onChange={e => props.setNotes(prev => prev + `\n[Monthly Volume: ${e.target.value}]`)} /></div>
        </>
      )}

      {showTranslation && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Source Language</Label><Select value={props.sourceLanguage} onValueChange={props.setSourceLanguage}><SelectTrigger><SelectValue placeholder="Original language" /></SelectTrigger><SelectContent>{COMMON_LANGUAGES.map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Target Language *</Label><Select value={props.targetLanguage} onValueChange={props.setTargetLanguage}><SelectTrigger><SelectValue placeholder="Translate to..." /></SelectTrigger><SelectContent>{COMMON_LANGUAGES.filter(l => l !== props.sourceLanguage).map(l => <SelectItem key={l} value={l}>{l}</SelectItem>)}</SelectContent></Select></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Document Type</Label><Select value={props.translationDocType} onValueChange={props.setTranslationDocType}><SelectTrigger><SelectValue placeholder="Select type..." /></SelectTrigger><SelectContent>{TRANSLATION_DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select></div>
            <div><Label>Page Count</Label><Input type="number" min="1" value={props.translationPageCount} onChange={e => props.setTranslationPageCount(e.target.value)} /></div>
          </div>
          <div className="rounded-lg border border-accent/20 bg-primary/5 p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-medium text-foreground">📄 How it works:</p>
            <p>1. Upload your document during booking or in your portal after booking</p>
            <p>2. Our AI translates your document with a Certificate of Translation Accuracy</p>
            <p>3. Review the translated document in your portal</p>
            <p>4. If notarization of the translation is needed, we can schedule that too</p>
          </div>
        </>
      )}

      {showWitness && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Number of Witnesses Needed</Label><Select value={props.witnessCount} onValueChange={props.setWitnessCount}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="1">1 Witness</SelectItem><SelectItem value="2">2 Witnesses</SelectItem></SelectContent></Select></div>
            <div><Label>Witness Mode</Label><Select value={props.witnessMode} onValueChange={v => props.setWitnessMode(v as any)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="in_person">In-Person</SelectItem><SelectItem value="virtual">Virtual (via video)</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Document Type Being Witnessed</Label><Input value={props.witnessDocType} onChange={e => props.setWitnessDocType(e.target.value)} placeholder="e.g. Will, Affidavit, Contract" /></div>
        </>
      )}

      {showCertifiedCopy && (
        <>
          <div><Label>Document Name</Label><Input value={props.certifiedDocName} onChange={e => props.setCertifiedDocName(e.target.value)} placeholder="e.g. Birth Certificate, Diploma" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Issuing Authority</Label><Input value={props.issuingAuthority} onChange={e => props.setIssuingAuthority(e.target.value)} placeholder="e.g. State of Ohio, County Clerk" /></div>
            <div><Label>Number of Copies</Label><Input type="number" min="1" max="20" value={props.copyCount} onChange={e => props.setCopyCount(e.target.value)} /></div>
          </div>
        </>
      )}

      {showOnboarding && (
        <>
          <div className="grid grid-cols-3 gap-3">
            <div><Label>Number of Employees</Label><Input type="number" min="1" value={props.employeeCount} onChange={e => props.setEmployeeCount(e.target.value)} placeholder="e.g. 10" /></div>
            <div><Label>Docs per Employee</Label><Input type="number" min="1" value={props.docsPerEmployee} onChange={e => props.setDocsPerEmployee(e.target.value)} placeholder="e.g. 3" /></div>
            <div><Label>HR Contact</Label><Input value={props.hrContact} onChange={e => props.setHrContact(e.target.value)} placeholder="Name or email" /></div>
          </div>
          <div><Label>Employer Name</Label><Input value={props.employerName} onChange={e => props.setEmployerName(e.target.value)} placeholder="Company name" /></div>
        </>
      )}

      {showCustomWorkflow && (
        <>
          <div><Label>Current Tools / Platforms Used</Label><Input value={props.currentTools} onChange={e => props.setCurrentTools(e.target.value)} placeholder="e.g. DocuSign, Notarize, pen & paper" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Team Size</Label><Select value={props.teamSize} onValueChange={props.setTeamSize}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="1">Solo</SelectItem><SelectItem value="2-5">2–5 people</SelectItem><SelectItem value="6-20">6–20 people</SelectItem><SelectItem value="20+">20+ people</SelectItem></SelectContent></Select></div>
            <div><Label>Budget Range</Label><Select value={props.budgetRange} onValueChange={props.setBudgetRange}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="under_500">Under $500</SelectItem><SelectItem value="500_2000">$500 – $2,000</SelectItem><SelectItem value="2000_5000">$2,000 – $5,000</SelectItem><SelectItem value="5000_plus">$5,000+</SelectItem></SelectContent></Select></div>
          </div>
        </>
      )}

      {showBulk && (
        <>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Estimated Monthly Volume</Label><Input value={props.monthlyVolume} onChange={e => props.setMonthlyVolume(e.target.value)} placeholder="e.g. 50 documents/month" /></div>
            <div><Label>Schedule Preference</Label><Select value={props.schedulePreference} onValueChange={props.setSchedulePreference}><SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger><SelectContent><SelectItem value="weekly">Weekly recurring</SelectItem><SelectItem value="biweekly">Bi-weekly</SelectItem><SelectItem value="monthly">Monthly batch</SelectItem><SelectItem value="on_demand">On demand</SelectItem></SelectContent></Select></div>
          </div>
          <div><Label>Document Types</Label><Input value={props.bulkDocTypes} onChange={e => props.setBulkDocTypes(e.target.value)} placeholder="e.g. Deeds, POAs, Affidavits" /></div>
        </>
      )}

      {showScanning && (
        <div>
          <Label>Document Format</Label>
          <div className="grid grid-cols-2 gap-3 mt-2">
            <button type="button" className={`rounded-lg border p-3 text-sm text-left transition-all ${props.scanningMode === "digital" ? "border-accent bg-primary/10 ring-2 ring-accent" : "border-border hover:border-primary/50"}`} onClick={() => props.setScanningMode("digital")}>
              <p className="font-medium">Digital Files</p><p className="text-xs text-muted-foreground mt-1">I have digital files to convert (PDF, images)</p>
            </button>
            <button type="button" className={`rounded-lg border p-3 text-sm text-left transition-all ${props.scanningMode === "physical" ? "border-accent bg-primary/10 ring-2 ring-accent" : "border-border hover:border-primary/50"}`} onClick={() => props.setScanningMode("physical")}>
              <p className="font-medium">Physical Documents</p><p className="text-xs text-muted-foreground mt-1">I need to bring in or have someone scan paper docs</p>
            </button>
          </div>
          {props.scanningMode === "digital" && (
            <p className="text-xs text-muted-foreground mt-2">💡 For digital files, you can use our <a href="/digitize" className="text-primary underline">Digitize tool</a> directly — no appointment needed!</p>
          )}
        </div>
      )}

      {/* Phase 12: Signer Capacity */}
      {showSignerCapacity && (
        <>
          <div>
            <Label>Signing Capacity</Label>
            <Select value={props.signerCapacity} onValueChange={v => { props.setSignerCapacity(v); if (v === "individual") { props.setEntityName(""); props.setSignerTitle(""); } }}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="individual">Individual</SelectItem>
                <SelectItem value="representative">Authorized Representative</SelectItem>
                <SelectItem value="attorney_in_fact">Attorney-in-Fact (POA)</SelectItem>
                <SelectItem value="corporate_officer">Corporate Officer</SelectItem>
                <SelectItem value="trustee">Trustee</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {props.signerCapacity !== "individual" && (
            <div className="grid grid-cols-2 gap-3">
              <div><Label>Entity / Organization Name</Label><Input value={props.entityName} onChange={e => props.setEntityName(e.target.value)} placeholder="e.g. ABC Corporation" /></div>
              <div><Label>Your Title</Label><Input value={props.signerTitle} onChange={e => props.setSignerTitle(e.target.value)} placeholder="e.g. President, Trustee" /></div>
            </div>
          )}
          <div>
            <Label>Number of Signers</Label>
            <div className="flex items-center gap-2 mt-1">
              {[1, 2, 3, 4].map(n => (
                <button key={n} type="button" className={`h-9 w-9 rounded-md border text-sm font-medium transition-all ${props.signerCount === n ? "border-accent bg-primary/10 ring-2 ring-accent" : "border-border hover:border-primary/50"}`} onClick={() => props.setSignerCount(n)}>{n}</button>
              ))}
              <button type="button" className={`h-9 px-3 rounded-md border text-sm font-medium transition-all ${props.signerCount > 4 ? "border-accent bg-primary/10 ring-2 ring-accent" : "border-border hover:border-primary/50"}`} onClick={() => props.setSignerCount(5)}>5+</button>
            </div>
            {props.signerCount > 1 && <p className="text-xs text-muted-foreground mt-1">All signers must be present with valid photo ID.</p>}
          </div>
        </>
      )}

      {/* Phase 12: Facility Signing */}
      {showFacility && (
        <>
          <div><Label>Facility Name *</Label><Input value={props.facilityName} onChange={e => props.setFacilityName(e.target.value)} placeholder="e.g. OhioHealth Riverside Methodist" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Room / Cell Number</Label><Input value={props.facilityRoom} onChange={e => props.setFacilityRoom(e.target.value)} placeholder="e.g. Room 412, Cell B-7" /></div>
            <div><Label>Facility Contact Person</Label><Input value={props.facilityContact} onChange={e => props.setFacilityContact(e.target.value)} placeholder="Nurse/guard name or ext." /></div>
          </div>
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs text-muted-foreground">
            <p className="font-medium text-foreground mb-1">📋 Facility Signing Notes:</p>
            <ul className="list-disc ml-4 space-y-0.5">
              <li>Confirm visitor policy and hours before booking</li>
              <li>A facility surcharge may apply</li>
              <li>The signer must be alert, aware, and willing to sign</li>
            </ul>
          </div>
        </>
      )}

      {/* Phase 12: Witness Logic Gate */}
      {showWitnessGate && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2"><Info className="h-4 w-4 text-primary" /> Witness Requirements</p>
          <p className="text-xs text-muted-foreground">This type of document typically requires witnesses. Ohio law may require 1-2 disinterested witnesses for Wills and certain estate documents.</p>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Number of Witnesses</Label>
              <Select value={props.witnessCount} onValueChange={props.setWitnessCount}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="0">None needed</SelectItem>
                  <SelectItem value="1">1 Witness</SelectItem>
                  <SelectItem value="2">2 Witnesses</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Witness Source</Label>
              <Select value={props.witnessMode} onValueChange={v => props.setWitnessMode(v as any)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="in_person">I'll bring my own</SelectItem>
                  <SelectItem value="virtual">Notary provides ($10/witness)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
