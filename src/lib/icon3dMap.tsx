// 3D Icon mapping for service categories and features
import checklist from "@/assets/icons-3d/checklist.png";
import notaryAgent from "@/assets/icons-3d/notary-agent.png";
import identityVerify from "@/assets/icons-3d/identity-verify-clean.png";
import docShield from "@/assets/icons-3d/doc-shield-clean.png";
import certificate from "@/assets/icons-3d/certificate.png";
import taskList from "@/assets/icons-3d/task-list.png";
import warning from "@/assets/icons-3d/warning.png";
import folders from "@/assets/icons-3d/folders.png";
import scroll from "@/assets/icons-3d/scroll.png";
import docSearch from "@/assets/icons-3d/doc-search.png";
import receipt from "@/assets/icons-3d/receipt.png";
import lightbulb from "@/assets/icons-3d/lightbulb.png";
import handshake from "@/assets/icons-3d/handshake.png";
import verifiedBadge from "@/assets/icons-3d/verified-badge.png";
import calendar from "@/assets/icons-3d/calendar.png";
import analytics from "@/assets/icons-3d/analytics.png";
import folderVerified from "@/assets/icons-3d/folder-verified.png";
import rocket from "@/assets/icons-3d/rocket.png";
import videoCall from "@/assets/icons-3d/video-call.png";
import cloudUpload from "@/assets/icons-3d/cloud-upload.png";
import pieChart from "@/assets/icons-3d/pie-chart.png";
import cloudSecurity from "@/assets/icons-3d/cloud-security.png";
import award from "@/assets/icons-3d/award.png";
import teamReview from "@/assets/icons-3d/team-review.png";
import medal from "@/assets/icons-3d/medal.png";
import tools from "@/assets/icons-3d/tools.png";
import password from "@/assets/icons-3d/password.png";
import email from "@/assets/icons-3d/email.png";
import thumbsUp from "@/assets/icons-3d/thumbs-up.png";
import workflow from "@/assets/icons-3d/workflow.png";
import globeDocs from "@/assets/icons-3d/globe-docs.png";
import newsletterMegaphone from "@/assets/icons-3d/newsletter-megaphone.jpg";
import lockShield from "@/assets/icons-3d/lock-shield.png";
import clockFast from "@/assets/icons-3d/clock-fast.png";
import legalDoc from "@/assets/icons-3d/legal-doc.png";
import encryption from "@/assets/icons-3d/encryption.png";

export const ICON_3D = {
  checklist,
  notaryAgent,
  identityVerify,
  docShield,
  certificate,
  taskList,
  warning,
  folders,
  scroll,
  docSearch,
  receipt,
  lightbulb,
  handshake,
  verifiedBadge,
  calendar,
  analytics,
  folderVerified,
  rocket,
  videoCall,
  cloudUpload,
  pieChart,
  cloudSecurity,
  award,
  teamReview,
  medal,
  tools,
  password,
  email,
  thumbsUp,
  workflow,
  globeDocs,
  lockShield,
  clockFast,
  legalDoc,
  encryption,
} as const;

// Maps service categories to their best-fit 3D icon
export const CATEGORY_3D_ICON: Record<string, string> = {
  notarization: docShield,
  document_services: checklist,
  verification: identityVerify,
  business: folders,
  authentication: globeDocs,
  admin_support: taskList,
  content_creation: lightbulb,
  customer_service: email,
};

// Maps feature/how-it-works concepts to icons
export const FEATURE_3D_ICON: Record<string, string> = {
  // Core notary
  upload: cloudUpload,
  identity: identityVerify,
  video: videoCall,
  download: folderVerified,
  security: cloudSecurity,
  schedule: calendar,
  certified: certificate,
  seal: award,
  compliance: docShield,
  ron: videoCall,
  mobile: notaryAgent,
  loan: handshake,
  apostille: globeDocs,
  oath: scroll,
  copy: receipt,
  i9: identityVerify,
  poa: scroll,
  // Document types
  wills: scroll,
  estate: scroll,
  trust: folderVerified,
  healthcare: teamReview,
  affidavit: checklist,
  court: docSearch,
  deed: certificate,
  mortgage: handshake,
  heloc: receipt,
  corporate: folders,
  contract: docShield,
  operating: folders,
  vehicle: notaryAgent,
  immigration: globeDocs,
  // Industry verticals
  lawFirm: docSearch,
  hospital: teamReview,
  bedside: teamReview,
  hipaa: cloudSecurity,
  realEstate: certificate,
  closing: handshake,
  titleWork: folderVerified,
  multiSigner: teamReview,
  bulkSigning: folders,
  // Platform features
  journal: checklist,
  eSeal: award,
  smartSchedule: calendar,
  aiTools: lightbulb,
  revenue: pieChart,
  retainer: receipt,
  subscription: receipt,
  witness: teamReview,
  urgent: warning,
  // Key Benefits
  lockShield: lockShield,
  clockFast: clockFast,
  legalDoc: legalDoc,
  encryption: encryption,
  // Generic
  tools: tools,
  workflow: workflow,
  verified: verifiedBadge,
  rocket: rocket,
  medal: medal,
  email: email,
  thumbsUp: thumbsUp,
  analytics: analytics,
  password: password,
  taskList: taskList,
  checklist: checklist,
  newsletter: newsletterMegaphone,
};

/** Render a 3D icon image element */
export function Icon3D({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={`object-contain ${className}`}
    />
  );
}
