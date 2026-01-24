-- Add edit_count column to track edit versions
ALTER TABLE public.chat_messages 
ADD COLUMN edit_count INTEGER DEFAULT 0;