/**
 * SVC-250: Contextual help tooltips for forms and dashboards
 */
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";

const HELP_CONTENT: Record<string, string> = {
  "notarization_type": "Choose 'In-Person' for face-to-face meetings or 'Remote Online (RON)' for secure video sessions from anywhere.",
  "signer_count": "Include all parties who need to sign. Each signer will need valid government-issued photo ID.",
  "service_type": "Select the type of notary service you need. Each service has different requirements and pricing.",
  "scheduled_date": "Select your preferred appointment date. We require at least 2 hours advance notice.",
  "kba": "Knowledge-Based Authentication (KBA) verifies your identity using personal questions from public records. Ohio allows up to 2 attempts per ORC §147.66.",
  "recording_consent": "Ohio law (ORC §147.63) requires audio-video recording of all RON sessions. Recordings are retained for 10 years.",
  "journal_entry": "The notary journal is a legal record of each notarial act as required by ORC §147.141.",
  "e_seal": "An electronic notary seal contains the notary's name, commission info, and state-specific elements per ORC §147.542.",
  "document_type": "Select the document category that best matches your needs. This helps us assign the right notary.",
  "travel_fee": "Mobile notary services include a travel fee based on distance from our office location.",
};

interface ContextualHelpProps {
  topic: string;
  className?: string;
}

export function ContextualHelp({ topic, className }: ContextualHelpProps) {
  const content = HELP_CONTENT[topic];
  if (!content) return null;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button type="button" className={`inline-flex items-center text-muted-foreground hover:text-foreground transition-colors ${className || ""}`} aria-label={`Help: ${topic}`}>
          <HelpCircle className="h-3.5 w-3.5" />
        </button>
      </TooltipTrigger>
      <TooltipContent side="top" className="max-w-xs text-xs">
        {content}
      </TooltipContent>
    </Tooltip>
  );
}
