import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/usePageMeta";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, ArrowRight, CheckCircle2, BookOpen } from "lucide-react";
import { sanitizeHtml } from "@/lib/sanitize";

export default function AcademyLessonViewer() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: lesson } = useQuery({
    queryKey: ["academy-lesson", id],
    queryFn: async () => {
      const { data } = await supabase.from("academy_lessons").select("*, academy_modules(*, e_courses(*))").eq("id", id!).single();
      return data;
    },
  });

  usePageMeta({ title: lesson?.title ? `${lesson.title} — Academy` : "Lesson" });

  // Get siblings for nav
  const { data: siblings = [] } = useQuery({
    queryKey: ["lesson-siblings", lesson?.module_id],
    enabled: !!lesson?.module_id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_lessons").select("id, title, sort_order").eq("module_id", lesson!.module_id).order("sort_order");
      return data || [];
    },
  });

  const { data: isCompleted } = useQuery({
    queryKey: ["lesson-completed", id, user?.id],
    enabled: !!user?.id && !!id,
    queryFn: async () => {
      const { data } = await supabase.from("academy_lesson_progress").select("id").eq("user_id", user!.id).eq("lesson_id", id!).maybeSingle();
      return !!data;
    },
  });

  const markComplete = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("academy_lesson_progress").insert({ user_id: user!.id, lesson_id: id! });
      if (error && !error.message.includes("duplicate")) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lesson-completed", id] });
      qc.invalidateQueries({ queryKey: ["academy-course-progress"] });
      qc.invalidateQueries({ queryKey: ["lesson-progress"] });
      toast({ title: "Lesson completed!" });
      // Auto-navigate to next
      if (nextLesson) navigate(`/academy/lesson/${nextLesson.id}`);
    },
  });

  const currentIdx = siblings.findIndex((s: any) => s.id === id);
  const prevLesson = currentIdx > 0 ? siblings[currentIdx - 1] : null;
  const nextLesson = currentIdx < siblings.length - 1 ? siblings[currentIdx + 1] : null;

  const mod = ((lesson as Record<string, unknown>))?.academy_modules;
  const course = mod?.e_courses;

  if (!lesson) return <div className="flex justify-center py-20"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground flex-wrap">
          <Link to="/academy" className="hover:text-foreground">Academy</Link>
          <span>/</span>
          {course && <Link to={`/academy/course/${course.slug || course.id}`} className="hover:text-foreground">{course.title}</Link>}
          <span>/</span>
          {mod && <span>{mod.title}</span>}
        </div>

        {/* Lesson header */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">{lesson.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="outline">{lesson.duration_minutes} min</Badge>
              {isCompleted && <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"><CheckCircle2 className="h-3 w-3 mr-1" />Completed</Badge>}
            </div>
          </div>
        </div>

        {/* Content */}
        <Card>
          <CardContent className="pt-6 prose dark:prose-invert max-w-none">
            {lesson.content_html ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.content_html) }} />
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Content is being prepared for this lesson.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex items-center justify-between">
          {prevLesson ? (
            <Link to={`/academy/lesson/${((prevLesson as Record<string, unknown>).id)}`}>
              <Button variant="outline" size="sm"><ArrowLeft className="h-4 w-4 mr-1" /> Previous</Button>
            </Link>
          ) : <div />}

          {!isCompleted && user ? (
            <Button onClick={() => markComplete.mutate()} disabled={markComplete.isPending}>
              {markComplete.isPending ? "Saving..." : "Mark Complete & Continue"}
            </Button>
          ) : nextLesson ? (
            <Link to={`/academy/lesson/${((nextLesson as Record<string, unknown>).id)}`}>
              <Button size="sm">Next Lesson <ArrowRight className="h-4 w-4 ml-1" /></Button>
            </Link>
          ) : (
            <Link to={course ? `/academy/course/${course.slug || course.id}` : "/academy"}>
              <Button variant="outline" size="sm">Back to Course</Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
