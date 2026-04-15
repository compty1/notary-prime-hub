import { usePageMeta } from "@/hooks/usePageMeta";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { GraduationCap, Clock, Lock, BookOpen, Award, ArrowRight } from "lucide-react";
import { useCourseProgress } from "@/hooks/useAcademyProgress";

const TIER_LABELS: Record<number, string> = {
  1: "Foundation",
  2: "Core",
  3: "Advanced",
  4: "Specialty",
  5: "Mastery",
  6: "Renewal",
};

const TIER_COLORS: Record<number, string> = {
  1: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  2: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  3: "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
  4: "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300",
  5: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
  6: "bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300",
};

function CourseCard({ course, userId }: { course: any; userId?: string }) {
  const { data: progress } = useCourseProgress(course.id, userId);
  const { data: enrollment } = useQuery({
    queryKey: ["enrollment-check", course.id, userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from("e_course_enrollments")
        .select("id")
        .eq("course_id", course.id)
        .eq("user_id", userId!)
        .maybeSingle();
      return data;
    },
  });

  const tier = ((course as Record<string, unknown>).tier) || 1;
  const totalHours = ((course as Record<string, unknown>).total_hours) || Math.round(course.duration_minutes / 60);
  const hasPrereqs = (((course as Record<string, unknown>).prerequisite_course_ids) || []).length > 0;
  const isEnrolled = !!enrollment;

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-border/50 flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <Badge className={TIER_COLORS[tier] || TIER_COLORS[1]}>{TIER_LABELS[tier] || `Tier ${tier}`}</Badge>
          {course.is_free && <Badge variant="outline" className="text-green-600 border-green-300">Free</Badge>}
          {hasPrereqs && !isEnrolled && <Lock className="h-4 w-4 text-muted-foreground" />}
        </div>
        <CardTitle className="text-lg leading-tight mt-2">{course.title}</CardTitle>
      </CardHeader>
      <CardContent className="flex-1 flex flex-col justify-between gap-4">
        <p className="text-sm text-muted-foreground line-clamp-3">{course.description}</p>
        <div className="space-y-3">
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{totalHours}h</span>
            {course.instructor_name && <span className="flex items-center gap-1"><BookOpen className="h-3.5 w-3.5" />{course.instructor_name}</span>}
          </div>
          {isEnrolled && progress && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs">
                <span>{progress.completed}/{progress.total} lessons</span>
                <span className="font-medium">{progress.percent}%</span>
              </div>
              <Progress value={progress.percent} className="h-2" />
            </div>
          )}
          <Link to={`/academy/course/${course.slug || course.id}`}>
            <Button variant="outline" size="sm" className="w-full gap-1">
              {isEnrolled ? "Continue" : "View Course"} <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AcademyLanding() {
  usePageMeta({ title: "Notary Training Academy", description: "Professional notary training courses — Ohio compliant CE, RON certification, and specialty tracks." });

  const { user } = useAuth();

  const { data: courses = [], isLoading } = useQuery({
    queryKey: ["academy-courses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("e_courses")
        .select("*")
        .eq("is_published", true)
        .order("tier", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: certs = [] } = useQuery({
    queryKey: ["my-academy-certs", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_certificates")
        .select("*, e_courses(title)")
        .eq("user_id", user!.id);
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative bg-gradient-to-br from-primary/10 via-background to-primary/5 py-16 px-4">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-1.5 text-sm font-medium text-primary">
            <GraduationCap className="h-4 w-4" /> Lovable Notary Training Academy
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight">Master the Art of Notarization</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Ohio-compliant training from pre-commission fundamentals through advanced specialty certifications. 
            Build expertise. Earn certificates. Grow your practice.
          </p>
          {!user && (
            <Link to="/auth">
              <Button size="lg" className="mt-4">Sign In to Get Started</Button>
            </Link>
          )}
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-4 py-12 space-y-12">
        {/* Certificates earned */}
        {certs.length > 0 && (
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Award className="h-5 w-5 text-primary" /> Your Certificates</h2>
            <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-4">
              {certs.map((cert: any) => (
                <Link key={cert.id} to={`/academy/certificate/${cert.id}`}>
                  <Card className="hover:border-primary/50 transition-colors">
                    <CardContent className="pt-4 flex items-center gap-3">
                      <Award className="h-8 w-8 text-primary shrink-0" />
                      <div>
                        <p className="font-medium text-sm">{(cert as Record<string, unknown>)?.e_courses?.title || "Course"}</p>
                        <p className="text-xs text-muted-foreground">{cert.certificate_number}</p>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Course Grid */}
        <section>
          <h2 className="text-xl font-bold mb-6">Course Catalog</h2>
          {isLoading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : courses.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No courses found. Please check back later or contact support.</CardContent></Card>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {courses.map((c: any) => <CourseCard key={c.id} course={c} userId={user?.id} />)}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
