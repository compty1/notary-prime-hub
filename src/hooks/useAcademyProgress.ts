import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useAcademyProgress(userId?: string) {
  return useQuery({
    queryKey: ["academy-progress", userId],
    enabled: !!userId,
    queryFn: async () => {
      const { data: progress } = await supabase
        .from("academy_lesson_progress")
        .select("lesson_id, completed_at")
        .eq("user_id", userId!);
      const { data: attempts } = await supabase
        .from("academy_quiz_attempts")
        .select("quiz_id, score, passed, created_at")
        .eq("user_id", userId!);
      const { data: certs } = await supabase
        .from("academy_certificates")
        .select("course_id, certificate_number, issued_at");
      return {
        completedLessons: new Set((progress || []).map((p: any) => p.lesson_id)),
        quizAttempts: attempts || [],
        certificates: certs || [],
      };
    },
  });
}

export function useCourseProgress(courseId?: string, userId?: string) {
  return useQuery({
    queryKey: ["academy-course-progress", courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      // Get all lessons for this course
      const { data: modules } = await supabase
        .from("academy_modules")
        .select("id")
        .eq("course_id", courseId!);
      const moduleIds = (modules || []).map((m: any) => m.id);
      if (moduleIds.length === 0) return { total: 0, completed: 0, percent: 0 };

      const { data: lessons } = await supabase
        .from("academy_lessons")
        .select("id")
        .in("module_id", moduleIds);
      const lessonIds = (lessons || []).map((l: any) => l.id);
      if (lessonIds.length === 0) return { total: 0, completed: 0, percent: 0 };

      const { data: progress } = await supabase
        .from("academy_lesson_progress")
        .select("lesson_id")
        .eq("user_id", userId!)
        .in("lesson_id", lessonIds);

      const completed = (progress || []).length;
      return { total: lessonIds.length, completed, percent: Math.round((completed / lessonIds.length) * 100) };
    },
  });
}
