CREATE TABLE public.content_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  body TEXT,
  category TEXT NOT NULL DEFAULT 'blog',
  status TEXT NOT NULL DEFAULT 'draft',
  author_id UUID NOT NULL,
  hero_image_url TEXT,
  service_id UUID,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.content_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins manage content posts" ON public.content_posts FOR ALL TO authenticated USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Notaries manage own posts" ON public.content_posts FOR ALL TO authenticated USING (has_role(auth.uid(), 'notary'::app_role) AND author_id = auth.uid()) WITH CHECK (has_role(auth.uid(), 'notary'::app_role) AND author_id = auth.uid());

CREATE POLICY "Public view published posts" ON public.content_posts FOR SELECT TO anon, authenticated USING (status = 'published');

CREATE TRIGGER update_content_posts_updated_at BEFORE UPDATE ON public.content_posts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();