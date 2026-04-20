import { useParams, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { usePrerequisiteCheck } from "@/hooks/usePrerequisiteCheck";
import { useCourseProgress } from "@/hooks/useAcademyProgress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import { ChevronDown, ChevronRight, Clock, Lock, CheckCircle2, BookOpen, FileQuestion, ArrowLeft, Play } from "lucide-react";
import { useState } from "react";

export default function AcademyCourseDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: course, isLoading } = useQuery({
    queryKey: ["academy-course", slug],
    queryFn: async () => {
      // Try slug first, then id
      let { data } = await supabase.from("e_courses").select("*").eq("slug", slug!).maybeSingle();
      if (!data) {
        const res = await supabase.from("e_courses").select("*").eq("id", slug!).maybeSingle();
        data = res.data;
      }
      return data;
    },
  });

  usePageMeta({ title: course?.title ? `${course.title} — Academy` : "Course — Academy" });

  const { data: prereq } = usePrerequisiteCheck(course?.id, user?.id);
  const { data: progress } = useCourseProgress(course?.id, user?.id);

  const { data: modules = [] } = useQuery({
    queryKey: ["academy-modules", course?.id],
    enabled: !!course?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("academy_modules")
        .select("*, academy_lessons(*), academy_quizzes(*)")
        .eq("course_id", course!.id)
        .order("sort_order");
      return (data || []).map((m: any) => ({
        ...m,
        academy_lessons: (m.academy_lessons || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
        academy_quizzes: (m.academy_quizzes || []).sort((a: any, b: any) => a.sort_order - b.sort_order),
      }));
    },
  });

  const { data: enrollment } = useQuery({
    queryKey: ["enrollment", course?.id, user?.id],
    enabled: !!course?.id && !!user?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("e_course_enrollments")
        .select("id")
        .eq("course_id", course!.id)
        .eq("user_id", user!.id)
        .maybeSingle();
      return data;
    },
  });

  const { data: lessonProgress = [] } = useQuery({
    queryKey: ["lesson-progress", course?.id, user?.id, modules.length],
    enabled: !!course?.id && !!user?.id && modules.length > 0,
    queryFn: async () => {
      const allLessonIds = modules.flatMap((m: any) => m.academy_lessons.map((l: any) => l.id));
      if (allLessonIds.length === 0) return [];
      const { data } = await supabase
        .from("academy_lesson_progress")
        .select("lesson_id")
        .eq("user_id", user!.id)
        .in("lesson_id", allLessonIds);
      return (data || []).map((p: any) => p.lesson_id);
    },
  });

  const completedSet = new Set(lessonProgress);

  const enrollMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("e_course_enrollments").insert({ course_id: course!.id, user_id: user!.id });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["enrollment"] });
      toast({ title: "Enrolled!", description: "You're now enrolled in this course." });
    },
  });

  const [openModules, setOpenModules] = useState<Set<string>>(new Set());
  const toggleModule = (id: string) => {
    setOpenModules(prev => {
      const n = new Set(prev);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  };

  if (isLoading) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  if (!course) return <div className="max-w-4xl mx-auto p-8 text-center"><p className="text-muted-foreground">Course not found.</p><Link to="/academy"><Button variant="outline" className="mt-4">Back to Academy</Button></Link></div>;

  const isLocked = prereq && !prereq.met;
  const isEnrolled = !!enrollment;
  const totalLessons = modules.reduce((s: number, m: any) => s + m.academy_lessons.length, 0);
  const totalHours = Number((course as any).total_hours) || Math.round(course.duration_minutes / 60);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
        <Link to="/academy" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ArrowLeft className="h-4 w-4" /> Back to Academy</Link>

        {/* Course Header */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 flex-wrap">
            <Badge>{String((course as any).course_code || course.category)}</Badge>
            <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />{totalHours}h</Badge>
            <Badge variant="outline"><BookOpen className="h-3 w-3 mr-1" />{totalLessons} lessons</Badge>
          </div>
          <h1 className="text-3xl font-bold">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>

          {isLocked && (
            <Card className="border-warning/30 bg-warning/10">
              <CardContent className="pt-4 flex items-start gap-3">
                <Lock className="h-5 w-5 text-warning shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-warning">Prerequisites Required</p>
                  <p className="text-sm text-warning">Complete these courses first: {prereq!.missing.join(", ")}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {!isLocked && !isEnrolled && user && (
            <Button onClick={() => enrollMutation.mutate()} disabled={enrollMutation.isPending} size="lg">
              {enrollMutation.isPending ? "Enrolling..." : course.is_free ? "Enroll Free" : `Enroll — $${course.price}`}
            </Button>
          )}

          {isEnrolled && progress && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm"><span>Course Progress</span><span className="font-bold">{progress.percent}%</span></div>
              <Progress value={progress.percent} className="h-3" />
            </div>
          )}
        </div>

        {/* Module Accordion */}
        <div className="space-y-3">
          <h2 className="text-xl font-bold">Curriculum</h2>
          {modules.length === 0 ? (
            <p className="text-muted-foreground text-sm">Modules are being added. Check back soon.</p>
          ) : modules.map((mod: any, mi: number) => {
            const isOpen = openModules.has(mod.id);
            const modLessons = mod.academy_lessons || [];
            const modCompleted = modLessons.filter((l: any) => completedSet.has(l.id)).length;
            return (
              <Card key={mod.id} className="overflow-hidden">
                <button onClick={() => toggleModule(mod.id)} className="w-full text-left px-4 py-3 flex items-center justify-between hover:bg-muted/50 transition-colors">
                  <div className="flex items-center gap-3">
                    {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                    <div>
                      <p className="font-medium text-sm">Module {mi + 1}: {mod.title}</p>
                      <p className="text-xs text-muted-foreground">{modLessons.length} lessons · {mod.duration_minutes || 0} min</p>
                    </div>
                  </div>
                  {isEnrolled && <span className="text-xs text-muted-foreground">{modCompleted}/{modLessons.length}</span>}
                </button>
                {isOpen && (
                  <div className="border-t divide-y">
                    {modLessons.map((lesson: any) => {
                      const done = completedSet.has(lesson.id);
                      return (
                        <Link key={lesson.id} to={isEnrolled ? `/academy/lesson/${lesson.id}` : "#"} className={`flex items-center gap-3 px-6 py-2.5 text-sm hover:bg-muted/30 transition-colors ${!isEnrolled ? "opacity-60 pointer-events-none" : ""}`}>
                          {done ? <CheckCircle2 className="h-4 w-4 text-success shrink-0" /> : <Play className="h-4 w-4 text-muted-foreground shrink-0" />}
                          <span className={done ? "text-muted-foreground line-through" : ""}>{lesson.title}</span>
                          <span className="ml-auto text-xs text-muted-foreground">{lesson.duration_minutes}m</span>
                        </Link>
                      );
                    })}
                    {(mod.academy_quizzes || []).map((quiz: any) => (
                      <Link key={quiz.id} to={isEnrolled ? `/academy/quiz/${quiz.id}` : "#"} className={`flex items-center gap-3 px-6 py-2.5 text-sm hover:bg-muted/30 transition-colors ${!isEnrolled ? "opacity-60 pointer-events-none" : ""}`}>
                        <FileQuestion className="h-4 w-4 text-primary shrink-0" />
                        <span className="font-medium">{quiz.title}</span>
                        <Badge variant="outline" className="ml-auto text-xs">Quiz</Badge>
                      </Link>
                    ))}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
}
