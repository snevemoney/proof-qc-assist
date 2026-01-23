-- Create verification_history table to store past verification runs
CREATE TABLE public.verification_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    claims JSONB NOT NULL DEFAULT '[]'::jsonb,
    summary JSONB,
    draft_text TEXT,
    sources_snapshot JSONB DEFAULT '[]'::jsonb,
    strict_mode BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.verification_history ENABLE ROW LEVEL SECURITY;

-- Users can only view their own history
CREATE POLICY "Users can view own verification history"
ON public.verification_history
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own history
CREATE POLICY "Users can insert own verification history"
ON public.verification_history
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can delete their own history
CREATE POLICY "Users can delete own verification history"
ON public.verification_history
FOR DELETE
USING (auth.uid() = user_id);

-- Index for faster queries
CREATE INDEX idx_verification_history_user_id ON public.verification_history(user_id);
CREATE INDEX idx_verification_history_created_at ON public.verification_history(created_at DESC);