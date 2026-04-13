import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function usePrerequisiteCheck(courseId?: string, userId?: string) {
  return useQuery({
    queryKey: ["prerequisite-check", courseId, userId],
    enabled: !!courseId && !!userId,
    queryFn: async () => {
      // Get course prerequisites
      const { data: course } = await supabase
        .from("e_courses")
        .select("prerequisite_course_ids, course_code")
        .eq("id", courseId!)
        .single();

      if (!course) return { met: false, missing: ["Course not found"] };

      const prereqs: string[] = (course as any).prerequisite_course_ids || [];
      if (prereqs.length === 0) return { met: true, missing: [] };

      // Check certificates for each prerequisite
      const { data: certs } = await supabase
        .from("academy_certificates")
        .select("course_id")
        .eq("user_id", userId!);

      const certCourseIds = new Set((certs || []).map((c: any) => c.course_id));
      const missing: string[] = [];

      for (const prereqId of prereqs) {
        if (!certCourseIds.has(prereqId)) {
          const { data: prereqCourse } = await supabase
            .from("e_courses")
            .select("title")
            .eq("id", prereqId)
            .single();
          missing.push(prereqCourse?.title || "Unknown course");
        }
      }

      return { met: missing.length === 0, missing };
    },
  });
}
