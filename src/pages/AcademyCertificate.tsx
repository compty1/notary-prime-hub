import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer, Award } from "lucide-react";
import { format } from "date-fns";

export default function AcademyCertificate() {
  const { id } = useParams<{ id: string }>();

  const { data: cert } = useQuery({
    queryKey: ["academy-cert", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_certificates")
        .select("*, e_courses(title, certificate_title)")
        .eq("id", id!)
        .single();
      return data;
    },
  });

  const { data: profile } = useQuery({
    queryKey: ["cert-profile", cert?.user_id],
    enabled: !!cert?.user_id,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("full_name, email").eq("user_id", cert!.user_id).single();
      return data;
    },
  });

  usePageMeta({ title: cert ? `Certificate — ${cert.certificate_number}` : "Certificate" });

  if (!cert) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  const course = (cert as any)?.e_courses;
  const courseName = (course as any)?.certificate_title || (course as any)?.title || "Course";

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between no-print">
          <Link to="/academy" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Back to Academy
          </Link>
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="h-4 w-4 mr-1" /> Print
          </Button>
        </div>

        {/* Certificate */}
        <div className="border-4 border-double border-primary/30 rounded-xl p-8 md:p-12 bg-gradient-to-br from-background via-primary/5 to-background text-center space-y-6 print:border-black print:p-16">
          <Award className="h-16 w-16 text-primary mx-auto" />
          <p className="text-sm uppercase tracking-[0.3em] text-muted-foreground font-medium">Certificate of Completion</p>
          <h1 className="text-3xl md:text-4xl font-bold font-serif">{courseName}</h1>
          <p className="text-lg text-muted-foreground">This certifies that</p>
          <p className="text-2xl md:text-3xl font-bold text-primary">{profile?.full_name || profile?.email || "Learner"}</p>
          <p className="text-muted-foreground">has successfully completed all requirements for</p>
          <p className="text-xl font-semibold">{courseName}</p>
          <p className="text-muted-foreground">through the Lovable Notary Training Academy</p>

          <div className="pt-6 flex items-center justify-center gap-8 text-sm text-muted-foreground">
            <div>
              <p className="font-medium text-foreground">{format(new Date(cert.issued_at), "MMMM d, yyyy")}</p>
              <p>Date Issued</p>
            </div>
            <div className="w-px h-8 bg-border" />
            <div>
              <p className="font-medium text-foreground font-mono">{cert.certificate_number}</p>
              <p>Certificate Number</p>
            </div>
          </div>

          <div className="pt-8 border-t border-border/50">
            <p className="text-xs text-muted-foreground">Lovable Notary Training Academy — Professional Development for Ohio Notaries</p>
          </div>
        </div>
      </div>
    </div>
  );
}
