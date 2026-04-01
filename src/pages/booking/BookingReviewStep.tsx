import { useState } from "react";
import { Link } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { MapPin, Monitor, Calendar, Shield, DollarSign, AlertTriangle, Clock, Eye, EyeOff, CreditCard } from "lucide-react";
import { formatTimeSlot, isDigitalOnly, HAGUE_COUNTRIES } from "./bookingConstants";
import { OhioComplianceNotice } from "@/components/OhioComplianceNotice";

interface ReviewStepProps {
  isNonNotarial: boolean;
  notarizationType: string;
  serviceType: string;
  serviceCategories: Record<string, string>;
  date: string; time: string;
  clientAddress: string; clientCity: string; clientState: string; clientZip: string;
  location: string;
  destinationCountry: string; uscisForm: string;
  sourceLanguage: string; targetLanguage: string;
  translationDocType: string; translationPageCount: string;
  employerName: string;
  idData: any; docAnalysis: any;
  documentCount: number; notes: string;
  estimatedPrice: number | null;
  pricingSettings: Record<string, string>;
  urgencyLevel: string;
  // Guest fields
  user: any;
  guestName: string; setGuestName: (v: string) => void;
  guestEmail: string; setGuestEmail: (v: string) => void;
  guestPassword: string; setGuestPassword: (v: string) => void;
  // Phase 12 fields
  travelDistance?: number | null;
  afterHoursFee?: number;
  signerCapacity?: string;
  facilityName?: string;
  signerCount?: number;
  pricingBreakdown?: { lineItems: { label: string; amount: number }[]; total: number; deposit: number } | null;
  validationErrors?: Record<string, string>;
  termsAccepted?: boolean;
  setTermsAccepted?: (v: boolean) => void;
}

export default function BookingReviewStep(props: ReviewStepProps) {
  const [showGuestPassword, setShowGuestPassword] = useState(false);
  const { notarizationType, serviceType, serviceCategories, date, time, estimatedPrice, pricingSettings, urgencyLevel, documentCount } = props;

  return (
    <div className="space-y-4">
      <div className="rounded-lg bg-muted/50 p-4 space-y-3">
        {!props.isNonNotarial && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Type</span>
            <span className="font-medium flex items-center gap-1">
              {notarizationType === "in_person" ? <><MapPin className="h-3 w-3" /> In-Person</> : <><Monitor className="h-3 w-3" /> Remote (RON)</>}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Service</span><span className="font-medium">{serviceType}</span></div>
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Date</span>
          <span className="font-medium flex items-center gap-1"><Calendar className="h-3 w-3" />{date && new Date(date + "T00:00:00").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}</span>
        </div>
        <div className="flex justify-between text-sm"><span className="text-muted-foreground">Time</span><span className="font-medium">{time && formatTimeSlot(time)}</span></div>
        {(props.clientAddress || props.location) && notarizationType === "in_person" && !isDigitalOnly(serviceType, serviceCategories) && (
          <div className="flex justify-between text-sm"><span className="text-muted-foreground">Location</span><span className="font-medium text-right max-w-[60%]">{props.clientAddress ? `${props.clientAddress}, ${props.clientCity}, ${props.clientState} ${props.clientZip}` : props.location}</span></div>
        )}
        {props.destinationCountry && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Destination</span><span className="font-medium">{props.destinationCountry} {HAGUE_COUNTRIES.includes(props.destinationCountry) ? "(Hague)" : "(Non-Hague)"}</span></div>}
        {props.uscisForm && <div className="flex justify-between text-sm"><span className="text-muted-foreground">USCIS Form</span><span className="font-medium">{props.uscisForm}</span></div>}
        {props.targetLanguage && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Translation</span><span className="font-medium">{props.sourceLanguage} → {props.targetLanguage}</span></div>}
        {props.translationDocType && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Document</span><span className="font-medium">{props.translationDocType} ({props.translationPageCount} page{parseInt(props.translationPageCount) !== 1 ? "s" : ""})</span></div>}
        {props.employerName && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Employer</span><span className="font-medium">{props.employerName}</span></div>}
        {props.idData && !props.idData.error && <div className="flex justify-between text-sm"><span className="text-muted-foreground">ID Verified</span><span className="font-medium flex items-center gap-1"><Shield className="h-3 w-3 text-primary" /> {props.idData.id_type}</span></div>}
        {documentCount > 1 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Documents</span><span className="font-medium">{documentCount} documents (batch session)</span></div>}
        {props.signerCapacity && props.signerCapacity !== "individual" && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Signing As</span><span className="font-medium capitalize">{props.signerCapacity.replace(/_/g, " ")}</span></div>}
        {props.facilityName && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Facility</span><span className="font-medium">{props.facilityName}</span></div>}
        {(props.signerCount ?? 1) > 1 && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Signers</span><span className="font-medium">{props.signerCount} signers</span></div>}
        {props.docAnalysis && !props.docAnalysis.error && <div className="flex justify-between text-sm"><span className="text-muted-foreground">Detected</span><span className="font-medium">{props.docAnalysis.document_name} ({props.docAnalysis.notarization_method})</span></div>}
        {props.notes && <div className="text-sm"><span className="text-muted-foreground">Notes: </span><span>{props.notes}</span></div>}
      </div>

      {props.pricingBreakdown && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-2">
          <p className="text-sm font-medium flex items-center gap-2"><DollarSign className="h-4 w-4 text-primary" /> Estimated Pricing</p>
          <div className="space-y-1 text-sm">
            {props.pricingBreakdown.lineItems.map((item, i) => (
              <div key={i} className="flex justify-between">
                <span className="text-muted-foreground">{item.label}</span>
                <span className={item.amount < 0 ? "text-primary" : ""}>{item.amount < 0 ? `-$${Math.abs(item.amount).toFixed(2)}` : `$${item.amount.toFixed(2)}`}</span>
              </div>
            ))}
            <div className="flex justify-between border-t border-border pt-1 font-semibold">
              <span>Estimated Total</span>
              <span className="text-primary">${props.pricingBreakdown.total.toFixed(2)}</span>
            </div>
            {props.pricingBreakdown.deposit > 0 && (
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>25% deposit due at booking</span>
                <span>${props.pricingBreakdown.deposit.toFixed(2)}</span>
              </div>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Final price may vary based on actual travel distance and document complexity.</p>
        </div>
      )}

      {!props.user && (
        <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
          <p className="text-sm font-medium flex items-center gap-2"><Shield className="h-4 w-4 text-primary" /> Create your account to confirm</p>
          <div>
            <Label>Full Name</Label>
            <Input value={props.guestName} onChange={e => props.setGuestName(e.target.value)} placeholder="Your full name" className={props.validationErrors?.guestName ? "border-destructive" : ""} />
            {props.validationErrors?.guestName && <p className="text-xs text-destructive mt-1">{props.validationErrors.guestName}</p>}
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={props.guestEmail} onChange={e => props.setGuestEmail(e.target.value)} placeholder="your@email.com" className={props.validationErrors?.guestEmail ? "border-destructive" : ""} />
            {props.validationErrors?.guestEmail && <p className="text-xs text-destructive mt-1">{props.validationErrors.guestEmail}</p>}
          </div>
          <div>
            <Label>Password</Label>
            <div className="relative">
              <Input type={showGuestPassword ? "text" : "password"} value={props.guestPassword} onChange={e => props.setGuestPassword(e.target.value)} placeholder="Create a password (min 8 characters)" minLength={8} className={`pr-10 ${props.validationErrors?.guestPassword ? "border-destructive" : ""}`} />
              <button type="button" onClick={() => setShowGuestPassword(!showGuestPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground" tabIndex={-1}>
                {showGuestPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {props.validationErrors?.guestPassword && <p className="text-xs text-destructive mt-1">{props.validationErrors.guestPassword}</p>}
          </div>
          {!props.validationErrors?.guestPassword && props.guestPassword && props.guestPassword.length < 8 && <p className="text-xs text-destructive">Password must be at least 8 characters.</p>}
          {!props.validationErrors?.guestPassword && props.guestPassword && props.guestPassword.length >= 8 && (!/[A-Z]/.test(props.guestPassword) || !/[0-9]/.test(props.guestPassword)) && <p className="text-xs text-destructive">Include at least one uppercase letter and one number.</p>}
          <p className="text-xs text-muted-foreground">Already have an account? <Link to="/login" className="text-primary hover:underline">Sign in</Link></p>
        </div>
      )}

      {!props.isNonNotarial && (
        <OhioComplianceNotice type={notarizationType === "ron" ? "ron" : "in_person"} />
      )}

      {/* Pre-signing warning */}
      <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-3 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 flex-shrink-0 text-destructive mt-0.5" />
        <div className="text-sm">
          <p className="font-medium text-foreground">Do NOT sign your documents before the notary session.</p>
          <p className="text-muted-foreground">Signing in advance voids the notarization. The notary must witness your signature.</p>
        </div>
      </div>

      {/* No-show / travel fee warning for mobile in-person */}
      {notarizationType === "in_person" && !props.isNonNotarial && (
        <div className="rounded-lg border border-border bg-muted/50 p-3 text-xs text-muted-foreground">
          <p><strong>Travel Fee Policy:</strong> Travel fees are non-refundable once the notary departs. No-show after arrival: full travel fee + $25. <a href="/terms" className="text-primary hover:underline">See full policy</a>.</p>
        </div>
      )}

      {/* Click-wrap Terms Agreement — Phase 4 */}
      <div className="rounded-lg border border-border bg-muted/30 p-3 space-y-2">
        <div className="flex items-start gap-2">
          <Checkbox
            id="terms-accept"
            checked={props.termsAccepted || false}
            onCheckedChange={(checked) => props.setTermsAccepted?.(checked === true)}
          />
          <Label htmlFor="terms-accept" className="text-xs leading-relaxed cursor-pointer">
            I have read and agree to the{" "}
            <Link to="/terms" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Terms of Service</Link>{" "}
            and{" "}
            <Link to="/terms#privacy" className="text-primary hover:underline" target="_blank" rel="noopener noreferrer">Privacy Policy</Link>.
            I understand that notarization fees are non-refundable after the session begins.
          </Label>
        </div>
      </div>

      {/* Payment methods */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <CreditCard className="h-3.5 w-3.5" aria-hidden="true" />
        <span>We accept: Credit/Debit • Venmo • Zelle • CashApp • Cash (in-person only)</span>
      </div>
    </div>
  );
}
