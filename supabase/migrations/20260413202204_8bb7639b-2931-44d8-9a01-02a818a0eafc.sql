
-- Add columns to e_courses
ALTER TABLE public.e_courses
  ADD COLUMN IF NOT EXISTS prerequisite_course_ids uuid[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS course_code text,
  ADD COLUMN IF NOT EXISTS tier int DEFAULT 1,
  ADD COLUMN IF NOT EXISTS total_hours numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS certificate_title text;

-- Academy Modules
CREATE TABLE public.academy_modules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id uuid NOT NULL REFERENCES public.e_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  sort_order int NOT NULL DEFAULT 0,
  duration_minutes int DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_modules ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read published modules" ON public.academy_modules FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins can manage modules" ON public.academy_modules FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_academy_modules_updated_at BEFORE UPDATE ON public.academy_modules FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Academy Lessons
CREATE TABLE public.academy_lessons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid NOT NULL REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  title text NOT NULL,
  content_html text DEFAULT '',
  content_type text NOT NULL DEFAULT 'text',
  sort_order int NOT NULL DEFAULT 0,
  duration_minutes int DEFAULT 5,
  is_published boolean DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_lessons ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read published lessons" ON public.academy_lessons FOR SELECT TO authenticated USING (is_published = true);
CREATE POLICY "Admins can manage lessons" ON public.academy_lessons FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_academy_lessons_updated_at BEFORE UPDATE ON public.academy_lessons FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Academy Quizzes
CREATE TABLE public.academy_quizzes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  module_id uuid REFERENCES public.academy_modules(id) ON DELETE CASCADE,
  course_id uuid NOT NULL REFERENCES public.e_courses(id) ON DELETE CASCADE,
  title text NOT NULL,
  quiz_type text NOT NULL DEFAULT 'module',
  passing_score int NOT NULL DEFAULT 80,
  questions jsonb NOT NULL DEFAULT '[]'::jsonb,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_quizzes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Authenticated users can read quizzes" ON public.academy_quizzes FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage quizzes" ON public.academy_quizzes FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_academy_quizzes_updated_at BEFORE UPDATE ON public.academy_quizzes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Academy Quiz Attempts
CREATE TABLE public.academy_quiz_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  quiz_id uuid NOT NULL REFERENCES public.academy_quizzes(id) ON DELETE CASCADE,
  score int NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.academy_quiz_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own attempts" ON public.academy_quiz_attempts FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own attempts" ON public.academy_quiz_attempts FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON public.academy_quiz_attempts FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_academy_quiz_attempts_user ON public.academy_quiz_attempts(user_id);
CREATE INDEX idx_academy_quiz_attempts_quiz ON public.academy_quiz_attempts(quiz_id);

-- Academy Lesson Progress
CREATE TABLE public.academy_lesson_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  lesson_id uuid NOT NULL REFERENCES public.academy_lessons(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, lesson_id)
);
ALTER TABLE public.academy_lesson_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own progress" ON public.academy_lesson_progress FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON public.academy_lesson_progress FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON public.academy_lesson_progress FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_academy_lesson_progress_user ON public.academy_lesson_progress(user_id);

-- Academy Certificates
CREATE TABLE public.academy_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  course_id uuid NOT NULL REFERENCES public.e_courses(id) ON DELETE CASCADE,
  certificate_number text UNIQUE,
  issued_at timestamptz NOT NULL DEFAULT now(),
  certificate_data jsonb DEFAULT '{}'::jsonb,
  UNIQUE(user_id, course_id)
);
ALTER TABLE public.academy_certificates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own certificates" ON public.academy_certificates FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own certificates" ON public.academy_certificates FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage certificates" ON public.academy_certificates FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER generate_academy_cert_number BEFORE INSERT ON public.academy_certificates FOR EACH ROW EXECUTE FUNCTION public.generate_certificate_number();

-- Performance indexes
CREATE INDEX idx_academy_modules_course ON public.academy_modules(course_id);
CREATE INDEX idx_academy_lessons_module ON public.academy_lessons(module_id);
CREATE INDEX idx_academy_quizzes_course ON public.academy_quizzes(course_id);
CREATE INDEX idx_academy_quizzes_module ON public.academy_quizzes(module_id);
