/**
 * SVC-442: Explicit consent checkboxes for booking with timestamps
 * Reusable consent checkbox group that logs consent with timestamps.
 */
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { logConsent, CONSENT_TYPES } from "@/lib/consentLogging";

interface ConsentItem {
  id: string;
  label: string;
  required: boolean;
  consentType: string;
  version: string;
}

const BOOKING_CONSENTS: ConsentItem[] = [
  {
    id: "terms",
    label: "I agree to the Terms of Service and Privacy Policy",
    required: true,
    consentType: CONSENT_TYPES.TERMS_OF_SERVICE,
    version: "2.0",
  },
  {
    id: "recording",
    label: "I consent to audio-video recording of any RON session (ORC §147.63)",
    required: false, // Only required for RON
    consentType: CONSENT_TYPES.RECORDING_CONSENT,
    version: "1.0",
  },
  {
    id: "sms",
    label: "I agree to receive appointment reminders via SMS (optional)",
    required: false,
    consentType: CONSENT_TYPES.SMS_OPT_IN,
    version: "1.0",
  },
];

interface BookingConsentsProps {
  isRON?: boolean;
  onConsentsChange: (allRequired: boolean, consents: Record<string, { granted: boolean; timestamp: string }>) => void;
  userId?: string;
}

export function BookingConsents({ isRON = false, onConsentsChange, userId }: BookingConsentsProps) {
  const [consents, setConsents] = useState<Record<string, boolean>>({});

  const applicableConsents = BOOKING_CONSENTS.map(c => ({
    ...c,
    required: c.id === "recording" ? isRON : c.required,
  }));

  const handleToggle = async (item: ConsentItem & { required: boolean }, checked: boolean) => {
    const updated = { ...consents, [item.id]: checked };
    setConsents(updated);

    // Log consent
    await logConsent(
      { consentType: item.consentType, version: item.version, granted: checked },
      userId
    );

    // Check if all required are met
    const allRequiredMet = applicableConsents
      .filter(c => c.required)
      .every(c => updated[c.id]);

    const timestamped = Object.fromEntries(
      Object.entries(updated).map(([k, v]) => [k, { granted: v, timestamp: new Date().toISOString() }])
    );
    onConsentsChange(allRequiredMet, timestamped);
  };

  return (
    <div className="space-y-3">
      {applicableConsents.map(item => (
        <div key={item.id} className="flex items-start gap-2">
          <Checkbox
            id={`consent-${item.id}`}
            checked={consents[item.id] || false}
            onCheckedChange={(v) => handleToggle(item, v === true)}
          />
          <label htmlFor={`consent-${item.id}`} className="text-sm text-muted-foreground leading-tight">
            {item.label}
            {item.required && <span className="text-destructive ml-1">*</span>}
          </label>
        </div>
      ))}
    </div>
  );
}
