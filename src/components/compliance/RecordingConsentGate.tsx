/**
 * Sprint I (I-31..40): Recording consent gate per ORC §147.63
 * Blocks RON session start until explicit opt-in is captured + logged.
 */
import { useState } from "react";
import { Video, AlertCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { logConsent, CONSENT_TYPES } from "@/lib/consentLogging";
import { logAuditEvent } from "@/lib/auditLog";

interface RecordingConsentGateProps {
  sessionId: string;
  userId?: string;
  onConsented: () => void;
}

export function RecordingConsentGate({ sessionId, userId, onConsented }: RecordingConsentGateProps) {
  const [acknowledged, setAcknowledged] = useState(false);
  const [recording, setRecording] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const canProceed = acknowledged && recording;

  const handleConsent = async () => {
    if (!canProceed) return;
    setSubmitting(true);
    try {
      await logConsent(
        {
          consentType: CONSENT_TYPES.RECORDING_CONSENT,
          version: "1.0",
          granted: true,
          metadata: { session_id: sessionId, statute: "ORC §147.63" },
        },
        userId
      );
      await logAuditEvent("ron.recording_consent_granted", {
        entityType: "notarization_session",
        entityId: sessionId,
      });
      onConsented();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card className="border-primary/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5 text-primary" />
          Audio-Video Recording Consent Required
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-lg bg-muted/40 p-3 text-sm leading-relaxed">
          <div className="flex gap-2">
            <AlertCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
            <p>
              Per <strong>Ohio Revised Code §147.63</strong>, this remote online notarization session
              must be recorded in audio and video. The recording will be retained for{" "}
              <strong>10 years</strong> in accordance with ORC §147.66 and may be reviewed by the
              Secretary of State or other authorized parties.
            </p>
          </div>
        </div>

        <div className="space-y-2">
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={acknowledged}
              onCheckedChange={(v) => setAcknowledged(v === true)}
              className="mt-0.5"
            />
            <span>I acknowledge I have read and understand the recording disclosure above.</span>
          </label>
          <label className="flex items-start gap-2 text-sm cursor-pointer">
            <Checkbox
              checked={recording}
              onCheckedChange={(v) => setRecording(v === true)}
              className="mt-0.5"
            />
            <span>
              I expressly consent to the audio-video recording of this session and its 10-year retention.
            </span>
          </label>
        </div>

        <Button onClick={handleConsent} disabled={!canProceed || submitting} className="w-full">
          {submitting ? "Recording consent..." : "I Consent — Begin Session"}
        </Button>
      </CardContent>
    </Card>
  );
}
