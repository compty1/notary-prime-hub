
-- Attach the handle_new_user trigger to auth.users
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Add recipient_id to chat_messages for proper conversation scoping
ALTER TABLE public.chat_messages ADD COLUMN IF NOT EXISTS recipient_id uuid;
