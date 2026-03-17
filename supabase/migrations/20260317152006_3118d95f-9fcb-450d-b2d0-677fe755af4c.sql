-- Phase 1: Add documents UPDATE policy for clients
CREATE POLICY "Clients can update own documents"
ON public.documents FOR UPDATE TO authenticated
USING (auth.uid() = uploaded_by)
WITH CHECK (auth.uid() = uploaded_by);

-- Phase 5: Chat messages UPDATE policy for mark-as-read
CREATE POLICY "Users can mark messages as read"
ON public.chat_messages FOR UPDATE TO authenticated
USING (auth.uid() = recipient_id OR auth.uid() = sender_id)
WITH CHECK (auth.uid() = recipient_id OR auth.uid() = sender_id);