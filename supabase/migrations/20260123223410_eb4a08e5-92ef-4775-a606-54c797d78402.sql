-- Create saved_drafts table for storing reusable draft templates
CREATE TABLE public.saved_drafts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.saved_drafts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view own saved drafts"
ON public.saved_drafts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own saved drafts"
ON public.saved_drafts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own saved drafts"
ON public.saved_drafts
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own saved drafts"
ON public.saved_drafts
FOR DELETE
USING (auth.uid() = user_id);

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_saved_drafts_updated_at
BEFORE UPDATE ON public.saved_drafts
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();