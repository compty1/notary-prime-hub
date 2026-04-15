/**
 * Animation Gallery — Showcases all 14 brand animation components
 */
import { useState } from "react";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Navbar } from "@/components/Navbar";
import { Footer } from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  NotarizationComplete,
  DocumentUpload,
  PaymentConfirmed,
  IdentityVerified,
  SessionJoined,
  CenturyClub,
  UploadFailed,
  SessionDisconnected,
  BusinessPlanUpgrade,
  SkeletonLoading,
  ToastNotification,
  ButtonLoadingState,
  FormError,
  MilestoneRating,
} from "@/components/animations";

export default function AnimationGallery() {
  usePageMeta({ title: "Animation Gallery | Notar", description: "Brand micro-interaction component library" });

  const [triggers, setTriggers] = useState<Record<string, boolean>>({});
  const [uploadProgress, setUploadProgress] = useState(0);
  const [rating, setRating] = useState(0);

  const toggle = (key: string) => {
    setTriggers(prev => ({ ...prev, [key]: !prev[key] }));
    if (key === "upload") {
      setUploadProgress(0);
      const interval = setInterval(() => {
        setUploadProgress(p => {
          if (p >= 100) { clearInterval(interval); return 100; }
          return p + 10;
        });
      }, 200);
    }
  };

  const demos = [
    {
      name: "NotarizationComplete",
      description: "Seal drop + check draw + glow pulse",
      render: () => <NotarizationComplete trigger={triggers["notarize"]} onComplete={() => setTimeout(() => setTriggers(p => ({ ...p, notarize: false })), 2000)} />,
      triggerKey: "notarize",
    },
    {
      name: "DocumentUpload",
      description: "Progress bar + status states",
      render: () => <DocumentUpload progress={uploadProgress} status={triggers["upload"] ? (uploadProgress >= 100 ? "complete" : "uploading") : "idle"} />,
      triggerKey: "upload",
    },
    {
      name: "PaymentConfirmed",
      description: "Receipt slide + check pop",
      render: () => <PaymentConfirmed trigger={triggers["payment"]} amount="$25.00" />,
      triggerKey: "payment",
    },
    {
      name: "IdentityVerified",
      description: "Shield fill + badge pop",
      render: () => <IdentityVerified trigger={triggers["identity"]} />,
      triggerKey: "identity",
    },
    {
      name: "SessionJoined",
      description: "Camera iris + live pulse",
      render: () => <SessionJoined trigger={triggers["session"]} participantName="Jane Doe" />,
      triggerKey: "session",
    },
    {
      name: "CenturyClub",
      description: "Milestone counter with particles",
      render: () => <CenturyClub count={triggers["century"] ? 100 : 97} milestone={100} />,
      triggerKey: "century",
    },
    {
      name: "UploadFailed",
      description: "Error shake + retry",
      render: () => <UploadFailed trigger={triggers["uploadFail"]} message="File too large (>10MB)" onRetry={() => setTriggers(p => ({ ...p, uploadFail: false }))} />,
      triggerKey: "uploadFail",
    },
    {
      name: "SessionDisconnected",
      description: "Disconnect alert with pulse",
      render: () => <SessionDisconnected trigger={triggers["disconnect"]} />,
      triggerKey: "disconnect",
    },
    {
      name: "BusinessPlanUpgrade",
      description: "Curtain wipe + morph bounce",
      render: () => <BusinessPlanUpgrade trigger={triggers["upgrade"]} planName="Business Pro" />,
      triggerKey: "upgrade",
    },
    {
      name: "SkeletonLoading",
      description: "Card/list/profile/table skeletons",
      render: () => <SkeletonLoading variant={triggers["skeleton"] ? "list" : "card"} count={3} />,
      triggerKey: "skeleton",
    },
    {
      name: "ToastNotification",
      description: "Slide in/out toast",
      render: () => <ToastNotification type="success" message="Document saved successfully!" show={triggers["toast"]} onDismiss={() => setTriggers(p => ({ ...p, toast: false }))} />,
      triggerKey: "toast",
    },
    {
      name: "ButtonLoadingState",
      description: "Width retract + ellipsis",
      render: () => <ButtonLoadingState loading={triggers["btnLoad"]}>Submit Document</ButtonLoadingState>,
      triggerKey: "btnLoad",
    },
    {
      name: "FormError",
      description: "Error shake + fade up",
      render: () => <FormError show={triggers["formErr"]} message="Please enter a valid Ohio address" />,
      triggerKey: "formErr",
    },
    {
      name: "MilestoneRating",
      description: "Star rating with badge pop",
      render: () => <MilestoneRating rating={rating} onRate={setRating} />,
      triggerKey: "",
    },
  ];

  return (
    <div className="flex flex-col min-h-screen bg-background">
      <Navbar />
      <main className="flex-1 container py-12">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground">Animation Gallery</h1>
          <p className="text-muted-foreground mt-1">14 brand micro-interaction components with 27 CSS keyframes</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demos.map((demo) => (
            <div key={demo.name} className="rounded-xl border border-border bg-card p-6 flex flex-col gap-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">{demo.name}</h3>
                  <p className="text-xs text-muted-foreground">{demo.description}</p>
                </div>
                <Badge variant="outline" className="text-[10px]">Component</Badge>
              </div>
              <div className="min-h-[120px] flex items-center justify-center bg-muted/30 rounded-lg relative overflow-hidden">
                {demo.render()}
              </div>
              {demo.triggerKey && (
                <Button size="sm" variant="outline" onClick={() => toggle(demo.triggerKey)}>
                  {triggers[demo.triggerKey] ? "Reset" : "Trigger"}
                </Button>
              )}
            </div>
          ))}
        </div>
      </main>
      <Footer />
    </div>
  );
}
