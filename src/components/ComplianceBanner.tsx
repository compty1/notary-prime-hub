import { Shield, ExternalLink } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface ComplianceBannerProps {
  variant?: "ron" | "journal" | "recording" | "signer-location" | "commission";
  compact?: boolean;
}

const BANNERS: Record<string, { title: string; text: string; link?: string }> = {
  ron: {
    title: "Ohio RON Compliance — ORC §147.60–147.66",
    text: "This Remote Online Notarization session complies with Ohio Revised Code §147.60–147.66. Audio-video recording is mandatory, sessions are retained for a minimum of 10 years, and signers must complete identity verification via Knowledge-Based Authentication (KBA) with a maximum of 2 attempts per ORC §147.66.",
    link: "https://codes.ohio.gov/ohio-revised-code/section-147.66",
  },
  journal: {
    title: "Electronic Journal — 5-Year Retention",
    text: "Per ORC §147.55, the notary must maintain a journal of all notarial acts. Electronic journal entries are retained for a minimum of 5 years from the date of the notarial act.",
  },
  recording: {
    title: "Session Recording Required",
    text: "Ohio law (ORC §147.66) requires that all RON sessions be recorded in their entirety. By proceeding, you consent to audio-video recording. Recordings are stored securely and retained per statutory requirements.",
  },
  "signer-location": {
    title: "Signer Location Verification",
    text: "The notary must verify the signer's physical location during a RON session. If the signer is located outside Ohio, additional jurisdictional rules may apply. The signer's IP address and self-reported location are logged.",
  },
  commission: {
    title: "Notary Commission Status",
    text: "All notarizations are performed by a commissioned Ohio notary public in good standing with the Ohio Secretary of State. Commission details and E&O insurance information are available upon request.",
    link: "https://www.ohiosos.gov/businesses/notary-public/",
  },
};

export function ComplianceBanner({ variant = "ron", compact = false }: ComplianceBannerProps) {
  const banner = BANNERS[variant];
  if (!banner) return null;

  if (compact) {
    return (
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2">
        <Shield className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
        <p className="text-xs text-muted-foreground">{banner.text}</p>
      </div>
    );
  }

  return (
    <Alert className="border-primary/20 bg-primary/5">
      <Shield className="h-4 w-4 text-primary" />
      <AlertTitle className="text-sm font-semibold">{banner.title}</AlertTitle>
      <AlertDescription className="text-xs text-muted-foreground mt-1">
        {banner.text}
        {banner.link && (
          <a
            href={banner.link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-primary hover:underline ml-1"
          >
            View statute <ExternalLink className="h-3 w-3" />
          </a>
        )}
      </AlertDescription>
    </Alert>
  );
}
