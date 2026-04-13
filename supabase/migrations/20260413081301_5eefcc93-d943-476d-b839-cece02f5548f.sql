
-- Sprint 15: Accounting & Tax Center
CREATE TABLE IF NOT EXISTS public.accounting_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  description TEXT NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  transaction_type TEXT NOT NULL DEFAULT 'expense',
  category TEXT NOT NULL DEFAULT 'other',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_path TEXT,
  tax_deductible BOOLEAN DEFAULT false,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.accounting_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own transactions" ON public.accounting_transactions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all transactions" ON public.accounting_transactions FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_accounting_transactions_updated_at BEFORE UPDATE ON public.accounting_transactions FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_accounting_transactions_user ON public.accounting_transactions(user_id);
CREATE INDEX idx_accounting_transactions_date ON public.accounting_transactions(transaction_date);

CREATE TABLE IF NOT EXISTS public.mileage_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  trip_date DATE NOT NULL DEFAULT CURRENT_DATE,
  start_address TEXT NOT NULL,
  end_address TEXT NOT NULL,
  miles NUMERIC(8,2) NOT NULL,
  purpose TEXT,
  rate_per_mile NUMERIC(4,2) NOT NULL DEFAULT 0.70,
  deduction_amount NUMERIC(10,2) GENERATED ALWAYS AS (miles * rate_per_mile) STORED,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.mileage_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own mileage" ON public.mileage_entries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins manage all mileage" ON public.mileage_entries FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_mileage_entries_user ON public.mileage_entries(user_id);

-- Sprint 16: Document Collaboration (participants table first for FK reference)
CREATE TABLE IF NOT EXISTS public.doc_collaboration_rooms (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_name TEXT NOT NULL,
  document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
  created_by UUID NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.doc_collaboration_rooms ENABLE ROW LEVEL SECURITY;
CREATE TRIGGER update_collab_rooms_updated_at BEFORE UPDATE ON public.doc_collaboration_rooms FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.doc_collaboration_participants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  room_id UUID NOT NULL REFERENCES public.doc_collaboration_rooms(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  permission TEXT NOT NULL DEFAULT 'view',
  joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(room_id, user_id)
);
ALTER TABLE public.doc_collaboration_participants ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage participants" ON public.doc_collaboration_participants FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Users see own participation" ON public.doc_collaboration_participants FOR SELECT USING (user_id = auth.uid());

-- Now add the rooms policies that reference participants
CREATE POLICY "Admins manage rooms" ON public.doc_collaboration_rooms FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Participants view rooms" ON public.doc_collaboration_rooms FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.doc_collaboration_participants WHERE room_id = id AND user_id = auth.uid())
  OR created_by = auth.uid()
);

-- Sprint 18: Dispatch & Routing
CREATE TABLE IF NOT EXISTS public.dispatch_assignments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID REFERENCES public.orders(id) ON DELETE SET NULL,
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
  assigned_to UUID NOT NULL,
  priority TEXT NOT NULL DEFAULT 'normal',
  dispatch_status TEXT NOT NULL DEFAULT 'pending',
  dispatched_at TIMESTAMPTZ,
  eta_minutes INTEGER,
  location_lat NUMERIC(10,7),
  location_lng NUMERIC(10,7),
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.dispatch_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage dispatches" ON public.dispatch_assignments FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Assignees view own dispatches" ON public.dispatch_assignments FOR SELECT USING (assigned_to = auth.uid());
CREATE TRIGGER update_dispatch_updated_at BEFORE UPDATE ON public.dispatch_assignments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX idx_dispatch_status ON public.dispatch_assignments(dispatch_status);
CREATE INDEX idx_dispatch_assigned ON public.dispatch_assignments(assigned_to);

CREATE TABLE IF NOT EXISTS public.sla_timers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  sla_type TEXT NOT NULL,
  deadline_at TIMESTAMPTZ NOT NULL,
  met_at TIMESTAMPTZ,
  breached BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.sla_timers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage SLAs" ON public.sla_timers FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE INDEX idx_sla_entity ON public.sla_timers(entity_type, entity_id);

-- Sprint 19: Notification & Messaging Hub
CREATE TABLE IF NOT EXISTS public.notification_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'email',
  subject TEXT,
  body_template TEXT NOT NULL,
  variables TEXT[] DEFAULT '{}',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.notification_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage templates" ON public.notification_templates FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_notif_templates_updated_at BEFORE UPDATE ON public.notification_templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.conversations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subject TEXT NOT NULL DEFAULT 'New Conversation',
  started_by UUID NOT NULL,
  conversation_type TEXT NOT NULL DEFAULT 'internal',
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage conversations" ON public.conversations FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Starters view own conversations" ON public.conversations FOR SELECT USING (started_by = auth.uid());
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON public.conversations FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.conversation_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.conversations(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  body TEXT NOT NULL,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.conversation_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage messages" ON public.conversation_messages FOR ALL USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Senders view own messages" ON public.conversation_messages FOR SELECT USING (sender_id = auth.uid());
CREATE INDEX idx_conv_messages_conversation ON public.conversation_messages(conversation_id);
