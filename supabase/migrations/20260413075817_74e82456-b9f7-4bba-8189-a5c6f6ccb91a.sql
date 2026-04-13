
-- Sprint 12: Admin Equipment
CREATE TABLE public.admin_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  equipment_name TEXT NOT NULL,
  equipment_type TEXT NOT NULL DEFAULT 'other',
  serial_number TEXT,
  purchase_date DATE,
  warranty_expiry DATE,
  vendor TEXT,
  purchase_price NUMERIC(10,2),
  condition TEXT NOT NULL DEFAULT 'good',
  maintenance_notes TEXT,
  last_maintenance_date DATE,
  next_maintenance_date DATE,
  assigned_to UUID,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_equipment ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage equipment"
  ON public.admin_equipment FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_admin_equipment_type ON public.admin_equipment(equipment_type);
CREATE INDEX idx_admin_equipment_active ON public.admin_equipment(is_active);

CREATE TRIGGER update_admin_equipment_updated_at
  BEFORE UPDATE ON public.admin_equipment
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Sprint 14: E-Courses
CREATE TABLE public.e_courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT UNIQUE,
  description TEXT,
  category TEXT NOT NULL DEFAULT 'general',
  instructor_name TEXT,
  duration_minutes INTEGER DEFAULT 0,
  price NUMERIC(10,2) DEFAULT 0,
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  content JSONB DEFAULT '[]',
  thumbnail_url TEXT,
  enrollment_count INTEGER DEFAULT 0,
  avg_rating NUMERIC(3,2) DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.e_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published courses"
  ON public.e_courses FOR SELECT TO authenticated
  USING (is_published = true);

CREATE POLICY "Admins manage all courses"
  ON public.e_courses FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_e_courses_published ON public.e_courses(is_published);
CREATE INDEX idx_e_courses_category ON public.e_courses(category);

CREATE TRIGGER update_e_courses_updated_at
  BEFORE UPDATE ON public.e_courses
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enrollments
CREATE TABLE public.e_course_enrollments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  course_id UUID REFERENCES public.e_courses(id) ON DELETE CASCADE NOT NULL,
  progress_percent INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'enrolled',
  completed_at TIMESTAMPTZ,
  certificate_issued BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.e_course_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own enrollments"
  ON public.e_course_enrollments FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves"
  ON public.e_course_enrollments FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own enrollment progress"
  ON public.e_course_enrollments FOR UPDATE TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Admins manage all enrollments"
  ON public.e_course_enrollments FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_enrollments_user ON public.e_course_enrollments(user_id);
CREATE INDEX idx_enrollments_course ON public.e_course_enrollments(course_id);

CREATE TRIGGER update_e_course_enrollments_updated_at
  BEFORE UPDATE ON public.e_course_enrollments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Add logo_path to notary_pages (Sprint 13)
ALTER TABLE public.notary_pages ADD COLUMN IF NOT EXISTS logo_path TEXT;
