import { useState, useEffect } from "react";
import { ShieldCheck, CheckCircle2, ScanFace, ListChecks, Lock, Fingerprint, CreditCard } from "lucide-react";

export default function HeroPhoneAnimation() {
  const [step, setStep] = useState(0);

  useEffect(() => {
    let timeouts: ReturnType<typeof setTimeout>[] = [];

    const runSequence = () => {
      setStep(0);
      timeouts.push(setTimeout(() => setStep(1), 1000));
      timeouts.push(setTimeout(() => setStep(2), 4000));
      timeouts.push(setTimeout(() => setStep(3), 5000));
      timeouts.push(setTimeout(() => setStep(4), 6500));
      timeouts.push(setTimeout(() => setStep(5), 8000));
      timeouts.push(setTimeout(() => runSequence(), 11000));
    };

    runSequence();
    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <div className="flex items-center justify-center" role="img" aria-label="Animated demonstration of the remote online notarization process: ID scanning, identity verification, and secure document signing">
      <style>{`
        @keyframes laserScan {
          0% { top: 10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 90%; opacity: 0; }
        }
        .animate-laser {
          animation: laserScan 1.5s ease-in-out infinite alternate;
        }
        @keyframes floatUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float-up {
          animation: floatUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes pulseShield {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(30, 174, 178, 0.4); }
          70% { transform: scale(1.05); box-shadow: 0 0 0 20px rgba(30, 174, 178, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(30, 174, 178, 0); }
        }
        .animate-shield {
          animation: pulseShield 2s infinite;
        }
      `}</style>

      {/* Phone Chassis */}
      <div
        className="relative w-[280px] h-[560px] rounded-[40px] p-[10px] shadow-2xl"
        style={{
          background: "linear-gradient(145deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)",
          boxShadow: "0 25px 60px -12px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)",
        }}
      >
        {/* Dynamic Island */}
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black rounded-full px-4 py-1.5">
          <div className="w-2 h-2 rounded-full bg-foreground/20" />
          <div className="w-8 h-2 rounded-full bg-foreground/10" />
        </div>

        {/* Screen */}
        <div
          className="w-full h-full rounded-[30px] overflow-hidden flex flex-col"
          style={{ background: "linear-gradient(180deg, hsl(216 79% 7%) 0%, hsl(216 60% 11%) 100%)" }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-5 pt-12 pb-3">
            <span className="font-heading text-base font-bold text-white tracking-tight">
              Notar<span className="text-accent">.</span>
            </span>
            <Lock className="w-3.5 h-3.5 text-primary" />
          </div>

          {/* Step 0: Connecting */}
          {step === 0 && (
            <div className="animate-float-up flex-1 flex flex-col items-center justify-center gap-4 px-6">
              <div className="w-10 h-10 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              <p className="text-xs text-white/60 font-body">Establishing Session...</p>
            </div>
          )}

          {/* Step 1 & 2: ID Verification */}
          {(step === 1 || step === 2) && (
            <div className="animate-float-up flex-1 flex flex-col px-5 py-4 gap-3">
              <div className="flex items-center gap-3">
                <ScanFace className="w-5 h-5 text-primary" />
                <div>
                  <p className="text-sm font-heading font-bold text-white">ID Verification</p>
                  <p className="text-[10px] text-white/50 font-body">Scanning official document</p>
                </div>
              </div>

              {/* ID Card */}
              <div className="relative mx-auto w-[200px] h-[130px] rounded-xl overflow-hidden border border-white/10" style={{ background: "linear-gradient(135deg, hsl(216 60% 15%), hsl(216 60% 20%))" }}>
                <div className="p-3 flex gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
                    <Fingerprint className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-2 w-3/4 rounded-full bg-white/15" />
                    <div className="h-2 w-1/2 rounded-full bg-white/10" />
                    <div className="h-2 w-2/3 rounded-full bg-white/10" />
                  </div>
                </div>

                {step === 1 && (
                  <div className="animate-laser absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent" />
                )}

                {step === 2 && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center backdrop-blur-sm">
                    <CheckCircle2 className="w-10 h-10 text-primary" />
                  </div>
                )}
              </div>

              <div className="text-center mt-2">
                <span className={`text-xs font-body font-medium ${step === 2 ? "text-primary" : "text-white/40"}`}>
                  {step === 2 ? "ID Confirmed" : "Align ID in frame..."}
                </span>
              </div>
            </div>
          )}

          {/* Step 3 & 4: KBA */}
          {(step === 3 || step === 4) && (
            <div className="animate-float-up flex-1 flex flex-col px-5 py-4 gap-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <ListChecks className="w-4 h-4 text-accent" />
                </div>
                <div>
                  <p className="text-sm font-heading font-bold text-white">Knowledge-Based Auth</p>
                  <p className="text-[10px] text-white/50 font-body">Please answer security questions</p>
                </div>
              </div>

              <div className="rounded-lg bg-white/5 p-3 mt-1">
                <p className="text-[11px] text-white/80 font-body leading-relaxed">
                  Which of the following addresses have you previously lived at?
                </p>
              </div>

              <div className="space-y-2 mt-1">
                <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />
                  <span className="text-[11px] text-white/70 font-body">1423 Maple Street Apt 4B</span>
                </div>

                <div
                  className={`flex items-center gap-2.5 rounded-lg border px-3 py-2.5 cursor-pointer transition-all duration-500 ${
                    step === 4
                      ? "border-primary bg-primary/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-full border-2 shrink-0 flex items-center justify-center transition-colors duration-500 ${step === 4 ? "border-primary bg-primary" : "border-white/20"}`}>
                    {step === 4 && <CheckCircle2 className="w-2.5 h-2.5 text-white" />}
                  </div>
                  <span className="text-[11px] text-white/70 font-body flex-1">7800 Westheimer Rd</span>
                  {step === 4 && <CheckCircle2 className="w-4 h-4 text-primary" />}
                </div>

                <div className="flex items-center gap-2.5 rounded-lg border border-white/10 bg-white/5 px-3 py-2.5 cursor-pointer">
                  <div className="w-4 h-4 rounded-full border-2 border-white/20 shrink-0" />
                  <span className="text-[11px] text-white/70 font-body">None of the above</span>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Verified */}
          {step === 5 && (
            <div className="animate-float-up flex-1 flex flex-col items-center justify-center px-6 gap-4">
              <div className="animate-shield w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <ShieldCheck className="w-10 h-10 text-primary" />
              </div>
              <p className="text-xl font-heading font-bold text-white">Verified!</p>
              <p className="text-xs text-white/50 font-body text-center leading-relaxed">
                Identity confirmed and secured for notarization.
              </p>
              <div className="flex items-center gap-3 mt-2">
                <div className="w-8 h-1 rounded-full bg-primary" />
                <div className="w-8 h-1 rounded-full bg-accent" />
                <div className="w-8 h-1 rounded-full bg-secondary" />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
