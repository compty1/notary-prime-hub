/**
 * SVC-108/503: SMS consent management
 * Opt-in checkbox with consent tracking for SMS reminders.
 */
import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Phone } from "lucide-react";
import { logConsent, CONSENT_TYPES } from "@/lib/consentLogging";

interface SMSConsentManagerProps {
  phone: string;
  onPhoneChange: (phone: string) => void;
  smsOptIn: boolean;
  onSmsOptInChange: (v: boolean) => void;
  userId?: string;
}

export function SMSConsentManager({ phone, onPhoneChange, smsOptIn, onSmsOptInChange, userId }: SMSConsentManagerProps) {
  const handleOptInChange = async (checked: boolean) => {
    onSmsOptInChange(checked);
    await logConsent(
      { consentType: CONSENT_TYPES.SMS_OPT_IN, version: "1.0", granted: checked },
      userId
    );
  };

  return (
    <div className="space-y-3 rounded-lg border border-border p-4">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Phone className="h-4 w-4 text-primary" /> SMS Notifications
      </div>
      <div>
        <Label htmlFor="sms-phone">Mobile Number</Label>
        <Input
          id="sms-phone"
          type="tel"
          value={phone}
          onChange={e => onPhoneChange(e.target.value)}
          placeholder="(555) 123-4567"
          maxLength={14}
        />
      </div>
      <div className="flex items-start gap-2">
        <Checkbox
          id="sms-optin"
          checked={smsOptIn}
          onCheckedChange={v => handleOptInChange(v === true)}
        />
        <div className="grid gap-0.5 leading-none">
          <Label htmlFor="sms-optin" className="text-sm cursor-pointer">
            I agree to receive appointment reminders via SMS
          </Label>
          <p className="text-xs text-muted-foreground">
            Standard message rates apply. Reply STOP to unsubscribe at any time. Max 4 messages per appointment.
          </p>
        </div>
      </div>
    </div>
  );
}
